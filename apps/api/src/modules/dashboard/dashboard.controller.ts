import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService, DashboardPeriod } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Dashboard - Thống kê & Tổng quan')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Tổng hợp số liệu dashboard thời gian thực theo ngày/tuần/tháng/quý/năm cụ thể' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'quarter', 'year'] })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD (dành cho xem theo ngày)' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number, description: '1 - 12 (dành cho xem theo tháng)' })
  @ApiQuery({ name: 'week', required: false, type: Number, description: '1 - 52 (dành cho xem theo tuần)' })
  @ApiQuery({ name: 'quarter', required: false, type: Number, description: '1 - 4 (dành cho xem theo quý)' })
  getSummary(
    @Query('period') period?: DashboardPeriod,
    @Query('date') date?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('week') week?: string,
    @Query('quarter') quarter?: string,
  ) {
    return this.dashboardService.getSummary({
      period: period || 'day',
      date,
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      week: week ? Number(week) : undefined,
      quarter: quarter ? Number(quarter) : undefined,
    });
  }
}
