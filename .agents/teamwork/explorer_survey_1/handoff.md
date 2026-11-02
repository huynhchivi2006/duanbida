# Handoff Report — Explorer 1 (Backend NestJS API & Prisma Survey)

**Agent ID**: `explorer_survey_1`  
**Working Directory**: `d:\Lập trình mã nguồn mở 2\duancuoiky\.agents\teamwork\explorer_survey_1`  
**Handoff Type**: Hard (Investigation task complete)  
**Parent Agent**: `01e97e8c-c3fe-4e06-8513-d97b258f5e5e`  
**Timestamp**: 2026-11-01T11:15:00Z  

---

## 1. Observation

Direct observations from source inspection, tool runs, and codebase structure:

1. **Build & Existing Unit Tests**:
   - Command: `npm run test:api`
   - Result:
     ```
     PASS src/modules/bookings/bookings.service.spec.ts (18.835 s)
     PASS src/modules/auth/auth.service.spec.ts (21.983 s)
     PASS src/modules/invoices/invoices.service.spec.ts (23.598 s)
     Test Suites: 3 passed, 3 total
     Tests:       11 passed, 11 total
     ```
   - Command: `npm run build:api`
   - Result: Exited with code 0 (`nest build` succeeded without compile errors).
   - Package.json inconsistency: `apps/api/package.json` line 18 contains `"test:e2e": "jest --config ./test/jest-e2e.json"`, but directory `apps/api/test` does not exist.

2. **Table Merge Data Loss on Checkout**:
   - Location: `apps/api/src/modules/tables/tables.service.ts` (lines 418-427, 455-467) and `apps/api/src/modules/invoices/invoices.service.ts` (lines 518-530, 554-555, 654-670).
   - Verbatim code in `tables.service.ts:455`:
     ```typescript
     const newTableAmount = Number(targetInvoice.tableAmount) + sourceTableAmount;
     ...
     const updatedTargetInvoice = await tx.invoice.update({
       where: { id: targetInvoice.id },
       data: {
         tableAmount: newTableAmount,
         serviceAmount: newServiceAmount,
         finalAmount: newFinalAmount,
     ```
   - Verbatim code in `invoices.service.ts:555, 657`:
     ```typescript
     const currentServiceAmount = targetInvoice ? Number(targetInvoice.serviceAmount) : 0;
     const preDiscountTotal = totalTableAmount + currentServiceAmount;
     ...
     targetInvoice = await tx.invoice.update({
       where: { id: targetInvoice.id },
       data: {
         tableAmount: totalTableAmount,
         discountAmount: totalDiscount,
         finalAmount,
     ```
   - Direct observation: `totalTableAmount` is computed solely from `targetSession` (`session.startTime` to `endTime`). Preexisting `tableAmount` from the merged session is overwritten and omitted from `preDiscountTotal` and `finalAmount`.

3. **Table Switch Guard Condition Bug**:
   - Location: `apps/api/src/modules/tables/tables.service.ts` line 241:
     ```typescript
     if (targetTable.status !== TableStatus.AVAILABLE && targetTable.playSessions.length > 0) {
       throw new ConflictException(`Bàn đích ${targetTable.tableNumber} hiện đang có khách chơi hoặc đang bảo trì`);
     }
     ```
   - Direct observation: Uses `&&` instead of `||`. If `targetTable.status === TableStatus.MAINTENANCE` and `targetTable.playSessions.length === 0`, condition evaluates to `false` and permits switching to a maintenance table.

4. **Multi-Day Table Occupancy Distortion**:
   - Location: `apps/api/src/modules/reports/reports.service.ts` lines 150-161 and `apps/api/src/modules/dashboard/dashboard.service.ts` lines 339-348:
     ```typescript
     const activeInHour = sessionsInPeriod.filter(...).length;
     const rate = Math.min(100, Math.round((activeInHour / totalTablesCount) * 100));
     ```
   - Direct observation: In a 30-day period, `activeInHour` sums sessions over 30 days. Dividing by `totalTablesCount` (single-day table count) inflates occupancy rates to 100% across all hours.
   - Overnight session condition in `reports.service.ts:155-159`:
     ```typescript
     if (sStart.toDateString() === sEnd.toDateString()) {
       return h >= startH && h <= endH;
     }
     return true;
     ```
     Returns `true` for all 24 hours of the day when a session spans past midnight.

5. **Inconsistent Block Calculation in Live Bill**:
   - Location: `apps/api/src/modules/invoices/invoices.service.ts` lines 869-872:
     ```typescript
     let diff = Math.ceil((now - start) / 60000);
     if (diff < 30) diff = 30;
     elapsedMinutes = Math.ceil(diff / 5) * 5;
     ```
   - Location: `invoices.service.ts` lines 502-515:
     ```typescript
     if (diffMinutes < 15) {
       diffMinutes = 15; // Tối thiểu 15 phút
     }
     const roundingMode: RoundingMode = dto.roundingMode || RoundingMode.BLOCK_5;
     ```
   - Direct observation: `getLiveBill` enforces a 30-minute minimum and hardcoded 5-minute block, whereas `createFromSession` enforces a 15-minute minimum and supports `BLOCK_15` and `EXACT`.

