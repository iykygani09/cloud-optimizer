# Phase Execution Checklist (`docs/PLAN.md`)

Source: PRD v1.1 Section 14

## Phase 0 — Bootstrap Monorepo & Docs
- [ ] Monorepo (npm workspaces), Git, `.gitignore`, ESLint/Prettier setup
- [ ] Create `docs/PRD.md`, `docs/PLAN.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/BLOCKERS.md`
- [ ] Create `AGENTS.md` and `.agent/rules/project.md`
- [ ] Verify `npm install` and `npm run lint`

## Phase 1 — Frontend (External Build)
- [x] Built with Lovable and enhanced UI/UX pass

## Phase 2 — Audit and Reconcile Frontend
- [ ] Move frontend code to `frontend/` directory
- [ ] Execute Section 12.3 reconciliation checklist (R1–R14)
- [ ] Save audit report to `docs/FRONTEND_AUDIT.md`
- [ ] Align types with Section 10.1 canonical types
- [ ] Verify `shared/src/scoring.ts` matching Section 9 pure function
- [ ] Verify cosmetic progress stepper, optimistic undo-delete, accessibility
- [ ] Remove generator leftovers (`lovable-tagger`, any Supabase code)
- [ ] Verify `npm run typecheck`, `lint`, `test`, `build` pass in `frontend/`

## Phase 3 — Backend Skeleton (AWS SAM)
- [ ] Create `backend/template.yaml` (HTTP API, Lambdas, DynamoDB single-table with TTL, log retention, throttling)
- [ ] Create backend structure, zod validation, error handler, CORS headers
- [ ] Implement `HistoryRepository` (in-memory + DynamoDB)
- [ ] Implement handlers (`GET /meta`, `POST /analyses`, `GET /analyses`, `GET /analyses/{id}`, `DELETE /analyses/{id}`)
- [ ] Verify backend tests pass (`npm run test -w backend`, SAM validate)

## Phase 4 — Data Layer & Pipeline
- [ ] Create catalog (AWS, GCP, Azure 8-12 instances with provenance)
- [ ] Create carbon coefficients, grid intensity, benchmark matrix, and assumptions
- [ ] Implement fetchers/normalizers and validator (`npm run data:validate`)
- [ ] Build offline snapshot generator (`npm run data:build` -> `data/snapshot/dataset.json`)
- [ ] Verify validator passes with 100% provenance and no mock data

## Phase 5 — Recommendation Engine
- [ ] Implement candidate generator with workload profile filtering
- [ ] Implement estimators (cost, carbon, performance)
- [ ] Implement `CloudProvider` classes (`AWSProvider`, `GCPProvider`, `AzureProvider`)
- [ ] Wire `POST /analyses` handler to engine and snapshot dataset
- [ ] Verify engine property and unit tests pass

## Phase 6 — Connect Frontend
- [ ] Implement real `httpClient` in frontend (`fetch`, `X-Client-Id`, typed `ApiError`)
- [ ] Populate options and methodology from `GET /meta`
- [ ] Hide demo banner in live mode; preserve mock mode
- [ ] Dedupe shared code
- [ ] Verify full end-to-end user flow locally

## Phase 7 — Testing and Validation
- [ ] Build `scripts/run-scenarios.ts` executing the 9 PRD scenarios
- [ ] Produce `docs/VALIDATION.md`
- [ ] Perform pricing spot checks against official provider pricing pages
- [ ] Verify all tests pass

## Phase 8 — Deploy, Documentation & Guardrails
- [ ] Deployed SAM template (`sam deploy`) and static frontend setup
- [ ] Create `docs/ARCHITECTURE.md` (Mermaid diagrams)
- [ ] Create `docs/METHODOLOGY.md`
- [ ] Finalize `README.md` (setup, run, deploy, SAM teardown)
