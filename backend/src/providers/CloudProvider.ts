import type { PriceRecord, ProviderId, SourcedValue, WorkloadInput } from 'shared';

export interface RegionInfo {
  providerRegion: string;
  regionLabel: string;
}

export interface ServiceInfo {
  service: string;
  kind: string;
}

export interface CarbonRegionData {
  gridIntensity: SourcedValue;
  pue: SourcedValue;
}

export interface CandidateMetrics {
  instanceType: string;
  family: 'general' | 'compute' | 'memory';
  vcpu: number;
  ramGb: number;
  providerRegion: string;
  monthlyCostUsd: SourcedValue;
  monthlyCo2eKg: SourcedValue;
  performanceScore: SourcedValue;
  costBreakdownUsd: { compute: number; storage: number; transfer: number; requests: number };
}

export interface CloudProvider {
  readonly id: ProviderId;
  getRegions(): Promise<RegionInfo[]>;
  getServices(): Promise<ServiceInfo[]>;
  getPricing(region: string, sku: string): Promise<PriceRecord[]>;
  getCarbonData(region: string): Promise<CarbonRegionData>;
}
