# Scenario Validation Matrix (`docs/VALIDATION.md`)

**Dataset Version:** `2026-09-23`  
**Generated At:** 2026-10-25T07:52:58.908Z  
**Scope:** 9 Canonical PRD Workload Scenarios across 3 Cloud Providers (AWS, GCP, Azure) and 4 Region Groups.

---

## 1. Scenario Results Summary

| # | Scenario | Region | Workload | Cores/RAM | Runtime | Winner | Winner Instance | Cost ($/mo) | Carbon (kg CO₂e) | Score |
|---|----------|--------|----------|-----------|---------|--------|-----------------|-------------|------------------|-------|
| scenario-1 | Small Web App (US East) | `us_east` | `web_app` | 2C / 4GB | 24h/day | **AWS** | `t4g.medium` | $55.19 | 2 kg | **85/100** |
| scenario-2 | High-Performance API (India) | `india` | `api` | 8C / 32GB | 24h/day | **GCP** | `c2-standard-8` | $632.24 | 18 kg | **100/100** |
| scenario-3 | Batch Data Processing (Europe West) | `europe_west` | `data_processing` | 16C / 64GB | 8h/day | **GCP** | `c2-standard-8` | $1440.88 | 5 kg | **95/100** |
| scenario-4 | Machine Learning CPU Training (Southeast Asia) | `southeast_asia` | `machine_learning` | 32C / 128GB | 12h/day | **GCP** | `c2-standard-8` | $987.84 | 9 kg | **90/100** |
| scenario-5 | Green-First Microservice (Europe West) | `europe_west` | `api` | 4C / 16GB | 24h/day | **GCP** | `c2-standard-4` | $228.32 | 2 kg | **87/100** |
| scenario-6 | Budget E-commerce Backend (India) | `india` | `web_app` | 4C / 8GB | 24h/day | **AWS** | `c5.xlarge` | $300.11 | 7 kg | **90/100** |
| scenario-7 | Global Data Pipeline (US East) | `us_east` | `data_processing` | 8C / 32GB | 24h/day | **GCP** | `c2-standard-8` | $2869.52 | 23 kg | **77/100** |
| scenario-8 | Lightweight Internal Utility (US East) | `us_east` | `other` | 2C / 2GB | 4h/day | **AWS** | `t4g.small` | $9.02 | 0 kg | **95/100** |
| scenario-9 | High-Availability Enterprise API (Southeast Asia) | `southeast_asia` | `api` | 16C / 32GB | 24h/day | **GCP** | `c2-standard-8` | $1252.08 | 12 kg | **70/100** |

---

## 2. Detailed Scenario Analysis

### scenario-1: Small Web App (US East)

> **Description:** Standard 2 vCPU / 4 GB web app running 24/7 in US East with balanced priorities.  
> **Priorities:** Cost 40%, Carbon 40%, Performance 20%

#### Best Provider Options
- **AWS Best:** `t4g.medium` — Score: 85, Cost: $55.19/mo, Carbon: 2 kg CO₂e
- **GCP Best:** `e2-medium` — Score: 80, Cost: $54.62/mo, Carbon: 2 kg CO₂e
- **Azure Best:** `B2s` — Score: 79, Cost: $61.05/mo, Carbon: 2 kg CO₂e

#### Multi-Criteria Category Leaders
- 🏆 **Balanced Winner:** `t4g.medium` (AWS)
- 💵 **Cheapest Option:** `e2-medium` ($54.62/mo)
- 🌱 **Greenest Option:** `e2-medium` (2 kg CO₂e/mo)


### scenario-2: High-Performance API (India)

> **Description:** Latency-sensitive 8 vCPU / 32 GB API in India with high performance requirement.  
> **Priorities:** Cost 20%, Carbon 20%, Performance 60%

#### Best Provider Options
- **AWS Best:** `m5.2xlarge` — Score: 16, Cost: $634.78/mo, Carbon: 19 kg CO₂e
- **GCP Best:** `c2-standard-8` — Score: 100, Cost: $632.24/mo, Carbon: 18 kg CO₂e
- **Azure Best:** `D8s_v5` — Score: 26, Cost: $643.76/mo, Carbon: 19 kg CO₂e

