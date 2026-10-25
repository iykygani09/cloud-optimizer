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
  durationValue?: number;         // e.g. 4, 12, 3, 2
  durationUnit?: 'hours' | 'days' | 'weeks'; // required timeframe
  urgency?: 'urgent' | 'flexible'; // urgent vs carbon-aware scheduling
}

export interface Priorities {
  cost: number;
  carbon: number;
  performance: number;
} // integers, sum = 100

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
  candidateId: string;
  provider: ProviderId;
  configName: string;
  monthlyCostUsd: number;
  monthlyCo2eKg: number;
}

export interface AnalysisSummary {
  id: string;
  createdAt: string;
  input: WorkloadInput;
  priorities: Priorities;
  recommendations: {
    lowerCost: RecommendationSummary;
    lowerCarbon: RecommendationSummary;
    balanced: RecommendationSummary;
  };
}

export interface MetaInfo {
  datasetVersion: string;
  retrievedAt: string;
  regionGroups: { id: RegionGroup; label: string }[];
  workloadTypes: { id: WorkloadType; label: string; utilization: number; families: string[] }[];
  assumptions: Record<string, SourcedValue | number | string>;
  sources: { id: string; name: string; url: string; type: DataType; retrievedAt: string }[];
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
