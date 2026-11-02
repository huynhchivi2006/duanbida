import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto, CancelBookingDto, FilterBookingDto } from './dto/create-booking.dto';
import { BookingStatus, TableStatus, SessionStatus, Role, UserStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(filter: FilterBookingDto, userRole?: Role, userId?: string) {
    const where: any = {};

    if (userRole === Role.CUSTOMER && userId) {
      where.customerId = userId;
    }

    if (filter.status) {
      where.status = filter.status as BookingStatus;
    }

    if (filter.tableId) {
      where.billiardTableId = filter.tableId;
    }

    if (filter.date) {
      const startOfDay = new Date(`${filter.date}T00:00:00.000Z`);
      const endOfDay = new Date(`${filter.date}T23:59:59.999Z`);
      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (filter.search) {
      where.OR = [
        { bookingCode: { contains: filter.search, mode: 'insensitive' } },
        { customer: { fullName: { contains: filter.search, mode: 'insensitive' } } },
        { customer: { phone: { contains: filter.search } } },
        { billiardTable: { tableNumber: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        billiardTable: {
          include: { tableType: true },
        },
        playSession: true,
        invoice: {
          select: { id: true, invoiceCode: true, status: true, finalAmount: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async findMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { customerId: userId },
      include: {
        billiardTable: {
          include: { tableType: true },
        },
        playSession: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStaffOptions() {
    return this.prisma.user.findMany({
      where: { role: Role.STAFF, status: UserStatus.ACTIVE },
      select: { id: true, fullName: true, phone: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: string, user?: any) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        OR: [{ id }, { bookingCode: id }],
      },
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        billiardTable: {
          include: { tableType: true },
        },
        statusHistories: {
          include: {
            changedByUser: {
              select: { id: true, fullName: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        playSession: true,
        invoice: {
          include: {
            invoiceItems: true,
            payments: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đặt bàn');
    }

    // Nếu là khách hàng chỉ được xem đơn của chính mình
    if (user && user.role === Role.CUSTOMER && booking.customerId !== user.id) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin đặt bàn này');
    }

    return booking;
  }

  async create(dto: CreateBookingDto, currentUser: any) {
    const requestedStart = new Date(dto.startTime);
    const requestedEnd = new Date(requestedStart.getTime() + dto.durationMinutes * 60 * 1000);

    const now = new Date();
    // Khách hàng đặt trước phải cách hiện tại ít nhất 15 phút
    if (currentUser.role === Role.CUSTOMER && requestedStart.getTime() < now.getTime() - 5 * 60 * 1000) {
      throw new BadRequestException('Thời gian bắt đầu đặt bàn không thể nằm trong quá khứ');
    }

    const targetCustomerId =
      currentUser.role === Role.STAFF || currentUser.role === Role.ADMIN
        ? dto.customerId || currentUser.id
        : currentUser.id;

    // Thực thi trong Transaction với cơ chế khóa bi quan (Pessimistic Lock)
    return this.prisma.$transaction(async (tx) => {
      // 1. Khóa bản ghi bàn bi-da để tuần tự hóa các request đồng thời trên cùng bàn này
      const tableRows: any[] = await tx.$queryRaw`
        SELECT id, table_number, table_type_id, status 
        FROM billiard_tables 
        WHERE id = ${dto.billiardTableId}::uuid 
        FOR UPDATE
      `;

      if (!tableRows || tableRows.length === 0) {
        throw new NotFoundException('Bàn bi-da không tồn tại');
      }

      const table = tableRows[0];
      if (table.status === TableStatus.MAINTENANCE) {
        throw new BadRequestException('Bàn này hiện đang được bảo trì');
      }

      // 2. Lấy thông tin đơn giá theo giờ từ TableType
      const tableType = await tx.tableType.findUnique({
        where: { id: table.table_type_id },
      });

      if (!tableType) {
        throw new NotFoundException('Không tìm thấy cấu hình loại bàn');
      }

      // 3. Kiểm tra trùng lấn thời gian với các booking đang giữ chỗ
      // [requestedStart, requestedEnd) giao với [b.startTime, b.endTime)
      const overlappingBookings = await tx.booking.findMany({
        where: {
          billiardTableId: dto.billiardTableId,
          status: {
            in: [
              BookingStatus.PENDING,
              BookingStatus.CONFIRMED,
              BookingStatus.CHECKED_IN,
              BookingStatus.IN_USE,
            ],
          },
          startTime: { lt: requestedEnd },
          endTime: { gt: requestedStart },
        },
      });

      if (overlappingBookings.length > 0) {
        throw new ConflictException(
          `Bàn ${table.table_number} đã có người đặt trong khoảng thời gian này. Vui lòng chọn khung giờ hoặc bàn khác.`,
        );
      }

      // 4. Tính giá dự kiến
      const hourlyRate = Number(table.hourlyRate != null ? table.hourlyRate : tableType.hourlyRate);
      const tableEstimatedPrice = Math.round((dto.durationMinutes / 60) * hourlyRate);

      // Tính tiền các món đồ uống / thức ăn đã chọn trước
      let preOrderedAmount = 0;
      const preOrderedDetails: Array<{ id: string; name: string; quantity: number; unitPrice: number; subtotal: number }> = [];

      if (dto.preOrderedServices && dto.preOrderedServices.length > 0) {
        const serviceIds = dto.preOrderedServices.map((s) => s.serviceId);
        const serviceItems = await tx.serviceItem.findMany({
          where: { id: { in: serviceIds } },
        });

        for (const item of dto.preOrderedServices) {
          const svc = serviceItems.find((s) => s.id === item.serviceId);
          if (svc && item.quantity > 0) {
            const price = Number(svc.unitPrice);
            const subtotal = price * item.quantity;
            preOrderedAmount += subtotal;
            preOrderedDetails.push({
              id: svc.id,
              name: svc.name,
              quantity: item.quantity,
              unitPrice: price,
              subtotal,
            });
          }
        }
      }

      // Tính phí nhân viên phục vụ nếu có yêu cầu
      let staffFee = 0;
      let requestedStaffInfo: { role: string; roleName: string; staffId?: string; staffName?: string; fee: number } | null = null;

      if (dto.requestedStaffRole) {
        const isAttendant = dto.requestedStaffRole === 'TABLE_ATTENDANT';
        staffFee = isAttendant ? 50000 : 30000;
        const roleName = isAttendant ? 'Đứng bàn phục vụ' : 'Xếp bi theo bàn';
        let staffName = 'Quán tự sắp xếp nhân viên trong ca';

        if (dto.requestedStaffId) {
          const staffUser = await tx.user.findUnique({
            where: { id: dto.requestedStaffId },
            select: { id: true, fullName: true },
          });
          if (staffUser) {
            staffName = staffUser.fullName;
          }
        }

        requestedStaffInfo = {
          role: dto.requestedStaffRole,
          roleName,
          staffId: dto.requestedStaffId,
          staffName,
          fee: staffFee,
        };
      }

      const estimatedPrice = tableEstimatedPrice + preOrderedAmount + staffFee;

      // 5. Sinh mã đặt bàn duy nhất: BKG-YYYYMMDD-XXXX
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingCode = `BKG-${dateStr}-${randomSuffix}`;

      // Đặt bàn thành công được chuyển thẳng sang CONFIRMED để giữ chỗ chắc chắn
      const initialStatus = BookingStatus.CONFIRMED;

      // Đóng gói metadata vào notes
      const metadataPayload = {
        customNote: dto.notes || '',
        tableEstimatedPrice,
        preOrderedItems: preOrderedDetails,
        preOrderedAmount,
        requestedStaff: requestedStaffInfo,
        staffFee,
      };
      const composedNotes = `[METADATA:${JSON.stringify(metadataPayload)}] ${dto.notes || ''}`.trim();

      // 6. Tạo bản ghi Booking
      const newBooking = await tx.booking.create({
        data: {
          bookingCode,
          customerId: targetCustomerId,
          billiardTableId: dto.billiardTableId,
          startTime: requestedStart,
          endTime: requestedEnd,
          estimatedPrice,
          status: initialStatus,
          notes: composedNotes,
        },
        include: {
          billiardTable: { include: { tableType: true } },
          customer: { select: { id: true, fullName: true, phone: true, email: true } },
        },
      });

      // 7. Ghi nhận lịch sử trạng thái
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: newBooking.id,
          fromStatus: null,
          toStatus: initialStatus,
          changedByUserId: currentUser.id,
          reason: 'Tạo đặt bàn mới thành công',
        },
      });

      // 8. Bắn thông báo thời gian thực cho nhân viên & quản lý quán
      try {
        const timeFormatted = new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        }).format(requestedStart);

        let itemsSummary = '';
        if (preOrderedDetails.length > 0) {
          itemsSummary = ` | Món: ${preOrderedDetails.map((p) => `${p.quantity}x ${p.name}`).join(', ')}`;
        }
        let staffSummary = '';
        if (requestedStaffInfo) {
          staffSummary = ` | NV: ${requestedStaffInfo.roleName} (${requestedStaffInfo.staffName})`;
        }

        this.notificationsService.create({
          role: Role.STAFF,
          title: '🔔 Khách Đặt Bàn Mới' + (preOrderedDetails.length > 0 || requestedStaffInfo ? ' (Có gọi món/NV)' : ''),
          message: `Khách ${newBooking.customer?.fullName || 'Khách'} vừa đặt Bàn ${newBooking.billiardTable.tableNumber} (${timeFormatted})${itemsSummary}${staffSummary}. Mã: ${bookingCode}`,
          type: 'NEW_BOOKING',
          metadata: {
            bookingId: newBooking.id,
            bookingCode: newBooking.bookingCode,
            tableNumber: newBooking.billiardTable.tableNumber,
            customerName: newBooking.customer?.fullName,
            startTime: requestedStart.toISOString(),
            preOrderedDetails,
            requestedStaffInfo,
          },
        });

        // Nếu khách chọn đích danh một nhân viên, thông báo riêng cho nhân viên đó
        if (requestedStaffInfo?.staffId) {
          this.notificationsService.create({
            userId: requestedStaffInfo.staffId,
            role: Role.STAFF,
            title: '🎱 Khách hàng chọn bạn phục vụ bàn!',
            message: `Khách ${newBooking.customer?.fullName || 'Khách'} đã chọn bạn phục vụ tại Bàn ${newBooking.billiardTable.tableNumber} (${timeFormatted}). Vai trò: ${requestedStaffInfo.roleName}.`,
            type: 'STAFF_ASSIGNED',
            metadata: {
              tableNumber: newBooking.billiardTable.tableNumber,
              bookingCode: newBooking.bookingCode,
              roleType: requestedStaffInfo.role,
            },
          });
        }
      } catch (err) {
        this.logger.warn(`Không thể gửi notification đặt bàn: ${err}`);
      }

      return newBooking;
    });
  }

  async confirm(id: string, currentUser: any) {
    const booking = await this.findOne(id);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(`Không thể xác nhận đơn đặt bàn ở trạng thái ${booking.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CONFIRMED },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: BookingStatus.CONFIRMED,
          changedByUserId: currentUser.id,
          reason: 'Nhân viên xác nhận đặt bàn',
        },
      });

      return updated;
    });
  }

  async checkIn(id: string, currentUser: any) {
    const booking = await this.findOne(id);
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Chỉ đơn đặt bàn đã xác nhận (CONFIRMED) mới có thể Check-in');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CHECKED_IN },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: BookingStatus.CHECKED_IN,
          changedByUserId: currentUser.id,
          reason: 'Khách hàng có mặt tại quầy check-in',
        },
      });

      return updated;
    });
  }

  async startSession(id: string, currentUser: any) {
    const booking = await this.findOne(id);
    if (booking.status !== BookingStatus.CHECKED_IN && booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Đơn đặt bàn phải ở trạng thái CHECKED_IN hoặc CONFIRMED để bắt đầu chơi');
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const sessionCode = `SES-${dateStr}-${randomSuffix}`;

      // Tạo phiên chơi PlaySession
      const playSession = await tx.playSession.create({
        data: {
          sessionCode,
          billiardTableId: booking.billiardTableId,
          bookingId: booking.id,
          startTime: now,
          hourlyRateSnapshot: booking.billiardTable.hourlyRate != null ? booking.billiardTable.hourlyRate : booking.billiardTable.tableType.hourlyRate,
          status: SessionStatus.PLAYING,
        },
      });

      // Cập nhật trạng thái bàn sang OCCUPIED
      await tx.billiardTable.update({
        where: { id: booking.billiardTableId },
        data: { status: TableStatus.OCCUPIED },
      });

      // Cập nhật trạng thái booking sang IN_USE
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.IN_USE },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: BookingStatus.IN_USE,
          changedByUserId: currentUser.id,
          reason: 'Mở bàn và bắt đầu tính giờ chơi',
        },
      });

      return {
        booking: updatedBooking,
        session: playSession,
      };
    });
  }

  async cancel(id: string, dto: CancelBookingDto, currentUser: any) {
    const booking = await this.findOne(id, currentUser);

    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.IN_USE
    ) {
      throw new BadRequestException(`Không thể hủy đặt bàn đang ở trạng thái ${booking.status}`);
    }

    // Nếu khách hàng tự hủy, kiểm tra chính sách 60 phút
    if (currentUser.role === Role.CUSTOMER) {
      const now = new Date();
      const diffMinutes = (new Date(booking.startTime).getTime() - now.getTime()) / (1000 * 60);
      if (diffMinutes < 60) {
        throw new BadRequestException(
          'Theo chính sách của câu lạc bộ, bạn chỉ có thể tự hủy đặt bàn trước giờ bắt đầu ít nhất 60 phút.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: dto.reason,
        },
      });

      // Trả bàn về AVAILABLE nếu bàn đang RESERVED
      if (booking.billiardTable.status === TableStatus.RESERVED) {
        await tx.billiardTable.update({
          where: { id: booking.billiardTableId },
          data: { status: TableStatus.AVAILABLE },
        });
      }

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: BookingStatus.CANCELLED,
          changedByUserId: currentUser.id,
          reason: dto.reason,
        },
      });

      return updated;
    });
  }
}

