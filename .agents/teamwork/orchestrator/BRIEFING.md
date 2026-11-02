# BRIEFING — 2026-11-01T11:12:30Z

## Mission
Comprehensive codebase review, bug fixing, test verification, and deployment artifact update for Billiards Club Management (NestJS + Next.js 14) focusing on 9 new features.

## 🔒 My Identity
- Archetype: orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: d:\Lập trình mã nguồn mở 2\duancuoiky\.agents\teamwork\orchestrator
- Original parent: parent
- Original parent conversation ID: 1ae03622-f35a-458e-85f0-9e70bc5339dc

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: d:\Lập trình mã nguồn mở 2\duancuoiky\PROJECT.md
1. **Decompose**: Survey (3 Explorers in parallel) -> Create PROJECT.md (Architecture, Feature Inventory, Milestones, Code Layout, Interfaces) -> Decompose into implementation milestones + parallel E2E testing track.
2. **Dispatch & Execute**:
   - **Delegate (sub-orchestrator)**: Spawn sub-orchestrators for milestones and E2E testing track.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (last resort)
4. **Succession**: at 16 spawns, write handoff.md, cancel timers, spawn successor
- **Work items**:
  1. Survey Phase (3 Explorers) [in-progress: 1 completed, 2 in-progress]
  2. PROJECT.md & Milestone Architecture [pending]
  3. Milestone Implementation & E2E Testing Tracks [pending]
  4. Final Milestone (E2E Test Suite & Hardening) [pending]
  5. Deployment Packaging & Verification [pending]
- **Current phase**: 0 (Survey)
- **Current focus**: Awaiting Explorer 2 (Frontend) and Explorer 3 (Infra/Packaging) completions.

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- NEVER investigate or explore the problem at the code level — dispatch Explorers for technical investigation.
- You MAY use file-editing tools ONLY for metadata/state files (.md) in your .agents/teamwork/ folder.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.
- Zero tolerance for integrity violations. Binary veto from auditor.
- All testing must use mock data or local test database; strictly no destructive operations on production DB.

## Current Parent
- Conversation ID: 1ae03622-f35a-458e-85f0-9e70bc5339dc
- Updated: 2026-11-01T11:05:00Z

## Key Decisions Made
- Selected Project Pattern.
- Explorer 1 (Backend) completed: 10 backend bugs identified (including critical table merge invoice overwrite BUG-BE-01 and table status check BUG-BE-02).
- Waiting for Explorer 2 and Explorer 3 to synthesize comprehensive PROJECT.md.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_survey_1 | teamwork_explorer | Backend Survey (apps/api, Prisma, 9 features) | completed | ac534e3b-34e0-4762-a5ce-f613cf16bf49 |
| explorer_survey_2 | teamwork_explorer | Frontend Survey (apps/web, Next.js 14, 9 features) | in-progress | 8fe7bb9e-86bb-458f-b4d9-3ed078b22ea1 |
| explorer_survey_3 | teamwork_explorer | Infra, Build, Test & Packaging Survey | in-progress | 760100d2-49fe-4a84-b947-8d7d5be2f03b |

## Succession Status
- Succession required: no
- Spawn count: 3 / 16
- Pending subagents: 8fe7bb9e-86bb-458f-b4d9-3ed078b22ea1, 760100d2-49fe-4a84-b947-8d7d5be2f03b
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 01e97e8c-c3fe-4e06-8513-d97b258f5e5e/task-24
- Safety timer: 01e97e8c-c3fe-4e06-8513-d97b258f5e5e/task-32
- On succession: kill all timers before spawning successor
- On context truncation: handle timers as step 4 of the State Recovery section of your prompt says

## Artifact Index
- d:\Lập trình mã nguồn mở 2\duancuoiky\.agents\teamwork\ORIGINAL_REQUEST.md — Authoritative User Request
- d:\Lập trình mã nguồn mở 2\duancuoiky\.agents\teamwork\orchestrator\DISPATCH.md — Initial dispatch message
- d:\Lập trình mã nguồn mở 2\duancuoiky\.agents\teamwork\orchestrator\progress.md — Execution heartbeat and progress tracking
- d:\Lập trình mã nguồn mở 2\duancuoiky\.agents\teamwork\explorer_survey_1\survey_backend.md — Explorer 1 Backend Survey Report
- d:\Lập trình mã nguồn mở 2\duancuoiky\.agents\teamwork\explorer_survey_1\handoff.md — Explorer 1 Handoff
