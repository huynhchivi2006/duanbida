# TÀI LIỆU YÊU CẦU PHẦN MỀM (SRS) - HỆ THỐNG QUẢN LÝ ĐẶT BÀN BI-DA

**Dự án:** Hệ thống Quản lý và Đặt bàn Bi-da (Billiards Club Management System)  
**Phiên bản:** 1.0.0  
**Tác giả:** Đội ngũ Kỹ sư Phần mềm  
**Ngày lập:** 2026-10-26  

---

## 1. GIỚI THIỆU & MỤC TIÊU DỰ ÁN

### 1.1. Bối cảnh
Các câu lạc bộ bi-da (billiard club) truyền thống thường quản lý bàn chơi, giờ chơi và dịch vụ nước uống bằng sổ sách viết tay hoặc phần mềm offline cục bộ. Điều này dẫn đến các vấn đề nghiêm trọng:
- Khách hàng không thể biết trước bàn còn trống hay không trước khi đến quán, dẫn đến tình trạng quá tải hoặc phải chờ đợi lâu vào giờ cao điểm.
- Trùng lịch đặt bàn khi nhiều nhân viên cùng nhận lịch qua điện thoại/tin nhắn.
- Thất thoát doanh thu, tính sai giờ chơi, nhầm lẫn đơn giá theo khung giờ hoặc loại bàn.
- Thiếu báo cáo tổng hợp trực quan theo thời gian thực để chủ câu lạc bộ ra quyết định kinh doanh.

### 1.2. Mục tiêu
Xây dựng một hệ thống phần mềm web chuyên nghiệp chuẩn công nghiệp, full-stack, đáp ứng toàn diện chu trình quản lý câu lạc bộ bi-da:
1. **Khách hàng (Customer):** Tra cứu bàn trống trực tuyến theo thời gian thực, xem bảng giá minh bạch, đặt bàn trước an toàn không sợ trùng lịch, theo dõi trạng thái và lịch sử hóa đơn.
2. **Nhân viên (Staff):** Quản lý sơ đồ bàn trực quan theo thời gian thực (trống, đã đặt, đang chơi, bảo trì), tiếp nhận khách, check-in, tính giờ chơi tự động, gọi dịch vụ bổ sung, thanh toán và in hóa đơn tại quầy.
3. **Quản trị viên (Admin):** Quản lý danh mục bàn, loại bàn, giá thuê, menu dịch vụ, tài khoản nhân viên, cấu hình quy tắc câu lạc bộ, theo dõi dashboard doanh thu và báo cáo phân tích sâu.

---

## 2. PHÂN TÍCH TÁC NHÂN (ACTORS) VÀ PHÂN QUYỀN (RBAC)

Hệ thống có 3 vai trò người dùng chính:

| Vai trò | Mã định danh | Mô tả quyền hạn |
| :--- | :--- | :--- |
| **Khách hàng** | `CUSTOMER` | Xem thông tin CLB, danh sách bàn, tra cứu bàn trống; Đăng ký/Đăng nhập tài khoản; Đặt bàn, hủy đặt bàn theo chính sách; Xem lịch sử đặt bàn và hóa đơn cá nhân; Cập nhật thông tin cá nhân. |
| **Nhân viên** | `STAFF` | Kế thừa quyền xem; Xem sơ đồ bàn thời gian thực; Tạo đơn đặt bàn trực tiếp cho khách vãng lai; Xác nhận khách đến (Check-in), Bắt đầu lượt chơi (Start Session); Thêm dịch vụ/đồ uống vào lượt chơi; Kết thúc lượt chơi (End Session); Xuất hóa đơn và xác nhận thanh toán tiền mặt/chuyển khoản; Xem ca làm việc. |
| **Quản trị viên** | `ADMIN` | Toàn quyền hệ thống; Quản lý bàn, loại bàn, khu vực; Quản lý bảng giá thuê theo giờ; Quản lý menu dịch vụ và giá; Quản lý tài khoản (khách hàng, nhân viên, admin); Cấu hình giờ mở cửa, chính sách hủy bàn; Xem Dashboard thống kê doanh thu, tỷ lệ sử dụng bàn; Xem nhật ký hệ thống (Audit Logs). |

