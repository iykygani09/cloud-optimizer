# Methodology & Mathematical Equations (`docs/METHODOLOGY.md`)

**Version:** 1.1  
**Project:** Real-Time Multi-Cloud Carbon Footprint & Cost Optimizer (V1)  
**Source of Truth:** PRD Version 1.1 (`docs/PRD.md`) Sections 8 & 9.

---

## 1. Cost Estimation Engine (Section 8.1)

Monthly cost is estimated across compute, storage, and egress data transfer for a 30-day billing month ($720$ hours):

$$\text{Monthly Cost (USD)} = C_{\text{compute}} + C_{\text{storage}} + C_{\text{transfer}}$$

### 1.1 Compute Cost
$$C_{\text{compute}} = P_{\text{compute}} \times \text{runtimeHoursPerDay} \times 30$$
Where $P_{\text{compute}}$ is the on-demand hourly list price for the candidate instance SKU in the selected region.

### 1.2 Storage Cost
$$C_{\text{storage}} = \text{storageGb} \times P_{\text{storage}}$$
Where $P_{\text{storage}}$ is the monthly per-GB storage list price for general-purpose SSD storage (AWS `gp3`, GCP `pd-balanced`, Azure `premium-ssd`). Block storage runs 24/7 (30 days/month).

### 1.3 Data Transfer Cost
$$C_{\text{transfer}} = \text{dataTransferGbPerDay} \times 30 \times P_{\text{egress}}$$
Where $P_{\text{egress}}$ is the regional outbound internet egress list price per GB.

---

## 2. Carbon Footprint Estimation Engine (Section 8.2)

Carbon footprint uses the **Location-Based Method** aligned with the Cloud Carbon Footprint open methodology.

$$\text{Monthly Carbon (kg CO}_2\text{e)} = \frac{E_{\text{total}} \times \text{PUE} \times I_{\text{grid}}}{1000}$$

### 2.1 Total Energy Consumption ($E_{\text{total}}$ in kWh/month)
$$E_{\text{total}} = E_{\text{cpu}} + E_{\text{ram}} + E_{\text{storage}} + E_{\text{network}}$$

1. **CPU Energy:**
   $$P_{\text{avg}} = P_{\text{min}} + u_{\text{workload}} \times (P_{\text{max}} - P_{\text{min}})$$
   $$E_{\text{cpu}} = \frac{P_{\text{avg}} \times \text{vCPU} \times \text{runtimeHoursPerDay} \times 30}{1000}$$
   - $P_{\text{min}} = 0.74\text{ W/vCPU}$ (idle power coefficient)
   - $P_{\text{max}} = 3.50\text{ W/vCPU}$ (peak power coefficient)
   - $u_{\text{workload}}$: Workload average CPU utilization derived from workload profile (e.g. 40% for web_app/api, 70% for data_processing/machine_learning).

2. **RAM Energy:**
   $$E_{\text{ram}} = 0.000392 \times \text{ramGb} \times \text{runtimeHoursPerDay} \times 30$$

3. **Storage Energy:**
   $$E_{\text{storage}} = 0.00065 \times \text{storageGb} \times 24 \times 30$$

4. **Network Egress Energy:**
   $$E_{\text{network}} = 0.001 \times \text{dataTransferGbPerDay} \times 30$$

### 2.2 Regional Grid Emissions Intensity ($I_{\text{grid}}$)
Grid emission factor in $\text{gCO}_2\text{e/kWh}$:
- **India (Mumbai/Pune):** $708\text{ gCO}_2\text{e/kWh}$
- **US East (N. Virginia):** $364\text{ gCO}_2\text{e/kWh}$
- **Western Europe (Ireland/Belgium/Netherlands):** $276\text{ gCO}_2\text{e/kWh}$
- **Southeast Asia (Singapore):** $408\text{ gCO}_2\text{e/kWh}$

### 2.3 Power Usage Effectiveness ($\text{PUE}$)
- **AWS:** $1.15$
- **GCP:** $1.10$
- **Azure:** $1.18$

---

## 3. Performance Score Engine (Section 8.3)

Performance score ($S_{\text{perf}} \in [0, 100]$) combines per-vCPU relative benchmark index with capacity headroom:

$$S_{\text{perf}} = \text{round}\left(0.70 \times I_{\text{cpu}} + 0.30 \times I_{\text{headroom}}\right)$$

1. **CPU Benchmark Index ($I_{\text{cpu}}$):** Derived from SPEC CPU 2017 & Geekbench 6 relative single-core benchmark matrix for instance processor family (e.g., AWS Graviton3: 85, AMD EPYC 7763: 90, Intel Xeon Ice Lake: 80).
2. **Headroom Index ($I_{\text{headroom}}$):**
   $$H_{\text{avg}} = \frac{\frac{\text{vCPU}}{\text{cpuCores}} + \frac{\text{ramGb}}{\text{requestedRamGb}}}{2} - 1$$
   $$I_{\text{headroom}} = 100 \times \min\left(1, \max\left(0, H_{\text{avg}}\right)\right)$$

---

## 4. Multi-Criteria Scoring Engine (Section 9)

Scores are computed normalized relative to the set of evaluated candidates $C$:

$$S_i = \text{round}\left(w_{\text{cost}} \cdot S_{\text{cost}, i} + w_{\text{carbon}} \cdot S_{\text{carbon}, i} + w_{\text{perf}} \cdot S_{\text{perf}, i}\right)$$

Where $w_{\text{cost}} + w_{\text{carbon}} + w_{\text{perf}} = 1.0$ (normalized from 0..100 integer user inputs).

### 4.1 Cost Sub-score ($S_{\text{cost}, i}$)
$$S_{\text{cost}, i} = 100 \times \left(1 - \frac{\text{Cost}_i - \min_{c \in C}\text{Cost}_c}{\max_{c \in C}\text{Cost}_c - \min_{c \in C}\text{Cost}_c + \epsilon}\right)$$

### 4.2 Carbon Sub-score ($S_{\text{carbon}, i}$)
$$S_{\text{carbon}, i} = 100 \times \left(1 - \frac{\text{Carbon}_i - \min_{c \in C}\text{Carbon}_c}{\max_{c \in C}\text{Carbon}_c - \min_{c \in C}\text{Carbon}_c + \epsilon}\right)$$

### 4.3 Performance Sub-score ($S_{\text{perf}, i}$)
$$S_{\text{perf}, i} = \text{PerformanceScore}_i$$
