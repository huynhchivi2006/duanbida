# DÀN Ý SLIDE POWERPOINT BẢO VỆ ĐỒ ÁN (TỐI ĐA 15 TRANG)
### Đề tài: Hệ Thống Quản Lý & Đặt Bàn Bi-da Trực Tuyến (Royal Billiards)

---

### SLIDE 1: TRANG TIÊU ĐỀ
- **Tiêu đề:** HỆ THỐNG QUẢN LÝ VÀ ĐẶT BÀN BI-DA TRỰC TUYẾN
- **Môn học:** Lập trình Mã Nguồn Mở
- **Sinh viên thực hiện:** [Họ và tên sinh viên] - MSSV: [Mã số sinh viên]
- **Giảng viên hướng dẫn:** [Họ và tên giảng viên]
- **Lời thuyết trình (Script):** *"Kính thưa quý thầy cô trong hội đồng nghiệm thu đồ án, hôm nay em xin đại diện nhóm trình bày đề tài Hệ thống Quản lý và Đặt bàn Bi-da Trực tuyến Royal Billiards, một giải pháp full-stack toàn diện ứng dụng NestJS, Next.js và PostgreSQL Neon."*

---

### SLIDE 2: BỐI CẢNH & LÝ DO CHỌN ĐỀ TÀI
- **Nội dung:**
  - Sự bùng nổ của môn thể thao bi-da và các CLB hiện đại tại Việt Nam.
  - Hạn chế của phương pháp thủ công: Sót lịch, trùng lịch khi đặt qua điện thoại, tính sai giờ chơi, thiếu báo cáo tức thì.
  - Nhu cầu khách hàng: Muốn biết bàn trống và đặt giữ chỗ trước từ xa.
- **Lời thuyết trình:** *"Hiện nay, đa số câu lạc bộ bi-da vẫn nhận khách bằng sổ tay hoặc phần mềm offline cục bộ. Điều này dẫn đến vấn đề nhức nhối nhất: trùng lịch vào giờ cao điểm và khách hàng đến nơi nhưng không có bàn chơi."*

---

### SLIDE 3: MỤC TIÊU DỰ ÁN
- **Nội dung:**
  - Xây dựng hệ thống web full-stack có nghiệp vụ thực tế hoàn chỉnh.
  - Giải quyết bài toán chống trùng lịch đặt bàn tuyệt đối ở cấp độ cơ sở dữ liệu.
  - Phục vụ đồng thời 3 nhóm đối tượng: Khách hàng, Nhân viên thu ngân, Quản trị viên.
- **Lời thuyết trình:** *"Mục tiêu của chúng em không chỉ là làm một trang web hiển thị thông tin, mà là một hệ thống quản lý có database thật, API thật, thuật toán chống xung đột đồng thời và tính tiền chính xác từng phút."*

---

### SLIDE 4: CÔNG NGHỆ BẮT BUỘC SỬ DỤNG
- **Nội dung:**
  - **Backend:** NestJS 10, TypeScript, RESTful API `/api/v1`, Swagger/OpenAPI.
  - **ORM & Database:** Prisma ORM v5, PostgreSQL Serverless trên Neon Cloud.
  - **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS, TanStack Query v5.
  - **Bảo mật:** Bcrypt hash, JWT Access Token & Refresh Token (HttpOnly Cookie), RBAC Guards.
- **Lời thuyết trình:** *"Toàn bộ hệ thống được xây dựng trên nền tảng monorepo với type safety tuyệt đối từ database đến giao diện người dùng."*

---

### SLIDE 5: KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)
- **Nội dung:**
  - Sơ đồ kiến trúc 4 tầng: Client Layer ➔ Gateway & Security Layer ➔ NestJS Domain Modules ➔ PostgreSQL Neon Database.
  - Cơ chế Connection Pooling đáp ứng kiến trúc Serverless.
- **Lời thuyết trình:** *"Kiến trúc được tổ chức theo module hóa cao độ, mỗi domain nghiệp vụ như Auth, Tables, Bookings, Invoices đều độc lập và dễ dàng mở rộng."*

---

### SLIDE 6: SƠ ĐỒ THỰC THỂ LIÊN KẾT (DATABASE ERD)
- **Nội dung:**
  - 12 bảng thực thể: `users`, `table_types`, `billiard_tables`, `bookings`, `booking_status_histories`, `play_sessions`, `services`, `invoices`, `invoice_items`, `payments`, `business_settings`, `audit_logs`.
  - Toàn vẹn dữ liệu: Khóa ngoại ràng buộc chặt chẽ, kiểu số `DECIMAL(12,2)` cho tiền tệ.
- **Lời thuyết trình:** *"Sơ đồ database được chuẩn hóa, áp dụng snapshot đơn giá vào bản ghi hóa đơn để bảo đảm lịch sử tài chính không bị biến động khi sửa giá niêm yết."*

---

### SLIDE 7: BÀI TOÁN CỐT LÕI - CHỐNG TRÙNG LỊCH ĐẶT BÀN
- **Nội dung:**
  - **Vấn đề:** Hai khách cùng bấm đặt bàn trong cùng 1 mili-giây (Race condition).
  - **Giải pháp đa tầng:**
    1. PostgreSQL Transaction với Pessimistic Lock (`SELECT FOR UPDATE`).
    2. Extension `btree_gist` và Exclusion Constraint trên `tstzrange(start, end, '[)')`.
    3. Trả về mã lỗi chuẩn `HTTP 409 Conflict`.
