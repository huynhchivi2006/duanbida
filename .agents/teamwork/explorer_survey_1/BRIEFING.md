# BRIEFING — 2026-11-01T11:15:00Z

## Mission
Comprehensive survey of Backend NestJS API (apps/api), Prisma schema & models, and backend business logic for all 9 target features and test setups.

## 🔒 My Identity
- Archetype: teamwork_explorer
- Roles: explorer, analyst, synthesizer
- Working directory: d:\Lập trình mã nguồn mở 2\duancuoiky\.agents\teamwork\explorer_survey_1
- Original parent: 01e97e8c-c3fe-4e06-8513-d97b258f5e5e
- Milestone: survey_phase_backend

## 🔒 Key Constraints
- Read-only investigation — do NOT implement fixes directly
- Investigate apps/api, Prisma schema, migrations, business logic, calculation logic, edge cases
- Safe testing / no modifications to real production data
- Adhere strictly to Teamwork Handoff protocol and output requirements

## Current Parent
- Conversation ID: 01e97e8c-c3fe-4e06-8513-d97b258f5e5e
- Updated: 2026-11-01T11:15:00Z

## Investigation State
- **Explored paths**:
  - `apps/api/src/modules/*` (auth, bookings, dashboard, health, invoices, membership, pricing-rules, reports, services, table-types, tables, users, vouchers)
  - `apps/api/prisma/*` (schema.prisma, migrations, custom_constraints.sql, seed.ts)
  - `deploy-wispbyte/*` and `scripts/create-zips.py`
  - Existing backend unit tests (`src/modules/**/*.spec.ts`)
  - Integration with frontend cards (`RevenueStructureCard`, `TableUtilizationCard`)
- **Key findings**:
  - Identified 10 concrete backend bugs & logic discrepancies across all 9 features (BUG-BE-01 to BUG-BE-10).
  - Critical: Table merge data loss on checkout (`createFromSession` overwriting merged `tableAmount`).
  - Critical: Table switch condition using `&&` allowing switch into maintenance tables.
  - Critical: Multi-day occupancy distortion always hitting 100% and overnight session spanning bug.
  - Identified concurrency race conditions in gift redemption and voucher usage limit.
  - Test suite has only 11 tests across 3 files; comprehensive tests needed for all 9 target features.
- **Unexplored areas**: None for backend scope.

## Key Decisions Made
- Cataloged all backend findings into `survey_backend.md`.
- Produced 5-component hard handoff in `handoff.md`.

## Artifact Index
- DISPATCH.md — Dispatch log from parent orchestrator
- progress.md — Heartbeat and status log
- survey_backend.md — Comprehensive backend survey report for 9 features
- handoff.md — 5-component hard handoff report
