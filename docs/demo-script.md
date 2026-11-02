# KỊCH BẢN DEMO HỆ THỐNG TRỰC TIẾP (5 - 10 PHÚT)
### Phục vụ buổi báo cáo và nghiệm thu đồ án môn học

---

## MỤC TIÊU CỦA BUỔI DEMO
Minh họa trực quan và thuyết phục toàn bộ chu trình nghiệp vụ thực tế của câu lạc bộ bi-da:
1. Luồng khách hàng: Tìm bàn trống ➔ Đặt bàn thành công.
2. **Điểm nhấn kỹ thuật:** Thử đặt trùng cùng bàn và khung giờ ➔ Hệ thống từ chối với lỗi **409 Conflict**.
3. Luồng nhân viên: Tiếp nhận khách ➔ Check-in ➔ Bật bàn bấm giờ ➔ Thêm đồ uống dịch vụ.
4. Luồng tính tiền & thanh toán: Tự động tính tiền theo phút ➔ Chống thanh toán 2 lần ➔ Bàn tự động về trống.
5. Luồng quản trị: Dashboard cập nhật doanh thu thời gian thực ➔ Xuất file CSV báo cáo kế toán.

---

## CÁC BƯỚC THỰC HIỆN CHI TIẾT (TỪNG PHÚT)

### ⏱️ Phút 01: Giới thiệu giao diện & Đăng nhập
1. Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).
2. Giới thiệu nhanh giao diện công khai phong cách Dark sang trọng mang âm hưởng câu lạc bộ bi-da hoàng gia.
3. Nhấp vào **Đăng Nhập** ➔ Nhấn nút **1-Click Demo** (Khách Hàng) để đăng nhập tài khoản `khach1@gmail.com`.
4. Hệ thống chuyển vào Cổng Khách Hàng (`/customer/dashboard`), hiển thị lời chào và lịch đặt hiện có.

---

### ⏱️ Phút 02: Tìm kiếm bàn trống & Đặt bàn thành công (Tình huống 1)
1. Trên thanh điều hướng, nhấp vào **Đặt Bàn Trực Tuyến** (`/book`).
2. Chọn:
   - **Ngày chơi:** Hôm nay (hoặc ngày mai).
   - **Giờ bắt đầu:** `15:00`.
   - **Thời lượng:** `120 phút` (2 tiếng).
3. Hệ thống tức thì trả về danh sách các bàn còn trống (ví dụ: Bàn `B03` - Bàn Bida Lỗ, đơn giá 80.000 ₫/h, chi phí dự kiến: `160.000 ₫`).
4. Nhấn nút **Xác Nhận Đặt Bàn** trên bàn `B03`.
5. Cửa sổ xác nhận hiện ra, nhập ghi chú: *"Cần 2 cơ thi đấu chuẩn"*. Bấm **Hoàn Tất Đặt Bàn**.
6. **Kết quả:** Modal thành công xuất hiện với mã đặt bàn duy nhất: `BKG-YYYYMMDD-XXXX`. Khung giờ 15:00 - 17:00 của bàn B03 đã chính thức được khóa trên database.

---

### ⏱️ Phút 04: Thử đặt trùng khung giờ & Bị từ chối (Tình huống 2 - Concurrency Conflict)
1. Mở một **Cửa sổ ẩn danh (Incognito)** mới hoặc đăng nhập tài khoản khách hàng thứ 2 (`khach2@gmail.com`).
2. Vào trang **Đặt Bàn Trực Tuyến** (`/book`).
3. Chọn cùng ngày chơi và khung giờ chồng lấn:
   - Giờ bắt đầu: `16:00` (nằm trong khoảng 15:00 - 17:00 của lượt đặt trước).
   - Thời lượng: `60 phút`.
4. Quan sát danh sách bàn khả dụng: Bàn `B03` đã tự động biến mất khỏi danh sách bàn trống trong khung giờ này.
5. Giả lập trường hợp cố tình gửi request đặt bàn `B03` vào khung giờ này (hoặc 2 người cùng bấm nút đồng thời):
   - **Kết quả:** Hệ thống lập tức trả về thông báo lỗi:
     > *"Bàn B03 đã có người đặt trong khoảng thời gian này. Vui lòng chọn khung giờ hoặc bàn khác."* (HTTP Status `409 Conflict`).
