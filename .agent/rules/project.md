Project: Real-Time Multi-Cloud Carbon Footprint & Cost Optimizer (V1, no ML).
Source of truth: docs/PRD.md (v1.1). Frontend is already built; keep its design and features.
- Work phase by phase (PRD section 14). Update docs/PROGRESS.md after each phase.
- Do not stop to ask unless the PRD Ask-First list applies. Missing credentials: write docs/BLOCKERS.md, stub, continue.
- Never fabricate prices, carbon values, benchmarks or APIs. Every data value carries source, retrievedAt, dataType (official|estimated|benchmark|mock).
- Mock data only in frontend mock mode and tests; UI shows a "Demo data" banner when dataMode is 'mock'.
- No hard-coded winning provider. Recommendations come only from shared/src/scoring.ts.
- Stack: React+Vite+TS+Tailwind+Recharts; Node 20 Lambda (TS); API Gateway HTTP API; DynamoDB; AWS SAM. No EC2, FastAPI, SQLite, Firebase, Supabase, MongoDB, auth, or ML. Remove any Lovable/Supabase leftovers.
- AWS hosts the backend; AWS/GCP/Azure are evaluated providers. Keep the engine provider-agnostic via CloudProvider.
- Run typecheck, lint, tests before every commit. Small commits, conventional messages.
- Record non-trivial decisions in docs/DECISIONS.md.
