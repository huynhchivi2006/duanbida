import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingRulesService } from '../pricing-rules/pricing-rules.service';
import {
  CreateInvoiceFromSessionDto,
  AddInvoiceServiceItemDto,
  PayInvoiceDto,
  AddSessionOrderDto,
  AssignStaffServiceDto,
} from './dto/invoice.dto';
import {
  InvoiceStatus,
  SessionStatus,
  TableStatus,
  BookingStatus,
  InvoiceItemType,
  PaymentStatus,
  RoundingMode,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { extractBookingMetadata } from '../../common/utils/booking-metadata.util';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingRulesService: PricingRulesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(status?: InvoiceStatus, date?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        staff: { select: { id: true, fullName: true } },
        payments: true,
        invoiceItems: true,
        playSession: {
          include: {
            billiardTable: { include: { tableType: true } },
            staffAssignments: { include: { staff: { select: { fullName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { customerId: userId },
      include: {
        invoiceItems: true,
        payments: true,
        playSession: {
          include: { billiardTable: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceCode: id }],
      },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        staff: { select: { id: true, fullName: true } },
        invoiceItems: {
          include: { serviceItem: true },
        },
        payments: true,
        playSession: {
          include: {
            billiardTable: { include: { tableType: true } },
            staffAssignments: { include: { staff: { select: { fullName: true } } } },
          },
        },
        booking: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    return invoice;
  }

  /**
   * Mở bàn chơi nhanh cho khách vãng lai (không cần đặt trước)
   */
  async quickOpenSession(tableId: string, currentUser: any) {
    const table = await this.prisma.billiardTable.findUnique({
      where: { id: tableId },
      include: { tableType: true },
    });

    if (!table) {
      throw new NotFoundException('Không tìm thấy bàn bi-da');
    }

    if (table.status !== TableStatus.AVAILABLE) {
      throw new BadRequestException(`Bàn ${table.tableNumber} hiện không ở trạng thái sẵn sàng (${table.status})`);
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const sessionCode = `SES-${dateStr}-${randomSuffix}`;

      // 1. Tạo lượt chơi
      const playSession = await tx.playSession.create({
        data: {
          sessionCode,
          billiardTableId: table.id,
          startTime: now,
          hourlyRateSnapshot: table.hourlyRate != null ? table.hourlyRate : table.tableType.hourlyRate,
          status: SessionStatus.PLAYING,
        },
        include: {
          billiardTable: { include: { tableType: true } },
        },
      });

      // 2. Chuyển bàn sang OCCUPIED
      await tx.billiardTable.update({
        where: { id: table.id },
        data: { status: TableStatus.OCCUPIED },
      });

      return playSession;
    });
  }

  /**
   * Order thêm đồ ăn/nước uống khi bàn đang chơi (Mid-session Ordering)
   * Tự động điều hướng nếu sessionId truyền vào là tableId hoặc tableNumber
   */
  async addSessionOrder(sessionId: string, dto: AddSessionOrderDto, currentUser: any) {
    const session = await this.prisma.playSession.findUnique({
      where: { id: sessionId },
      include: {
        billiardTable: { include: { tableType: true } },
        invoice: true,
        booking: true,
      },
    });

    if (!session) {
      // sessionId có thể là tableId hoặc tableNumber!
      return this.addTableOrder(sessionId, dto, currentUser);
    }

    if (session.status === SessionStatus.FINISHED) {
      throw new BadRequestException('Phiên chơi này đã kết thúc, không thể gọi thêm món');
    }

    const service = await this.prisma.serviceItem.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Món dịch vụ không tồn tại hoặc đã ngừng kinh doanh');
    }

    return this.prisma.$transaction(async (tx) => {
      const unitPrice = Number(service.unitPrice);
      const subtotal = unitPrice * dto.quantity;

      let invoice: any = session.invoice;

      // Nếu phiên chơi chưa có hóa đơn tạm, tạo mới ngay lập tức
      if (!invoice) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const invoiceCode = `INV-${dateStr}-${randomSuffix}`;

        invoice = await tx.invoice.create({
          data: {
            invoiceCode,
            sessionId: session.id,
            bookingId: session.bookingId,
            customerId: session.booking?.customerId,
            staffId: currentUser?.id,
            tableAmount: 0,
            serviceAmount: subtotal,
            discountAmount: 0,
            finalAmount: subtotal,
            status: InvoiceStatus.UNPAID,
            note: 'Order trực tiếp trong lúc chơi',
          },
        });
      } else {
        const newServiceAmount = Number(invoice.serviceAmount) + subtotal;
        const newFinalAmount = Number(invoice.tableAmount) + newServiceAmount - Number(invoice.discountAmount);

        invoice = await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            serviceAmount: newServiceAmount,
            finalAmount: Math.max(0, newFinalAmount),
          },
        });
      }

      // Thêm dòng chi tiết món vào hóa đơn
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          itemType: InvoiceItemType.SERVICE,
          serviceId: service.id,
          itemName: service.name,
          unitPriceSnapshot: unitPrice,
          quantity: dto.quantity,
          subtotal,
        },
      });

      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          invoiceItems: true,
          playSession: {
            include: { billiardTable: true },
          },
        },
      });
    });
  }

  /**
   * Gọi món trực tiếp theo Table (Tự động mở phiên chơi nếu bàn OCCUPIED nhưng chưa có session)
   */
  async addTableOrder(tableIdOrNumber: string, dto: AddSessionOrderDto, currentUser: any) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableIdOrNumber);
    const table = await this.prisma.billiardTable.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: tableIdOrNumber }] : []),
          { tableNumber: { equals: tableIdOrNumber, mode: 'insensitive' } },
        ],
      },
      include: {
        tableType: true,
        playSessions: {
          where: { status: SessionStatus.PLAYING },
          orderBy: { startTime: 'desc' },
          take: 1,
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Không tìm thấy thông tin bàn bi-da tương ứng');
    }

    let activeSession = table.playSessions[0];

    // Nếu bàn chưa có session PLAYING nào (ví dụ bàn OCCUPIED thủ công hoặc bàn trống)
    if (!activeSession) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const sessionCode = `SES-${table.tableNumber}-${dateStr}-${randomSuffix}`;

      activeSession = await this.prisma.playSession.create({
        data: {
          sessionCode,
          billiardTableId: table.id,
          startTime: now,
          hourlyRateSnapshot: table.hourlyRate != null ? table.hourlyRate : table.tableType.hourlyRate,
          status: SessionStatus.PLAYING,
        },
      });

      await this.prisma.billiardTable.update({
        where: { id: table.id },
        data: { status: TableStatus.OCCUPIED },
      });
    }

    return this.addSessionOrder(activeSession.id, dto, currentUser);
  }

  /**
   * Gán nhân viên phục vụ bàn (Xếp bi theo từng bàn, nhân viên đứng bàn)
   * Tự động điều hướng nếu sessionId truyền vào là tableId hoặc tableNumber
   */
  async assignStaff(sessionId: string, dto: AssignStaffServiceDto, currentUser: any) {
    const session = await this.prisma.playSession.findUnique({
      where: { id: sessionId },
      include: {
        billiardTable: true,
        invoice: true,
        booking: true,
      },
    });

    if (!session) {
      // sessionId có thể là tableId hoặc tableNumber!
      return this.assignStaffByTable(sessionId, dto, currentUser);
    }

    if (session.status === SessionStatus.FINISHED) {
      throw new BadRequestException('Phiên chơi này đã kết thúc');
    }

    const staffUser = await this.prisma.user.findUnique({
      where: { id: dto.staffId },
    });

    if (!staffUser) {
      throw new NotFoundException('Không tìm thấy nhân viên được chỉ định');
    }

    return this.prisma.$transaction(async (tx) => {
      const defaultFee = dto.roleType === 'BALL_RACKER' ? 30000 : 50000;
      const fee = dto.fee !== undefined ? Number(dto.fee) : defaultFee;

      // 1. Tạo bản ghi phân công nhân viên
      const assignment = await tx.staffAssignment.create({
        data: {
          sessionId: session.id,
          staffId: staffUser.id,
          roleType: dto.roleType as any,
          fee,
          notes: dto.notes,
        },
      });

      // 2. Nếu có phí dịch vụ, đưa vào hóa đơn
      if (fee > 0) {
        let invoice: any = session.invoice;

        if (!invoice) {
          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const invoiceCode = `INV-${dateStr}-${randomSuffix}`;

          invoice = await tx.invoice.create({
            data: {
              invoiceCode,
              sessionId: session.id,
              bookingId: session.bookingId,
              customerId: session.booking?.customerId,
              staffId: currentUser?.id,
              tableAmount: 0,
              serviceAmount: fee,
              discountAmount: 0,
              finalAmount: fee,
              status: InvoiceStatus.UNPAID,
              note: 'Dịch vụ nhân viên phục vụ bàn',
            },
          });
        } else {
          const newServiceAmount = Number(invoice.serviceAmount) + fee;
          const newFinalAmount = Number(invoice.tableAmount) + newServiceAmount - Number(invoice.discountAmount);

          invoice = await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              serviceAmount: newServiceAmount,
              finalAmount: Math.max(0, newFinalAmount),
            },
          });
        }

        const roleName = dto.roleType === 'BALL_RACKER' ? 'Xếp bi theo bàn' : 'Đứng bàn phục vụ';
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            itemType: InvoiceItemType.STAFF_SERVICE,
            itemName: `Nhân viên ${roleName}: ${staffUser.fullName}`,
            unitPriceSnapshot: fee,
            quantity: 1,
            subtotal: fee,
          },
        });
      }

      // Bắn thông báo thời gian thực đến nhân viên được phân công
      try {
        const roleName = dto.roleType === 'BALL_RACKER' ? 'Xếp bi theo bàn' : 'Đứng bàn phục vụ';
        this.notificationsService.create({
          userId: dto.staffId,
          role: 'STAFF',
          title: '🎱 Bạn vừa được phân công phục vụ bàn!',
          message: `Bạn được phân công phục vụ Bàn ${session.billiardTable?.tableNumber || 'bi-da'} (Vai trò: ${roleName}). Hãy chuẩn bị phục vụ khách chu đáo.`,
          type: 'STAFF_ASSIGNED',
          metadata: {
            tableNumber: session.billiardTable?.tableNumber,
            sessionId: session.id,
            roleType: dto.roleType,
          },
        });
      } catch (err) {
        this.logger.warn(`Không thể gửi notification phân công nhân viên: ${err}`);
      }

      return assignment;
    });
  }

  /**
   * Gán nhân viên theo bàn (Tự động khởi tạo phiên chơi nếu bàn OCCUPIED nhưng chưa có session)
   */
  async assignStaffByTable(tableIdOrNumber: string, dto: AssignStaffServiceDto, currentUser: any) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableIdOrNumber);
    const table = await this.prisma.billiardTable.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: tableIdOrNumber }] : []),
          { tableNumber: { equals: tableIdOrNumber, mode: 'insensitive' } },
        ],
      },
      include: {
        tableType: true,
        playSessions: {
          where: { status: SessionStatus.PLAYING },
          orderBy: { startTime: 'desc' },
          take: 1,
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Không tìm thấy thông tin bàn bi-da tương ứng');
    }

    let activeSession = table.playSessions[0];

    if (!activeSession) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const sessionCode = `SES-${table.tableNumber}-${dateStr}-${randomSuffix}`;

      activeSession = await this.prisma.playSession.create({
        data: {
          sessionCode,
          billiardTableId: table.id,
          startTime: now,
          hourlyRateSnapshot: table.hourlyRate != null ? table.hourlyRate : table.tableType.hourlyRate,
          status: SessionStatus.PLAYING,
        },
      });

      await this.prisma.billiardTable.update({
        where: { id: table.id },
        data: { status: TableStatus.OCCUPIED },
      });
    }

    return this.assignStaff(activeSession.id, dto, currentUser);
  }

  /**
   * Kết thúc phiên chơi, tính tiền giờ, áp dụng phụ thu ngày lễ/Chủ Nhật, chốt hóa đơn
   */
  async createFromSession(dto: CreateInvoiceFromSessionDto, currentUser: any) {
    let session = await this.prisma.playSession.findUnique({
      where: { id: dto.sessionId },
      include: {
        billiardTable: { include: { tableType: true } },
        booking: { include: { customer: true } },
        invoice: { include: { invoiceItems: true } },
      },
    });

    if (!session) {
      // Thử tìm theo tableId nếu truyền tableId
      session = await this.prisma.playSession.findFirst({
        where: {
          billiardTableId: dto.sessionId,
          status: SessionStatus.PLAYING,
        },
        orderBy: { startTime: 'desc' },
        include: {
          billiardTable: { include: { tableType: true } },
          booking: { include: { customer: true } },
          invoice: { include: { invoiceItems: true } },
        },
      });
    }

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên chơi này');
    }

    if (session.status === SessionStatus.FINISHED) {
      throw new BadRequestException('Phiên chơi này đã kết thúc trước đó');
    }

    // Kiểm tra quy tắc phụ thu ngày lễ / Chủ Nhật
    const activePricingRule = await this.pricingRulesService.getActiveRuleForDate(new Date());

    return this.prisma.$transaction(async (tx) => {
      const endTime = new Date();
      const startMs = new Date(session.startTime).getTime();
      const endMs = endTime.getTime();
      let diffMinutes = Math.ceil((endMs - startMs) / (1000 * 60));

      if (diffMinutes < 15) {
        diffMinutes = 15; // Tối thiểu 15 phút
      }

      // 1. Tự động tính tiền giờ theo block (5 phút, 15 phút hoặc phút thực tế)
      const roundingMode: RoundingMode = dto.roundingMode || RoundingMode.BLOCK_5;
      let roundedMinutes = diffMinutes;
      if (roundingMode === RoundingMode.BLOCK_15) {
        roundedMinutes = Math.ceil(diffMinutes / 15) * 15;
      } else if (roundingMode === RoundingMode.BLOCK_5) {
        roundedMinutes = Math.ceil(diffMinutes / 5) * 5;
      } else {
        roundedMinutes = diffMinutes; // EXACT - theo phút thực tế
      }

      const hourlyRate = Number(session.hourlyRateSnapshot);
      const baseTableAmount = Math.round((roundedMinutes / 60) * hourlyRate);

      // Tính phụ thu nếu hôm nay rơi vào Chủ Nhật hoặc ngày Lễ/Tết
      let surchargeAmount = 0;
      let surchargeNote = '';
      if (activePricingRule) {
        const percent = Number(activePricingRule.surchargePercent) || 0;
        const fixed = Number(activePricingRule.fixedSurcharge) || 0;
        surchargeAmount = Math.round(baseTableAmount * (percent / 100)) + fixed;
        surchargeNote = `Phụ thu ${activePricingRule.name} (+${percent}%)`;
      }

      const totalTableAmount = baseTableAmount + surchargeAmount;

      // Cập nhật session sang FINISHED
      await tx.playSession.update({
        where: { id: session.id },
        data: {
          endTime,
          durationMinutes: roundedMinutes,
          status: SessionStatus.FINISHED,
        },
      });

      // 2. Xác định khách hàng (từ customerPhone, customerId hoặc booking)
      let customerId: string | null = dto.customerId || session.booking?.customerId || null;
      if (!customerId && dto.customerPhone) {
        const foundCustomer = await tx.user.findFirst({
          where: { phone: dto.customerPhone.trim() },
        });
        if (foundCustomer) {
          customerId = foundCustomer.id;
        }
      }

      let targetInvoice: any = session.invoice;
      let currentServiceAmount = targetInvoice ? Number(targetInvoice.serviceAmount) : 0;

      // Kiểm tra nếu session bắt nguồn từ Booking và có món ăn/nhân viên đặt trước
      const bMeta = extractBookingMetadata(session.booking?.notes);
      const preOrderedItems = bMeta?.preOrderedItems || [];
      const requestedStaff = bMeta?.requestedStaff;

      // Nếu targetInvoice chưa có, tính bổ sung tiền dịch vụ từ booking
      if (!targetInvoice && (preOrderedItems.length > 0 || requestedStaff)) {
        for (const item of preOrderedItems) {
          currentServiceAmount += Number(item.subtotal) || 0;
        }
        if (requestedStaff && requestedStaff.fee > 0) {
          currentServiceAmount += Number(requestedStaff.fee) || 0;
        }
      }

      const preDiscountTotal = totalTableAmount + currentServiceAmount;

      // 3. Áp dụng chiết khấu hạng thẻ thành viên (Silver, Gold, VIP)
      let tierDiscount = 0;
      let tierNote = '';
      let memberTierSnapshot: any = null;
      if (customerId) {
        const customer = await tx.user.findUnique({ where: { id: customerId } });
        if (customer) {
          memberTierSnapshot = customer.membershipTier;
          const benefit = await tx.membershipTierBenefit.findUnique({
            where: { tier: customer.membershipTier },
          });
          if (benefit) {
            const tableDiscPercent = Number(benefit.discountTablePercent) || 0;
            const servDiscPercent = Number(benefit.discountServicePercent) || 0;
            const tableDisc = Math.round(totalTableAmount * (tableDiscPercent / 100));
            const servDisc = Math.round(currentServiceAmount * (servDiscPercent / 100));
            tierDiscount = tableDisc + servDisc;
            if (tierDiscount > 0) {
              tierNote = `Ưu đãi ${benefit.name} (-${tierDiscount.toLocaleString('vi-VN')}đ)`;
            }
          }
        }
      }

      // 4. Áp dụng voucher / mã giảm giá (nếu có)
      let voucherId: string | null = null;
      let voucherCode: string | null = null;
      let voucherDiscount = 0;
      let voucherNote = '';

      if (dto.voucherCode) {
        const voucher = await tx.voucher.findFirst({
          where: { code: { equals: dto.voucherCode.trim(), mode: 'insensitive' } },
        });

        if (voucher && voucher.isActive) {
          const now = new Date();
          const validDate = (!voucher.startDate || now >= voucher.startDate) && (!voucher.endDate || now <= voucher.endDate);
          const validUsage = !voucher.usageLimit || voucher.usedCount < voucher.usageLimit;

          if (validDate && validUsage && preDiscountTotal >= Number(voucher.minOrderValue)) {
            voucherId = voucher.id;
            voucherCode = voucher.code;

            if (voucher.discountType === 'PERCENT') {
              const calc = Math.round((preDiscountTotal * Number(voucher.discountValue)) / 100);
              voucherDiscount = voucher.maxDiscount ? Math.min(calc, Number(voucher.maxDiscount)) : calc;
            } else {
              voucherDiscount = Math.min(preDiscountTotal, Number(voucher.discountValue));
            }

            voucherNote = `Voucher ${voucher.code} (-${voucherDiscount.toLocaleString('vi-VN')}đ)`;

            // Tăng số lượt dùng của voucher
            await tx.voucher.update({
              where: { id: voucher.id },
              data: { usedCount: { increment: 1 } },
            });
          }
        }
      }

      const manualDiscount = dto.discountAmount || 0;
      const totalDiscount = tierDiscount + voucherDiscount + manualDiscount;
      const finalAmount = Math.max(0, preDiscountTotal - totalDiscount);

      const combinedNoteParts = [dto.note, tierNote, voucherNote].filter(Boolean);
      const combinedNote = combinedNoteParts.join(' | ');

      if (!targetInvoice) {
        // Chưa có hóa đơn draft
        const dateStr = endTime.toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const invoiceCode = `INV-${dateStr}-${randomSuffix}`;

        targetInvoice = await tx.invoice.create({
          data: {
            invoiceCode,
            sessionId: session.id,
            bookingId: session.bookingId,
            customerId,
            staffId: currentUser?.id,
            tableAmount: totalTableAmount,
            serviceAmount: currentServiceAmount,
            discountAmount: totalDiscount,
            voucherId,
            voucherCode,
            voucherDiscount,
            tierDiscount,
            roundingMode,
            finalAmount,
            status: InvoiceStatus.UNPAID,
            note: combinedNote || null,
          },
        });

        // Tạo các dòng InvoiceItem từ preOrderedItems
        for (const item of preOrderedItems) {
          await tx.invoiceItem.create({
            data: {
              invoiceId: targetInvoice.id,
              itemType: InvoiceItemType.SERVICE,
              serviceId: item.id,
              itemName: item.name,
              unitPriceSnapshot: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            },
          });
        }

        // Tạo dòng InvoiceItem cho nhân viên phục vụ nếu có phí
        if (requestedStaff && requestedStaff.fee > 0) {
          await tx.invoiceItem.create({
            data: {
              invoiceId: targetInvoice.id,
              itemType: InvoiceItemType.STAFF_SERVICE,
              itemName: `Phí ${requestedStaff.roleName} (${requestedStaff.staffName || 'Theo bàn'})`,
              unitPriceSnapshot: requestedStaff.fee,
              quantity: 1,
              subtotal: requestedStaff.fee,
            },
          });
        }
      } else {
        // Đã có hóa đơn draft từ trước (khách đã order đồ hoặc nhân viên)
        targetInvoice = await tx.invoice.update({
          where: { id: targetInvoice.id },
          data: {
            tableAmount: totalTableAmount,
            customerId: customerId || targetInvoice.customerId,
            discountAmount: totalDiscount,
            voucherId,
            voucherCode,
            voucherDiscount,
            tierDiscount,
            roundingMode,
            finalAmount,
            staffId: currentUser?.id,
            note: combinedNote || targetInvoice.note,
          },
        });
      }

      // Thêm dòng chi tiết tiền bàn
      const roundingLabel =
        roundingMode === RoundingMode.BLOCK_15
          ? 'Block 15 phút'
          : roundingMode === RoundingMode.EXACT
          ? 'Phút thực tế'
          : 'Block 5 phút';

      await tx.invoiceItem.create({
        data: {
          invoiceId: targetInvoice.id,
          itemType: InvoiceItemType.TABLE_TIME,
          itemName: `Tiền giờ chơi bàn ${session.billiardTable.tableNumber} (${roundedMinutes} phút - ${roundingLabel})`,
          unitPriceSnapshot: hourlyRate,
          quantity: 1,
          subtotal: baseTableAmount,
        },
      });

      // Thêm dòng chi tiết phụ thu ngày Lễ/Chủ nhật (nếu có)
      if (surchargeAmount > 0) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: targetInvoice.id,
            itemType: InvoiceItemType.SURCHARGE,
            itemName: surchargeNote,
            unitPriceSnapshot: surchargeAmount,
            quantity: 1,
            subtotal: surchargeAmount,
          },
        });
      }

      return tx.invoice.findUnique({
        where: { id: targetInvoice.id },
        include: {
          invoiceItems: true,
          playSession: {
            include: {
              billiardTable: { include: { tableType: true } },
              staffAssignments: { include: { staff: true } },
            },
          },
          customer: true,
        },
      });
    });
  }

  /**
   * Thêm dịch vụ / đồ uống vào hóa đơn đang mở
   */
  async addServiceItem(invoiceId: string, dto: AddInvoiceServiceItemDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Không thể thêm món vào hóa đơn đã hoàn tất thanh toán');
    }

    const service = await this.prisma.serviceItem.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Món dịch vụ không tồn tại hoặc đã ngừng kinh doanh');
    }

    return this.prisma.$transaction(async (tx) => {
      const unitPrice = Number(service.unitPrice);
      const subtotal = unitPrice * dto.quantity;

      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          itemType: InvoiceItemType.SERVICE,
          serviceId: service.id,
          itemName: service.name,
          unitPriceSnapshot: unitPrice,
          quantity: dto.quantity,
          subtotal,
        },
      });

      const newServiceAmount = Number(invoice.serviceAmount) + subtotal;
      const newFinalAmount = Number(invoice.tableAmount) + newServiceAmount - Number(invoice.discountAmount);

      return tx.invoice.update({
        where: { id: invoice.id },
        data: {
          serviceAmount: newServiceAmount,
          finalAmount: Math.max(0, newFinalAmount),
        },
        include: {
          invoiceItems: true,
        },
      });
    });
  }

  /**
   * Xem hóa đơn trực tiếp thời gian thực qua mã QR (Public - Khách không cần login)
   */
  async getLiveBill(codeOrId: string) {
    // 1. Thử tìm bàn theo tableNumber (ví dụ "B01", "B02")
    const table = await this.prisma.billiardTable.findFirst({
      where: {
        OR: [
          { tableNumber: { equals: codeOrId, mode: 'insensitive' } },
          { id: codeOrId.length === 36 ? codeOrId : undefined },
        ],
      },
      include: {
        tableType: true,
        playSessions: {
          where: { status: SessionStatus.PLAYING },
          include: {
            invoice: { include: { invoiceItems: true } },
            staffAssignments: { include: { staff: { select: { fullName: true } } } },
          },
          take: 1,
        },
      },
    });

    let targetSession: any = null;
    let targetInvoice: any = null;

    if (table && table.playSessions.length > 0) {
      targetSession = table.playSessions[0];
      targetInvoice = targetSession.invoice;
    } else {
      // 2. Thử tìm theo mã session hoặc mã invoice
      targetSession = await this.prisma.playSession.findFirst({
        where: {
          OR: [
            { sessionCode: codeOrId },
            { id: codeOrId.length === 36 ? codeOrId : undefined },
          ],
        },
        include: {
          billiardTable: { include: { tableType: true } },
          invoice: { include: { invoiceItems: true } },
          staffAssignments: { include: { staff: { select: { fullName: true } } } },
        },
      });

      if (targetSession) {
        targetInvoice = targetSession.invoice;
      } else {
        targetInvoice = await this.prisma.invoice.findFirst({
          where: {
            OR: [
              { invoiceCode: codeOrId },
              { id: codeOrId.length === 36 ? codeOrId : undefined },
            ],
          },
          include: {
            invoiceItems: true,
            playSession: {
              include: {
                billiardTable: { include: { tableType: true } },
                staffAssignments: { include: { staff: { select: { fullName: true } } } },
              },
            },
          },
        });

        if (targetInvoice) {
          targetSession = targetInvoice.playSession;
        } else {
          // 3. Thử tìm theo mã đặt bàn BookingCode (ví dụ BKG-20261102-1234)
          const booking = await this.prisma.booking.findFirst({
            where: {
              OR: [
                { bookingCode: codeOrId },
                { id: codeOrId.length === 36 ? codeOrId : undefined },
              ],
            },
            include: {
              billiardTable: { include: { tableType: true } },
              playSession: {
                include: {
                  invoice: { include: { invoiceItems: true } },
                  staffAssignments: { include: { staff: { select: { fullName: true } } } },
                  billiardTable: { include: { tableType: true } },
                },
              },
              invoice: {
                include: {
                  invoiceItems: true,
                  playSession: {
                    include: {
                      billiardTable: { include: { tableType: true } },
                      staffAssignments: { include: { staff: { select: { fullName: true } } } },
                    },
                  },
                },
              },
            },
          });

          if (booking) {
            if (booking.playSession) {
              targetSession = booking.playSession;
              targetInvoice = targetSession.invoice;
            } else if (booking.invoice) {
              targetInvoice = booking.invoice;
              targetSession = booking.invoice.playSession;
            } else {
              // Khách chưa mở bàn: Trả về thông tin hóa đơn tạm tính theo đơn đặt chỗ
              const estAmount = Number(booking.estimatedPrice);
              const vietQrUrl = `https://img.vietqr.io/image/970422-0978580607-compact.png?amount=${estAmount}&addInfo=${encodeURIComponent(
                `ROYAL_${booking.bookingCode}`,
              )}&accountName=HUYNH%20CHI%20VI`;

              // Trích xuất metadata đặt trước (món ăn, nhân viên phục vụ)
              const parsedMetadata = extractBookingMetadata(booking.notes);

              const tableEst = parsedMetadata?.tableEstimatedPrice != null ? Number(parsedMetadata.tableEstimatedPrice) : estAmount;
              const svcEst = (Number(parsedMetadata?.preOrderedAmount) || 0) + (Number(parsedMetadata?.staffFee) || 0);

              const orderedItems = (parsedMetadata?.preOrderedItems || []).map((p: any) => ({
                id: p.id,
                type: 'SERVICE',
                name: p.name,
                quantity: p.quantity,
                unitPrice: p.unitPrice,
                subtotal: p.subtotal,
              }));

              const staffAssignments: Array<{ name: string; role: string; fee?: number }> = [];
              if (parsedMetadata?.requestedStaff) {
                staffAssignments.push({
                  name: parsedMetadata.requestedStaff.staffName || 'Nhân viên câu lạc bộ',
                  role: parsedMetadata.requestedStaff.roleName || parsedMetadata.requestedStaff.role,
                  fee: Number(parsedMetadata.requestedStaff.fee) || 0,
                });
              }

              return {
                tableNumber: booking.billiardTable.tableNumber,
                tableType: booking.billiardTable.tableType.name,
                area: booking.billiardTable.area || 'STANDARD',
                hourlyRate: Number(booking.billiardTable.hourlyRate != null ? booking.billiardTable.hourlyRate : booking.billiardTable.tableType.hourlyRate),
                status: booking.status,
                startTime: booking.startTime,
                elapsedMinutes: 0,
                baseTableAmount: tableEst,
                surchargeAmount: 0,
                surchargeNote: 'Hóa đơn tạm tính theo đơn đặt trước' + (parsedMetadata?.requestedStaff ? ` (${parsedMetadata.requestedStaff.roleName})` : ''),
                tableAmount: tableEst,
                serviceAmount: svcEst,
                discountAmount: 0,
                voucherCode: null,
                voucherDiscount: 0,
                tierDiscount: 0,
                roundingMode: 'BLOCK_5',
                pointsEarned: 0,
                totalAmount: estAmount,
                orderedItems,
                staffAssignments,
                invoiceCode: null,
                sessionCode: booking.bookingCode,
                vietQrUrl,
                updatedAt: new Date().toISOString(),
              };
            }
          }
        }
      }
    }

    if (!targetSession && !targetInvoice) {
      throw new NotFoundException('Không tìm thấy thông tin bàn hoặc hóa đơn tương ứng');
    }

    const currentTable = targetSession?.billiardTable || table;
    const isPlaying = targetSession?.status === SessionStatus.PLAYING;

    // Tính thời gian & tiền bàn thời gian thực
    let elapsedMinutes = 0;
    let liveTableAmount = 0;
    let surchargeAmount = 0;
    let surchargeNote = '';

    const activeRule = await this.pricingRulesService.getActiveRuleForDate(new Date());

    if (isPlaying && targetSession) {
      const now = Date.now();
      const start = new Date(targetSession.startTime).getTime();
      let diff = Math.ceil((now - start) / 60000);
      if (diff < 30) diff = 30;
      elapsedMinutes = Math.ceil(diff / 5) * 5;

      const rate = Number(targetSession.hourlyRateSnapshot);
      const baseAmount = Math.round((elapsedMinutes / 60) * rate);

      if (activeRule) {
        const percent = Number(activeRule.surchargePercent) || 0;
        const fixed = Number(activeRule.fixedSurcharge) || 0;
        surchargeAmount = Math.round(baseAmount * (percent / 100)) + fixed;
        surchargeNote = `Phụ thu ${activeRule.name} (+${percent}%)`;
      }

      liveTableAmount = baseAmount + surchargeAmount;
    } else if (targetInvoice) {
      liveTableAmount = Number(targetInvoice.tableAmount);
      elapsedMinutes = targetSession?.durationMinutes || 0;
    }

    // Các món đã gọi
    let orderedItems = targetInvoice?.invoiceItems?.map((it: any) => ({
      id: it.id,
      name: it.itemName,
      type: it.itemType,
      unitPrice: Number(it.unitPriceSnapshot),
      quantity: it.quantity,
      subtotal: Number(it.subtotal),
    })) || [];

    // Dự phòng: Nếu targetInvoice chưa có invoiceItems nhưng targetSession bắt nguồn từ Booking có pre-order:
    if (orderedItems.length === 0 && targetSession?.booking?.notes) {
      const bMeta = extractBookingMetadata(targetSession.booking.notes);
      if (bMeta?.preOrderedItems && bMeta.preOrderedItems.length > 0) {
        orderedItems = bMeta.preOrderedItems.map((p) => ({
          id: p.id,
          name: p.name,
          type: 'SERVICE',
          unitPrice: p.unitPrice,
          quantity: p.quantity,
          subtotal: p.subtotal,
        }));
      }
    }

    const serviceAmount = orderedItems
      .filter((it: any) => it.type === 'SERVICE' || it.type === 'STAFF_SERVICE')
      .reduce((sum: number, it: any) => sum + it.subtotal, 0);

    const discountAmount = Number(targetInvoice?.discountAmount) || 0;
    const totalEstimate = Math.max(0, liveTableAmount + serviceAmount - discountAmount);

    // Nhân viên phục vụ
    let staffList = targetSession?.staffAssignments?.map((sa: any) => ({
      name: sa.staff?.fullName,
      role: sa.roleType === 'BALL_RACKER' ? 'Xếp bi theo bàn' : 'Đứng bàn phục vụ',
      fee: Number(sa.fee),
    })) || [];

    if (staffList.length === 0 && targetSession?.booking?.notes) {
      const bMeta = extractBookingMetadata(targetSession.booking.notes);
      if (bMeta?.requestedStaff) {
        staffList = [
          {
            name: bMeta.requestedStaff.staffName || 'Nhân viên câu lạc bộ',
            role: bMeta.requestedStaff.roleName || 'Phục vụ bàn',
            fee: bMeta.requestedStaff.fee,
          },
        ];
      }
    }

    const invoiceCodeOrRef = targetInvoice?.invoiceCode || targetSession?.sessionCode || currentTable?.tableNumber;

    // Tạo link VietQR chuẩn ngân hàng (MB Bank - HUYNH CHI VI - 0978580607)
    const vietQrUrl = `https://img.vietqr.io/image/970422-0978580607-compact.png?amount=${totalEstimate}&addInfo=${encodeURIComponent(
      `ROYAL_${invoiceCodeOrRef}`,
    )}&accountName=HUYNH%20CHI%20VI`;

    return {
      tableNumber: currentTable?.tableNumber || 'Bàn',
      tableType: currentTable?.tableType?.name || 'Standard',
      area: currentTable?.area || 'STANDARD',
      hourlyRate: Number(targetSession?.hourlyRateSnapshot || currentTable?.hourlyRate || currentTable?.tableType?.hourlyRate || 80000),
      status: isPlaying ? 'PLAYING' : targetInvoice?.status || 'FINISHED',
      startTime: targetSession?.startTime || null,
      elapsedMinutes,
      baseTableAmount: liveTableAmount - surchargeAmount,
      surchargeAmount,
      surchargeNote,
      tableAmount: liveTableAmount,
      serviceAmount,
      discountAmount,
      voucherCode: targetInvoice?.voucherCode || null,
      voucherDiscount: Number(targetInvoice?.voucherDiscount) || 0,
      tierDiscount: Number(targetInvoice?.tierDiscount) || 0,
      roundingMode: targetInvoice?.roundingMode || 'BLOCK_5',
      pointsEarned: targetInvoice?.pointsEarned || 0,
      totalAmount: totalEstimate,
      orderedItems,
      staffAssignments: staffList,
      invoiceCode: targetInvoice?.invoiceCode || null,
      sessionCode: targetSession?.sessionCode || null,
      vietQrUrl,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Xác nhận thanh toán hóa đơn
   */
  async pay(invoiceId: string, dto: PayInvoiceDto, currentUser: any) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        playSession: true,
        booking: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new ConflictException('Hóa đơn này đã được thanh toán hoàn tất trước đó!');
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const paymentCode = `PAY-${dateStr}-${randomSuffix}`;

      const payment = await tx.payment.create({
        data: {
          paymentCode,
          invoiceId: invoice.id,
          amount: invoice.finalAmount,
          method: dto.method,
          status: PaymentStatus.SUCCESS,
          transactionRef: dto.transactionRef,
          note: dto.note,
        },
      });

      // Tích điểm thưởng & Nâng hạng thành viên tự động
      let pointsEarned = 0;
      if (invoice.customerId) {
        const customer = await tx.user.findUnique({ where: { id: invoice.customerId } });
        if (customer) {
          const tierBenefit = await tx.membershipTierBenefit.findUnique({
            where: { tier: customer.membershipTier },
          });
          const multiplier = Number(tierBenefit?.pointMultiplier) || 1.0;
          const finalAmountNum = Number(invoice.finalAmount);
          // 10.000đ = 1 điểm * hệ số nhân hạng thẻ
          pointsEarned = Math.floor((finalAmountNum / 10000) * multiplier);

          const newTotalSpending = Number(customer.totalSpending) + finalAmountNum;
          const newVisitCount = customer.visitCount + 1;

          // Kiểm tra và tự động nâng hạng thẻ nếu đạt mốc chi tiêu
          let newTier = customer.membershipTier;
          const allTiers = await tx.membershipTierBenefit.findMany({
            orderBy: { minSpending: 'desc' },
          });
          for (const tb of allTiers) {
            if (newTotalSpending >= Number(tb.minSpending)) {
              newTier = tb.tier;
              break;
            }
          }

          await tx.user.update({
            where: { id: customer.id },
            data: {
              points: { increment: pointsEarned },
              totalSpending: newTotalSpending,
              visitCount: newVisitCount,
              membershipTier: newTier,
            },
          });
        }
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: now,
          staffId: currentUser?.id,
          pointsEarned,
        },
        include: {
          payments: true,
          invoiceItems: true,
          customer: true,
        },
      });

      if (invoice.playSession?.billiardTableId) {
        await tx.billiardTable.update({
          where: { id: invoice.playSession.billiardTableId },
          data: { status: TableStatus.AVAILABLE },
        });
      }

      if (invoice.bookingId) {
        await tx.booking.update({
          where: { id: invoice.bookingId },
          data: {
            status: BookingStatus.COMPLETED,
            actualPrice: invoice.finalAmount,
          },
        });

        await tx.bookingStatusHistory.create({
          data: {
            bookingId: invoice.bookingId,
            fromStatus: BookingStatus.IN_USE,
            toStatus: BookingStatus.COMPLETED,
            changedByUserId: currentUser?.id,
            reason: 'Khách hàng hoàn tất thanh toán hóa đơn',
          },
        });
      }

      return updatedInvoice;
    });
  }
}