---

## 3. CÁC GIẢ ĐỊNH NGHIỆP VỤ & QUY TẮC CỐT LÕI (CORE BUSINESS RULES)

### 3.1. Chuẩn hóa Thời gian & Múi giờ
- **Lưu trữ Backend / Database:** Tất cả mốc thời gian (`start_time`, `end_time`, `check_in_at`, `created_at`,...) đều được lưu trữ theo chuẩn **UTC (ISO-8601 / TIMESTAMPTZ)**.
- **Hiển thị & Giao dịch:** Hiển thị và xử lý nghiệp vụ theo múi giờ địa phương Việt Nam: **`Asia/Ho_Chi_Minh` (UTC+7)**.
- **Quy ước khoảng thời gian:** Áp dụng mô hình nửa mở `[startAt, endAt)`:
  - Nếu Khách A đặt từ `14:00 - 15:00`, Khách B hoàn toàn hợp lệ khi đặt từ `15:00 - 16:00` trên cùng một bàn.

### 3.2. Chống Trùng Lịch Đặt Bàn Tuyệt Đối (Anti-Overlap Concurrency Strategy)
- Không chỉ dừng ở mức kiểm tra `SELECT` rồi `INSERT` (dễ bị Race Condition khi có 2 request đồng thời cùng mili-giây).
- **Cơ chế phòng thủ đa tầng:**
  1. **Tầng Database (Constraint Level):** Sử dụng PostgreSQL Extension `btree_gist` và tạo **Exclusion Constraint** trên trường `billiard_table_id WITH =` và `tstzrange(start_time, end_time) WITH &&` đối với các trạng thái giữ chỗ (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `IN_USE`).
  2. **Tầng Application Transaction:** Bọc quá trình kiểm tra và tạo booking trong PostgreSQL Transaction với cơ chế khóa bi quan (`SELECT ... FOR UPDATE` trên bàn hoặc Advisory Lock theo `table_id`) nhằm phát hiện xung đột và trả về HTTP status `409 Conflict` kèm thông điệp tiếng Việt thân thiện rõ ràng.

### 3.3. Vòng đời Trạng thái Đặt bàn (Booking Lifecycle State Machine)
Hệ thống quản lý trạng thái đặt bàn qua Finite State Machine nghiêm ngặt:
- `PENDING`: Đặt bàn vừa được tạo, đang chờ CLB/Nhân viên duyệt (nếu cấu hình duyệt trước) hoặc chờ khách đến xác nhận. Giữ chỗ tối đa `15 phút` kể từ khi tạo (hoặc quá 15 phút so với giờ bắt đầu). Nếu quá hạn sẽ chuyển sang `CANCELLED` hoặc giải phóng bàn.
- `CONFIRMED`: Đặt bàn đã được duyệt/xác nhận thành công. Khung giờ được đảm bảo.
- `CHECKED_IN`: Khách đã có mặt tại câu lạc bộ.
- `IN_USE`: Bàn đã bật điện/bắt đầu tính giờ chơi thực tế.
- `COMPLETED`: Lượt chơi đã kết thúc, hóa đơn đã được lập và thanh toán hoàn tất.
- `CANCELLED`: Khách tự hủy theo chính sách hoặc nhân viên hủy (kèm lý do).
- `NO_SHOW`: Quá giờ bắt đầu 20 phút mà khách không đến và không liên lạc.

**Bảng chuyển đổi trạng thái hợp lệ:**
- `PENDING` -> `CONFIRMED` (Admin/Staff duyệt hoặc auto-confirm theo cấu hình)
- `PENDING` -> `CANCELLED` (Khách hủy hoặc hết hạn giữ chỗ)
- `CONFIRMED` -> `CHECKED_IN` (Khách đến quầy)
- `CONFIRMED` -> `CANCELLED` (Khách hủy trước giờ chơi ít nhất 60 phút)
- `CONFIRMED` -> `NO_SHOW` (Khách không đến)
- `CHECKED_IN` -> `IN_USE` (Bật bàn, bắt đầu bấm giờ)
- `IN_USE` -> `COMPLETED` (Kết thúc chơi & thanh toán)

