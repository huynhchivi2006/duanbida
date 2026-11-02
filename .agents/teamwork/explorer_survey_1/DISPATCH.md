# Dispatch Log

## 2026-11-01T11:02:36Z
You are Explorer 1 (teamwork_explorer) in the survey phase of a full-codebase review and bug-fixing effort for Billiards Club Management.
Your identity: explorer_survey_1
Your working directory: d:\Lập trình mã nguồn mở 2\duancuoiky\.agents\teamwork\explorer_survey_1
Original Request path: d:\Lập trình mã nguồn mở 2\duancuoiky\.agents\teamwork\ORIGINAL_REQUEST.md

READ ORIGINAL_REQUEST.md first before doing any work!

Scope & Mission:
Perform an in-depth survey of the Backend NestJS API (apps/api), Prisma schema & models, and backend business logic for all 9 target features:
1. Tích điểm đổi quà & Hạng thành viên (Standard, Silver, Gold, VIP), cấu hình ưu đãi, thẻ hội viên điện tử.
2. Quản lý và áp dụng Voucher / Mã giảm giá (% hoặc tiền cố định, giới hạn lượt dùng, áp dụng tại POS).
3. Chuyển bàn (chuyển ca chơi sang bàn trống) và gộp bàn (gộp thời lượng chơi, đồ uống, nhân viên sang bàn khác).
4. Tự động tính tiền giờ theo block làm tròn (5 phút, 15 phút, hoặc chính xác từng phút thực tế).
5. Áp dụng chiết khấu kép (hạng thẻ thành viên + voucher khuyến mãi).
6. Quản lý hồ sơ khách hàng toàn diện (SĐT, ngày sinh, tổng chi tiêu, tần suất chơi, điểm tích lũy, phân hạng).
7. Thống kê cơ cấu doanh thu: Tiền giờ vs Tiền F&B vs Bán phụ kiện vs Khác (RevenueStructureCard).
8. Đo lường hiệu suất khai thác bàn: Tỷ lệ lấp đầy bàn theo 24 khung giờ trong ngày và Xếp hạng loại bàn được ưa chuộng nhất (TableUtilizationCard).
9. Đóng gói deploy Wispbyte (backend-wispbyte.zip) & Hosting (frontend-hosting.zip) - backend perspective.

Specific tasks:
1. Map exact backend files (controllers, services, repositories, DTOs, entities, Prisma schema, migration files).
2. Deeply inspect the calculation logic, edge cases, data flows, potential concurrency issues, and bugs in:
   - Time billing & block rounding (5m, 15m, exact minutes).
   - Dual discount calculation order and logic (membership discount + voucher discount), ensuring no negative totals or double deductions.
   - Table transfer to empty table & table merge logic: how session duration, orders, staff, bill items are merged, potential data loss or duplicate charges.
   - Customer loyalty points, auto tier upgrade thresholds, tier discount lookup, spending history.
   - Voucher validation (expiry, usage limits, min order value, discount type % vs fixed amount).
   - Revenue structure and table utilization statistics calculation and SQL/Prisma queries.
3. Review existing backend tests in apps/api (unit, e2e), mock setups, and test runner scripts in package.json.
4. Document all findings, inventory of backend components, identified bugs / code smells, and recommended fixes.
5. Write your comprehensive report to d:\Lập trình mã nguồn mở 2\duancuoiky\.agents\teamwork\explorer_survey_1\survey_backend.md and write d:\Lập trình mã nguồn mở 2\duancuoiky\.agents\teamwork\explorer_survey_1\handoff.md.
6. When complete, use send_message to report your completion and summary to the orchestrator.