6. **Discount Amount Capping & Applicability Scope**:
   - Location: `apps/api/src/modules/invoices/invoices.service.ts` lines 601-621:
     ```typescript
     const calc = Math.round((preDiscountTotal * Number(voucher.discountValue)) / 100);
     ...
     const totalDiscount = tierDiscount + voucherDiscount + manualDiscount;
     const finalAmount = Math.max(0, preDiscountTotal - totalDiscount);
     ```
   - Direct observation: `voucher.applicableTo` (`TABLE_ONLY`, `SERVICE_ONLY`) is not checked. `discountAmount` stored in database is `totalDiscount`, which can exceed `preDiscountTotal` if large fixed discounts or dual discounts apply.

---

## 2. Logic Chain

1. **Table Merge Data Loss**:
   - Observation 2 shows that `mergeTables` attaches a `TABLE_TIME` item for `sourceTableAmount` and updates `targetInvoice.tableAmount += sourceTableAmount`.
   - When the target table later finishes, `createFromSession` re-evaluates `baseTableAmount` from only the target table's start/end time and assigns `tableAmount: totalTableAmount`.
   - Inference: This assignment wipes out `sourceTableAmount` from both `tableAmount` and `finalAmount`. The club loses the revenue of the merged session.
   - Solution: In `createFromSession`, sum any existing `InvoiceItem` of type `TABLE_TIME` (from merged sessions) into the final table amount calculation.

2. **Table Switch Guard**:
   - Observation 3 shows `status !== AVAILABLE && length > 0`.
   - Truth table: When `status === MAINTENANCE` (not AVAILABLE) and `length === 0` (no playing sessions), `true && false = false`.
   - Inference: The guard does not throw, allowing table switch to maintenance or reserved tables.
   - Solution: Change `&&` to `||`.

3. **Occupancy Rate Calculation**:
   - Observation 4 shows `activeInHour / totalTablesCount`.
   - When period spans $D$ days, total potential table-hours for hour $h$ is $totalTablesCount \times D$.
   - Inference: Calculating `(activeInHour / totalTablesCount) * 100` computes occupancy against 1 day instead of $D$ days, causing rates to falsely max out at 100%.
   - Solution: Normalize by number of days in the period: `Math.round((activeInHour / (totalTablesCount * daysCount)) * 100)`.

4. **Live Bill Inconsistency**:
   - Observation 5 shows minimum 30 minutes in `getLiveBill` vs 15 minutes in `createFromSession`.
   - Inference: A customer scanning the QR code at 10 minutes sees a bill for 30 minutes, but upon payment at the counter, the bill calculates 15 minutes.
   - Solution: Synchronize `getLiveBill` with 15-minute minimum and respect `roundingMode`.

5. **Discount Capping & Scope**:
   - Observation 6 shows `voucher.applicableTo` is ignored and `totalDiscount` is stored uncapped.
   - Inference: Storing `discountAmount > preDiscountTotal` corrupts financial records (`gross - discount != final`). Applying `TABLE_ONLY` voucher to F&B violates business rules.
   - Solution: Cap `discountAmount = Math.min(preDiscountTotal, totalDiscount)` and filter discount base by `applicableTo`.

---

## 3. Caveats

- **No live DB modifications**: Investigation was strictly read-only; no database records or production data were altered.
- **Frontend integration**: Detailed frontend investigation is conducted concurrently by Explorer 2 (`explorer_survey_2`). The survey here examined frontend components (`RevenueStructureCard`, `TableUtilizationCard`) solely to verify API payload contracts and data format compatibility.
- **Wispbyte runtime environment**: Local packaging verification confirmed `deploy-wispbyte` structure and `scripts/create-zips.py`. Actual deployment execution on Wispbyte server node requires server credentials not tested locally.

---

## 4. Conclusion

The NestJS backend architecture is modular, type-safe, and builds cleanly (`npm run build:api` code 0). Existing unit tests (11 tests) pass.
However, **10 concrete defects** (ranging from critical data loss in table merge to flawed occupancy formulas and race conditions in gift redemption) were identified and cataloged with exact file locations and code snippets in `survey_backend.md`.
The backend requires targeted bug fixes across `invoices.service.ts`, `tables.service.ts`, `reports.service.ts`, `dashboard.service.ts`, `membership.service.ts`, and `vouchers.service.ts`, followed by comprehensive unit test coverage and deployment package re-generation.

---

## 5. Verification Method

To independently verify all findings and test fixes:

1. **Run Current Test Suite**:
   ```powershell
   npm run test:api
   ```
2. **Build Backend**:
   ```powershell
   npm run build:api
   ```
3. **Inspect Key Findings in Code**:
   - Check line 241 in `apps/api/src/modules/tables/tables.service.ts` for `&&` operator.
   - Check line 657 in `apps/api/src/modules/invoices/invoices.service.ts` for `tableAmount` overwrite.
   - Check line 161 in `apps/api/src/modules/reports/reports.service.ts` for multi-day occupancy rate formula.
   - Check line 870 in `apps/api/src/modules/invoices/invoices.service.ts` for 30m hardcoded minimum.
4. **Invalidation Condition**:
   - If `mergeTables` and subsequent `createFromSession` preserves and sums `TABLE_TIME` items from source tables in `finalAmount`, Bug 1 is refuted.
   - If `switchTable` to a table with `status = MAINTENANCE` throws 409 Conflict, Bug 2 is refuted.
