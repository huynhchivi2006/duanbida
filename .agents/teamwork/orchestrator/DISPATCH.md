## 2026-11-01T11:01:03Z
From: 1ae03622-f35a-458e-85f0-9e70bc5339dc

Rà soát toàn diện codebase Billiards Club Management (NestJS API + Prisma + PostgreSQL Neon & Next.js 14 Web App), kiểm thử các kịch bản thực tế, phát hiện và sửa chữa triệt để các lỗi tiềm ẩn cho 9 tính năng mới và các module liên quan, xác minh hệ thống hoạt động ổn định và cập nhật lại các gói đóng gói triển khai.

Working directory: d:\Lập trình mã nguồn mở 2\duancuoiky
Integrity mode: development

## Requirements

### R1. Rà soát và kiểm thử chuyên sâu 9 tính năng mới cùng các luồng tích hợp
Lập kế hoạch và rà soát kỹ lưỡng toàn diện codebase (NestJS API và Next.js 14 Web App), tập trung chuyên sâu vào 9 tính năng mới phát triển và sự tích hợp của chúng với các module hiện có trong hệ thống:
1. Tích điểm đổi quà & Hạng thành viên (Standard, Silver, Gold, VIP), cấu hình ưu đãi, thẻ hội viên điện tử.
2. Quản lý và áp dụng Voucher / Mã giảm giá (% hoặc tiền cố định, giới hạn lượt dùng, áp dụng tại POS).
3. Chuyển bàn (chuyển ca chơi sang bàn trống) và gộp bàn (gộp thời lượng chơi, đồ uống, nhân viên sang bàn khác).
4. Tự động tính tiền giờ theo block làm tròn (5 phút, 15 phút, hoặc chính xác từng phút thực tế).
5. Áp dụng chiết khấu kép (hạng thẻ thành viên + voucher khuyến mãi).
6. Quản lý hồ sơ khách hàng toàn diện (SĐT, ngày sinh, tổng chi tiêu, tần suất chơi, điểm tích lũy, phân hạng).
7. Thống kê cơ cấu doanh thu: Tiền giờ vs Tiền F&B vs Bán phụ kiện vs Khác (RevenueStructureCard).
8. Đo lường hiệu suất khai thác bàn: Tỷ lệ lấp đầy bàn theo 24 khung giờ trong ngày và Xếp hạng loại bàn được ưa chuộng nhất (TableUtilizationCard).
9. Đóng gói deploy Wispbyte (backend-wispbyte.zip) và Hosting (frontend-hosting.zip).
Kiểm tra các kịch bản thực tế, phát hiện mọi lỗi tiềm ẩn gồm edge cases, validation, giao diện, xử lý bất đồng bộ, sai số tính toán tiền/điểm/chiết khấu.

### R2. Sửa lỗi triệt để và bảo đảm tính toàn vẹn hệ thống
Viết mã khắc phục triệt để mọi lỗi phát hiện được trên cả backend và frontend, đảm bảo tính nhất quán logic giữa API và giao diện người dùng. Đảm bảo toàn bộ hệ thống biên dịch thành công, không phát sinh lỗi hồi quy (regression) và hoạt động ổn định.

### R3. Xác minh độc lập bằng kiểm thử tự động an toàn
Sử dụng các bộ test hiện có trong dự án và viết bổ sung các kịch bản kiểm thử tự động (unit, API/integration) để kiểm tra các luồng nghiệp vụ cốt lõi và các trường hợp biên. Mọi hoạt động kiểm thử phải sử dụng mock data hoặc database test cục bộ, tuyệt đối không thao tác hoặc làm ảnh hưởng đến dữ liệu thực tế.

### R4. Cập nhật và kiểm tra các gói triển khai
Nếu có thay đổi mã nguồn sau khi sửa lỗi, tiến hành build và đóng gói lại các file triển khai backend-wispbyte.zip và frontend-hosting.zip. Xác minh các file nén chứa đầy đủ artifact cần thiết để triển khai.

## Acceptance Criteria

### Biên dịch và Mã nguồn
- [ ] Backend NestJS và Frontend Next.js biên dịch (build) thành công không có lỗi TypeScript hoặc lỗi linter ngăn cản.
- [ ] Không có lỗi runtime hoặc unhandled exception trong quá trình khởi động hoặc chạy các service chính.

### Logic Nghiệp vụ & Sửa lỗi
- [ ] Tính tiền giờ theo block làm tròn (5 phút, 15 phút, chính xác từng phút) tính toán chính xác tiền và thời lượng trong mọi kịch bản kiểm thử.
- [ ] Chiết khấu kép (hạng thẻ thành viên kết hợp voucher) được áp dụng và khấu trừ chính xác theo thứ tự cấu hình, không bị cộng dồn sai hoặc âm tiền.
- [ ] Luồng chuyển bàn sang bàn trống và gộp bàn (thời gian, order F&B, nhân viên) cập nhật đúng trạng thái và không làm mất hoặc nhân đôi dữ liệu.
- [ ] Luồng tích điểm thành viên, nâng hạng tự động, cập nhật lịch sử chi tiêu khách hàng hoạt động chính xác.
- [ ] Áp dụng voucher (% hoặc tiền mặt, kiểm tra hạn mức sử dụng và điều kiện hợp lệ tại POS) hoạt động chính xác.
- [ ] Biểu đồ và dữ liệu thống kê cơ cấu doanh thu (RevenueStructureCard) cùng hiệu suất khai thác bàn (TableUtilizationCard) hiển thị số liệu tính toán chính xác từ API.

### Kiểm thử và An toàn dữ liệu
- [ ] Toàn bộ các bộ test tự động (bao gồm test hiện có và test bổ sung) chạy thành công 100%.
- [ ] Kiểm thử chạy hoàn toàn trên mock data / database test cục bộ, không ghi hoặc chỉnh sửa dữ liệu trên database thực tế.

### Đóng gói Triển khai
- [ ] Các file backend-wispbyte.zip và frontend-hosting.zip được đóng gói lại đồng bộ với mã nguồn mới nhất (nếu có thay đổi code) và chứa đầy đủ cấu hình/artifact triển khai.
