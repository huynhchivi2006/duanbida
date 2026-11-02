import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    // Thử kết nối lại vài lần: Neon có thể đang ngủ hoặc DNS/mạng chập chờn lúc khởi động
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        this.logger.log('🚀 Kết nối Cơ sở dữ liệu PostgreSQL (Neon) thành công');
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          this.logger.error('❌ Kết nối Cơ sở dữ liệu PostgreSQL thất bại:', error);
          return;
        }
        const delayMs = attempt * 2000;
        this.logger.warn(
          `⚠️ Kết nối DB thất bại (lần ${attempt}/${maxAttempts}), thử lại sau ${delayMs / 1000}s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🛑 Đã ngắt kết nối Cơ sở dữ liệu PostgreSQL');
  }
}

