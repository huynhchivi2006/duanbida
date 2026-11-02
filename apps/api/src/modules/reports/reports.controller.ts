import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService, ReportPeriod } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Response } from 'express';

@ApiTags('Reports - Báo cáo & Xuất dữ liệu')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Báo cáo doanh thu chi tiết theo ngày, tuần, tháng, quý, năm' })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'quarter', 'year'] })
  getRevenueReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period?: ReportPeriod,
  ) {
    return this.reportsService.getRevenueReport(startDate, endDate, period || 'day');
  }

  @Get('revenue-breakdown')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cơ cấu doanh thu: Tiền giờ vs Tiền F&B vs Bán phụ kiện' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getRevenueBreakdown(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getRevenueBreakdown(startDate, endDate);
  }

  @Get('table-utilization')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Hiệu suất khai thác bàn: Tỷ lệ lấp đầy 24h & Loại bàn ưa chuộng nhất' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getTableUtilization(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getTableUtilization(startDate, endDate);
  }

  @Get('export-csv')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Xuất file CSV báo cáo doanh thu' })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'quarter', 'year'] })
  async exportCsv(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('period') period: ReportPeriod,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.exportCsv(startDate, endDate, period || 'day');
    const fileName = `BaoCaoDoanhThu_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csvContent);
  }
}
