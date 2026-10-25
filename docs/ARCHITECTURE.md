# System Architecture & Technical Design (`docs/ARCHITECTURE.md`)

**Version:** 1.1  
**Project:** Real-Time Multi-Cloud Carbon Footprint & Cost Optimizer  
**Stack:** React + Vite + TypeScript + Tailwind CSS + Recharts (Frontend), Node.js 20 TS Lambda + API Gateway HTTP API + DynamoDB (Backend via AWS SAM).

---

## 1. System Overview

```mermaid
flowchart TD
    subgraph Client ["Frontend Workspace (React 18 + Vite + TS)"]
        UI["Web Application UI\n(Dashboard / Workload Form / Results / History)"]
        API_CLIENT["Typed HTTP API Client\n(frontend/src/api/index.ts)"]
        UI --> API_CLIENT
    end

    subgraph Backend ["Backend Workspace (Node.js 20 TS)"]
        HTTP_API["AWS API Gateway HTTP API\n(CORS + Throttling 50 req/s)"]
        LAMBDA["AWS Lambda Function\n(Node.js 20 TS Handler)"]
        ROUTER["API Router & Zod Validator\n(backend/src/handlers/router.ts)"]
        ENGINE["Snapshot Recommendation Engine\n(shared/src/candidate-generator.ts)"]
        REPO["History Repository\n(DynamoDB / In-Memory)"]
        
        HTTP_API --> LAMBDA
        LAMBDA --> ROUTER
        ROUTER --> ENGINE
        ROUTER --> REPO
    end

    subgraph Data ["Data & Engine Workspaces"]
        DATASET["Compiled Dataset Snapshot\n(data/snapshot/dataset.json)"]
        SCORING["Pure Scoring & Estimators\n(shared/src/scoring.ts)"]
        ENGINE --> DATASET
        ENGINE --> SCORING
    end

    subgraph Storage ["AWS Infrastructure (SAM Stack)"]
        DYNAMO[("DynamoDB Table\nAnalysisHistory (TTL 30 days)")]
        REPO --> DYNAMO
    end

    API_CLIENT -- "HTTPS REST API (JSON)" --> HTTP_API
```

---

## 2. Monorepo Workspaces Layout

```mermaid
graph TD
    ROOT["multi-cloud-optimizer (Root Workspace)"]
    FRONTEND["frontend/\n(React, Vite, Tailwind, Recharts)"]
    BACKEND["backend/\n(Node 20 Lambda, SAM template.yaml, Local Dev Server)"]
    SHARED["shared/\n(Types, Zod Schemas, Scoring Engine, Estimators)"]
    PIPELINE["data-pipeline/\n(Dataset Ingestion, Validation & Snapshot Builder)"]

    ROOT --> FRONTEND
    ROOT --> BACKEND
    ROOT --> SHARED
    ROOT --> PIPELINE

    FRONTEND --> SHARED
    BACKEND --> SHARED
    PIPELINE --> SHARED
```

---

## 3. Data Processing & Recommendation Engine Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Frontend UI
    participant Server as Backend API Gateway / Dev Server
    participant Router as Router & Zod Validation
    participant Engine as Recommendation Engine
    participant Snapshot as Dataset Snapshot Cache
    participant Repo as History Repository

    User->>UI: Submit Workload Form (Cores, RAM, Region, Priorities)
    UI->>Server: POST /analyses { input, priorities }
    Server->>Router: Parse Request & Validate with Zod
    Router->>Engine: snapshotAnalyzeEngine(input, priorities)
    Engine->>Snapshot: Read Instance Catalog, Grid Intensity & Prices
    Engine->>Engine: Filter Eligible Instances & Capped Headroom
    Engine->>Engine: Compute Cost ($), Carbon (kg CO₂e), Perf Score (0-100)
    Engine->>Engine: Normalize Min-Max & Score (w_cost*S_cost + w_carb*S_carb + w_perf*S_perf)
    Engine-->>Router: Return AnalysisResult
    Router->>Repo: Save Analysis (ClientId + TTL)
    Router-->>Server: 201 Created Response
    Server-->>UI: JSON Analysis Result
    UI-->>User: Display Results Cards, Charts & Compare Drawer
```

---

## 4. Local Execution & AWS SAM Deployment Architecture

```mermaid
flowchart LR
    subgraph Development ["Local Dev Environment"]
        DEV_SERVER["Local Node Dev Server\n(backend/src/dev-server.ts:3000)"]
        IN_MEM["InMemoryHistoryRepository\n(Map storage)"]
        DEV_SERVER --> IN_MEM
    end

    subgraph AWS_Cloud ["AWS Production Environment (SAM)"]
        GW["API Gateway HTTP API"]
        LAMB["Lambda Function (Node 20)"]
        DYN["DynamoDB AnalysisHistory"]
        GW --> LAMB
        LAMB --> DYN
    end

    VITE["Vite Frontend Dev / Build"] -- "Local API Target" --> DEV_SERVER
    VITE -- "Production API Target" --> GW
```

---

## 5. Security, Infrastructure & Scalability Controls

1. **API Gateway Throttling:** Capped at 50 requests per second with a burst limit of 100 requests to prevent abuse.
2. **Lambda Execution Limits:** Memory set to 512 MB, timeout set to 10 seconds, concurrency cap set to 20 instances.
3. **Data Security & TTL:** Analysis history records are keyed per client ID (`X-Client-Id`) and automatically purged after 30 days using DynamoDB TTL.
4. **CORS & Headers:** Wildcard CORS enabled for HTTP API Gateway with preflight `OPTIONS` routing handled cleanly.