6. **Thuyết minh trước hội đồng:** *"Cơ chế PostgreSQL Transaction kết hợp Exclusion Constraint GiST đã chặn đứng hoàn toàn hiện tượng overbooking ngay tại database level."*

---

### ⏱️ Phút 06: Nhân viên tiếp nhận khách & Bật bàn tính giờ
1. Đăng nhập tài khoản Nhân Viên: `staff1@billiards.local` / `Staff@123456`.
2. Vào **Lịch Đặt Trong Ca** (`/staff/bookings`):
   - Tìm thấy đơn đặt bàn `BKG-...` vừa tạo.
   - Nhấn nút **Check-in Khách Đến** ➔ Trạng thái chuyển sang `CHECKED_IN`.
   - Nhấn nút **Bật Bàn Bấm Giờ** ➔ Đơn chuyển sang `IN_USE`.
3. Vào **Sơ Đồ Bàn Trực Quan** (`/staff/dashboard`):
   - Bàn `B03` lập tức đổi sang màu đỏ với trạng thái **ĐANG CHƠI (Tính Giờ)**.

---

### ⏱️ Phút 07: Thêm đồ uống dịch vụ & Lập hóa đơn tại Quầy Thu Ngân
1. Vào **Quầy Thu Ngân** (`/staff/billing`):
   - Bàn `B03` đang hiển thị trong danh sách bàn đang chơi.
   - Nhấn vào bàn `B03` ➔ Bấm **Chốt Giờ Chơi & Tạo Hóa Đơn**.
   - Hệ thống tự động tính số phút chơi thực tế và quy ra tiền giờ theo đơn giá snapshot.
2. Tại khu vực gọi món:
   - Chọn món: `Nước ngọt Red Bull (Bò Húc)` - Số lượng: `2`. Nhấn **Thêm Món**.
   - Chọn món: `Khăn lạnh hương quế` - Số lượng: `2`. Nhấn **Thêm Món**.
3. Bảng chi tiết hóa đơn tức thì cộng dồn tiền bàn và tiền nước, cập nhật tổng số tiền thanh toán minh bạch.

---

### ⏱️ Phút 08: Xác nhận thanh toán & Chống thanh toán 2 lần
1. Chọn hình thức: **Chuyển Khoản QR** hoặc **Tiền Mặt**.
2. Nhấn nút xác nhận thanh toán:
   - Hệ thống thông báo thanh toán thành công.
   - Trạng thái hóa đơn chuyển sang `PAID`.
   - Bàn `B03` tự động được giải phóng và chuyển về trạng thái **AVAILABLE (Xanh lá)**.
3. Nếu cố tình gửi lại lệnh thanh toán cho hóa đơn này, hệ thống sẽ từ chối ngay lập tức: *"Hóa đơn này đã được thanh toán hoàn tất trước đó!"*.

---

### ⏱️ Phút 09: Quản trị viên xem Dashboard & Xuất file CSV
1. Đăng nhập tài khoản Quản Trị Viên: `admin@billiards.local` / `Admin@123456`.
2. Vào **Tổng Quan (Dashboard)** (`/admin/dashboard`):
   - Doanh thu hôm nay lập tức nhảy số tăng đúng bằng giá trị hóa đơn vừa thanh toán.
   - Biểu đồ cột 7 ngày phản ánh sự gia tăng doanh thu.
3. Vào **Báo Cáo Doanh Thu** (`/admin/reports`):
   - Xem bóc tách: Tiền giờ bàn, Tiền đồ uống dịch vụ.
   - Bấm nút **Xuất Báo Cáo Excel (CSV)**.
   - Mở file CSV tải về: Toàn bộ thông tin hiển thị chuẩn tiếng Việt, có dấu rõ ràng không bị lỗi font nhờ chuẩn UTF-8 with BOM.

---

## KẾT THÚC DEMO
*"Kính thưa quý thầy cô, toàn bộ kịch bản từ khách hàng đặt bàn, chống trùng lịch, nhân viên vận hành đến quản trị tài chính đã diễn ra trơn tru và chính xác 100% trên hệ thống thực tế. Nhóm chúng em xin lắng nghe nhận xét và câu hỏi từ hội đồng."*

