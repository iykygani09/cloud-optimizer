# Real-Time Carbon Footprint Estimator for Cloud Workloads

[![Live Demo](https://img.shields.io/badge/Live%20Demo-cloud--optimizer--theta.vercel.app-00d8ff?style=for-the-badge&logo=vercel&logoColor=white)](https://cloud-optimizer-theta.vercel.app)
[![PRD Version](https://img.shields.io/badge/PRD-v1.1-blue.svg)](docs/PRD.md)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Typecheck](https://img.shields.io/badge/TypeScript-Strict-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/Tests-21%2F21%20Pass-success.svg)]()

> 🌐 **Live Web Application:** [https://cloud-optimizer-theta.vercel.app](https://cloud-optimizer-theta.vercel.app)  
> ⚡ **Live AWS API Gateway Backend:** `https://naby4rtnh6.execute-api.us-east-1.amazonaws.com`

A deterministic, multi-criteria cloud optimization and carbon estimation platform that evaluates **Amazon Web Services (AWS)**, **Google Cloud (GCP)**, and **Microsoft Azure** compute, storage, and data egress costs alongside real-time region-specific carbon footprint emissions and hardware performance scores.

---

## 🚀 Key Features & Highlights

- **Live Multi-Cloud Decision Engine:** No hard-coded winners. Real-time evaluation of AWS, GCP, and Azure configurations based on exact workload durations (hours, days, weeks) and carbon/cost priorities.
- **EPA Green Impact Translation:** Quantifies CO₂e emissions into tangible real-world equivalents (passenger car kilometers, mature tree carbon absorption, smartphone charge cycles, LED runtime hours).
- **Spatial Geo-Shift Simulator:** Demonstrates carbon-reduction potential by shifting workloads to greener geographic regions with lower marginal grid carbon intensity.
- **Scope 2 & 3 Carbon Accounting:** Distinguishes between GHG Protocol Scope 2 operational electricity grid emissions and Scope 3 embodied hardware manufacturing carbon.
- **Auditable PDF Reports:** One-click executive ESG audit reporting with print-optimized summaries, data provenance, and methodologies.
- **Pure Provider-Agnostic Engine:** Location-based marginal grid emissions ($\text{gCO}_2\text{e/kWh}$) × Power Usage Effectiveness ($\text{PUE}$) × hardware power consumption (min/max vCPU watts, RAM, storage, network energy).
- **Data Provenance & Transparency:** Every cost estimate, carbon value, grid intensity factor, and benchmark score carries strict metadata (`source`, `retrievedAt`, `dataType`, `methodology`).
- **Modern Monorepo Stack:** React 19 + Vite + TypeScript + Tailwind CSS v4 + Recharts frontend paired with a Node.js 20 TypeScript AWS Lambda backend API Gateway service and DynamoDB history.

---

## 📁 Repository Workspaces

| Workspace Package | Path | Role & Technology |
|-------------------|------|-------------------|
| **Frontend** | `frontend/` | React 19, Vite, TypeScript, Tailwind CSS v4, Recharts, TanStack Router |
| **Backend** | `backend/` | Node.js 20 Lambda handlers, API Gateway router, DynamoDB repository, Local Dev Server |
| **Shared Library** | `shared/` | Canonical TypeScript types, Zod validation schemas, Scoring Engine, Estimators |
| **Data Pipeline** | `data-pipeline/` | Offline data curation, catalog ingestion, provenance validator, snapshot compiler |

---

## 🛠️ Quickstart & Local Development

### 1. Requirements
- Node.js `20.x` or higher
- npm `10.x` or higher

### 2. Installation
```bash
git clone https://github.com/iykygani09/cloud-optimizer.git
cd cloud-optimizer
npm install
```

### 3. Run Local Dev Server (Backend API)
Hosts the Node.js 20 HTTP API Gateway router locally on `http://localhost:3000`:
```bash
npm run dev:backend
```

### 4. Run Frontend Development Server
Hosts the Vite React UI on `http://localhost:5173`:
```bash
npm run dev
```

---

## 🧪 Testing & Verification Commands

Run full automated checks before commits:

```bash
# 1. Typecheck all workspaces (0 errors)
npm run typecheck

# 2. Run vitest unit test suites across all workspaces (21/21 passing)
npm run test

# 3. Validate dataset snapshot & data provenance
npm run data:validate

# 4. Execute 9 PRD Scenarios & generate docs/VALIDATION.md
npm run test:scenarios
```

---

## 📊 Data Pipeline

Recompile dataset snapshot from raw JSON catalog and coefficients in `data/`:

```bash
npm run data:build
```
This generates `data/snapshot/dataset.json` containing normalized instance specs, regional prices, PUE factors, grid intensities, and SPEC CPU benchmark scores.

---

## ☁️ Production Deployment (AWS SAM)

To deploy the serverless backend stack to AWS (API Gateway + Lambda + DynamoDB):

### 1. Build SAM Application
```bash
cd backend
sam build
```

### 2. Deploy to AWS
```bash
sam deploy --guided
```
SAM creates:
- **API Gateway HTTP API** with CORS, throttling (50 req/s), and route preflight.
- **Node.js 20 TS Lambda** function.
- **DynamoDB Table** `AnalysisHistory` with 30-day automatic TTL.

### 3. Teardown / Cleanup
To destroy all deployed AWS resources and prevent incurring charges:
```bash
cd backend
sam delete
```

---

## 📚 Documentation Index

- [PRD Version 1.1](docs/PRD.md) — Canonical Specification & Requirement Source of Truth
- [System Architecture](docs/ARCHITECTURE.md) — System Overview, Monorepo Layout & Mermaid Diagrams
- [Estimation Methodology](docs/METHODOLOGY.md) — Detailed Mathematical Equations for Cost, Carbon & Performance
- [Scenario Validation Matrix](docs/VALIDATION.md) — 9 Canonical Scenario Results & Official Catalog Spot-Checks
- [Frontend Audit Report](docs/FRONTEND_AUDIT.md) — Section 12.3 Phase 2 Reconciliation Checklist
- [Progress Tracker](docs/PROGRESS.md) — Phase 0–8 Task Status Checklist
- [Architecture Decisions](docs/DECISIONS.md) — Record of Key Non-Trivial Design Choices
