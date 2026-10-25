# Architectural & Technical Decisions Log (`docs/DECISIONS.md`)

Format per rule 0.1: `[YYYY-MM-DD] Decision: <decision> | Reason: <reason>`

- [2026-09-23] Decision: Use npm workspaces with `frontend`, `backend`, `shared`, `data-pipeline` | Reason: PRD Section 5 & 6 requirement for monorepo structure.
- [2026-09-23] Decision: Move existing Lovable root code into `frontend/` workspace package | Reason: PRD Section 12.3 R1 requires frontend code to live in `frontend/`.
- [2026-10-01] Decision: Deploy backend infrastructure using AWS SAM (Serverless Application Model) | Reason: PRD Section 11 requirement for Serverless HTTP API Gateway, Lambda, and DynamoDB.
- [2026-10-01] Decision: Bundle backend TypeScript using `esbuild` into a single self-contained ESM file (`dist/index.js`) | Reason: Eliminates node_modules workspace symlink resolution failures and CJS/ESM module mismatch in AWS Lambda Node 20 runtime.
- [2026-10-25] Decision: Deduplicate recommendation cards into Overall Champion + Best Multi-Cloud Provider Alternatives (AWS & Azure), and synchronize exact user-selected timeframe (hours/days/weeks) with pro-rated period costs | Reason: Project guide feedback to eliminate identical duplicated cards when one instance sweeps multiple categories, and ensure exact selected duration is displayed without defaulting.
- [2026-10-25] Decision: Implement Enterprise Sustainability Suite (EPA Green Impact Translator, Spatial Carbon Geo-Shift Simulator, GHG Protocol Scope 2/3 Breakdown, Hyperscale SLA badges, and Executive Audit PDF Report) | Reason: Elevate project credibility and academic distinction for project guide review while maintaining $0 AWS free-tier cost.
