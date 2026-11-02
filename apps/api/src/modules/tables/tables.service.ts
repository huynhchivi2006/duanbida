import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTableDto,
  UpdateTableDto,
  UpdateTableStatusDto,
  FindAvailableTablesDto,
  SwitchTableDto,
  MergeTablesDto,
} from './dto/create-table.dto';
import { TableStatus, BookingStatus, Area, SessionStatus, InvoiceItemType, InvoiceStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: TableStatus, area?: Area, tableTypeId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (area) where.area = area;
    if (tableTypeId) where.tableTypeId = tableTypeId;

    return this.prisma.billiardTable.findMany({
      where,
      include: {
        tableType: true,
        playSessions: {
          where: { status: 'PLAYING' },
          take: 1,
        },
      },
      orderBy: { tableNumber: 'asc' },
    });
  }

  async findOne(id: string) {
    const table = await this.prisma.billiardTable.findUnique({
      where: { id },
      include: {
        tableType: true,
        playSessions: {
          where: { status: 'PLAYING' },
        },
        bookings: {
          where: {
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.IN_USE] },
            endTime: { gte: new Date() },
          },
          orderBy: { startTime: 'asc' },
          take: 5,
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Không tìm thấy bàn bi-da');
    }

    return table;
  }

  async findAvailable(dto: FindAvailableTablesDto) {
    const requestedStart = new Date(dto.startTime);
    const requestedEnd = new Date(requestedStart.getTime() + dto.durationMinutes * 60 * 1000);

    // 1. Tìm các booking bị chồng lấn trong khoảng thời gian [requestedStart, requestedEnd)
    // Quy tắc chồng lấn 2 khoảng [A, B) và [C, D): A < D và B > C
    const overlappingBookings = await this.prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.IN_USE] },
        startTime: { lt: requestedEnd },
        endTime: { gt: requestedStart },
      },
      select: {
        billiardTableId: true,
      },
    });

    const unavailableTableIds = new Set(overlappingBookings.map((b) => b.billiardTableId));

    // 2. Lấy danh sách bàn khả dụng (không nằm trong ID trùng và không bảo trì)
    const where: any = {
      status: { not: TableStatus.MAINTENANCE },
      id: { notIn: Array.from(unavailableTableIds) },
    };

    if (dto.tableTypeId) where.tableTypeId = dto.tableTypeId;
    if (dto.area) where.area = dto.area;

    const availableTables = await this.prisma.billiardTable.findMany({
      where,
      include: {
        tableType: true,
      },
      orderBy: { tableNumber: 'asc' },
    });

    // 3. Tính kèm giá dự kiến
    return availableTables.map((table) => {
      const hourlyRate = Number(table.tableType.hourlyRate);
      const estimatedPrice = (dto.durationMinutes / 60) * hourlyRate;
      return {
        ...table,
        slot: {
          startTime: requestedStart.toISOString(),
          endTime: requestedEnd.toISOString(),
          durationMinutes: dto.durationMinutes,
          estimatedPrice: Math.round(estimatedPrice),
        },
      };
    });
  }

  async create(dto: CreateTableDto) {
    const existing = await this.prisma.billiardTable.findUnique({
      where: { tableNumber: dto.tableNumber },
    });

    if (existing) {
      throw new ConflictException(`Mã bàn ${dto.tableNumber} đã tồn tại`);
    }

    return this.prisma.billiardTable.create({
      data: {
        tableNumber: dto.tableNumber,
        tableTypeId: dto.tableTypeId,
        area: dto.area || Area.STANDARD,
        note: dto.note,
      },
      include: { tableType: true },
    });
  }

  async update(id: string, dto: UpdateTableDto) {
    await this.findOne(id);

    if (dto.tableNumber) {
      const existing = await this.prisma.billiardTable.findFirst({
        where: {
          tableNumber: dto.tableNumber,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException(`Mã bàn ${dto.tableNumber} đã tồn tại`);
      }
    }

    return this.prisma.billiardTable.update({
      where: { id },
      data: dto,
      include: { tableType: true },
    });
  }

  async updateStatus(id: string, dto: UpdateTableStatusDto) {
    await this.findOne(id);

    return this.prisma.billiardTable.update({
      where: { id },
      data: { status: dto.status },
      include: { tableType: true },
    });
  }

  async remove(id: string) {
    const table = await this.findOne(id);
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        billiardTableId: id,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_USE] },
      },
    });

    if (activeBooking) {
      throw new ConflictException('Không thể xóa bàn đang có lịch đặt hoặc đang được sử dụng');
    }

    return this.prisma.billiardTable.delete({
      where: { id },
    });
  }

  /**
   * Chuyển bàn khi khách có nhu cầu đổi vị trí
   */
  async switchTable(dto: SwitchTableDto, currentUser: any) {
    const isSourceUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.sourceTableId);
    const isTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.targetTableId);

    const sourceTable = await this.prisma.billiardTable.findFirst({
      where: {
        OR: [
          ...(isSourceUuid ? [{ id: dto.sourceTableId }] : []),
          { tableNumber: { equals: dto.sourceTableId, mode: 'insensitive' } },
        ],
      },
      include: {
        tableType: true,
        playSessions: {
          where: { status: SessionStatus.PLAYING },
          include: { invoice: true },
          take: 1,
        },
      },
    });

    if (!sourceTable) {
      throw new NotFoundException('Không tìm thấy bàn nguồn');
    }

    const activeSession = sourceTable.playSessions[0];
    if (!activeSession) {
      throw new BadRequestException(`Bàn ${sourceTable.tableNumber} hiện không có phiên chơi nào đang hoạt động`);
    }

    const targetTable = await this.prisma.billiardTable.findFirst({
      where: {
        OR: [
          ...(isTargetUuid ? [{ id: dto.targetTableId }] : []),
          { tableNumber: { equals: dto.targetTableId, mode: 'insensitive' } },
        ],
      },
      include: {
        tableType: true,
        playSessions: {
          where: { status: SessionStatus.PLAYING },
          take: 1,
        },
      },
    });

    if (!targetTable) {
      throw new NotFoundException('Không tìm thấy bàn đích muốn chuyển đến');
    }

    if (targetTable.id === sourceTable.id) {
      throw new BadRequestException('Bàn đích trùng với bàn nguồn hiện tại');
    }

    if (targetTable.status !== TableStatus.AVAILABLE && targetTable.playSessions.length > 0) {
      throw new ConflictException(`Bàn đích ${targetTable.tableNumber} hiện đang có khách chơi hoặc đang bảo trì`);
    }

    return this.prisma.$transaction(async (tx) => {
      const newHourlyRate = targetTable.hourlyRate != null ? targetTable.hourlyRate : targetTable.tableType.hourlyRate;

      // 1. Chuyển session sang bàn đích
      const updatedSession = await tx.playSession.update({
        where: { id: activeSession.id },
        data: {
          billiardTableId: targetTable.id,
          hourlyRateSnapshot: newHourlyRate,
        },
        include: {
          billiardTable: { include: { tableType: true } },
          invoice: true,
        },
      });

      // 2. Chuyển trạng thái bàn
      await tx.billiardTable.update({
        where: { id: sourceTable.id },
        data: { status: TableStatus.AVAILABLE },
      });

      await tx.billiardTable.update({
        where: { id: targetTable.id },
        data: { status: TableStatus.OCCUPIED },
      });

      // 3. Nếu session có booking, cập nhật booking sang bàn đích
      if (activeSession.bookingId) {
        await tx.booking.update({
          where: { id: activeSession.bookingId },
          data: { billiardTableId: targetTable.id },
        });
      }

      // 4. Nếu có hóa đơn, ghi chú việc chuyển bàn
      if (activeSession.invoice) {
        const switchNote = `Chuyển từ bàn ${sourceTable.tableNumber} sang bàn ${targetTable.tableNumber} (${dto.reason || 'Khách đổi vị trí'})`;
        const currentNote = activeSession.invoice.note || '';
        await tx.invoice.update({
          where: { id: activeSession.invoice.id },
          data: {
            note: currentNote ? `${currentNote} | ${switchNote}` : switchNote,
          },
        });
      }

      return {
        success: true,
        message: `Đã chuyển thành công từ bàn ${sourceTable.tableNumber} sang bàn ${targetTable.tableNumber}`,
        sourceTableNumber: sourceTable.tableNumber,
        targetTableNumber: targetTable.tableNumber,
        session: updatedSession,
      };
    });
  }

  /**
   * Gộp 2 bàn khi khách có nhu cầu gộp hóa đơn và trả 1 bàn
   */
  async mergeTables(dto: MergeTablesDto, currentUser: any) {
    const isSourceUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.sourceTableId);
    const isTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.targetTableId);

    const sourceTable = await this.prisma.billiardTable.findFirst({
      where: {
        OR: [
          ...(isSourceUuid ? [{ id: dto.sourceTableId }] : []),
          { tableNumber: { equals: dto.sourceTableId, mode: 'insensitive' } },
        ],
      },
      include: {
        tableType: true,
        playSessions: {
          where: { status: SessionStatus.PLAYING },
          include: {
            invoice: { include: { invoiceItems: true } },
            staffAssignments: true,
          },
          take: 1,
        },
      },
    });

    const targetTable = await this.prisma.billiardTable.findFirst({
      where: {
        OR: [
          ...(isTargetUuid ? [{ id: dto.targetTableId }] : []),
          { tableNumber: { equals: dto.targetTableId, mode: 'insensitive' } },
        ],
      },
      include: {
        tableType: true,
        playSessions: {
          where: { status: SessionStatus.PLAYING },
          include: {
            invoice: { include: { invoiceItems: true } },
          },
          take: 1,
        },
      },
    });

    if (!sourceTable || !targetTable) {
      throw new NotFoundException('Không tìm thấy bàn nguồn hoặc bàn đích');
    }

    if (sourceTable.id === targetTable.id) {
      throw new BadRequestException('Không thể gộp một bàn vào chính nó');
    }

    const sourceSession = sourceTable.playSessions[0];
    const targetSession = targetTable.playSessions[0];

    if (!sourceSession) {
      throw new BadRequestException(`Bàn ${sourceTable.tableNumber} không có phiên chơi đang hoạt động`);
    }

    if (!targetSession) {
      throw new BadRequestException(`Bàn đích ${targetTable.tableNumber} không có phiên chơi đang hoạt động để nhận gộp`);
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      // 1. Tính tiền giờ bàn nguồn tính đến thời điểm gộp
      const startMs = new Date(sourceSession.startTime).getTime();
      const endMs = now.getTime();
      let diffMinutes = Math.ceil((endMs - startMs) / (1000 * 60));
      if (diffMinutes < 15) diffMinutes = 15;
      const roundedMinutes = Math.ceil(diffMinutes / 5) * 5;
      const hourlyRate = Number(sourceSession.hourlyRateSnapshot);
      const sourceTableAmount = Math.round((roundedMinutes / 60) * hourlyRate);

      // Kết thúc session bàn nguồn
      await tx.playSession.update({
        where: { id: sourceSession.id },
        data: {
          endTime: now,
          durationMinutes: roundedMinutes,
          status: SessionStatus.FINISHED,
        },
      });

      // Giải phóng bàn nguồn
      await tx.billiardTable.update({
        where: { id: sourceTable.id },
        data: { status: TableStatus.AVAILABLE },
      });

      // 2. Chuẩn bị hóa đơn bàn đích (nếu chưa có thì tạo mới)
      let targetInvoice: any = targetSession.invoice;
      if (!targetInvoice) {
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const invoiceCode = `INV-${dateStr}-${randomSuffix}`;

        targetInvoice = await tx.invoice.create({
          data: {
            invoiceCode,
            sessionId: targetSession.id,
            bookingId: targetSession.bookingId,
            staffId: currentUser?.id,
            tableAmount: 0,
            serviceAmount: 0,
            discountAmount: 0,
            finalAmount: 0,
            status: InvoiceStatus.UNPAID,
            note: `Nhận gộp từ bàn ${sourceTable.tableNumber}`,
          },
        });
      }

      // 3. Đưa tiền giờ bàn nguồn vào hóa đơn bàn đích
      await tx.invoiceItem.create({
        data: {
          invoiceId: targetInvoice.id,
          itemType: InvoiceItemType.TABLE_TIME,
          itemName: `Tiền giờ bàn ${sourceTable.tableNumber} (${roundedMinutes} phút gộp sang)`,
          unitPriceSnapshot: hourlyRate,
          quantity: 1,
          subtotal: sourceTableAmount,
        },
      });

      // 4. Nếu bàn nguồn có hóa đơn chứa món F&B hoặc dịch vụ, chuyển sang hóa đơn bàn đích
      let movedServiceAmount = 0;
      if (sourceSession.invoice?.invoiceItems?.length) {
        for (const item of sourceSession.invoice.invoiceItems) {
          if (item.itemType === InvoiceItemType.SERVICE || item.itemType === InvoiceItemType.STAFF_SERVICE) {
            await tx.invoiceItem.create({
              data: {
                invoiceId: targetInvoice.id,
                itemType: item.itemType,
                serviceId: item.serviceId,
                itemName: `${item.itemName} (từ bàn ${sourceTable.tableNumber})`,
                unitPriceSnapshot: item.unitPriceSnapshot,
                quantity: item.quantity,
                subtotal: item.subtotal,
              },
            });
            movedServiceAmount += Number(item.subtotal);
          }
        }

        // Xóa hóa đơn draft của bàn nguồn sau khi đã gom
        await tx.invoiceItem.deleteMany({ where: { invoiceId: sourceSession.invoice.id } });
        await tx.invoice.delete({ where: { id: sourceSession.invoice.id } });
      }

      // 5. Cập nhật lại tổng tiền hóa đơn bàn đích
      const newTableAmount = Number(targetInvoice.tableAmount) + sourceTableAmount;
      const newServiceAmount = Number(targetInvoice.serviceAmount) + movedServiceAmount;
      const discount = Number(targetInvoice.discountAmount) || 0;
      const newFinalAmount = Math.max(0, newTableAmount + newServiceAmount - discount);

      const updatedTargetInvoice = await tx.invoice.update({
        where: { id: targetInvoice.id },
        data: {
          tableAmount: newTableAmount,
          serviceAmount: newServiceAmount,
          finalAmount: newFinalAmount,
          note: `${targetInvoice.note || ''} | Đã gộp bàn ${sourceTable.tableNumber} (+${sourceTableAmount.toLocaleString('vi-VN')}đ giờ, +${movedServiceAmount.toLocaleString('vi-VN')}đ dịch vụ)`.trim(),
        },
        include: {
          invoiceItems: true,
          playSession: { include: { billiardTable: true } },
        },
      });

      return {
        success: true,
        message: `Đã gộp thành công bàn ${sourceTable.tableNumber} vào bàn ${targetTable.tableNumber}`,
        sourceTableNumber: sourceTable.tableNumber,
        targetTableNumber: targetTable.tableNumber,
        mergedInvoice: updatedTargetInvoice,
      };
    });
  }
}