- **Lời thuyết trình:** *"Đây là điểm nhấn kỹ thuật quan trọng nhất của đồ án. Nhóm đã sử dụng Exclusion Constraint với toán tử range nửa mở, triệt tiêu hoàn toàn nguy cơ trùng bàn ngay tại nhân của PostgreSQL."*

---

### SLIDE 8: CHU TRÌNH VÒNG ĐỜI ĐẶT BÀN (STATE MACHINE)
- **Nội dung:**
  - `PENDING` ➔ `CONFIRMED` ➔ `CHECKED_IN` ➔ `IN_USE` ➔ `COMPLETED`.
  - Nhánh hủy: `CANCELLED` (Khách hủy trước 60 phút hoặc nhân viên hủy có lý do), `NO_SHOW`.
- **Lời thuyết trình:** *"Trạng thái đặt bàn được kiểm soát bằng máy trạng thái hữu hạn, không cho phép client cập nhật tùy tiện các bước nhảy trạng thái."*

---

### SLIDE 9: THUẬT TOÁN TÍNH TIỀN TẬP TRUNG (PRICING ENGINE)
- **Nội dung:**
  - Tính tiền giờ chơi tự động: Làm tròn block 5 phút, tối thiểu tính phí 30 phút.
  - Tiền dịch vụ phát sinh từ đồ ăn, thức uống, phụ kiện thuê.
  - Tổng thanh toán = Tiền bàn + Tiền dịch vụ - Giảm giá.
- **Lời thuyết trình:** *"Công thức tính tiền được thực hiện hoàn toàn ở backend, đảm bảo khách hàng hay client không thể can thiệp số tiền cuối cùng."*

---

### SLIDE 10: CỔNG KHÁCH HÀNG (CUSTOMER PORTAL)
- **Nội dung:**
  - Tra cứu bàn trống theo ngày, giờ và thời lượng.
  - Xem trước báo giá dự kiến.
  - Quản lý lịch đặt và lịch sử hóa đơn cá nhân.
- **Lời thuyết trình:** *"Khách hàng có thể trải nghiệm giao diện Dark Theme sang trọng, đặt bàn nhanh chóng chỉ qua 2 bước đơn giản."*

---

### SLIDE 11: CỔNG NHÂN VIÊN THU NGÂN (STAFF POS)
- **Nội dung:**
  - Sơ đồ bàn trực quan: Xanh (Trống), Đỏ (Đang chơi), Vàng (Đã đặt), Xám (Bảo trì).
  - Tiếp nhận khách đến, check-in, bật bàn tính giờ.
  - Gọi thêm đồ uống dịch vụ vào hóa đơn và xác nhận thanh toán tại quầy.
- **Lời thuyết trình:** *"Màn hình thu ngân được tối ưu cho thao tác nhanh của nhân viên quầy, hỗ trợ cả tiền mặt và chuyển khoản QR."*

---

### SLIDE 12: CỔNG QUẢN TRỊ VIÊN (ADMIN PORTAL)
- **Nội dung:**
  - Dashboard KPI: Doanh thu ngày, tỷ lệ lấp đầy bàn, biểu đồ 7 ngày.
  - Quản lý bàn, menu dịch vụ, phân quyền tài khoản nhân viên.
  - Báo cáo doanh thu lọc theo dải ngày và xuất file Excel (CSV) tiếng Việt.
- **Lời thuyết trình:** *"Dashboard hiển thị các chỉ số được tính toán thời gian thực từ database bằng các truy vấn aggregate SQL có điều kiện chặt chẽ."*

---

### SLIDE 13: KẾT QUẢ KIỂM THỬ THỰC TẾ (TEST RESULTS)
- **Nội dung:**
  - 100% test suite PASSED (11/11 tests chạy thực tế bằng Jest).
  - Kiểm tra các luồng: Đăng nhập sai mật khẩu, Đặt bàn hợp lệ, Xung đột trùng lịch (409 Conflict), Chống thanh toán 2 lần, Chính sách hủy bàn 60 phút.
- **Lời thuyết trình:** *"Nhóm đã xây dựng bộ test tự động và chạy thực tế đạt kết quả 11/11 test cases thành công mỹ mãn."*

---

### SLIDE 14: KẾ HOẠCH TRIỂN KHAI THỰC TẾ (DEPLOYMENT)
- **Nội dung:**
  - Database: Neon Serverless PostgreSQL (Singapore Region).
  - Backend API: Cloud Node của Wispyte.
  - Frontend: Vercel / Next.js Host.
  - Quy trình chạy Migration an toàn và Health Check endpoint.
- **Lời thuyết trình:** *"Hệ thống đã sẵn sàng với bộ tài liệu triển khai chi tiết từng bước, cấu hình biến môi trường và kịch bản vận hành an toàn."*

---

### SLIDE 15: KẾT LUẬN & HƯỚNG PHÁT TRIỂN
- **Nội dung:**
  - **Kết luận:** Hoàn thành đầy đủ các tiêu chuẩn đồ án môn học, giải quyết bài toán nghiệp vụ thực tiễn.
  - **Hướng phát triển:** Tích hợp cổng thanh toán trực tuyến tự động (PayOS/VNPay/Momo webhook), hệ thống tích điểm thành viên VIP, thông báo nhắc lịch qua Zalo/SMS.
  - **Cảm ơn & Hỏi đáp:** Xin cảm ơn quý thầy cô đã chú ý lắng nghe!
- **Lời thuyết trình:** *"Em xin chân thành cảm ơn thầy cô trong hội đồng. Sau đây em xin phép được trình chiếu kịch bản demo hệ thống thực tế."*

