import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { Response } from 'express';

@ApiTags('Health - Giám sát hệ thống')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái máy chủ và kết nối database PostgreSQL Neon' })
  async check(@Res() res: Response) {
    const startTime = Date.now();
    let dbStatus = 'UP';
    let dbLatencyMs = 0;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - startTime;
    } catch (err: any) {
      dbStatus = 'DOWN';
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: dbStatus,
          error: err.message,
        },
      });
    }

    return res.status(HttpStatus.OK).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    });
  }
}