### 3.4. Công Thức & Quy Tắc Tính Tiền (Pricing Engine)
1. **Giá thuê bàn dự kiến:**
   $$\text{Tiền bàn dự kiến} = \frac{\text{Thời lượng đặt (phút)}}{60} \times \text{Đơn giá loại bàn (VNĐ/giờ)}$$
2. **Giá thuê bàn thực tế:**
   $$\text{Thời gian chơi thực} = \max(\text{Thời lượng tối thiểu (30 phút)}, \text{Phút kết thúc} - \text{Phút bắt đầu})$$
   - Làm tròn thời gian: Làm tròn lên theo block 5 phút (ví dụ: 62 phút -> 65 phút) hoặc theo công thức cấu hình.
   - Snapshot đơn giá: Khi tạo hóa đơn, đơn giá theo giờ của bàn và đơn giá dịch vụ tại thời điểm đó được lưu trực tiếp vào bản ghi hóa đơn (`hourly_rate_snapshot`), đảm bảo thay đổi giá sau này không ảnh hưởng đến lịch sử thanh toán.
3. **Tiền dịch vụ phát sinh:**
   $$\text{Tiền dịch vụ} = \sum (\text{Số lượng} \times \text{Đơn giá dịch vụ snapshot})$$
4. **Tổng thanh toán:**
   $$\text{Tổng tiền} = \text{Tiền bàn thực tế} + \text{Tiền dịch vụ} - \text{Giảm giá (Voucher/Chiết khấu)} + \text{Thuế/Phụ phí (nếu có)}$$
5. **Tiền tệ:** Toàn bộ trường liên quan đến tiền sử dụng kiểu số nguyên chính xác (Decimal/Numeric trong DB, VNĐ không có số lẻ thập phân, làm tròn về hàng đơn vị).

### 3.5. Quy định Đặt & Hủy Bàn
- Thời lượng đặt tối thiểu: 60 phút. Tối đa: 360 phút (6 tiếng)/lần đặt.
- Thời gian đặt trước tối thiểu: 30 phút trước giờ bắt đầu.
- Hủy bàn: Khách hàng được phép tự hủy trước giờ bắt đầu ít nhất 60 phút mà không chịu phạt.

---

## 4. YÊU CẦU PHI CHỨC NĂNG (NFR)

1. **Bảo mật (Security):**
   - Không lưu mật khẩu dạng plaintext. Băm mật khẩu bằng `Argon2` hoặc `Bcrypt` với salt round an toàn.
   - Xác thực: JWT (Access Token 15 phút, Refresh Token 7 ngày lưu dạng HttpOnly Cookie chống XSS).
   - Rate limiting trên API nhạy cảm (Đăng nhập, Đăng ký, Đặt bàn) chống Brute-force và Spam request.
   - CORS cấu hình whitelist chặt chẽ theo domain frontend.
   - Helmet bảo vệ HTTP Header.
   - Phân quyền RBAC kiểm tra chặt ở backend qua NestJS Guards.
2. **Hiệu năng & Khả năng chịu tải (Performance & Scalability):**
   - Response time API trung bình < 100ms.
   - Đánh chỉ mục (Index) đầy đủ trên `(table_id, start_time, end_time)`, `user_id`, `status`.
   - Kết nối cơ sở dữ liệu qua Connection Pooling tương thích hoàn toàn với kiến trúc Serverless của Neon PostgreSQL.
3. **Tính toàn vẹn dữ liệu (Data Integrity):**
   - Đảm bảo tính ACID của Transaction khi tạo đặt bàn, cập nhật trạng thái và thanh toán hóa đơn.
   - Không xóa cứng (Hard delete) dữ liệu hóa đơn, bàn chơi hay lịch sử giao dịch khi người dùng bị xóa (Sử dụng Soft Delete hoặc Restrict Foreign Keys).
4. **Khả năng quan sát & Giám sát (Observability):**
   - Nhật ký hoạt động (`audit_logs`) ghi nhận mọi thao tác nhạy cảm: Đổi trạng thái bàn, thay đổi giá, thanh toán hóa đơn.
   - Endpoint Health Check (`/api/v1/health`) kiểm tra liveness và database connection.

