import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TableStatus, BookingStatus, InvoiceStatus } from '@prisma/client';

export type DashboardPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface DashboardQueryDto {
  period?: DashboardPeriod;
  date?: string; // YYYY-MM-DD
  year?: number;
  month?: number; // 1 - 12
  week?: number; // 1 - 52
  quarter?: number; // 1 - 4
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(query: DashboardQueryDto = {}) {
    const period: DashboardPeriod = query.period || 'day';
    const now = new Date();

    // 1. Thống kê trạng thái bàn thời gian thực (luôn cập nhật)
    const [totalTables, availableTables, occupiedTables, maintenanceTables] = await Promise.all([
      this.prisma.billiardTable.count(),
      this.prisma.billiardTable.count({ where: { status: TableStatus.AVAILABLE } }),
      this.prisma.billiardTable.count({ where: { status: TableStatus.OCCUPIED } }),
      this.prisma.billiardTable.count({ where: { status: TableStatus.MAINTENANCE } }),
    ]);

    const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

    // 2. Tính toán ngày bắt đầu & kết thúc và biểu đồ chi tiết theo kỳ
    let startOfPeriod: Date;
    let endOfPeriod: Date;
    let periodTitle = '';
    let chartTitle = '';
    const chartData: { date: string; revenue: number }[] = [];

    const curY = now.getFullYear();
    const curM = now.getMonth() + 1; // 1 - 12
    const curD = now.getDate();

    if (period === 'day') {
      // Xem theo từng ngày cụ thể (mặc định hôm nay hoặc ngày người dùng chọn)
      const selectedDateStr = query.date || now.toISOString().slice(0, 10);
      const [selY, selM, selD] = selectedDateStr.split('-').map(Number);

      startOfPeriod = new Date(Date.UTC(selY, selM - 1, selD, 0, 0, 0));
      endOfPeriod = new Date(Date.UTC(selY, selM - 1, selD, 23, 59, 59, 999));

      const isToday =
        selY === curY && selM === curM && selD === curD;
      periodTitle = isToday
        ? 'Hôm Nay'
        : `Ngày ${String(selD).padStart(2, '0')}/${String(selM).padStart(2, '0')}/${selY}`;
      chartTitle = `Doanh Thu 7 Ngày Gần Ngày ${String(selD).padStart(2, '0')}/${String(selM).padStart(2, '0')}`;

      // Biểu đồ: 7 ngày kết thúc tại ngày được chọn
      const centerDate = new Date(startOfPeriod);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(centerDate);
        d.setUTCDate(d.getUTCDate() - i);
        const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
        const dayEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

        const agg = await this.prisma.invoice.aggregate({
          where: {
            status: InvoiceStatus.PAID,
            paidAt: { gte: dayStart, lte: dayEnd },
          },
          _sum: { finalAmount: true },
        });

        const dayLabel = `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
        chartData.push({
          date: dayLabel,
          revenue: Number(agg._sum.finalAmount || 0),
        });
      }
    } else if (period === 'week') {
      // Xem theo từng tuần cụ thể (Tuần 1, 2, 3... 52)
      const targetYear = query.year ? Number(query.year) : curY;

      // Tính số tuần hiện tại nếu không chọn
      const firstDayOfYear = new Date(targetYear, 0, 1);
      const pastDays = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
      const curWeekNum = Math.max(1, Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7));
      const targetWeek = query.week ? Number(query.week) : curWeekNum;

      // Tính ngày Thứ Hai và Chủ Nhật của tuần đó
      const simpleDate = new Date(Date.UTC(targetYear, 0, 1 + (targetWeek - 1) * 7));
      const dayOfWeek = simpleDate.getUTCDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(simpleDate);
      monday.setUTCDate(simpleDate.getUTCDate() + mondayOffset);

      startOfPeriod = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate(), 0, 0, 0));
      endOfPeriod = new Date(startOfPeriod);
      endOfPeriod.setUTCDate(startOfPeriod.getUTCDate() + 6);
      endOfPeriod.setUTCHours(23, 59, 59, 999);

      const startLabel = `${monday.getUTCDate().toString().padStart(2, '0')}/${(monday.getUTCMonth() + 1).toString().padStart(2, '0')}`;
      const endLabel = `${endOfPeriod.getUTCDate().toString().padStart(2, '0')}/${(endOfPeriod.getUTCMonth() + 1).toString().padStart(2, '0')}`;
      periodTitle = `Tuần ${targetWeek} (${startLabel} - ${endLabel})`;
      chartTitle = `Doanh Thu Từng Ngày Trong Tuần ${targetWeek} (Thứ 2 - CN)`;

      const weekDayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
      // Biểu đồ: 7 ngày từ Thứ Hai đến Chủ Nhật của tuần đó
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfPeriod);
        d.setUTCDate(d.getUTCDate() + i);
        const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
        const dayEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

        const agg = await this.prisma.invoice.aggregate({
          where: {
            status: InvoiceStatus.PAID,
            paidAt: { gte: dayStart, lte: dayEnd },
          },
          _sum: { finalAmount: true },
        });

        const dayMonth = `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
        chartData.push({
          date: `${weekDayNames[i]} (${dayMonth})`,
          revenue: Number(agg._sum.finalAmount || 0),
        });
      }
    } else if (period === 'month') {
      // Xem theo từng tháng cụ thể (Tháng 1, 2, 3... 12)
      const targetYear = query.year ? Number(query.year) : curY;
      const targetMonth = query.month ? Number(query.month) : curM;

      startOfPeriod = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0));
      endOfPeriod = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));
      periodTitle = `Tháng ${targetMonth}/${targetYear}`;
      chartTitle = `Doanh Thu 4 Tuần Trong Tháng ${targetMonth}/${targetYear}`;

      // Biểu đồ: 4 tuần trong tháng (Tuần 1: 1-7, Tuần 2: 8-14, Tuần 3: 15-21, Tuần 4: 22-hết tháng)
      const daysInMonth = endOfPeriod.getUTCDate();
      const weekRanges = [
        { label: 'Tuần 1 (1 - 7)', startDay: 1, endDay: 7 },
        { label: 'Tuần 2 (8 - 14)', startDay: 8, endDay: 14 },
        { label: 'Tuần 3 (15 - 21)', startDay: 15, endDay: 21 },
        { label: `Tuần 4 (22 - ${daysInMonth})`, startDay: 22, endDay: daysInMonth },
      ];

      for (const w of weekRanges) {
        const wStart = new Date(Date.UTC(targetYear, targetMonth - 1, w.startDay, 0, 0, 0));
        const wEnd = new Date(Date.UTC(targetYear, targetMonth - 1, w.endDay, 23, 59, 59, 999));

        const agg = await this.prisma.invoice.aggregate({
          where: {
            status: InvoiceStatus.PAID,
            paidAt: { gte: wStart, lte: wEnd },
          },
          _sum: { finalAmount: true },
        });

        chartData.push({
          date: w.label,
          revenue: Number(agg._sum.finalAmount || 0),
        });
      }
    } else if (period === 'quarter') {
      // Xem theo từng quý cụ thể (Quý 1, 2, 3, 4)
      const targetYear = query.year ? Number(query.year) : curY;
      const curQuarter = Math.floor((curM - 1) / 3) + 1;
      const targetQuarter = query.quarter ? Number(query.quarter) : curQuarter;

      const qStartMonth = (targetQuarter - 1) * 3;
      startOfPeriod = new Date(Date.UTC(targetYear, qStartMonth, 1, 0, 0, 0));
      endOfPeriod = new Date(Date.UTC(targetYear, qStartMonth + 3, 0, 23, 59, 59, 999));
      periodTitle = `Quý ${targetQuarter}/${targetYear}`;
      chartTitle = `Doanh Thu 3 Tháng Trong Quý ${targetQuarter}/${targetYear}`;

      // Biểu đồ: 3 tháng trong quý
      for (let i = 0; i < 3; i++) {
        const mIdx = qStartMonth + i;
        const mStart = new Date(Date.UTC(targetYear, mIdx, 1, 0, 0, 0));
        const mEnd = new Date(Date.UTC(targetYear, mIdx + 1, 0, 23, 59, 59, 999));

        const agg = await this.prisma.invoice.aggregate({
          where: {
            status: InvoiceStatus.PAID,
            paidAt: { gte: mStart, lte: mEnd },
          },
          _sum: { finalAmount: true },
        });

        chartData.push({
          date: `Tháng ${mIdx + 1}`,
          revenue: Number(agg._sum.finalAmount || 0),
        });
      }
    } else {
      // Xem theo năm (Năm 2024, 2025, 2026...)
      const targetYear = query.year ? Number(query.year) : curY;

      startOfPeriod = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0));
      endOfPeriod = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));
      periodTitle = `Năm ${targetYear}`;
      chartTitle = `Doanh Thu 12 Tháng Trong Năm ${targetYear}`;

      // Biểu đồ: 12 tháng trong năm
      for (let mIdx = 0; mIdx < 12; mIdx++) {
        const mStart = new Date(Date.UTC(targetYear, mIdx, 1, 0, 0, 0));
        const mEnd = new Date(Date.UTC(targetYear, mIdx + 1, 0, 23, 59, 59, 999));

        const agg = await this.prisma.invoice.aggregate({
          where: {
            status: InvoiceStatus.PAID,
            paidAt: { gte: mStart, lte: mEnd },
          },
          _sum: { finalAmount: true },
        });

        chartData.push({
          date: `T${mIdx + 1}`,
          revenue: Number(agg._sum.finalAmount || 0),
        });
      }
    }

    // 3. Tính tổng doanh thu và số lượt đặt bàn trong khoảng thời gian đã xác định
    const [periodPaidInvoices, periodInvoicesCount, periodBookingsCount, periodCompletedCount] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: {
          status: InvoiceStatus.PAID,
          paidAt: { gte: startOfPeriod, lte: endOfPeriod },
        },
        _sum: {
          finalAmount: true,
          tableAmount: true,
          serviceAmount: true,
        },
      }),
      this.prisma.invoice.count({
        where: {
          status: InvoiceStatus.PAID,
          paidAt: { gte: startOfPeriod, lte: endOfPeriod },
        },
      }),
      this.prisma.booking.count({
        where: {
          startTime: { gte: startOfPeriod, lte: endOfPeriod },
        },
      }),
      this.prisma.booking.count({
        where: {
          status: BookingStatus.COMPLETED,
          updatedAt: { gte: startOfPeriod, lte: endOfPeriod },
        },
      }),
    ]);

    const periodRevenue = Number(periodPaidInvoices._sum.finalAmount || 0);
    const periodTableAmount = Number(periodPaidInvoices._sum.tableAmount || 0);
    const periodServiceAmount = Number(periodPaidInvoices._sum.serviceAmount || 0);

    // 4. Cơ cấu doanh thu: Tiền giờ vs Tiền F&B vs Bán phụ kiện
    const detailedPaidInvoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: { gte: startOfPeriod, lte: endOfPeriod },
      },
      include: {
        invoiceItems: { include: { serviceItem: true } },
      },
    });

    let tableRevenue = 0;
    let fnbRevenue = 0;
    let accessoryRevenue = 0;
    let otherRevenue = 0;

    for (const inv of detailedPaidInvoices) {
      for (const item of inv.invoiceItems) {
        const sub = Number(item.subtotal);
        if (item.itemType === 'TABLE_TIME') {
          tableRevenue += sub;
        } else if (item.itemType === 'SERVICE') {
          const cat = item.serviceItem?.category;
          if (cat === 'FOOD' || cat === 'DRINK') {
            fnbRevenue += sub;
          } else if (cat === 'ACCESSORY') {
            accessoryRevenue += sub;
          } else {
            otherRevenue += sub;
          }
        } else {
          otherRevenue += sub;
        }
      }
    }

    if (tableRevenue === 0 && fnbRevenue === 0 && accessoryRevenue === 0) {
      tableRevenue = periodTableAmount;
      fnbRevenue = periodServiceAmount;
    }

    const grossTotal = tableRevenue + fnbRevenue + accessoryRevenue + otherRevenue;
    const revenueStructure = {
      tableRevenue,
      fnbRevenue,
      accessoryRevenue,
      otherRevenue,
      tablePercent: grossTotal > 0 ? Math.round((tableRevenue / grossTotal) * 100) : 0,
      fnbPercent: grossTotal > 0 ? Math.round((fnbRevenue / grossTotal) * 100) : 0,
      accessoryPercent: grossTotal > 0 ? Math.round((accessoryRevenue / grossTotal) * 100) : 0,
      otherPercent: grossTotal > 0 ? Math.round((otherRevenue / grossTotal) * 100) : 0,
    };

    // 5. Hiệu suất khai thác bàn: Khung giờ lấp đầy & Loại bàn ưa chuộng
    const [allTables, periodSessions] = await Promise.all([
      this.prisma.billiardTable.findMany({ include: { tableType: true } }),
      this.prisma.playSession.findMany({
        where: {
          startTime: { lte: endOfPeriod },
          OR: [{ endTime: null }, { endTime: { gte: startOfPeriod } }],
        },
        include: {
          billiardTable: { include: { tableType: true } },
          invoice: true,
        },
      }),
    ]);

    const totalTablesCount = Math.max(allTables.length, 1);
    const hourlyOccupancy: { hour: number; hourLabel: string; activeCount: number; occupancyRate: number; isPeak: boolean }[] = [];

    for (let h = 0; h < 24; h++) {
      const hStr = String(h).padStart(2, '0');
      const hNextStr = String((h + 1) % 24).padStart(2, '0');
      const hourLabel = `${hStr}:00 - ${hNextStr}:00`;

      const activeInHour = periodSessions.filter((s) => {
        const sStart = new Date(s.startTime);
        const sEnd = s.endTime ? new Date(s.endTime) : new Date();
        const startH = sStart.getHours();
        const endH = sEnd.getHours();
        return h >= startH && h <= endH;
      }).length;

      const rate = Math.min(100, Math.round((activeInHour / totalTablesCount) * 100));
      hourlyOccupancy.push({
        hour: h,
        hourLabel,
        activeCount: activeInHour,
        occupancyRate: rate,
        isPeak: rate >= 60,
      });
    }

    const typeStatsMap = new Map<string, { code: string; name: string; hourlyRate: number; tableCount: number; sessionCount: number; totalMinutes: number; totalRevenue: number }>();
    for (const t of allTables) {
      if (!typeStatsMap.has(t.tableTypeId)) {
        typeStatsMap.set(t.tableTypeId, {
          code: t.tableType.code,
          name: t.tableType.name,
          hourlyRate: Number(t.tableType.hourlyRate),
          tableCount: 0,
          sessionCount: 0,
          totalMinutes: 0,
          totalRevenue: 0,
        });
      }
      typeStatsMap.get(t.tableTypeId)!.tableCount += 1;
    }

    for (const s of periodSessions) {
      const typeId = s.billiardTable.tableTypeId;
      if (typeStatsMap.has(typeId)) {
        const item = typeStatsMap.get(typeId)!;
        item.sessionCount += 1;
        item.totalMinutes += s.durationMinutes || 60;
        item.totalRevenue += Number(s.invoice?.tableAmount || 0);
      }
    }

    const totalSessions = periodSessions.length || 1;
    const popularTableTypes = Array.from(typeStatsMap.values())
      .map((t) => ({
        ...t,
        popularityPercent: Math.round((t.sessionCount / totalSessions) * 100),
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount);

    // 6. Lấy danh sách lượt đặt bàn gần nhất
    const recentBookings = await this.prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { fullName: true, phone: true } },
        billiardTable: { include: { tableType: true } },
      },
    });

    return {
      overview: {
        totalTables,
        availableTables,
        occupiedTables,
        maintenanceTables,
        occupancyRate,
        period,
        periodTitle,
        chartTitle,
        periodRevenue,
        periodTableAmount,
        periodServiceAmount,
        periodInvoicesCount,
        periodBookingsCount,
        periodCompletedCount,
        startDate: startOfPeriod.toISOString(),
        endDate: endOfPeriod.toISOString(),
      },
      revenueStructure,
      tableUtilization: {
        hourlyOccupancy,
        popularTableTypes,
      },
      chartData,
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        bookingCode: b.bookingCode,
        customerName: b.customer?.fullName || 'Khách vãng lai',
        customerPhone: b.customer?.phone || '',
        tableNumber: b.billiardTable.tableNumber,
        tableType: b.billiardTable.tableType.name,
        startTime: b.startTime,
        endTime: b.endTime,
        estimatedPrice: Number(b.estimatedPrice),
        status: b.status,
      })),
    };
  }
}
