# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG (DEPLOYMENT GUIDE)

---

## 1. TRIỂN KHAI CƠ SỞ DỮ LIỆU POSTGRESQL TRÊN NEON

[Neon](https://neon.tech) là dịch vụ Serverless PostgreSQL trên nền tảng đám mây AWS, hỗ trợ Connection Pooling và phân tách lưu trữ/tính toán.

### Bước 1: Tạo Project và Database
1. Truy cập [console.neon.tech](https://console.neon.tech) và đăng nhập.
2. Nhấn **New Project**:
   - Project name: `billiards-management-prod`
   - Region: Chọn khu vực gần Việt Nam nhất (ví dụ: `Asia Pacific (Singapore) - ap-southeast-1`).
   - PostgreSQL version: `16` (hoặc phiên bản ổn định mới nhất).
3. Sau khi khởi tạo, Neon sẽ cung cấp chuỗi kết nối:
   - **Pooled connection string** (cổng `6543`, chứa flag `?sslmode=require&pgbouncer=true`): Dùng cho `DATABASE_URL` trong runtime của NestJS API.
   - **Direct connection string** (cổng `5432`, không qua pgbouncer): Dùng cho `DIRECT_URL` để chạy Prisma Migrations.

### Bước 2: Cấu hình biến môi trường Database
```env
DATABASE_URL="postgresql://user:password@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:password@ep-sample.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

### Bước 3: Chạy Migrations và Exclusion Constraint lên Neon
Từ máy local hoặc CI/CD pipeline có kết nối Internet:
```bash
# 1. Đồng bộ cấu trúc bảng từ Prisma Schema
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# 2. Áp dụng PostgreSQL Exclusion Constraint chống trùng lịch
# Sử dụng psql hoặc Neon SQL Editor chạy nội dung file:
# apps/api/prisma/migrations/custom_constraints.sql
```

Nội dung SQL:
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'booking_no_overlap_exclusion'
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT booking_no_overlap_exclusion
        EXCLUDE USING gist (
            billiard_table_id WITH =,
            tstzrange(start_time, end_time, '[)') WITH &&
        )
        WHERE (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_USE'));
    END IF;
END $$;
```

### Bước 4: Seed dữ liệu demo ban đầu
```bash
npm run prisma:seed --workspace=apps/api
```

---

## 2. TRIỂN KHAI BACKEND NESTJS LÊN CLOUD NODE CỦA WISPYTE

Cloud Node của Wispyte cung cấp môi trường máy chủ chạy Node.js (Node.js Container / Application Runner). Không giả định máy chủ có Docker hay PM2 nếu chưa xác nhận từ nhà cung cấp.

### Bước 1: Chuẩn bị gói mã nguồn & Build
```bash
# Chạy build NestJS sang thư mục dist
npm run build:api
```
Cấu trúc đóng gói cần đưa lên máy chủ gồm:
- Thư mục `apps/api/dist/`
- Thư mục `apps/api/prisma/`
- File `package.json` và `node_modules` (hoặc cài đặt trực tiếp trên server: `npm install --omit=dev`)

### Bước 2: Khởi tạo biến môi trường trên Wispyte Dashboard
Thiết lập các biến môi trường tại phần Settings / Environment Variables:
```env
NODE_ENV=production
PORT=4000
API_PREFIX=api/v1
DATABASE_URL="<Chuỗi Neon Connection Pooler>"
DIRECT_URL="<Chuỗi Neon Direct>"
CORS_ORIGIN="https://billiards.yourdomain.com,https://your-frontend.vercel.app"
JWT_ACCESS_SECRET="<Khóa ngẫu nhiên tối thiểu 32 ký tự an toàn>"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="<Khóa refresh ngẫu nhiên an toàn>"
JWT_REFRESH_EXPIRES_IN="7d"
```

### Bước 3: Lệnh khởi động (Start Command)
Trên cấu hình ứng dụng Wispyte Cloud Node, nhập lệnh khởi động:
```bash
node dist/src/main.js
```

### Bước 4: Kiểm tra Health Check
Sau khi deploy thành công, truy cập endpoint kiểm tra tình trạng kết nối:
```
GET https://api.yourdomain.com/api/v1/health
```
Phản hồi mẫu thành công:
```json
{
  "status": "OK",
  "timestamp": "2026-10-26T15:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "database": {
    "status": "UP",
    "latencyMs": 18
  }
}
```

---

## 3. TRIỂN KHAI FRONTEND NEXT.JS (VERCEL / NODE PLATFORM)

### Bước 1: Cấu hình biến môi trường Build & Runtime
Cung cấp biến môi trường trỏ đến URL Backend API thật đã deploy:
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api/v1"
```

### Bước 2: Quy trình Build trên Host
- Build Command: `npm run build:web` hoặc `cd apps/web && npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### Bước 3: Kiểm tra Sau Triển Khai
1. Mở trang chủ: Kiểm tra giao diện, phông chữ, responsive mobile.
2. Thử đăng nhập tài khoản Admin / Nhân viên / Khách hàng.
3. Kiểm tra tính năng Đặt bàn trực tuyến: Tìm bàn trống, chọn bàn, xác nhận.
4. Kiểm tra trang Thu ngân: Mở bàn, gọi đồ uống, xuất hóa đơn và thanh toán.
5. Kiểm tra trang Admin: Thống kê doanh thu, biểu đồ 7 ngày, xuất file CSV.

