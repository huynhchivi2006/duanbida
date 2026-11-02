# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG (USER MANUAL)

---

## 1. DÀNH CHO KHÁCH HÀNG (CUSTOMER)

### 1.1. Đăng ký & Đăng nhập
- Truy cập trang chủ: [http://localhost:3000](http://localhost:3000)
- Chọn nút **Đăng Nhập** ở góc phải thanh điều hướng.
- Nhập Email và Mật khẩu. Bạn cũng có thể bấm nút **1-Click Demo** (Khách Hàng) để tự động điền tài khoản thử nghiệm `khach1@gmail.com` / `Khach@123456`.
- Nếu chưa có tài khoản, nhấn liên kết **Đăng ký ngay** để tạo mới.

### 1.2. Tra cứu & Đặt bàn trước trực tuyến
1. Vào mục **Đặt Bàn Trực Tuyến** trên menu:
   - **Bước 1:** Chọn ngày muốn chơi, giờ bắt đầu và thời lượng dự kiến (từ 60 phút đến 360 phút).
   - **Bước 2:** Hệ thống tự động lọc và hiển thị danh sách các bàn còn trống kèm đơn giá và chi phí dự kiến.
   - **Bước 3:** Nhấn nút **Xác Nhận Đặt Bàn** trên bàn muốn chọn, xem lại thông tin trên cửa sổ xác nhận và điền ghi chú (nếu có).
2. Khi đặt bàn thành công, hệ thống cấp một mã duy nhất dạng `BKG-YYYYMMDD-XXXX`.
3. Khung giờ này sẽ lập tức được khóa và giữ chỗ cho bạn.

### 1.3. Theo dõi & Hủy đặt bàn
- Truy cập **Lịch Đặt Của Tôi** (`/customer/dashboard`):
  - Theo dõi danh sách các đơn đặt bàn, giờ bắt đầu, trạng thái (`CONFIRMED`, `CHECKED_IN`, `IN_USE`,...).
  - Nếu có việc bận, bạn có thể tự nhấn nút **Hủy Bàn** trước giờ chơi ít nhất 60 phút theo chính sách của câu lạc bộ.
- Truy cập **Lịch Sử Hóa Đơn** (`/customer/invoices`) để xem lại các hóa đơn và khoản phí đã thanh toán.

---

## 2. DÀNH CHO NHÂN VIÊN THU NGÂN (STAFF)

Đăng nhập tài khoản nhân viên: `staff1@billiards.local` / `Staff@123456`.

### 2.1. Quản lý Sơ đồ bàn trực quan (`/staff/dashboard`)
- Sơ đồ bàn hiển thị màu sắc theo trạng thái:
  - **Màu xanh lá:** Bàn đang trống, sẵn sàng nhận khách.
  - **Màu đỏ/cam:** Bàn đang có khách chơi (đang bật giờ).
  - **Màu vàng:** Bàn đã có khách đặt trước trong ngày.
  - **Màu xám:** Bàn đang bảo trì.
- Nhấn vào bất kỳ bàn nào để xem chi tiết hoặc thực hiện thao tác nhanh.

### 2.2. Tiếp nhận khách đặt trước & Khách vãng lai (`/staff/bookings`)
- Khi khách đến quán xuất trình mã đặt bàn:
  1. Nhấn nút **Check-in Khách Đến** để xác nhận khách đã có mặt.
  2. Khi khách vào bàn, nhấn nút **Bật Bàn Bấm Giờ**. Bàn sẽ tự động chuyển sang trạng thái `OCCUPIED` (Đang chơi) và bắt đầu đếm thời gian thực tế.
- Khách vãng lai đến trực tiếp: Nhân viên có thể bấm **Đặt Bàn Cho Khách Tại Quầy** để tạo đơn ngay lập tức.

### 2.3. Bán đồ uống & Tính tiền giờ tại Quầy Thu Ngân (`/staff/billing`)
1. **Gọi thêm dịch vụ:** Trong suốt quá trình khách chơi, chọn bàn tương ứng, chọn món từ menu (Nước ngọt, Cà phê, Khăn lạnh, Mì xào, Cơ thi đấu), chọn số lượng và bấm **Thêm Món**.
2. **Kết thúc giờ chơi:**
   - Bấm **Chốt Giờ Chơi & Tạo Hóa Đơn**.
   - Hệ thống tự động tính chính xác thời gian chơi (tối thiểu 30 phút, làm tròn theo block 5 phút) nhân với đơn giá giờ snapshot.
   - Nhập tiền giảm giá (nếu có chương trình khuyến mãi).
3. **Thanh toán:**
   - Chọn phương thức: **Tiền Mặt** hoặc **Chuyển Khoản QR**.
   - Bấm xác nhận thanh toán. Hệ thống lập tức đánh dấu hóa đơn là `PAID`, giải phóng bàn chơi về trạng thái `AVAILABLE` cho lượt khách tiếp theo và chống thanh toán lặp.

---

## 3. DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)

Đăng nhập tài khoản Admin: `admin@billiards.local` / `Admin@123456`.

### 3.1. Dashboard Thống kê thời gian thực (`/admin/dashboard`)
- Xem 4 chỉ số KPI chính:
  1. Doanh thu hôm nay (chỉ tính hóa đơn `PAID`).
  2. Tỷ lệ lấp đầy bàn hiện tại (`%`).
  3. Tổng số lượt đặt bàn trong ngày.
  4. Tổng số bàn hoạt động.
- Biểu đồ cột trực quan biến động doanh thu 7 ngày gần nhất.
- Bảng danh sách các lượt đặt bàn mới nhất trong hệ thống.

### 3.2. Quản lý Bàn & Loại bàn (`/admin/tables`)
- Thêm bàn mới: Nhập mã số bàn (`B09`), chọn loại bàn (`POOL`, `CAROM_3C`, `SNOOKER`), chọn khu vực (`STANDARD`, `VIP`, `OUTDOOR`).
- Đổi trạng thái bàn sang `MAINTENANCE` khi cần thay nỉ, sửa cơ hoặc vệ sinh.
- Xóa bàn: Chỉ cho phép xóa khi bàn không có lượt đặt bàn hay phiên chơi liên quan.

### 3.3. Quản lý Menu Đồ Uống & Dịch Vụ (`/admin/services`)
- Thêm đồ uống, món ăn nhẹ, phụ kiện thuê với đơn giá niêm yết và đơn vị tính (Lon, Ly, Chai, Dĩa, Lượt).
- Tạm ngưng hoặc khôi phục kinh doanh các món trong menu.

### 3.4. Quản lý Người dùng & Nhân viên (`/admin/users`)
- Tạo tài khoản nhân viên mới cấp quyền `STAFF` cho ca làm việc.
- Khóa hoặc Mở khóa tài khoản người dùng khi vi phạm chính sách.

### 3.5. Báo cáo Doanh thu & Xuất CSV (`/admin/reports`)
- Lọc doanh thu theo khoảng thời gian tùy chọn (Từ ngày ... Đến ngày ...).
- Xem bóc tách chi tiết: Tổng doanh thu, Tiền giờ bàn, Tiền dịch vụ, Tiền chiết khấu, Cơ cấu thanh toán theo Tiền mặt vs Chuyển khoản.
- Nhấn nút **Xuất Báo Cáo Excel (CSV)** để tải file `.csv` chuẩn tiếng Việt (UTF-8 with BOM), mở trực tiếp trên Excel không bị lỗi font chữ.

