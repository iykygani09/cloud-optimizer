# PRD — Real-Time Multi-Cloud Carbon Footprint & Cost Optimizer
 
**Version:** 1.1 (V1, no machine learning)
**Audience:** Antigravity agent (primary), project owner (secondary)
**Status:** Source of truth. If any other file conflicts with this PRD, this PRD wins. Save as `docs/PRD.md` (replaces v1.0).
 
---
 
## Change log (v1.0 → v1.1)
 
| # | Change | Reason |
|---|--------|--------|
| 1 | **Phase 1 (frontend) is done externally** (Lovable build + UI/UX enhancement pass). The agent starts at Phase 2, which is now an audit-and-reconcile phase with an explicit checklist (Section 12.3). | Frontend already exists |
| 2 | `WorkloadType` changed to `web_app | api | data_processing | machine_learning | other` | Matches the built UI |
| 3 | New Section 8.6: workload type now has a defined effect (utilization assumption and allowed instance families) | v1.0 collected workload type but never used it |
| 4 | `requestsPerDay` is stored and displayed but **does not affect V1 VM estimates**; UI must say so | Honest handling of a captured-but-unused field |
| 5 | New Section 12: frontend as-built feature inventory, split into client-side derived features vs server-provided data | New UI features (compare drawer, deltas, trade-off strip, history search/sort/undo, dark mode, progress stepper) |
| 6 | Progress stepper defined as cosmetic; undo-delete semantics defined | Prevents fake backend steps and inconsistent history |
| 7 | Cleanup rule: remove any Supabase/Firebase/Lovable integration code the generator may have added | Lovable often scaffolds these |
| 8 | Frontend API contract requires `getMeta()` | Options, assumptions and methodology come from the backend in live mode |
| 9 | Agent kickoff prompts added (Appendix C) | Short prompts to save quota |
 
---
 
## 0. Instructions for the agent (read first)
 
### 0.1 Operating protocol
 
