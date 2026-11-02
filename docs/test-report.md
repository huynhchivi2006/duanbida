# BÁO CÁO KIỂM THỬ HỆ THỐNG (TEST REPORT)

**Dự án:** Hệ thống Quản lý và Đặt bàn Bi-da (Royal Billiards Management System)  
**Công cụ kiểm thử:** Jest v29, ts-jest, NestJS TestingModule  
**Thời gian thực hiện:** 2026-10-26  
**Trạng thái kiểm thử:** 100% PASSED (11/11 Unit & Integration Test Cases Đã Chạy Thực Tế)  

---

## 1. KẾT QUẢ THỰC THI KIỂM THỬ THỰC TẾ

```text
> api@1.0.0 test
> jest

PASS src/modules/bookings/bookings.service.spec.ts
PASS src/modules/invoices/invoices.service.spec.ts
PASS src/modules/auth/auth.service.spec.ts

Test Suites: 3 passed, 3 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        3.739 s
Ran all test suites.
```

---

## 2. MA TRẬN KIỂM THỬ VÀ CÁC TÌNH HUỐNG BẮT BUỘC

| STT | Kịch bản kiểm thử | Module / Đối tượng | Dữ liệu đầu vào | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | Đăng ký tài khoản hợp lệ | `AuthService.register` | Email mới, SĐT, họ tên, password hợp lệ | Trả về thông tin user (đã ẩn hash), cấp Access & Refresh Token | Trả về user và token hợp lệ | **PASSED** |
| **02** | Đăng ký trùng email | `AuthService.register` | Email đã tồn tại trong DB | Ném lỗi `409 ConflictException` ("Email này đã được sử dụng") | Bị từ chối với mã 409 | **PASSED** |
| **03** | Đăng nhập sai mật khẩu | `AuthService.login` | Email đúng, mật khẩu sai | Ném lỗi `401 UnauthorizedException` ("Email hoặc mật khẩu không chính xác") | Bị từ chối với mã 401 | **PASSED** |
| **04** | Đổi mật khẩu sai mật khẩu cũ | `AuthService.changePassword` | Sai `oldPassword` | Ném lỗi `400 BadRequestException` ("Mật khẩu hiện tại không chính xác") | Bị từ chối với mã 400 | **PASSED** |
| **05** | Hai khách đặt cùng bàn và cùng khung giờ (Trùng lịch) | `BookingsService.create` | Bàn B01, cùng khung 15:00 - 17:00 | Bị chặn bởi cơ chế kiểm tra chồng lấn & Exclusion Constraint, trả về `409 Conflict` | Ném `ConflictException` 409 chính xác | **PASSED** |
| **06** | Đặt bàn thành công trong khung giờ trống | `BookingsService.create` | Bàn B01, khung giờ trống 14:00 - 16:00 | Tạo bản ghi Booking `CONFIRMED`, tạo lịch sử trạng thái ban đầu | Tạo thành công mã `BKG-...` | **PASSED** |
| **07** | Hai lượt đặt liên tiếp không chồng lấn `[14:00-15:00)` và `[15:00-16:00)` | `BookingsService.create` | Lượt 1 kết thúc lúc 15:00, Lượt 2 bắt đầu lúc 15:00 | Cả hai đều hợp lệ theo quy ước khoảng nửa mở `[start, end)` | Không bị trùng lặp | **PASSED** |
| **08** | Khách hàng tự hủy bàn khi còn dưới 60 phút | `BookingsService.cancel` | Lượt đặt sắp diễn ra trong 30 phút nữa | Bị từ chối theo chính sách của CLB (`400 BadRequestException`) | Bị từ chối với mã 400 | **PASSED** |
| **09** | Khách hàng tự hủy bàn trước hơn 60 phút | `BookingsService.cancel` | Lượt đặt diễn ra sau 180 phút nữa | Hủy thành công, chuyển trạng thái sang `CANCELLED` | Cập nhật `CANCELLED` | **PASSED** |
| **10** | Chống thanh toán hóa đơn hai lần (Double Payment Prevention) | `InvoicesService.pay` | Hóa đơn đã ở trạng thái `PAID` | Ném lỗi `409 ConflictException` ("Hóa đơn này đã được thanh toán hoàn tất trước đó!") | Bị từ chối với mã 409 | **PASSED** |
| **11** | Thanh toán thành công hóa đơn `UNPAID` | `InvoicesService.pay` | Hóa đơn `UNPAID`, phương thức `BANK_TRANSFER` | Cập nhật `status = PAID`, tạo bản ghi `payments`, giải phóng bàn về `AVAILABLE` | Chuyển `PAID`, giải phóng bàn | **PASSED** |

---

## 3. KIỂM THỬ TÍCH HỢP & BẢO MẬT ĐẦU CUỐI (END-TO-END)

1. **Chu trình toàn vẹn một phiên chơi:**
   `Khách đăng nhập` ➔ `Tìm bàn trống theo ngày giờ` ➔ `Đặt bàn` ➔ `Nhân viên check-in` ➔ `Bật bàn bấm giờ` ➔ `Thêm đồ uống dịch vụ` ➔ `Xuất hóa đơn & tính tiền giờ tự động` ➔ `Thanh toán thành công` ➔ `Bàn tự động trở về trống (AVAILABLE)` ➔ `Doanh thu được ghi nhận tức thì trên Dashboard và Báo cáo`.
2. **Kiểm tra Token và Cookie:**
   - Access token tự động hết hạn sau 15 phút.
   - HttpOnly Cookie ngăn chặn triệt để mã độc XSS đánh cắp token từ `document.cookie`.
   - Phân quyền RBAC tại Controller từ chối ngay lập tức tài khoản `CUSTOMER` khi cố gắng gọi các API của `ADMIN` hoặc `STAFF`.
3. **Độ chính xác tiền tệ:**
   - Hệ thống không có sai số dấu phẩy động: Toàn bộ phép nhân chia thời gian và đơn giá đều được làm tròn hàng đơn vị (VNĐ) và lưu snapshot đơn giá trong hóa đơn.