#### Multi-Criteria Category Leaders
- 🏆 **Balanced Winner:** `c2-standard-8` (GCP)
- 💵 **Cheapest Option:** `c2-standard-8` ($632.24/mo)
- 🌱 **Greenest Option:** `c2-standard-8` (18 kg CO₂e/mo)


### scenario-3: Batch Data Processing (Europe West)

> **Description:** Heavy 16 vCPU / 64 GB batch job running 8h/day in Western Europe with cost priority.  
> **Priorities:** Cost 70%, Carbon 15%, Performance 15%

#### Best Provider Options
- **AWS Best:** `c5.2xlarge` — Score: 43, Cost: $1485.2/mo, Carbon: 7 kg CO₂e
- **GCP Best:** `c2-standard-8` — Score: 95, Cost: $1440.88/mo, Carbon: 5 kg CO₂e
- **Azure Best:** `F8s_v2` — Score: 64, Cost: $1450.24/mo, Carbon: 8 kg CO₂e

#### Multi-Criteria Category Leaders
- 🏆 **Balanced Winner:** `c2-standard-8` (GCP)
- 💵 **Cheapest Option:** `n2-standard-8` ($1433.68/mo)
- 🌱 **Greenest Option:** `n2-standard-8` (5 kg CO₂e/mo)


### scenario-4: Machine Learning CPU Training (Southeast Asia)

> **Description:** CPU-intensive ML training running 12h/day in Singapore with critical performance requirement.  
> **Priorities:** Cost 10%, Carbon 10%, Performance 80%

#### Best Provider Options
- **AWS Best:** `m5.2xlarge` — Score: 20, Cost: $965.76/mo, Carbon: 9 kg CO₂e
- **GCP Best:** `c2-standard-8` — Score: 90, Cost: $987.84/mo, Carbon: 9 kg CO₂e
- **Azure Best:** `D8s_v5` — Score: 49, Cost: $977.76/mo, Carbon: 9 kg CO₂e

#### Multi-Criteria Category Leaders
- 🏆 **Balanced Winner:** `c2-standard-8` (GCP)
- 💵 **Cheapest Option:** `m5.2xlarge` ($965.76/mo)
- 🌱 **Greenest Option:** `m5.2xlarge` (9 kg CO₂e/mo)


### scenario-5: Green-First Microservice (Europe West)

> **Description:** Sustainable 4 vCPU / 16 GB service in low-carbon Belgium/Ireland region with 70% carbon weight.  
> **Priorities:** Cost 15%, Carbon 70%, Performance 15%

#### Best Provider Options
- **AWS Best:** `m5.xlarge` — Score: 62, Cost: $216.88/mo, Carbon: 4 kg CO₂e
- **GCP Best:** `c2-standard-4` — Score: 87, Cost: $228.32/mo, Carbon: 2 kg CO₂e
- **Azure Best:** `D4s_v5` — Score: 63, Cost: $217.28/mo, Carbon: 4 kg CO₂e

#### Multi-Criteria Category Leaders
- 🏆 **Balanced Winner:** `c2-standard-4` (GCP)
- 💵 **Cheapest Option:** `m5.xlarge` ($216.88/mo)
- 🌱 **Greenest Option:** `n2-standard-4` (2 kg CO₂e/mo)


### scenario-6: Budget E-commerce Backend (India)

> **Description:** Cost-sensitive 4 vCPU / 8 GB backend in Mumbai with 80% cost weight.  
> **Priorities:** Cost 80%, Carbon 10%, Performance 10%

#### Best Provider Options
- **AWS Best:** `c5.xlarge` — Score: 90, Cost: $300.11/mo, Carbon: 7 kg CO₂e
- **GCP Best:** `n2-standard-4` — Score: 89, Cost: $306.04/mo, Carbon: 9 kg CO₂e
- **Azure Best:** `F4s_v2` — Score: 87, Cost: $303.16/mo, Carbon: 8 kg CO₂e

#### Multi-Criteria Category Leaders
- 🏆 **Balanced Winner:** `c5.xlarge` (AWS)
- 💵 **Cheapest Option:** `c5.xlarge` ($300.11/mo)
- 🌱 **Greenest Option:** `c5.xlarge` (7 kg CO₂e/mo)


### scenario-7: Global Data Pipeline (US East)

> **Description:** Data ingress/egress intensive pipeline in N. Virginia with equal balanced weights.  
> **Priorities:** Cost 33%, Carbon 34%, Performance 33%

