import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Bảo mật HTTP Headers bằng Helmet (Tắt CSP để Swagger UI không bị chặn css/js)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. Cookie Parser để đọc HttpOnly Cookies
  app.use(cookieParser());

  // 3. CORS cho phép kết nối từ mọi frontend domain an toàn
  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép tất cả origin hoặc theo cấu hình
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // 4. Xử lý Route gốc '/' để giải quyết dứt điểm lỗi 'Cannot GET /'
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/' || req.path === '') {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json({
          name: 'Royal Billiards Management API',
          version: '1.0.0',
          status: 'ONLINE',
          swaggerDocs: '/api/docs',
          healthCheck: '/api/v1/health',
          apiPrefix: '/api/v1',
        });
      }

      return res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Royal Billiards API - Server Online</title>
  <style>
    body {
      background-color: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 36px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      text-align: center;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #059669;
      color: #34d399;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 12px #10b981;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 24px;
      font-weight: 800;
      color: #fff;
    }
    p {
      color: #a1a1aa;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 28px;
    }
    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn {
      display: block;
      padding: 12px 20px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #059669;
      color: #fff;
    }
    .btn-primary:hover {
      background: #10b981;
    }
    .btn-secondary {
      background: #27272a;
      color: #e4e4e7;
      border: 1px solid #3f3f46;
    }
    .btn-secondary:hover {
      background: #3f3f46;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="status-badge">
      <span class="status-dot"></span>
      Backend Server Đang Hoạt Động (Online)
    </div>
    <h1>ROYAL BILLIARDS API</h1>
    <p>Hệ thống Quản lý và Đặt bàn Bi-da RESTful API v1.0.0 đã kết nối thành công với Neon PostgreSQL và sẵn sàng phục vụ.</p>
    <div class="btn-group">
      <a href="/api/docs" class="btn btn-primary">📖 Mở Tài Liệu API (Swagger UI)</a>
      <a href="/api/v1/health" class="btn btn-secondary">🩺 Kiểm Tra Health Check (Database)</a>
      <a href="/api/v1/tables" class="btn btn-secondary">🎱 Xem Danh Sách Bàn Bi-da (/api/v1/tables)</a>
    </div>
    <div class="footer">
      Đang chạy trên Wispyte Cloud Node • Royal Billiards Management
    </div>
  </div>
</body>
</html>
      `);
    }
    next();
  });

  // 5. Tiền tố định tuyến API toàn cục (/api/v1)
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // 6. Global Validation Pipe với Whitelist và Transform
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 7. Global Exception Filter & Transform Interceptor
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // 8. Thiết lập tài liệu API Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hệ Thống Quản Lý Đặt Bàn Bi-da (Billiards Management API)')
    .setDescription(
      'RESTful API chuẩn công nghiệp phục vụ đồ án môn học và vận hành câu lạc bộ bi-da thực tế. Hỗ trợ xác thực JWT HttpOnly Cookie/Bearer, chống trùng lịch PostgreSQL Exclusion Constraint, tính tiền tự động và thống kê báo cáo.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập access token JWT',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Auth - Xác thực & Tài khoản')
    .addTag('Tables - Danh sách & Bàn bi-da')
    .addTag('Table Types - Loại bàn & Bảng giá')
    .addTag('Bookings - Quản lý Đặt bàn')
    .addTag('Invoices & Payments - Hóa đơn & Thanh toán')
    .addTag('Services - Menu đồ uống & Dịch vụ')
    .addTag('Dashboard - Thống kê & Tổng quan')
    .addTag('Reports - Báo cáo & Xuất dữ liệu')
    .addTag('Health - Giám sát hệ thống')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // 9. Khởi chạy Server (Hỗ trợ Pterodactyl SERVER_PORT và lắng nghe 0.0.0.0)
  const port = process.env.PORT || process.env.SERVER_PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🎯 Backend REST API đang chạy tại: http://0.0.0.0:${port}/${apiPrefix}`);
  logger.log(`📑 Swagger API Docs sẵn sàng tại: http://0.0.0.0:${port}/api/docs`);
}

bootstrap();