1. Read this whole PRD before writing code. Then create `docs/PLAN.md` containing the phase list from Section 14 as a checklist.
2. Work **phase by phase**, tasks in order. A phase is finished only when every verification command passes.
3. After every task: run verify commands, fix failures, then commit with a conventional commit message (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
4. After every phase, update `docs/PROGRESS.md` with: what is done, what is next, open blockers, and how to resume. This makes pausing (rate limits, quota) safe.
5. **Do not stop to ask questions** unless the decision is on the Ask-First list (0.3). For everything else, choose the simplest option that satisfies this PRD and record it in `docs/DECISIONS.md` (one line: decision, reason).
6. **Blocker protocol:** if you need something only the human can provide (AWS credentials, GCP API key, deployed URL), do NOT stop. Write the blocker to `docs/BLOCKERS.md` with exact steps for the human, implement a local stub or fallback, and continue with the next unblocked task.
7. Prefer small files, few dependencies, boring code. This is a B.Tech final-year project: clarity beats cleverness.
8. Name the file path for every file you produce. Do not rewrite working code without a reason recorded in `docs/DECISIONS.md`.
9. **Preserve existing frontend functionality and visual design.** Refactor only where this PRD requires it.
 
### 0.2 Non-negotiable rules
 
- **Never fabricate** cloud prices, carbon values, benchmark values, APIs, or AWS capabilities and present them as real.
- Every numeric data record carries: `provider`, `region`, `service/SKU`, `value`, `unit`, `source`, `retrievedAt`, `dataType` (`official` | `estimated` | `benchmark` | `mock`), and `methodology` where applicable.
- Mock data is allowed **only** in frontend mock mode and in tests, must have `dataType: "mock"`, and the UI must show a visible "Demo data" banner whenever `dataMode === 'mock'`.
- No hard-coded winner anywhere. Recommendations always come from the scoring function applied to the user's input and weights.
- No machine learning, chatbot, authentication, Firebase, Supabase, MongoDB, FastAPI, Uvicorn, SQLite, or EC2.
- AWS is the **host** of our backend. AWS, GCP and Azure are the **providers being evaluated**. Keep these separate in code and naming (`hosting` vs `providers`).
- No AWS-specific logic in the comparison/recommendation engine. It only consumes normalized data through the `CloudProvider` interface.
 
### 0.3 Ask-first list (the only reasons to stop and ask)
 
- Adding an AWS service beyond API Gateway, Lambda, DynamoDB, IAM, CloudWatch (and AWS Budgets for cost alarms).
- Adding any paid dependency or anything that could incur cost.
- Changing the scoring approach, adding ML, or changing V1 scope.
- Changing the locked tech decisions in Section 5.
 
### 0.4 Human prerequisites (do these once, before Phase 3)
 
| # | Item | Needed for | If missing |
|---|------|-----------|-----------|
| 1 | Node.js 20+ and npm, Git | Everything | Cannot start |
| 2 | AWS account with MFA enabled | Deploy backend | Backend runs locally; deploy blocked |
| 3 | AWS Budgets alert at $1–$5 | Cost safety | Do before first deploy |
| 4 | AWS CLI configured (`aws configure` or IAM Identity Center) | Deploy | Deploy blocked |
| 5 | AWS SAM CLI installed | Build/deploy | Deploy blocked |
| 6 | (Optional) Docker | Local Lambda emulation | Use unit tests and a local dev server |
| 7 | (Optional) Google Cloud project + API key for Cloud Billing Catalog API | GCP pricing ingestion | Use manual-CSV fallback (7.4) |
| 8 | Frontend code from Lovable exported to GitHub (or a zip) | Phase 2 | Agent rebuilds from Section 12 |
 
---
 
## 1. Readiness verdict
 
The architecture is sound, correctly scoped and buildable at zero or near-zero cost, once the following gaps are closed.
 
| Gap | Why it matters | Resolution |
|-----|---------------|-----------|
| Provider carbon tools (AWS Customer Carbon Footprint Tool, Google Carbon Footprint, Microsoft Emissions Impact Dashboard) report the **user's own past usage** and cannot price a hypothetical workload | No provider API answers "what would this new workload emit?" | Carbon is **estimated with an open methodology** (Cloud Carbon Footprint style: power coefficients × PUE × grid intensity), always labeled `estimated` (8.2) |
| Calling three pricing APIs on every request is slow, brittle, rate-limited | Demo would break | **Offline ingestion** produces a small normalized JSON snapshot bundled with the Lambda (7) |
| "Real-time" in the project name | Could imply live API calls | Defined as **request-time computation on a dated snapshot**; snapshot date shown in the UI (7.5) |
| No free universal performance benchmark | Score could be arbitrary | Documented **rubric**; benchmark table where a citation exists, otherwise `estimated` (8.3) |
| GPU / ML training | "ML/AI" workload type implies GPUs | V1 is **CPU-only**; UI says so |
| Workload type collected but unused (v1.0 gap) | Field would be decorative | Defined effect: utilization assumption and allowed families (8.6) |
| Requests/invocations collected but irrelevant to VM pricing | Misleading if it looks like it matters | Stored and shown, **not used in V1 VM estimates**; UI helper text says so (8.1) |
| Frontend hosting unspecified | Needed for a live demo | Free static host (Netlify, Vercel, Cloudflare Pages or GitHub Pages) or local demo |
| AWS free-tier terms differ per account | Cost surprise | Budget alert, throttling, concurrency cap, log retention, teardown (16) |
| Agent quota interruptions | "Disturbance in the middle" | Phase checkpoints, `PROGRESS.md`, blocker protocol, short kickoff prompts (Appendix C) |
 
**Verdict:** complete enough to build end to end. Expect small carbon differences between providers in the same country because grid intensity dominates; this is honest behavior and the UI explains it.
 
---
 
## 2. Product definition
 
**Purpose:** a user describes a cloud workload and priorities; the app compares equivalent configurations on AWS, GCP and Azure by cost, carbon and performance, and returns three separate recommendations with explained trade-offs.
 
**There is no universal best provider.** Results depend on the input and weights.
 
### 2.1 Goals
- G1. Compare equivalent configurations across three providers from one form.
- G2. Produce Lower Cost, Lower Carbon and Balanced recommendations from the same candidate set.
- G3. Explain trade-offs numerically.
- G4. Make every number traceable to source, date and data type.
- G5. Run entirely on free tiers.
 
### 2.2 Non-goals (V1)
ML or predictive models, GPU workloads, reserved/spot/committed-use pricing, free-tier or discount modeling, multi-user auth, live provider API calls at request time, currency conversion, chatbot.
 
### 2.3 User stories
- I enter CPU, RAM, storage, runtime, data transfer, region and priorities and get a comparison in a few seconds.
- I see which option is cheapest, greenest and best balanced, and why.
- I can inspect where each number came from and whether it is official, estimated or benchmark-based.
- I can select 2–4 configurations and compare them side by side.
- I can revisit, search, sort and delete past analyses.
 
---
 
## 3. V1 scope
 
**In:** compute (VM) + block storage + data egress comparison across three providers in four region groups; weighted scoring; history; methodology transparency.
 
**Stretch (Phase 8, only after Phase 7 passes):** serverless comparison using `requestsPerDay`; optional CodeCarbon order-of-magnitude check.
 
---
 
## 4. Architecture
 
```
React (Vite, TS, Tailwind, Recharts)
   |  HTTPS, JSON
   v
API Gateway (HTTP API)
   v
Lambda (Node.js, TypeScript)
   |-- reads bundled dataset snapshot (JSON in the deployment package)
   |-- reads/writes DynamoDB (analysis history only)
   v
Recommendation engine (pure functions in /shared)
   v
JSON response to React
```
 
Offline (developer machine, never in Lambda):
 
```
Provider pricing sources + carbon references
  -> data-pipeline scripts -> validate -> normalized JSON snapshot -> committed to /data
```
 
The Lambda code contains three provider modules (`AWSProvider`, `GCPProvider`, `AzureProvider`). That Lambda runs on AWS is irrelevant to those modules.
 
---
 
## 5. Locked technical decisions
 
| Area | Decision | Reason |
|------|----------|--------|
| Language | TypeScript everywhere | One language, shared types |
| Repo | npm workspaces monorepo: `frontend`, `backend`, `shared`, `data-pipeline` | Simple |
| Frontend | React + Vite + TypeScript + Tailwind + Recharts + React Router (as built) | Spec + generated code |
| Forms/validation | `react-hook-form` + `zod` (schemas moved to `shared`) | Same validation both sides |
| Backend runtime | Node.js 20 (or newest Lambda LTS) on Lambda, ARM64 | Cheaper |
| API | API Gateway **HTTP API** | Cheaper, still API Gateway |
| IaC/deploy | AWS SAM (`template.yaml`) | Free, one-command deploy/teardown |
| Database | DynamoDB single table (history only) | Spec |
| Data | Bundled JSON snapshot | Fast, free, versionable |
| Tests | Vitest | Simple |
| Lint/format | ESLint + Prettier | Standard |
 
---
 
## 6. Repository structure
 
```
/
├─ AGENTS.md                     # copy of Appendix B
├─ .agent/rules/project.md       # same content (verify folder name in your Antigravity version)
├─ docs/
│  ├─ PRD.md  PLAN.md  PROGRESS.md  DECISIONS.md  BLOCKERS.md
│  ├─ METHODOLOGY.md  VALIDATION.md  ARCHITECTURE.md  FRONTEND_AUDIT.md
├─ frontend/
├─ backend/
│  ├─ template.yaml
│  └─ src/ handlers/ providers/ repository/ dataset/ lib/
├─ shared/src/                   # types, schemas, scoring, estimators
├─ data/
│  ├─ snapshot/dataset.json
│  ├─ catalog/  carbon/  benchmarks/  manual/
│  ├─ assumptions.json
│  └─ sources.json
└─ data-pipeline/src/
```
 
---
 
## 7. Data layer
 
### 7.1 Principles
- One normalized internal format for all providers.
- Snapshot generated **offline**; Lambda only reads it.
- Every record is provenance-tagged. `npm run data:validate` fails if any record lacks `source`, `retrievedAt` or `dataType`, or if `official` records lack a URL, or if `estimated`/`benchmark` records lack `methodology`.
- If a source is unavailable, use a documented fallback or mark `estimated`. Never invent a value.
 
### 7.2 Normalized records
 
```ts
export type ProviderId = 'aws' | 'gcp' | 'azure';
export type DataType = 'official' | 'estimated' | 'benchmark' | 'mock';
 
export interface SourcedValue {
  value: number;
  unit: string;
  dataType: DataType;
  source: string;        // URL or document name
  retrievedAt: string;   // ISO date
  methodology?: string;  // required for 'estimated' and 'benchmark'
}
 
export interface InstanceSpec {
  provider: ProviderId;
  service: string;             // "EC2" | "Compute Engine" | "Virtual Machines"
  instanceType: string;
  family: 'general' | 'compute' | 'memory';
  vcpu: number;
  ramGb: number;
  cpuArch: 'x86' | 'arm';
  cpuFamilyKey: string;        // key into benchmarks.json
  specSource: string;
  specRetrievedAt: string;
}
 
export interface PriceRecord {
  provider: ProviderId;
  providerRegion: string;
  sku: string;
  kind: 'compute_hour' | 'storage_gb_month' | 'egress_gb';
  price: SourcedValue;         // USD
}
```
 
Also: `carbon/coefficients.json` (power per vCPU, memory, storage, network coefficients, PUE per provider) and `carbon/grid-intensity.json` (gCO₂e/kWh per provider region), each value a `SourcedValue`.
 
### 7.3 Curated catalog and equivalence
Hand-curate about 8–12 instance types per provider covering `general`, `compute`, `memory` with 2–32 vCPU, with source URLs. Equivalence is by **vCPU and RAM**, not name. A commonly cited equivalent 4 vCPU / 16 GB shape is AWS `m5.xlarge`, GCP `n2-standard-4`, Azure `D4s_v5`; the pipeline must read actual specs from the official source and fail if they differ.
 
Storage is compared as general-purpose SSD block storage: AWS EBS gp3, GCP Persistent Disk balanced, Azure Premium SSD or Standard SSD (pick one, record in `DECISIONS.md`).
 
### 7.4 Sources and fallbacks (verify each at build time; record terms in `data/sources.json`)
 
| Need | Primary source | Fallback |
|------|---------------|----------|
| AWS prices | AWS Price List bulk files (public JSON) or Price List Query API (needs IAM credentials) | Manual CSV from AWS pricing pages with URL + date |
| Azure prices | Azure Retail Prices API (public REST, OData filter, paginated) | Manual CSV |
| GCP prices | Cloud Billing Catalog API (API key; find Compute Engine via `services.list`) | Manual CSV from Google Cloud pricing pages, `dataType: official`, methodology "manually transcribed" |
| Instance specs | Official provider documentation | n/a |
| Power coefficients | Cloud Carbon Footprint coefficients/methodology (open source); record version/commit | Published academic values, labeled `estimated` |
| Grid intensity | Public annual datasets (for example Ember yearly data, or provider-published regional data); check licence | Documented national average, labeled `estimated` |
| Electricity Maps / WattTime | **Optional, not used at runtime in V1.** Free access depends on current plans; do not assume free | Skip |
| BoaviztAPI | Optional embodied-emissions cross-check | Skip |
| CodeCarbon / eco2AI | Optional Phase 8 order-of-magnitude check only (a local machine is not a cloud VM) | Skip |
 
Manual CSVs go in `data/manual/` with the `PriceRecord` columns; the pipeline validates and merges them like fetched data.
 
### 7.5 Snapshot and "real-time" definition
`data/snapshot/dataset.json` has `datasetVersion` (date-based), all records, and a `sources` list. The UI shows "Data snapshot: <date>". Refresh is manual (`npm run data:build`).
 
---
 
## 8. Methodologies
 
All assumptions live in `data/assumptions.json`, are returned by `GET /meta`, and are shown in the UI methodology panel.
 
### 8.1 Cost (USD per month)
 
```
computeCost  = hourlyPrice(instance, region) × runtimeHoursPerDay × daysPerMonth
storageCost  = storageGb × pricePerGbMonth(storageClass, region)          # billed 24/7
transferCost = dataTransferGbPerDay × daysPerMonth × egressPricePerGb     # first paid tier
requestCost  = 0 in V1 (VM workloads)
monthlyCost  = computeCost + storageCost + transferCost + requestCost
```
 
Assumptions: `daysPerMonth = 30`; on-demand list prices; instance stopped when not running; **no free tiers, discounts or free egress allowance**; ingress free. **`requestsPerDay` is stored and shown but does not change V1 estimates**; the UI helper text under that field must say "Used for serverless comparison in a later version. Does not affect VM estimates."
 
### 8.2 Carbon (kg CO₂e per month), location-based
 
```
avgWattsPerVcpu = minWatts + utilization × (maxWatts − minWatts)
cpuKwh     = avgWattsPerVcpu × vcpu × runtimeHours / 1000
memKwh     = memoryCoeffKwhPerGbHour × ramGb × runtimeHours
storageKwh = storageCoeffKwhPerGbHour × storageGb × 24 × daysPerMonth
networkKwh = networkCoeffKwhPerGb × transferGb
energyKwh  = cpuKwh + memKwh + storageKwh + networkKwh
kgCO2e     = energyKwh × PUE(provider) × gridIntensity(providerRegion) / 1000
```
 
- Coefficients come from `carbon/coefficients.json` with source and version. **Do not type coefficient numbers from memory into code**; copy them from the cited source into JSON.
- `utilization` comes from the workload-type profile (8.6).
- Embodied emissions excluded in V1 (documented limitation).
- Location-based method for **all** providers. Provider renewable-energy purchases (market-based claims) are not applied; the methodology panel says so.
- Providers in the same country will often produce similar carbon; show a note in the UI.
- Every carbon value is `estimated` with `methodology` text.
 
### 8.3 Performance score (0–100)
 
```
cpuFamilyIndex  (0–100)  from benchmarks.json (per-vCPU relative compute performance)
headroomIndex   (0–100)  = 100 × clamp(((vcpu/requestedCpu + ram/requestedRam)/2 − 1), 0, 1)
performanceScore = 0.7 × cpuFamilyIndex + 0.3 × headroomIndex
```
 
- `benchmarks.json` rows cite a public source; otherwise use a documented generation/tier rubric labeled `estimated`.
- The 0.7/0.3 weights live in `assumptions.json` as design choices.
- **Performance requirement** minimum score: `low 0`, `standard 40`, `high 60`, `critical 75` (design choices, configurable, not vendor facts).
 
### 8.4 Candidate generation
For each provider, in the mapped region:
1. Keep instances with `vcpu ≥ requestedCpu` and `ramGb ≥ requestedRam` and `family` allowed for the workload type (8.6).
2. Drop instances with `vcpu > 2× requested` or `ramGb > 2× requested`, unless that leaves none.
3. Per family keep the smallest 1–2 that qualify.
4. Compute metrics; drop candidates below the performance requirement threshold.
5. If a provider has none, add a message to `warnings` and continue.
 
### 8.5 Region groups
 
| regionGroup | UI label | AWS | GCP | Azure |
|-------------|----------|-----|-----|-------|
| `india` | India | ap-south-1 (Mumbai) | asia-south1 (Mumbai) | centralindia (Pune) |
| `us_east` | US East | us-east-1 (N. Virginia) | us-east4 (N. Virginia) | eastus (Virginia) |
| `europe_west` | Western Europe | eu-west-1 (Ireland) | europe-west1 (Belgium) | westeurope (Netherlands) |
| `southeast_asia` | Southeast Asia | ap-southeast-1 (Singapore) | asia-southeast1 (Singapore) | southeastasia (Singapore) |
 
The pipeline asserts each chosen instance is priced in each mapped region; missing combinations are dropped and logged.
 
### 8.6 Workload profiles (new in v1.1)
 
`assumptions.json` contains a profile per workload type. These are **design assumptions**, labeled `estimated` with methodology "design assumption, adjustable", and shown in the methodology panel. Starting values (change only with a note in `DECISIONS.md`):
 
| workloadType | utilization | allowed families |
|--------------|-------------|------------------|
| `web_app` | 0.40 | general, compute |
| `api` | 0.40 | general, compute |
| `data_processing` | 0.70 | general, compute, memory |
| `machine_learning` (CPU only) | 0.70 | general, compute, memory |
| `other` | 0.50 | general, compute, memory |
 
The same profile applies to all three providers, so it never favors one provider.
 
---
 
## 9. Recommendation engine (`shared/src/scoring.ts`, pure and deterministic)
 
Inputs: candidates with `cost`, `carbon`, `performance`; priorities `{cost, carbon, performance}` (integers summing to 100).
 
```
norm(x, min, max) = (max === min) ? 0 : (x − min) / (max − min)
costN = norm(cost)  carbonN = norm(carbon)  perfN = norm(performance)
overallScore = 100 × ( wCost × (1 − costN) + wCarbon × (1 − carbonN) + wPerf × perfN )      # w = priority/100
```
 
If `max === min` for a metric, it contributes equally to all candidates.
 
- **Lower Cost** = min `monthlyCost`. Ties: lower carbon, higher performance, `id`.
- **Lower Carbon** = min `monthlyCo2e`. Ties: lower cost, higher performance, `id`.
- **Balanced** = max `overallScore`. Ties: lower cost, lower carbon, `id`.
- `providerBest[provider]` = highest `overallScore` of that provider, or `null`.
 
One candidate may win several categories; the UI then says there is no trade-off. Trade-off text is computed from data.
 
**Worked example (illustrative numbers only, not real data).** Candidates A, B, C: cost 100/120/110, carbon 30/20/25, performance 70/80/60, weights 50/30/20:
 
| | costN | carbonN | perfN | score |
|---|---|---|---|---|
| A | 0 | 1 | 0.5 | 60 |
| B | 1 | 0 | 1 | 50 |
| C | 0.5 | 0.5 | 0 | 40 |
 
Lower Cost = A, Lower Carbon = B, Balanced = A. Choosing B over A costs +20% and cuts carbon by 33%.
 
---
 
## 10. Backend API (API Gateway HTTP API + Lambda)
 
Headers: `Content-Type: application/json`, `X-Client-Id: <uuid from browser>` (identifies a browser's history; **not authentication**).
 
| Method | Path | Purpose | Success |
|--------|------|---------|---------|
| GET | `/meta` | Dataset version, region groups, workload types, workload profiles, assumptions, sources | 200 |
| POST | `/analyses` | Body `{ input, priorities }`; compute, persist, return `AnalysisResult` | 201 |
| GET | `/analyses` | Latest 50 `AnalysisSummary` for the client | 200 |
| GET | `/analyses/{id}` | Full `AnalysisResult` | 200 |
| DELETE | `/analyses/{id}` | Delete one | 204 |
 
Errors: `{ "error": { "code": "VALIDATION_ERROR" | "NOT_FOUND" | "NO_CANDIDATES" | "INTERNAL", "message": "...", "details": [...] } }` with 400/404/422/500. Validate every body with the shared zod schema; reject weights not summing to 100. CORS: allow frontend origins and `localhost`. Throttle (16). Log with request id; do not log full bodies at info level.
 
"Clear all" in the UI is implemented by the frontend calling `DELETE` per item (no bulk endpoint in V1).
 
### 10.1 Canonical types (`shared/src/types.ts`)
 
```ts
export type WorkloadType = 'web_app' | 'api' | 'data_processing' | 'machine_learning' | 'other';
export type PerformanceRequirement = 'low' | 'standard' | 'high' | 'critical';
export type RegionGroup = 'india' | 'us_east' | 'europe_west' | 'southeast_asia';
 
export interface WorkloadInput {
  workloadType: WorkloadType;
  cpuCores: number;               // 1-64
  ramGb: number;                  // 1-512
  storageGb: number;              // 10-10000
  runtimeHoursPerDay: number;     // 1-24
  dataTransferGbPerDay: number;   // 0-10000
  requestsPerDay: number;         // 0-1_000_000_000 (not used in V1 VM estimates)
  regionGroup: RegionGroup;
  performanceRequirement: PerformanceRequirement;
}
 
export interface Priorities { cost: number; carbon: number; performance: number } // integers, sum = 100
 
export interface CandidateConfig {
  id: string;
  provider: ProviderId;
  service: string;
  configName: string;
  providerRegion: string;
  regionLabel: string;
  vcpu: number;
  ramGb: number;
  storageGb: number;
  runtimeHoursPerDay: number;
  monthlyCostUsd: SourcedValue;
  monthlyCo2eKg: SourcedValue;
  performanceScore: SourcedValue;   // 0-100
  overallScore: number;             // 0-100 for the user's priorities
  costBreakdownUsd: { compute: number; storage: number; transfer: number; requests: number };
}
 
export interface AnalysisResult {
  id: string;
  createdAt: string;
  dataMode: 'mock' | 'live';
  datasetVersion: string;
  input: WorkloadInput;
  priorities: Priorities;
  candidates: CandidateConfig[];
  providerBest: Record<ProviderId, string | null>;
  recommendations: { lowerCost: string; lowerCarbon: string; balanced: string }; // candidate ids
  warnings: string[];
}
 
export interface RecommendationSummary {
  candidateId: string; provider: ProviderId; configName: string;
  monthlyCostUsd: number; monthlyCo2eKg: number;
}
export interface AnalysisSummary {
  id: string; createdAt: string; input: WorkloadInput; priorities: Priorities;
  recommendations: { lowerCost: RecommendationSummary; lowerCarbon: RecommendationSummary; balanced: RecommendationSummary };
}
 
export interface MetaInfo {
  datasetVersion: string;
  retrievedAt: string;
  regionGroups: { id: RegionGroup; label: string }[];
  workloadTypes: { id: WorkloadType; label: string; utilization: number; families: string[] }[];
  assumptions: Record<string, SourcedValue | number | string>;
  sources: { id: string; name: string; url: string; type: DataType; retrievedAt: string }[];
}
```
 
### 10.2 Provider abstraction (`backend/src/providers/CloudProvider.ts`)
 
```ts
export interface CloudProvider {
  readonly id: ProviderId;
  getRegions(): Promise<RegionInfo[]>;
  getServices(): Promise<ServiceInfo[]>;
  getPricing(region: string, sku: string): Promise<PriceRecord[]>;
  getCarbonData(region: string): Promise<CarbonRegionData>;   // grid intensity, PUE, coefficients
  estimateWorkload(input: WorkloadInput): Promise<CandidateMetrics[]>;
}
```
 
`AWSProvider`, `GCPProvider`, `AzureProvider` read from the snapshot and share estimator functions from `shared`. A registry (`providers/index.ts`) returns the list; the engine iterates it. Adding a provider means adding one class and its data files.
 
---
 
## 11. DynamoDB design (single table `AnalysisHistory`)
 
| Attribute | Value |
|-----------|-------|
| PK | `CLIENT#<clientId>` |
| SK | `ANALYSIS#<createdAtISO>#<id>` |
| `id` | ULID or UUID |
| `summary` | `AnalysisSummary` |
| `result` | full `AnalysisResult` (well below 400 KB) |
| `ttl` | epoch seconds, now + 90 days (TTL enabled) |
 
Access patterns: list by client (Query on PK, descending, limit 50); get by id (Query on PK filtered by id, or a GSI on `id`; choose the simplest and record it); delete. No scans. Search/sort in the UI is client-side over the 50 returned summaries.
 
`HistoryRepository` interface with `InMemoryHistoryRepository` (tests, local) and `DynamoHistoryRepository` (deployed).
 
---
 
## 12. Frontend (as built, then reconciled)
 
The frontend was generated with Lovable and enhanced with a UI/UX pass. It uses mock mode (`VITE_USE_MOCK=true`). The agent must **keep the design and features** and only reconcile them with this PRD.
 
### 12.1 Pages and features to preserve
 
| Page | Features |
|------|----------|
| `/` Landing | Hero with interactive cost-vs-carbon scatter and presets; benefits (Cost Optimization, Carbon Reduction, Multi-Cloud Comparison); 3-step "how it works"; data-transparency note; **Analyze Workload** CTA |
| `/configure` | Sectioned form; sticky summary panel; linked priority sliders totaling exactly 100 with stacked bar, presets, live total; inline validation; disabled-button reason; submit progress stepper |
| `/results/:id` | Demo-data banner (compact, popover); 3 recommendation cards (icon, provider/config, cost, CO₂e, deltas vs highest, performance meter, overall score, computed reason, "also lowest carbon" tags); trade-off strip; per-provider best-fit comparison with best-in-row markers; 4 Recharts charts with "view as table"; sticky in-page tabs (Overview, Charts, Details, Methodology); Export CSV |
| `/compare/:id` | Sortable table, provider filter chips, column visibility, sticky header/first column, checkbox selection of 2–4 configurations with side-by-side drawer, mobile cards, Export CSV |
| `/history` | Search, sort (newest, lowest cost, lowest carbon), result chips, View details, delete with undo toast, clear all with confirm, empty state, seeded demo entries |
| Global | Light/dark mode toggle (CSS variables, respects system), skeleton loaders, error and empty states with retry, toasts, accessibility (focus, AA contrast, aria labels) |
 
Design tokens: background `#F3F5F1`, text `#14201B`, primary `#256D4F`, subtle `#DCE9E1`, border `#C9D3CC`, warning `#B4531A`; provider chart colors AWS `#E38B25`, GCP `#3B78E0`, Azure `#17919F` (always with text labels). Fonts: Instrument Sans, IBM Plex Mono for figures.
 
### 12.2 What is derived client-side vs provided by the backend
 
| Client-side (from `candidates`, no backend change) | Backend-provided |
|----------------------------------------------------|------------------|
| Deltas vs highest/lowest, trade-off strip and sentence, best-in-row markers, quadrant guides, chart data, CSV export, compare drawer, history search/sort, column visibility | Candidates with `SourcedValue` metrics, `overallScore`, `providerBest`, `recommendations`, `warnings`, `datasetVersion`, `dataMode`, `/meta` (options, assumptions, workload profiles, sources) |
 
Rules:
- The submit **progress stepper is cosmetic**: it must not imply backend steps that do not exist. Show real time elapsed; complete when the response arrives; time out with an error after 15 seconds.
- **Undo delete**: remove the item optimistically, wait for the undo window (5 seconds), then call `DELETE`. If undone, cancel the call. If the page closes during the window, the delete is skipped (acceptable in V1).
- When `dataMode === 'live'`, hide the Demo-data banner; badges show the real `dataType` (official, estimated, benchmark).
- Dropdown options and methodology text come from `getMeta()` in live mode and from local constants in mock mode.
 
### 12.3 Reconciliation checklist (Phase 2; write results to `docs/FRONTEND_AUDIT.md`)
 
- [ ] R1 Code lives in `frontend/`; `npm install`, `typecheck`, `lint`, `test`, `build` pass.
- [ ] R2 Types match Section 10.1 exactly (including the new `WorkloadType`); form options and labels updated.
- [ ] R3 `src/lib/scoring.ts` implements Section 9 exactly; tests include the worked example, 100/0/0 and 0/100/0 cases, order independence and the all-equal case.
- [ ] R4 No provider name is used as a winner constant anywhere (search the code). Recommendations come only from the scoring function.
- [ ] R5 API layer exposes `analyzeWorkload`, `listAnalyses`, `getAnalysis`, `deleteAnalysis`, `getMeta`; selection by `VITE_USE_MOCK`; the HTTP client exists and matches Section 10; no component imports mock code directly.
- [ ] R6 History goes through a `HistoryStore` interface; undo-delete follows 12.2.
- [ ] R7 Every cost/CO₂e/performance value is a `SourcedValue` and shows a data-type badge with source, date, methodology.
- [ ] R8 The `requestsPerDay` helper text from 8.1 is present.
- [ ] R9 The methodology panel lists assumptions from 8.1–8.6 (30 days, on-demand list prices, no discounts, location-based carbon, workload-profile utilization, same-country note).
- [ ] R10 **Remove** generator leftovers: `lovable-tagger`, any Supabase/Firebase client or integration folder, unused UI components and dependencies. No backend calls other than the API layer.
- [ ] R11 Progress stepper is cosmetic and honest (12.2).
- [ ] R12 Dark and light mode both pass contrast; charts, badges and banners are readable in both.
- [ ] R13 Layout verified at 375px, 768px and 1280px; keyboard operable sliders, tables and drawers.
- [ ] R14 Move types, zod schemas and scoring into `shared/` and import them in the frontend; if workspace imports cause bundler friction, keep a copy in `frontend/`, record it in `DECISIONS.md`, and dedupe in Phase 6.
 
---
 
## 13. Environments and configuration
 
- `frontend/.env.example`: `VITE_API_BASE_URL=`, `VITE_USE_MOCK=true`.
- Backend via SAM parameters: `TABLE_NAME`, `ALLOWED_ORIGINS`, `DATASET_VERSION`.
- Never commit secrets. `.gitignore` covers `.env*`, `.aws-sam`, `node_modules`, `dist`.
 
---
 
## 14. Phased build plan
 
Each phase: tasks → verification → done-when. Commit per task; update `docs/PROGRESS.md` at the end of each phase.
 
### Phase 0 — Bootstrap
- Monorepo (npm workspaces), Git, `.gitignore`, ESLint/Prettier, `docs/` files, `AGENTS.md` and `.agent/rules/project.md` from Appendix B.
- **Verify:** `npm install` succeeds; `npm run lint` runs.
 
### Phase 1 — Frontend (DONE externally)
- Built with Lovable and a UI/UX enhancement pass. Nothing to do except confirm the code has been placed in `frontend/`.
 
### Phase 2 — Audit and reconcile the frontend
- Run the Section 12.3 checklist, write `docs/FRONTEND_AUDIT.md` with pass/fail per item, then fix every failure without changing the visual design or working features.
- **Verify:** `npm run typecheck`, `lint`, `test`, `build` pass; all R1–R14 pass; manual walkthrough of all five pages at 375px and 1280px in light and dark mode.
- **Done when:** the app works fully in mock mode and every checklist item passes.
 
### Phase 3 — Backend skeleton
- `backend/template.yaml`: HTTP API, Lambdas (five handlers or one router), DynamoDB table with TTL, least-privilege role, log retention 7 days, throttling, reserved concurrency cap.
- Handlers with zod validation, error helper, CORS, `HistoryRepository` (in-memory + DynamoDB). `analyze()` initially uses the shared scoring on a tiny fixture dataset (`tests/fixtures`, `dataType: "mock"`).
- **Verify:** `npm run test -w backend`; `sam validate` and `sam build` if SAM is installed; handler tests with `InMemoryHistoryRepository` and a mocked DynamoDB client.
- **Blocker rule:** if SAM/AWS is missing, log in `BLOCKERS.md` and continue.
 
### Phase 4 — Data layer
- Curate catalog (7.3), assumptions including workload profiles (8.6), carbon coefficients, grid intensity, benchmarks, each with provenance.
- Fetchers/normalizers for AWS, Azure and GCP (or manual-CSV fallback); validators; `npm run data:build` and `npm run data:validate`; generate `data/snapshot/dataset.json` and `data/sources.json`.
- **Verify:** validator passes; every record has provenance; snapshot under 5 MB; counts per provider/region printed; no `mock` records in the snapshot.
 
### Phase 5 — Recommendation engine
- Estimators (8.1–8.3), candidate generation with workload profiles (8.4, 8.6), scoring (9), three provider classes (10.2), `analyze()`, `GET /meta`.
- Wire `postAnalysis` to the engine and dataset loader (cache at module scope).
- **Verify:** unit tests with hand-calculated expectations (include the worked example); property tests: 100/0/0 ⇒ Balanced equals Lower Cost; 0/100/0 ⇒ Balanced equals Lower Carbon; order independence; determinism; more runtime never lowers cost or carbon.
 
### Phase 6 — Connect frontend
- Implement the real HTTP client (`fetch`, `X-Client-Id`, error mapping to typed `ApiError`) behind `VITE_USE_MOCK=false`; populate options and methodology from `getMeta()`; hide the Demo banner in live mode; keep mock mode for demos; dedupe shared code (R14).
- **Verify:** run the backend locally (`sam local start-api` if Docker exists, else a small local dev server reusing the same handlers) and complete the full flow from the UI: analyze, results, compare, history, delete with undo.
 
### Phase 7 — Testing and validation
- `scripts/run-scenarios.ts` runs at least these and writes `docs/VALIDATION.md` (inputs, results, provenance summary, observations):
  1. ML, 4 CPU / 16 GB / 100 GB / 8 h / 20 GB per day, India, 50/30/20
  2. Same, 10/80/10
  3. Same, 80/10/10
  4. Dev-style small workload, 2 CPU / 8 GB, 2 h/day (`other`)
  5. Large data processing, 32 CPU / 128 GB, 24 h/day
  6. Memory-heavy, 8 CPU / 64 GB (`data_processing`)
  7. Scenario 1 in `us_east`, `europe_west`, `southeast_asia`
  8. Infeasible request (64 CPU / 512 GB): confirm warnings and empty states
  9. Web app vs data processing with identical resources: confirm the profile changes carbon as documented
- Manual spot check of 3 configurations per provider against public pricing pages (record date, values, difference; investigate anything beyond a small tolerance).
- Confirm changing priorities changes recommendations in at least some scenarios and that no provider wins every scenario by construction.
- **Verify:** all tests green; `VALIDATION.md` complete.
 
### Phase 8 — Deploy, docs, stretch
- `sam deploy --guided` (human step if credentials are missing), frontend on a free static host, teardown instructions (`sam delete`).
- `README.md` (setup, run, deploy, cost notes), `docs/ARCHITECTURE.md` (Mermaid), `docs/METHODOLOGY.md` (report-ready).
- Optional stretch, in order: serverless comparison; CodeCarbon order-of-magnitude check.
- **Verify:** fresh clone → README steps → working local app.
 
---
 
## 15. Testing strategy
 
| Level | What | Tool |
|-------|------|------|
| Unit | Estimators, normalization, scoring, weight balancing, validators | Vitest |
| Property | Extreme weights, order independence, monotonicity | Vitest |
| Contract | Response validates against shared zod schema; mock client and HTTP client return the same shape | Vitest |
| Data | Provenance completeness, region coverage, no mock in snapshot | `data:validate` |
| Scenario | Phase 7 matrix | `run-scenarios.ts` |
| UI | Manual checklist + component tests (weights total 100, empty/error states, undo delete) | Vitest + Testing Library |
 
---
 
## 16. Security and cost guardrails
 
- AWS Budgets alert ($1–$5) before first deploy.
- HTTP API throttling (for example 10 requests/second, burst 20) and Lambda reserved concurrency (for example 5).
- CloudWatch log retention 7 days; no verbose body logging.
- DynamoDB: minimal provisioned capacity (5 RCU/WCU fits within the always-free allowance at the time of writing; verify) or on-demand with TTL; no GSI unless needed.
- No NAT gateway, VPC, RDS, EC2 or other always-on resources.
- Least-privilege Lambda role limited to the table ARN and logs.
- Validate every input; body size limit; `X-Client-Id` must be a UUID.
- No secrets in the repo or frontend bundle. No auth in V1; history is per-browser and not private.
- `sam delete` teardown documented. **Verify free-tier terms for your account at deploy time; they differ by account creation date.**
 
---
 
## 17. Risks
 
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Pricing API changes or blocks | Ingestion fails | Manual CSV fallback; snapshot committed |
| Carbon coefficients disputed | Credibility | Cite source/version; label `estimated`; methodology page; list limitations |
| Similar carbon across providers in one country | Looks weak | Explain in UI; show other region groups |
| Workload profile values seen as arbitrary | Credibility | Labeled design assumptions, identical for all providers, adjustable, documented |
| Generated frontend has hidden bugs or backend integrations | Rework | Phase 2 audit, cleanup rule R10 |
| Agent quota interruptions | Delay | Phase checkpoints, `PROGRESS.md`, short kickoff prompts |
| Scope creep | Never finishes | Ask-first list, non-goals, stretch only after Phase 7 |
| AWS cost surprise | Money | Section 16 guardrails |
 
---
 
## 18. Definition of done (V1)
 
1. All five pages work in mock mode and live mode, in light and dark mode.
2. Live results come only from the dated snapshot through the engine; no hard-coded winners.
3. Every displayed number exposes source, date, data type (and methodology if estimated).
4. Three separate recommendations plus computed trade-off text for any valid input.
5. Scenario matrix and spot checks documented in `VALIDATION.md`.
6. Deployed on API Gateway + Lambda + DynamoDB with guardrails; teardown documented.
7. README lets a new person run the project from scratch.
 
---
 
## Appendix A — Data source register template (`data/sources.json`)
 
```json
[
  {
    "id": "aws-price-list",
    "name": "AWS Price List bulk files",
    "url": "<fill from official docs>",
    "type": "official",
    "terms": "<record licence / terms summary at retrieval>",
    "retrievedAt": "<ISO date>",
    "usedFor": ["compute_hour", "storage_gb_month", "egress_gb"]
  }
]
```
 
## Appendix B — Agent rules (put in `AGENTS.md` and `.agent/rules/project.md`)
 
```
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
```
 
## Appendix C — Short kickoff prompts for Antigravity
 
**Phase 2 (audit and reconcile):**
```
Read docs/PRD.md sections 0, 10.1, 12 and 14. Frontend code is in frontend/ (built with Lovable, enhanced). Execute Phase 2: run checklist R1-R14, write docs/FRONTEND_AUDIT.md, fix every failure without changing the design or working features, then run typecheck, lint, test, build. Update docs/PROGRESS.md. Do not ask questions; log blockers to docs/BLOCKERS.md and continue.
```
 
**Phases 3–5 (backend, data, engine):**
```
Read docs/PRD.md and docs/PROGRESS.md. Execute Phases 3, 4 and 5 in order, verifying each phase before the next. Never fabricate data; follow sections 7-9. Update docs/PROGRESS.md after each phase. Log blockers and continue.
```
 
**Phases 6–8 (connect, validate, deploy):**
```
Read docs/PRD.md and docs/PROGRESS.md. Execute Phases 6, 7 and 8 in order. Log blockers (for example AWS credentials) to docs/BLOCKERS.md, stub or document the manual step, and continue. Update docs/PROGRESS.md after each phase.
```
 
**Resume after a quota pause:**
```
Read docs/PROGRESS.md and continue exactly where you stopped.
```