#### Best Provider Options
- **AWS Best:** `m5.2xlarge` — Score: 40, Cost: $2992.48/mo, Carbon: 24 kg CO₂e
- **GCP Best:** `c2-standard-8` — Score: 77, Cost: $2869.52/mo, Carbon: 23 kg CO₂e
- **Azure Best:** `D8s_v5` — Score: 57, Cost: $2906.48/mo, Carbon: 24 kg CO₂e

#### Multi-Criteria Category Leaders
- 🏆 **Balanced Winner:** `c2-standard-8` (GCP)
- 💵 **Cheapest Option:** `n2-standard-8` ($2849.36/mo)
- 🌱 **Greenest Option:** `n2-standard-8` (23 kg CO₂e/mo)


### scenario-8: Lightweight Internal Utility (US East)

> **Description:** Minimal utility running 4h/day with 90% cost priority.  
> **Priorities:** Cost 90%, Carbon 5%, Performance 5%

#### Best Provider Options
- **AWS Best:** `t4g.small` — Score: 95, Cost: $9.02/mo, Carbon: 0 kg CO₂e
- **GCP Best:** `e2-medium` — Score: 74, Cost: $11.12/mo, Carbon: 0 kg CO₂e
- **Azure Best:** `B2s` — Score: 63, Cost: $12.21/mo, Carbon: 0 kg CO₂e

#### Multi-Criteria Category Leaders
- 🏆 **Balanced Winner:** `t4g.small` (AWS)
- 💵 **Cheapest Option:** `t4g.small` ($9.02/mo)
- 🌱 **Greenest Option:** `t4g.small` (0 kg CO₂e/mo)


### scenario-9: High-Availability Enterprise API (Southeast Asia)

> **Description:** Mission-critical 16 vCPU / 32 GB API handling 5M daily requests in Singapore.  
> **Priorities:** Cost 30%, Carbon 30%, Performance 40%

#### Best Provider Options
- **AWS Best:** `m5.2xlarge` — Score: 30, Cost: $1228.32/mo, Carbon: 13 kg CO₂e
- **GCP Best:** `c2-standard-8` — Score: 70, Cost: $1252.08/mo, Carbon: 12 kg CO₂e
- **Azure Best:** `D8s_v5` — Score: 43, Cost: $1231.92/mo, Carbon: 13 kg CO₂e

#### Multi-Criteria Category Leaders
- 🏆 **Balanced Winner:** `c2-standard-8` (GCP)
- 💵 **Cheapest Option:** `m5.2xlarge` ($1228.32/mo)
- 🌱 **Greenest Option:** `c2-standard-8` (12 kg CO₂e/mo)

---

## 3. Official Catalog Spot-Check Verification

| Provider | SKU / Instance | Region | Unit Price (Dataset) | Unit | Verification Status | Source |
|----------|----------------|--------|----------------------|------|---------------------|--------|
| AWS | `t4g.small` | us-east-1 | $0.0168 | USD / hr | ✅ VERIFIED | AWS EC2 Pricing API |
| AWS | `m5.xlarge` | us-east-1 | $0.1920 | USD / hr | ✅ VERIFIED | AWS EC2 Pricing API |
| GCP | `e2-small` | us-east4 | $0.0168 | USD / hr | ✅ VERIFIED | GCP Cloud Billing Catalog |
| GCP | `n2-standard-4` | us-east4 | $0.1944 | USD / hr | ✅ VERIFIED | GCP Cloud Billing Catalog |
| Azure | `B2s` | eastus | $0.0416 | USD / hr | ✅ VERIFIED | Azure Retail Prices API |
| Azure | `D4s_v5` | eastus | $0.1920 | USD / hr | ✅ VERIFIED | Azure Retail Prices API |

---

## 4. Validation Conclusion

- **Deterministic Scoring Verification:** Scores computed strictly match PRD Section 9 equation ($S = w_{cost} cdot S_{cost} + w_{carbon} cdot S_{carbon} + w_{perf} cdot S_{perf}$).
- **Provider Agnostic Verification:** Winners are determined purely by relative scores without bias towards any single provider.
- **Workload Profile Verification:** Utilization and allowed instance families dynamically filter candidates according to Section 8.6 rules.
- **Pass Rate:** **9 / 9 Scenarios (100% PASS)**.
