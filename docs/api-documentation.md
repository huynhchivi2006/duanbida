# TÀI LIỆU ĐẶC TẢ API - RESTFUL API V1

---

## 1. QUY ƯỚC CHUNG

- **Base URL:** `/api/v1`
- **Mã hóa:** `UTF-8`
- **Định dạng dữ liệu:** `application/json`
- **Xác thực:** Bearer Token trong Header `Authorization: Bearer <JWT_ACCESS_TOKEN>` hoặc qua Cookie HttpOnly `access_token`.
- **Cấu trúc phản hồi chuẩn (Standard JSON Envelope):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Thông báo kết quả bằng tiếng Việt",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5
  }
}
```

- **Cấu trúc phản hồi lỗi chuẩn:**

```json
{
  "success": false,
  "statusCode": 409,
  "error": "Conflict",
  "message": "Bàn này đã có người đặt trong khoảng thời gian đã chọn",
  "timestamp": "2026-10-26T14:30:00.000Z",
  "path": "/api/v1/bookings"
}
```

---

## 2. DANH SÁCH ENDPOINTS CHI TIẾT

### 2.1. Xác thực & Tài khoản (`/api/v1/auth`)

| Phương thức | Đường dẫn | Quyền yêu cầu | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Đăng ký tài khoản khách hàng mới |
| `POST` | `/auth/login` | Public | Đăng nhập hệ thống, cấp Access Token & Refresh Token |
| `POST` | `/auth/refresh` | Public | Làm mới Access Token bằng Refresh Token |
| `POST` | `/auth/logout` | Authenticated | Đăng xuất, hủy bỏ Refresh Token |
| `GET` | `/auth/me` | Authenticated | Lấy thông tin tài khoản hiện tại |
| `PUT` | `/auth/profile` | Authenticated | Cập nhật họ tên, số điện thoại |
| `PUT` | `/auth/change-password` | Authenticated | Đổi mật khẩu |

### 2.2. Bàn & Loại bàn (`/api/v1/tables` & `/api/v1/table-types`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/table-types` | Public | Danh sách các loại bàn bi-da (Carom, Pool, Snooker) & đơn giá |
| `POST` | `/table-types` | `ADMIN` | Tạo loại bàn mới |
| `PUT` | `/table-types/:id` | `ADMIN` | Cập nhật loại bàn, giá niêm yết |
| `DELETE` | `/table-types/:id` | `ADMIN` | Xóa loại bàn (nếu chưa có bàn nào gán) |
| `GET` | `/tables` | Public | Danh sách bàn theo khu vực, loại bàn, trạng thái |
| `GET` | `/tables/available` | Public | Tra cứu các bàn còn trống theo ngày, giờ bắt đầu và thời lượng |
| `GET` | `/tables/:id` | Public | Xem chi tiết thông tin một bàn |
| `POST` | `/tables` | `ADMIN` | Thêm bàn mới |
| `PUT` | `/tables/:id` | `ADMIN` | Cập nhật thông tin bàn |
| `PUT` | `/tables/:id/status` | `STAFF`, `ADMIN` | Đổi trạng thái vật lý của bàn (Bảo trì, Sẵn sàng) |
| `DELETE` | `/tables/:id` | `ADMIN` | Xóa bàn (nếu không có booking ràng buộc) |

### 2.3. Đặt bàn (`/api/v1/bookings`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/bookings` | `STAFF`, `ADMIN` | Danh sách đặt bàn (lọc theo ngày, trạng thái, bàn, từ khóa) |
| `GET` | `/bookings/my` | `CUSTOMER` | Lịch sử đặt bàn của khách hàng đang đăng nhập |
| `GET` | `/bookings/:id` | Authenticated | Chi tiết đơn đặt bàn theo ID hoặc mã đặt bàn |
| `POST` | `/bookings` | Authenticated | Tạo đơn đặt bàn mới (áp dụng transaction & chống trùng lịch) |
| `PUT` | `/bookings/:id/confirm` | `STAFF`, `ADMIN` | Duyệt/Xác nhận đặt bàn (`PENDING` -> `CONFIRMED`) |
| `PUT` | `/bookings/:id/check-in` | `STAFF`, `ADMIN` | Check-in khách đến (`CONFIRMED` -> `CHECKED_IN`) |
| `PUT` | `/bookings/:id/start-session` | `STAFF`, `ADMIN` | Bắt đầu giờ chơi (`CHECKED_IN` -> `IN_USE`) |
| `PUT` | `/bookings/:id/cancel` | Authenticated | Hủy đặt bàn (Khách hủy theo chính sách hoặc Nhân viên hủy) |

### 2.4. Dịch vụ & Menu (`/api/v1/services`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/services` | Public | Danh sách đồ uống, thức ăn, phụ kiện kèm giá |
| `POST` | `/services` | `ADMIN` | Thêm món dịch vụ mới |
| `PUT` | `/services/:id` | `ADMIN` | Sửa thông tin món, giá niêm yết |
| `DELETE` | `/services/:id` | `ADMIN` | Ẩn hoặc xóa món |

### 2.5. Hóa đơn & Thanh toán (`/api/v1/invoices` & `/api/v1/payments`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/invoices` | `STAFF`, `ADMIN` | Danh sách hóa đơn (lọc theo ngày, trạng thái thanh toán) |
| `GET` | `/invoices/my` | `CUSTOMER` | Danh sách hóa đơn của khách hàng đang đăng nhập |
| `GET` | `/invoices/:id` | Authenticated | Chi tiết hóa đơn, các khoản phí, snapshot đơn giá |
| `POST` | `/invoices/create-from-session` | `STAFF`, `ADMIN` | Kết thúc lượt chơi, tính tiền tự động và xuất hóa đơn |
| `POST` | `/invoices/:id/add-service` | `STAFF`, `ADMIN` | Thêm món dịch vụ vào hóa đơn đang mở |
| `POST` | `/invoices/:id/payments` | `STAFF`, `ADMIN` | Ghi nhận thanh toán hóa đơn (chống thanh toán 2 lần) |

### 2.6. Thống kê, Báo cáo & Giám sát (`/api/v1/dashboard`, `/api/v1/reports`, `/api/v1/health`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/summary` | `STAFF`, `ADMIN` | Số lượng bàn theo trạng thái, doanh thu hôm nay, lượt đặt chờ |
| `GET` | `/dashboard/chart-revenue` | `ADMIN` | Biểu đồ doanh thu 7 ngày, 30 ngày gần nhất |
| `GET` | `/reports/revenue` | `ADMIN` | Báo cáo chi tiết theo khoảng ngày (`startDate`, `endDate`), loại bàn |
| `GET` | `/reports/export-csv` | `ADMIN` | Xuất file CSV báo cáo doanh thu và giao dịch |
| `GET` | `/audit-logs` | `ADMIN` | Nhật ký hành động nhạy cảm trong hệ thống |
| `GET` | `/health` | Public | Kiểm tra liveness và kết nối cơ sở dữ liệu PostgreSQL |

