import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';

export type ReportPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueReport(startDateStr?: string, endDateStr?: string, period: ReportPeriod = 'day') {
    let start: Date;
    let end: Date;

    const now = new Date();

    if (startDateStr && endDateStr) {
      start = new Date(`${startDateStr}T00:00:00.000Z`);
      end = new Date(`${endDateStr}T23:59:59.999Z`);
    } else {
      // Khoảng thời gian mặc định tùy theo kỳ
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      start = new Date(end);

      if (period === 'year') {
        start.setUTCFullYear(start.getUTCFullYear() - 3);
      } else if (period === 'quarter' || period === 'month') {
        start.setUTCFullYear(start.getUTCFullYear() - 1);
      } else if (period === 'week') {
        start.setUTCDate(start.getUTCDate() - 84); // 12 tuần
      } else {
        start.setUTCDate(start.getUTCDate() - 30); // 30 ngày
      }
      start.setUTCHours(0, 0, 0, 0);
    }

    if (start > end) {
      throw new BadRequestException('Ngày bắt đầu không thể lớn hơn ngày kết thúc');
    }

    const paidInvoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        paidAt: { gte: start, lte: end },
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        staff: { select: { fullName: true } },
        payments: true,
        invoiceItems: {
          include: {
            serviceItem: true,
          },
        },
        playSession: {
          include: {
            billiardTable: { include: { tableType: true } },
          },
        },
      },
      orderBy: { paidAt: 'asc' },
    });

    let totalRevenue = 0;
    let totalTableAmount = 0;
    let totalServiceAmount = 0;
    let totalDiscountAmount = 0;
    const paymentMethodStats: Record<string, number> = {};

    // Phân tích cơ cấu doanh thu: Tiền giờ vs Tiền F&B vs Bán phụ kiện vs Khác
    let totalTableRevenue = 0;
    let totalFnbRevenue = 0;
    let totalAccessoryRevenue = 0;
    let totalOtherRevenue = 0;

    for (const inv of paidInvoices) {
      for (const item of inv.invoiceItems) {
        const sub = Number(item.subtotal);
        if (item.itemType === 'TABLE_TIME') {
          totalTableRevenue += sub;
        } else if (item.itemType === 'SERVICE') {
          const cat = item.serviceItem?.category;
          if (cat === 'FOOD' || cat === 'DRINK') {
            totalFnbRevenue += sub;
          } else if (cat === 'ACCESSORY') {
            totalAccessoryRevenue += sub;
          } else {
            totalOtherRevenue += sub;
          }
        } else {
          totalOtherRevenue += sub;
        }
      }
    }

    // Nếu không có chi tiết item, fallback theo tableAmount và serviceAmount
    if (totalTableRevenue === 0 && totalFnbRevenue === 0 && totalAccessoryRevenue === 0) {
      for (const inv of paidInvoices) {
        totalTableRevenue += Number(inv.tableAmount);
        totalFnbRevenue += Number(inv.serviceAmount);
      }
    }

    const preDiscountGross = totalTableRevenue + totalFnbRevenue + totalAccessoryRevenue + totalOtherRevenue;
    const revenueStructure = {
      tableRevenue: totalTableRevenue,
      fnbRevenue: totalFnbRevenue,
      accessoryRevenue: totalAccessoryRevenue,
      otherRevenue: totalOtherRevenue,
      tablePercent: preDiscountGross > 0 ? Math.round((totalTableRevenue / preDiscountGross) * 100) : 0,
      fnbPercent: preDiscountGross > 0 ? Math.round((totalFnbRevenue / preDiscountGross) * 100) : 0,
      accessoryPercent: preDiscountGross > 0 ? Math.round((totalAccessoryRevenue / preDiscountGross) * 100) : 0,
      otherPercent: preDiscountGross > 0 ? Math.round((totalOtherRevenue / preDiscountGross) * 100) : 0,
    };

    // Hiệu suất khai thác bàn:
    // 1. Tỷ lệ lấp đầy bàn theo từng khung giờ trong ngày (24 giờ)
    // 2. Loại bàn được ưa chuộng nhất
    const [allTables, sessionsInPeriod] = await Promise.all([
      this.prisma.billiardTable.findMany({ include: { tableType: true } }),
      this.prisma.playSession.findMany({
        where: {
          startTime: { lte: end },
          OR: [{ endTime: null }, { endTime: { gte: start } }],
        },
        include: {
          billiardTable: { include: { tableType: true } },
          invoice: true,
        },
      }),
    ]);

    const totalTablesCount = Math.max(allTables.length, 1);

    // Tính tỷ lệ lấp đầy theo 24 khung giờ trong ngày
    const hourlyOccupancy: {
      hour: number;
      hourLabel: string;
      activeCount: number;
      occupancyRate: number;
      isPeak: boolean;
    }[] = [];

    for (let h = 0; h < 24; h++) {
      const hourStart = String(h).padStart(2, '0');
      const hourEnd = String((h + 1) % 24).padStart(2, '0');
      const hourLabel = `${hourStart}:00 - ${hourEnd}:00`;

      // Đếm số session diễn ra trong khung giờ h
      const activeInHour = sessionsInPeriod.filter((s) => {
        const sStart = new Date(s.startTime);
        const sEnd = s.endTime ? new Date(s.endTime) : new Date();
        const startH = sStart.getHours();
        const endH = sEnd.getHours();
        if (sStart.toDateString() === sEnd.toDateString()) {
          return h >= startH && h <= endH;
        }
        return true;
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

    // Loại bàn được ưa chuộng nhất (Most popular table types)
    const typeStatsMap = new Map<string, {
      code: string;
      name: string;
      hourlyRate: number;
      tableCount: number;
      sessionCount: number;
      totalMinutes: number;
      totalRevenue: number;
    }>();

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

    for (const s of sessionsInPeriod) {
      const typeId = s.billiardTable.tableTypeId;
      if (typeStatsMap.has(typeId)) {
        const item = typeStatsMap.get(typeId)!;
        item.sessionCount += 1;
        item.totalMinutes += s.durationMinutes || 60;
        item.totalRevenue += Number(s.invoice?.tableAmount || 0);
      }
    }

    const totalSessionsAll = sessionsInPeriod.length || 1;
    const popularTableTypes = Array.from(typeStatsMap.values())
      .map((t) => ({
        ...t,
        popularityPercent: Math.round((t.sessionCount / totalSessionsAll) * 100),
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount);

    // Map gom nhóm theo kỳ (Period Map)
    const periodMap = new Map<string, {
      periodKey: string;
      periodLabel: string;
      invoiceCount: number;
      tableAmount: number;
      serviceAmount: number;
      discountAmount: number;
      revenue: number;
    }>();

    for (const inv of paidInvoices) {
      const invFinal = Number(inv.finalAmount);
      const invTable = Number(inv.tableAmount);
      const invService = Number(inv.serviceAmount);
      const invDiscount = Number(inv.discountAmount);

      totalRevenue += invFinal;
      totalTableAmount += invTable;
      totalServiceAmount += invService;
      totalDiscountAmount += invDiscount;

      for (const pay of inv.payments) {
        paymentMethodStats[pay.method] = (paymentMethodStats[pay.method] || 0) + Number(pay.amount);
      }

      // Xác định key và label cho từng kỳ
      const paidDate = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
      let pKey = '';
      let pLabel = '';

      const y = paidDate.getFullYear();
      const m = paidDate.getMonth() + 1;
      const d = paidDate.getDate();

      if (period === 'day') {
        pKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        pLabel = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
      } else if (period === 'week') {
        // Tính số tuần trong năm
        const firstDayOfYear = new Date(y, 0, 1);
        const pastDaysOfYear = (paidDate.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        pKey = `${y}-W${String(weekNum).padStart(2, '0')}`;
        pLabel = `Tuần ${weekNum} (${y})`;
      } else if (period === 'month') {
        pKey = `${y}-${String(m).padStart(2, '0')}`;
        pLabel = `Tháng ${m}/${y}`;
      } else if (period === 'quarter') {
        const q = Math.floor((m - 1) / 3) + 1;
        pKey = `${y}-Q${q}`;
        pLabel = `Quý ${q}/${y}`;
      } else if (period === 'year') {
        pKey = `${y}`;
        pLabel = `Năm ${y}`;
      }

      if (!periodMap.has(pKey)) {
        periodMap.set(pKey, {
          periodKey: pKey,
          periodLabel: pLabel,
          invoiceCount: 0,
          tableAmount: 0,
          serviceAmount: 0,
          discountAmount: 0,
          revenue: 0,
        });
      }

      const pData = periodMap.get(pKey)!;
      pData.invoiceCount += 1;
      pData.tableAmount += invTable;
      pData.serviceAmount += invService;
      pData.discountAmount += invDiscount;
      pData.revenue += invFinal;
    }

    const periodStats = Array.from(periodMap.values());

    return {
      summary: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        period,
        totalInvoices: paidInvoices.length,
        totalRevenue,
        totalTableAmount,
        totalServiceAmount,
        totalDiscountAmount,
        paymentMethodStats,
      },
      revenueStructure,
      tableUtilization: {
        hourlyOccupancy,
        popularTableTypes,
      },
      periodStats,
      invoices: paidInvoices
        .slice()
        .reverse()
        .map((inv) => ({
          id: inv.id,
          invoiceCode: inv.invoiceCode,
          customerName: inv.customer?.fullName || 'Khách vãng lai',
          customerPhone: inv.customer?.phone || '',
          tableNumber: inv.playSession?.billiardTable.tableNumber || '-',
          tableType: inv.playSession?.billiardTable.tableType.name || '-',
          tableAmount: Number(inv.tableAmount),
          serviceAmount: Number(inv.serviceAmount),
          discountAmount: Number(inv.discountAmount),
          finalAmount: Number(inv.finalAmount),
          paidAt: inv.paidAt,
          paymentMethod: inv.payments[0]?.method || 'CASH',
        })),
    };
  }

  async exportCsv(startDateStr?: string, endDateStr?: string, period: ReportPeriod = 'day'): Promise<string> {
    const data = await this.getRevenueReport(startDateStr, endDateStr, period);

    let csv = '\uFEFFMã Hóa Đơn,Khách Hàng,SĐT,Bàn,Loại Bàn,Tiền Giờ (VNĐ),Tiền Dịch Vụ (VNĐ),Giảm Giá (VNĐ),Tổng Thanh Toán (VNĐ),Thời Gian TT,Phương Thức\n';

    for (const row of data.invoices) {
      const line = [
        `"${row.invoiceCode}"`,
        `"${row.customerName}"`,
        `"${row.customerPhone}"`,
        `"${row.tableNumber}"`,
        `"${row.tableType}"`,
        row.tableAmount,
        row.serviceAmount,
        row.discountAmount,
        row.finalAmount,
        `"${row.paidAt ? new Date(row.paidAt).toLocaleString('vi-VN') : ''}"`,
        `"${row.paymentMethod}"`,
      ].join(',');
      csv += line + '\n';
    }

    return csv;
  }

  async getRevenueBreakdown(startDateStr?: string, endDateStr?: string) {
    const report = await this.getRevenueReport(startDateStr, endDateStr, 'day');
    return report.revenueStructure;
  }

  async getTableUtilization(startDateStr?: string, endDateStr?: string) {
    const report = await this.getRevenueReport(startDateStr, endDateStr, 'day');
    return report.tableUtilization;
  }
}
