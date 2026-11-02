# Báo Cáo Khảo Sát Chuyên Sâu Backend NestJS API & Prisma ORM
**Mã đặc nhiệm**: `explorer_survey_1`  
**Dự án**: Billiards Club Management System (Billiards Monorepo)  
**Thời gian khảo sát**: 2026-11-01T11:10:00Z  
**Phạm vi**: `apps/api`, Prisma Schema & Migrations, Logic Nghiệp Vụ 9 Tính Năng Mục Tiêu, Unit/E2E Tests, Đóng gói Wispbyte.

---

## 1. Tổng Quan Kiến Trúc & Cấu Trúc Backend (`apps/api`)

### 1.1 Cấu trúc Monorepo & Backend
- **Framework**: NestJS v10 (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`).
- **ORM & Database**: Prisma ORM v5.22 kết nối Neon PostgreSQL (hỗ trợ pooling qua `DATABASE_URL` và direct connection qua `DIRECT_URL`).
- **Module Architecture**: Đóng gói dạng module hướng tính năng (`src/modules/*`), tích hợp `ConfigModule`, `ThrottlerModule` (120 req/min), `JwtModule`, `PassportModule`.
- **Validation & Transformation**: `ValidationPipe` toàn cục với `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- **Error Handling & Response Formatting**: `AllExceptionsFilter` (`src/common/filters/http-exception.filter.ts`) và `TransformInterceptor` (`src/common/interceptors/transform.interceptor.ts`).
- **Tài liệu API**: OpenAPI / Swagger UI tại route `/api/docs`.

### 1.2 Danh mục Module Backend
| Tên Module | Controller | Service | DTOs | Chức năng chính |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `auth.controller.ts` | `auth.service.ts` | `login.dto`, `register.dto`, `change-password.dto`, `update-profile.dto` | Đăng ký, đăng nhập JWT (access 15m, refresh 7d), cập nhật hồ sơ, đổi mật khẩu |
| **Invoices** | `invoices.controller.ts` | `invoices.service.ts` | `invoice.dto.ts` | Mở bàn nhanh, gọi món khi chơi, gán nhân viên, tính tiền kết thúc phiên, chiết khấu kép, thanh toán & tích điểm, live bill QR |
| **Tables** | `tables.controller.ts` | `tables.service.ts` | `create-table.dto.ts` | CRUD bàn, tìm bàn trống theo slot, chuyển bàn (`switchTable`), gộp bàn (`mergeTables`) |
| **Table Types** | `table-types.controller.ts` | `table-types.service.ts` | `create-table-type.dto.ts` | Phân loại bàn (Bida Lỗ, Carom, Snooker, Lỗ 15 bi) & biểu giá theo giờ |
| **Bookings** | `bookings.controller.ts` | `bookings.service.ts` | `create-booking.dto.ts` | Đặt bàn trước, khóa bi quan chống trùng lịch, check-in, hủy đặt bàn (chính sách 60m), khởi tạo session |
| **Membership** | `membership.controller.ts` | `membership.service.ts` | `membership.dto.ts` | Cấu hình ưu đãi hạng thẻ (Standard, Silver, Gold, VIP), đổi quà thưởng (`RewardGift`, `RewardRedemption`), thẻ hội viên điện tử |
| **Vouchers** | `vouchers.controller.ts` | `vouchers.service.ts` | `voucher.dto.ts` | Quản lý voucher (% hoặc tiền mặt), kiểm tra hiệu lực, hạn mức sử dụng, min order value |
| **Pricing Rules** | `pricing-rules.controller.ts` | `pricing-rules.service.ts` | `pricing-rule.dto.ts` | Cấu hình quy tắc phụ thu ngày lễ/tết (+20%, +25%), ngày Chủ Nhật (+15%) |
| **Services** | `services.controller.ts` | `services.service.ts` | `create-service.dto.ts` | Quản lý danh mục F&B (DRINK, FOOD), phụ kiện bi-da (ACCESSORY), dịch vụ khác |
| **Users** | `users.controller.ts` | `users.service.ts` | `create-user.dto.ts` | Tra cứu khách hàng theo SĐT (POS), danh sách người dùng theo hạng thẻ, kích hoạt/khóa tài khoản |
| **Dashboard** | `dashboard.controller.ts` | `dashboard.service.ts` | `dashboard.controller.ts` | Thống kê dashboard theo ngày/tuần/tháng/quý/năm, tỷ lệ lấp đầy bàn, biểu đồ doanh thu |
| **Reports** | `reports.controller.ts` | `reports.service.ts` | `reports.controller.ts` | Báo cáo doanh thu chu kỳ, xuất CSV, cơ cấu doanh thu F&B/Giờ/Phụ kiện, hiệu suất bàn 24h |
| **Health** | `health.controller.ts` | N/A | N/A | Giám sát trạng thái hoạt động & ping Neon database |

### 1.3 Prisma Schema & Mô hình Dữ liệu
Các Model cốt lõi trong `prisma/schema.prisma`:
- `User`: Quản lý thông tin tài khoản, `phone`, `dateOfBirth`, `membershipTier` (STANDARD, SILVER, GOLD, VIP), `points`, `totalSpending` (Decimal 12,2), `visitCount` (Int).
- `BilliardTable` & `TableType`: Bàn bi-da vật lý (`tableNumber`, `area`, `status`) và loại bàn (`code`, `hourlyRate`).
- `Booking` & `BookingStatusHistory`: Đơn đặt bàn trước, trạng thái (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `IN_USE`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
- `PlaySession` & `StaffAssignment`: Phiên chơi thực tế tại bàn (`hourlyRateSnapshot`, `startTime`, `endTime`, `durationMinutes`, `status: PLAYING | PAUSED | FINISHED`) và nhân viên đứng bàn / xếp bi (`fee`).
- `Invoice` & `InvoiceItem`: Hóa đơn (`tableAmount`, `serviceAmount`, `discountAmount`, `finalAmount`, `voucherDiscount`, `tierDiscount`, `roundingMode`, `pointsEarned`, `status: UNPAID | PAID | CANCELLED | REFUNDED`).
- `Payment`: Giao dịch thanh toán (`method: CASH | BANK_TRANSFER | VNPAY_MOMO | CARD`, `status: PENDING | SUCCESS | FAILED`).
- `MembershipTierBenefit`: Cấu hình ưu đãi hạng (`minSpending`, `discountTablePercent`, `discountServicePercent`, `pointMultiplier`).
- `Voucher`: Mã giảm giá (`code`, `discountType: PERCENT | FIXED_AMOUNT`, `discountValue`, `minOrderValue`, `maxDiscount`, `usageLimit`, `usedCount`, `applicableTo`, `isActive`).
- `RewardGift` & `RewardRedemption`: Quà đổi điểm (`pointsRequired`, `stockQuantity`) và lịch sử đổi quà.
- `PricingRule`: Quy tắc phụ thu theo ngày lễ/tết/chủ nhật (`surchargePercent`, `fixedSurcharge`).

---

## 2. Khảo Sát Chi Tiết 9 Tính Năng Mục Tiêu & Phát Hiện Lỗi

### Feature 1: Tích điểm đổi quà & Hạng thành viên (Standard, Silver, Gold, VIP)
- **Tập tin liên quan**:
  - `apps/api/src/modules/membership/membership.service.ts`
  - `apps/api/src/modules/membership/membership.controller.ts`
  - `apps/api/src/modules/invoices/invoices.service.ts` (phần tích điểm khi thanh toán: dòng 988-1025)
- **Cơ chế tính toán**:
  - Khi hóa đơn chuyển sang `PAID` (`invoices.service.ts:pay`), hệ thống nhân `finalAmount` với hệ số `pointMultiplier` của hạng thẻ (`10.000đ = 1 điểm * pointMultiplier`).
  - Điểm cộng dồn vào `user.points`, doanh số thanh toán cộng dồn vào `user.totalSpending`, tăng `user.visitCount + 1`.
  - Tự động nâng hạng: Quét danh sách `membershipTierBenefit` sắp xếp `minSpending: 'desc'`. Nếu `newTotalSpending >= minSpending`, cập nhật `user.membershipTier = tb.tier`.
  - Khách hàng xem thẻ điện tử và tiến trình qua `membership.service.ts:getMyMembershipInfo`.
- **Các lỗi và rủi ro phát hiện**:
  1. **Race Condition khi đổi quà (`redeemGift`)**:
     - *Vị trí*: `apps/api/src/modules/membership/membership.service.ts:106-156`.
     - *Hiện tượng*: Kiểm tra `user.points < gift.pointsRequired` và `gift.stockQuantity <= 0` được thực hiện **NGOÀI transaction** (`findUnique` trước khi gọi `prisma.$transaction`). Nếu khách hàng gửi 2 request đổi quà song song (hoặc 2 khách cùng đổi món quà cuối cùng còn tồn kho 1 chiếc), cả 2 request đều vượt qua bước kiểm tra, dẫn đến `user.points` bị âm hoặc `gift.stockQuantity` bị âm (-1)!
     - *Khắc phục*: Thực hiện đọc và kiểm tra bên trong transaction, sử dụng điều kiện nguyên tử: `where: { id: userId, points: { gte: gift.pointsRequired } }` và `where: { id: gift.id, stockQuantity: { gte: 1 } }`.

---

### Feature 2: Quản lý và áp dụng Voucher / Mã giảm giá
- **Tập tin liên quan**:
  - `apps/api/src/modules/vouchers/vouchers.service.ts`
  - `apps/api/src/modules/vouchers/vouchers.controller.ts`
  - `apps/api/src/modules/vouchers/dto/voucher.dto.ts`
  - `apps/api/src/modules/invoices/invoices.service.ts:587-617`
- **Cơ chế tính toán**:
  - Hỗ trợ loại `%` (`PERCENT`) hoặc tiền cố định (`FIXED_AMOUNT`).
  - Có điều kiện giá trị đơn tối thiểu (`minOrderValue`), mức giảm tối đa (`maxDiscount`), thời hạn (`startDate` -> `endDate`), giới hạn lượt dùng (`usageLimit` so với `usedCount`).
- **Các lỗi và rủi ro phát hiện**:
  1. **Bỏ qua phạm vi áp dụng (`applicableTo`)**:
     - *Vị trí*: `invoices.service.ts:587-617` và `vouchers.service.ts:91-154`.
     - *Hiện tượng*: Trong Prisma schema và seed data có trường `applicableTo` (`ALL`, `TABLE_ONLY`, `SERVICE_ONLY`). Ví dụ `CHAOMUNG20` là `TABLE_ONLY` (giảm tiền giờ), `FNB10` là `SERVICE_ONLY` (giảm F&B). Tuy nhiên, cả `createFromSession` và `validateVoucher` đều tính chiết khấu trên toàn bộ `preDiscountTotal` (`totalTableAmount + currentServiceAmount`). Dẫn đến voucher tiền bàn lại giảm luôn cả tiền F&B, và ngược lại.
  2. **Thất bại âm thầm (Silent Voucher Failure)**:
     - *Vị trí*: `invoices.service.ts:592-616`.
     - *Hiện tượng*: Nếu thu ngân nhập mã voucher không hợp lệ, đã hết hạn, hoặc chưa đủ `minOrderValue`, hàm `createFromSession` chỉ đơn giản bỏ qua không tính giảm giá, không hề ném lỗi hoặc cảnh báo. Thu ngân tưởng rằng đã áp dụng voucher nhưng hóa đơn thực tế vẫn tính nguyên giá.
  3. **Thiếu kiểm tra cận trên của % giảm giá**:
     - *Vị trí*: `apps/api/src/modules/vouchers/dto/voucher.dto.ts:20-25`.
     - *Hiện tượng*: `CreateVoucherDto` chỉ có `@Min(0)`, không có `@Max(100)` cho `discountType === 'PERCENT'`. Người dùng có thể tạo voucher giảm 200%.

---

### Feature 3: Chuyển bàn (Switch Table) và Gộp bàn (Merge Tables)
- **Tập tin liên quan**:
  - `apps/api/src/modules/tables/tables.service.ts:187-482`
  - `apps/api/src/modules/tables/tables.controller.ts`
  - `apps/api/src/modules/invoices/invoices.service.ts:553-670`
- **Cơ chế tính toán**:
  - `switchTable`: Chuyển `PlaySession` đang chơi từ bàn nguồn sang bàn đích, cập nhật trạng thái bàn nguồn sang `AVAILABLE`, bàn đích sang `OCCUPIED`. Cập nhật `booking` nếu có.
  - `mergeTables`: Tính tiền giờ bàn nguồn đến thời điểm gộp, kết thúc session bàn nguồn, chuyển bàn nguồn về `AVAILABLE`. Tạo hoặc cập nhật hóa đơn bàn đích, chuyển toàn bộ món F&B và dịch vụ nhân viên của bàn nguồn sang hóa đơn bàn đích, cộng dồn tiền giờ bàn nguồn vào bàn đích.
- **Các lỗi và rủi ro phát hiện**:
  1. **LỖI NGHIỆP VỤ NGHIÊM TRỌNG: Mất tiền giờ bàn gộp khi chốt hóa đơn (`createFromSession`)**:
     - *Vị trí*: `tables.service.ts:460-467` kết hợp với `invoices.service.ts:555, 657`.
     - *Hiện tượng*: Khi gộp bàn, `mergeTables` đã thêm `InvoiceItem` (`TABLE_TIME` bàn nguồn, vd 80.000đ) và cộng `targetInvoice.tableAmount += sourceTableAmount`. Tuy nhiên, khi khách chơi xong tại bàn đích và thu ngân bấm **"Kết thúc phiên chơi / Tính tiền"** (`createFromSession`), hàm này lại tính lại tiền giờ chỉ dựa trên `targetSession` (từ `startTime` đến `endTime` của bàn đích = `totalTableAmount`, vd 100.000đ) và **GHI ĐÈ HOÀN TOÀN** vào `targetInvoice`:
       ```typescript
       targetInvoice = await tx.invoice.update({
         where: { id: targetInvoice.id },
         data: {
           tableAmount: totalTableAmount, // GHI ĐÈ, LÀM MẤT SẠCH TIỀN GIỜ BÀN NGUỒN!
           finalAmount: Math.max(0, preDiscountTotal - totalDiscount),
         }
       });
       ```
       Hậu quả: Tiền giờ của bàn nguồn hoàn toàn bị xóa khỏi `tableAmount` và `finalAmount`. Khách hàng được miễn phí toàn bộ thời gian chơi ở bàn trước khi gộp!
  2. **Lỗi logic toán tử điều kiện chuyển bàn sang bàn bảo trì (`switchTable`)**:
     - *Vị trí*: `apps/api/src/modules/tables/tables.service.ts:241`.
     - *Hiện tượng*: Dòng kiểm tra:
       ```typescript
       if (targetTable.status !== TableStatus.AVAILABLE && targetTable.playSessions.length > 0)
       ```
       Dùng toán tử `&&` thay vì `||`. Nếu bàn đích đang ở trạng thái `MAINTENANCE` (bảo trì) hoặc `RESERVED` và không có active session nào (`playSessions.length === 0`), biểu thức trả về `false` và hệ thống **CHO PHÉP CHUYỂN BÀN SANG BÀN ĐANG HỎNG/BẢO TRÌ**!
  3. **Mất ghi chú chuyển bàn khi phiên chưa có hóa đơn tạm**:
     - *Vị trí*: `tables.service.ts:281-290`.
     - *Hiện tượng*: Chỉ ghi chú chuyển bàn nếu `activeSession.invoice` tồn tại. Nếu khách vừa vào mở bàn nhanh và chưa gọi đồ ăn uống (`invoice` chưa tạo), note chuyển bàn bị bỏ qua hoàn toàn.
  4. **Nhân viên phục vụ bị mất liên kết sau khi gộp bàn**:
     - *Vị trí*: `tables.service.ts:429-452`.
     - *Hiện tượng*: `StaffAssignment` vẫn gắn với `sourceSession.id` (đã đóng `FINISHED`). Bàn đích chỉ nhận dòng phí trong hóa đơn, còn bản ghi phân công nhân viên không được cập nhật sang bàn đích.

---

### Feature 4: Tự động tính tiền giờ theo block làm tròn (5 phút, 15 phút, chính xác từng phút)
- **Tập tin liên quan**:
  - `apps/api/src/modules/invoices/invoices.service.ts:497-519, 867-874`
  - `apps/api/src/modules/tables/tables.service.ts:372-374`
- **Cơ chế tính toán**:
  - Thời lượng chơi tối thiểu: 15 phút (`diffMinutes = Math.max(15, diffMinutes)`).
  - Làm tròn theo enum `RoundingMode`:
    - `BLOCK_15`: `Math.ceil(diffMinutes / 15) * 15`
    - `BLOCK_5`: `Math.ceil(diffMinutes / 5) * 5`
    - `EXACT`: `diffMinutes`
  - Tiền giờ cơ bản: `Math.round((roundedMinutes / 60) * hourlyRate)`.
  - Phụ thu (nếu có pricing rule): `Math.round(baseTableAmount * (percent / 100)) + fixed`.
- **Các lỗi và rủi ro phát hiện**:
  1. **Bất nhất giữa hóa đơn thực tế và Live Bill QR**:
     - *Vị trí*: `invoices.service.ts:869-871` trong `getLiveBill`.
     - *Hiện tượng*:
       ```typescript
       let diff = Math.ceil((now - start) / 60000);
       if (diff < 30) diff = 30; // HARDCODE 30 PHÚT THAY VÌ 15 PHÚT!
       elapsedMinutes = Math.ceil(diff / 5) * 5; // HARDCODE BLOCK 5 PHÚT, BỎ QUA ROUNDING MODE!
       ```
       Khách quét mã QR khi chơi 10 phút thì Live Bill báo tính tiền 30 phút. Nhưng khi ra quầy thanh toán (`createFromSession`), hệ thống lại tính theo mốc 15 phút và theo `roundingMode` (vd EXACT). Số tiền trên QR và số tiền thanh toán thực tế không khớp nhau.
  2. **Hardcode Block 5 phút trong gộp bàn**:
     - *Vị trí*: `tables.service.ts:374`.
     - *Hiện tượng*: `mergeTables` luôn làm tròn theo `Math.ceil(diffMinutes / 5) * 5` mà không tham chiếu cấu hình `roundingMode` của quán.

---

### Feature 5: Áp dụng chiết khấu kép (Hạng thẻ thành viên + Voucher khuyến mãi)
- **Tập tin liên quan**:
  - `apps/api/src/modules/invoices/invoices.service.ts:553-622`
  - `apps/api/src/modules/vouchers/vouchers.service.ts:89-154`
- **Cơ chế tính toán**:
  - Chiết khấu hạng thẻ: `tierDiscount = totalTableAmount * (discountTablePercent/100) + currentServiceAmount * (discountServicePercent/100)`.
  - Chiết khấu voucher: Tính theo % hoặc tiền mặt từ voucher.
  - Tổng giảm giá: `totalDiscount = tierDiscount + voucherDiscount + manualDiscount`.
  - Tiền thanh toán cuối: `finalAmount = Math.max(0, preDiscountTotal - totalDiscount)`.
- **Các lỗi và rủi ro phát hiện**:
  1. **Tổng giảm giá (`discountAmount`) vượt quá tổng tiền đơn hàng**:
     - *Vị trí*: `invoices.service.ts:620-641`.
     - *Hiện tượng*: Dù `finalAmount` được bảo vệ bằng `Math.max(0, ...)`, nhưng trường `discountAmount` trong bảng `invoices` được lưu trực tiếp bằng `totalDiscount`. Nếu hóa đơn 100.000đ, khách có ưu đãi VIP 15.000đ + Voucher tiền mặt 100.000đ, thì `discountAmount` được lưu là `115.000đ`, trong khi `tableAmount + serviceAmount = 100.000đ`. Điều này làm sai lệch báo cáo tài chính kế toán (`gross - discount != final`). Cần giới hạn:
       `cappedDiscountAmount = Math.min(preDiscountTotal, totalDiscount)`.
  2. **Thứ tự áp dụng chiết khấu kép (% trên giá gốc hay % trên giá đã giảm hạng thẻ)**:
     - Hiện tại cả 2 chiết khấu đều tính độc lập trên giá gốc `preDiscountTotal`. Nếu quán có quy định voucher tính trên số tiền còn lại sau khi giảm hạng thẻ (hoặc ngược lại), hiện chưa có cờ phân biệt. Tuy nhiên, ít nhất cần đảm bảo tổng mức chiết khấu không vượt quá giá trị đơn hàng.

---

### Feature 6: Quản lý hồ sơ khách hàng toàn diện
- **Tập tin liên quan**:
  - `apps/api/src/modules/users/users.service.ts`
  - `apps/api/src/modules/users/users.controller.ts`
  - `apps/api/src/modules/auth/auth.service.ts:166-202`
- **Cơ chế lưu trữ**:
  - Khách hàng có đầy đủ trường: `phone`, `dateOfBirth`, `totalSpending`, `visitCount`, `points`, `membershipTier`.
  - Hỗ trợ API tra cứu nhanh theo SĐT tại quầy: `GET /users/by-phone/:phone`.
  - Khách hàng có thể tự cập nhật ngày sinh, họ tên, SĐT qua `PUT /auth/profile`.
- **Các lỗi và rủi ro phát hiện**:
  1. **Admin / Thu ngân thiếu API cập nhật hồ sơ khách hàng**:
     - *Vị trí*: `apps/api/src/modules/users/users.controller.ts`.
     - *Hiện tượng*: Trong `UsersController` chỉ có `updateStatus` (`ACTIVE, INACTIVE, BLOCKED`), không có endpoint `PUT /users/:id` để Admin/Thu ngân cập nhật ngày sinh, SĐT hay họ tên cho khách khi khách yêu cầu tại quầy.

---

### Feature 7: Thống kê cơ cấu doanh thu (RevenueStructureCard)
- **Tập tin liên quan**:
  - `apps/api/src/modules/reports/reports.service.ts:70-115, 357-360`
  - `apps/api/src/modules/dashboard/dashboard.service.ts:263-315`
  - Frontend: `apps/web/components/analytics/revenue-structure-card.tsx`
- **Cơ chế tính toán**:
  - Gom các `invoiceItems` thuộc các hóa đơn `PAID`:
    - `itemType === 'TABLE_TIME'` -> `tableRevenue` (Tiền giờ)
    - `itemType === 'SERVICE'` & (`FOOD` hoặc `DRINK`) -> `fnbRevenue` (Ẩm thực)
    - `itemType === 'SERVICE'` & `ACCESSORY` -> `accessoryRevenue` (Bán phụ kiện)
    - Còn lại (`STAFF_SERVICE`, `SURCHARGE`, `OTHER`) -> `otherRevenue` (Dịch vụ khác)
  - Tính tỷ lệ %: `tablePercent`, `fnbPercent`, `accessoryPercent`, `otherPercent` so với tổng doanh thu gộp.
- **Các lỗi và rủi ro phát hiện**:
  1. **Lỗi Fallback khi một số hóa đơn không có invoiceItems**:
     - *Vị trí*: `reports.service.ts:97-102` và `dashboard.service.ts:299-303`.
     - *Hiện tượng*: Điều kiện fallback:
       ```typescript
       if (totalTableRevenue === 0 && totalFnbRevenue === 0 && totalAccessoryRevenue === 0)
       ```
       Chỉ chạy khi TOÀN BỘ 3 mục đều bằng 0. Nếu trong kỳ có 1 hóa đơn có item và 5 hóa đơn cũ không có item (chỉ có `tableAmount` và `serviceAmount`), thì 5 hóa đơn kia bị bỏ rơi không được tính vào cơ cấu doanh thu!
     - *Khắc phục*: Tính toán ở cấp độ từng hóa đơn: Nếu hóa đơn có `invoiceItems` thì lặp qua items; nếu hóa đơn không có items thì cộng `inv.tableAmount` vào `tableRevenue` và `inv.serviceAmount` vào `fnbRevenue`.

---

### Feature 8: Đo lường hiệu suất khai thác bàn (TableUtilizationCard)
- **Tập tin liên quan**:
  - `apps/api/src/modules/reports/reports.service.ts:135-214, 362-365`
  - `apps/api/src/modules/dashboard/dashboard.service.ts:331-390`
  - Frontend: `apps/web/components/analytics/table-utilization-card.tsx`
- **Cơ chế tính toán**:
  - `hourlyOccupancy`: Tỷ lệ lấp đầy bàn theo 24 khung giờ (00:00 - 23:00).
  - `popularTableTypes`: Xếp hạng loại bàn theo số lượt chơi (`sessionCount`), tổng phút (`totalMinutes`), doanh thu (`totalRevenue`), và % độ phổ biến.
- **Các lỗi và rủi ro phát hiện**:
  1. **LỖI THUẬT TOÁN 1: Tỷ lệ lấp đầy luôn chạm 100% khi xem chu kỳ nhiều ngày**:
     - *Vị trí*: `reports.service.ts:161` và `dashboard.service.ts:347`.
     - *Hiện tượng*:
       ```typescript
       const activeInHour = sessionsInPeriod.filter(...).length;
       const rate = Math.min(100, Math.round((activeInHour / totalTablesCount) * 100));
       ```
       Nếu chu kỳ là 30 ngày (mặc định của Reports), `sessionsInPeriod` gom toàn bộ session trong 30 ngày. Lúc 20h mỗi ngày có 3 bàn chơi => trong 30 ngày có 90 lượt chơi lúc 20h. `activeInHour = 90`. Quán có 10 bàn (`totalTablesCount = 10`). Hệ thống tính `(90 / 10) * 100 = 900%` => kẹp về `100%`! Tất cả các giờ đều hiển thị 100% công suất khai thác dù quán rất vắng!
     - *Khắc phục*: Mẫu số phải nhân với số ngày trong chu kỳ: `daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000))`. `rate = Math.min(100, Math.round((activeInHour / (totalTablesCount * daysCount)) * 100))`.
  2. **LỖI THUẬT TOÁN 2: Session chơi qua đêm (vượt qua 0h) bị tính cho toàn bộ 24 giờ**:
     - *Vị trí*: `reports.service.ts:155-159` và `dashboard.service.ts:344-345`.
     - *Hiện tượng*:
       ```typescript
       if (sStart.toDateString() === sEnd.toDateString()) {
         return h >= startH && h <= endH;
       }
       return true; // LỖI: Trả về true cho TẤT CẢ các giờ h từ 0 đến 23!
       ```
       Nếu khách chơi từ 23:30 hôm trước đến 01:30 sáng hôm sau (2 tiếng), session này lại được tính là đang chơi vào lúc 8h sáng, 12h trưa, 15h chiều!
     - *Khắc phục*: Với session qua nửa đêm, trong ngày bắt đầu thì `h >= startH`, trong ngày kết thúc thì `h <= endH`, hoặc kiểm tra chính xác `h >= startH || h <= endH`.

---

### Feature 9: Đóng gói deploy Wispbyte (backend-wispbyte.zip) & Hosting
- **Tập tin liên quan**:
  - `deploy-wispbyte/`
  - `backend-wispbyte.zip`
  - `scripts/create-zips.py`
  - `apps/api/package.json`
- **Khảo sát hiện trạng**:
  - `deploy-wispbyte/` chứa: `.env`, `dist/`, `prisma/` (`schema.prisma`, `seed.ts`, migrations), `package.json`, `package-lock.json`, `index.js`, `main.js`.
  - `main.js` gọi `require('./dist/main.js')`.
  - `scripts/create-zips.py` dùng `zipfile.ZipFile` nén toàn bộ thư mục `deploy-wispbyte` thành `backend-wispbyte.zip` và `apps/web/out` thành `frontend-hosting.zip`.
  - Khi có chỉnh sửa code backend:
    1. Biên dịch backend: `npm run build:api` (tạo `apps/api/dist`).
    2. Đồng bộ `apps/api/dist` vào `deploy-wispbyte/dist`.
    3. Đồng bộ file `prisma/schema.prisma` và `prisma/seed.ts` nếu có cập nhật.
    4. Chạy `python scripts/create-zips.py` để đóng gói lại `backend-wispbyte.zip`.

---

## 3. Khảo Sát Hiện Trạng Kiểm Thử (Unit / E2E Tests)

### 3.1 Các file test hiện có
1. `apps/api/src/modules/auth/auth.service.spec.ts` (3 tests: register, login, changePassword).
2. `apps/api/src/modules/bookings/bookings.service.spec.ts` (4 tests: anti-overlap check, cancellation policy).
3. `apps/api/src/modules/invoices/invoices.service.spec.ts` (2 tests: anti double-payment, confirm payment).
- **Kết quả chạy thử nghiệm**: 3 test suites, 11 tests ĐÃ VƯỢT QUA 100% trong 25.7s.
- **Lỗ hổng cấu hình script**: Trong `apps/api/package.json`, script `"test:e2e": "jest --config ./test/jest-e2e.json"` chỉ đến thư mục `./test/` không hề tồn tại.

### 3.2 Các vùng nghiệp vụ thiếu test cần bổ sung
Để thỏa mãn tiêu chí Acceptance Criteria R3 (xác minh độc lập bằng kiểm thử an toàn trên mock data), cần bổ sung các test suite cho:
1. **Block Rounding**: Test làm tròn 5 phút (`BLOCK_5`), 15 phút (`BLOCK_15`), và phút thực tế (`EXACT`). Test mốc thời gian tối thiểu 15 phút.
2. **Chiết khấu kép (Dual Discount)**: Test áp dụng đồng thời chiết khấu hạng thành viên và voucher, kiểm tra giới hạn không bị âm tiền và không bị vượt quá tổng giá trị đơn hàng.
3. **Chuyển bàn & Gộp bàn**:
   - Test từ chối chuyển bàn sang bàn đang bảo trì/có khách.
   - Test chuyển bàn thành công sang bàn trống.
   - Test gộp bàn: cộng dồn thời gian chơi, chuyển món F&B, kiểm tra không bị ghi đè mất tiền khi chốt hóa đơn.
4. **Tích điểm & Nâng hạng**:
   - Test tích điểm theo hệ số nhân hạng thẻ.
   - Test tự động nâng hạng thẻ khi `totalSpending` vượt mốc.
   - Test đổi quà điểm thưởng và phòng chống race condition (không cho điểm âm).
5. **Kiểm tra Voucher**: Test tính tiền giảm giá theo %, tiền cố định, kiểm tra `minOrderValue`, giới hạn lượt dùng, và voucher hết hạn.
6. **Thống kê cơ cấu doanh thu & Hiệu suất bàn**: Test gom nhóm doanh thu theo danh mục và thuật toán tính occupancy theo khung giờ không bị vọt lên 100%.

---

## 4. Bảng Tổng Hợp Lỗi Phát Hiện & Kế Hoạch Khắc Phục Khuyến Nghị

| ID Lỗi | Module / Vị trí | Mức độ | Mô tả lỗi | Phương án sửa chữa khuyến nghị |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-BE-01** | `invoices.service.ts:555, 657` | **CRITICAL** | Ghi đè `tableAmount` khi chốt hóa đơn bàn đã gộp, làm mất sạch tiền giờ của bàn nguồn | Kiểm tra các `invoiceItems` loại `TABLE_TIME` đã có từ trước (do gộp bàn) để cộng dồn vào `tableAmount` và `preDiscountTotal`, không ghi đè mất tiền bàn nguồn |
| **BUG-BE-02** | `tables.service.ts:241` | **HIGH** | Dùng toán tử `&&` thay vì `||` khiến hệ thống cho phép chuyển bàn vào bàn đang bảo trì/hỏng | Đổi thành: `if (targetTable.status !== TableStatus.AVAILABLE || targetTable.playSessions.length > 0)` |
| **BUG-BE-03** | `reports.service.ts:161` & `dashboard.service.ts:347` | **HIGH** | Tỷ lệ lấp đầy bàn theo giờ bị nhân dồn qua nhiều ngày, luôn chạm ngưỡng 100% | Chia số lượt chơi theo giờ cho `(totalTablesCount * numberOfDays)` để phản ánh đúng công suất trung bình |
| **BUG-BE-04** | `reports.service.ts:158` & `dashboard.service.ts:345` | **MEDIUM** | Session chơi qua nửa đêm trả về `true` cho tất cả 24 khung giờ trong ngày | Bổ sung logic kiểm tra khung giờ chính xác cho phiên chơi qua đêm: `h >= startH || h <= endH` |
| **BUG-BE-05** | `invoices.service.ts:869-871` | **MEDIUM** | `getLiveBill` hardcode tối thiểu 30 phút và block 5 phút, không khớp với 15 phút và roundingMode lúc thanh toán | Đồng bộ logic tính phút trong `getLiveBill` với `createFromSession` (tối thiểu 15 phút, tôn trọng roundingMode) |
| **BUG-BE-06** | `invoices.service.ts:620` | **MEDIUM** | `discountAmount` được lưu vượt quá tổng tiền đơn hàng khi kết hợp ưu đãi hạng và voucher | Capped `discountAmount = Math.min(preDiscountTotal, totalDiscount)` để bảo đảm tính toàn vẹn kế toán |
| **BUG-BE-07** | `invoices.service.ts:587-617` & `vouchers.service.ts:91` | **MEDIUM** | Voucher bỏ qua trường `applicableTo` (`TABLE_ONLY`, `SERVICE_ONLY`) | Kiểm tra `applicableTo`: Nếu `TABLE_ONLY` chỉ giảm trên tiền bàn, nếu `SERVICE_ONLY` chỉ giảm trên tiền dịch vụ |
| **BUG-BE-08** | `membership.service.ts:106-156` | **MEDIUM** | Đổi quà (`redeemGift`) có thể bị race condition dẫn đến điểm âm hoặc tồn kho âm | Đưa kiểm tra số dư điểm và tồn kho vào điều kiện update nguyên tử trong transaction |
| **BUG-BE-09** | `users.controller.ts` | **LOW** | Thiếu API cho Admin/Staff cập nhật thông tin hồ sơ khách hàng (SĐT, ngày sinh, họ tên) | Thêm endpoint `PUT /users/:id` với DTO tương ứng |
| **BUG-BE-10** | `apps/api/package.json` | **LOW** | Script `test:e2e` trỏ vào `./test/jest-e2e.json` không tồn tại | Cấu hình file `jest-e2e.json` hoặc điều chỉnh script test |

---

## 5. Kết Luận Khảo Sát

Backend NestJS API sở hữu nền tảng kiến trúc vững chắc, phân tách module rõ ràng, và đã tích hợp các cơ chế bảo vệ nâng cao (khóa bi quan `$queryRaw ... FOR UPDATE` chống trùng lịch đặt bàn, Exclusion Constraint PostgreSQL trên Neon).

Tuy nhiên, trong quá trình phát triển các tính năng nghiệp vụ nâng cao (chuyển/gộp bàn, chiết khấu kép, tính tiền giờ theo block, thống kê cơ cấu doanh thu & lấp đầy bàn), đã phát sinh một số lỗi logic và tính toán quan trọng (đặc biệt là lỗi ghi đè làm mất tiền bàn gộp khi chốt hóa đơn, lỗi toán tử điều kiện chuyển bàn, và lỗi tính tỷ lệ lấp đầy 24h). 

Bản khảo sát này cung cấp đầy đủ tọa độ, nguyên nhân gốc rễ và giải pháp cụ thể để các đặc nhiệm trong giai đoạn tiếp theo (Planning & Fixing) triển khai sửa lỗi triệt để, viết bộ unit test toàn diện và đóng gói lại các file triển khai Wispbyte.
