import { describe, expect, it } from 'vitest';
import type { DatasetSnapshot, WorkloadInput, Priorities } from '../src/index.js';
import { generateCandidates } from '../src/candidate-generator.js';
import { computeMonthlyCarbon, computeMonthlyCost, computePerformanceScore } from '../src/estimators.js';

const mockDataset: DatasetSnapshot = {
  datasetVersion: '2026-09-23-test',
  builtAt: '2026-09-23T00:00:00.000Z',
  instances: [
    { provider: 'aws', service: 'Amazon EC2', instanceType: 't4g.medium', family: 'general', vcpu: 2, ramGb: 4, cpuArch: 'arm', cpuFamilyKey: 'aws_graviton3', specSource: 'https://aws.com', specRetrievedAt: '2026-09-23' },
    { provider: 'aws', service: 'Amazon EC2', instanceType: 'm5.large', family: 'general', vcpu: 2, ramGb: 8, cpuArch: 'x86', cpuFamilyKey: 'aws_intel_cascade_lake', specSource: 'https://aws.com', specRetrievedAt: '2026-09-23' },
    { provider: 'gcp', service: 'Google Cloud Compute Engine', instanceType: 'n2-standard-2', family: 'general', vcpu: 2, ramGb: 8, cpuArch: 'x86', cpuFamilyKey: 'gcp_intel_cascade_lake', specSource: 'https://cloud.google.com', specRetrievedAt: '2026-09-23' },
    { provider: 'azure', service: 'Azure Virtual Machines', instanceType: 'D2s_v5', family: 'general', vcpu: 2, ramGb: 8, cpuArch: 'x86', cpuFamilyKey: 'azure_intel_ice_lake', specSource: 'https://azure.com', specRetrievedAt: '2026-09-23' },
  ],
  prices: [
    { provider: 'aws', providerRegion: 'ap-south-1', sku: 't4g.medium', kind: 'compute_hour', price: { value: 0.0336, unit: 'USD', dataType: 'official', source: 'http://aws', retrievedAt: '2026-09-23' } },
    { provider: 'aws', providerRegion: 'ap-south-1', sku: 'm5.large', kind: 'compute_hour', price: { value: 0.096, unit: 'USD', dataType: 'official', source: 'http://aws', retrievedAt: '2026-09-23' } },
    { provider: 'aws', providerRegion: 'ap-south-1', sku: 'gp3', kind: 'storage_gb_month', price: { value: 0.08, unit: 'USD', dataType: 'official', source: 'http://aws', retrievedAt: '2026-09-23' } },
    { provider: 'aws', providerRegion: 'ap-south-1', sku: 'egress', kind: 'egress_gb', price: { value: 0.09, unit: 'USD', dataType: 'official', source: 'http://aws', retrievedAt: '2026-09-23' } },

    { provider: 'gcp', providerRegion: 'asia-south1', sku: 'n2-standard-2', kind: 'compute_hour', price: { value: 0.091, unit: 'USD', dataType: 'official', source: 'http://gcp', retrievedAt: '2026-09-23' } },
    { provider: 'gcp', providerRegion: 'asia-south1', sku: 'pd-balanced', kind: 'storage_gb_month', price: { value: 0.10, unit: 'USD', dataType: 'official', source: 'http://gcp', retrievedAt: '2026-09-23' } },
    { provider: 'gcp', providerRegion: 'asia-south1', sku: 'egress', kind: 'egress_gb', price: { value: 0.085, unit: 'USD', dataType: 'official', source: 'http://gcp', retrievedAt: '2026-09-23' } },

    { provider: 'azure', providerRegion: 'centralindia', sku: 'D2s_v5', kind: 'compute_hour', price: { value: 0.096, unit: 'USD', dataType: 'official', source: 'http://azure', retrievedAt: '2026-09-23' } },
    { provider: 'azure', providerRegion: 'centralindia', sku: 'premium-ssd', kind: 'storage_gb_month', price: { value: 0.10, unit: 'USD', dataType: 'official', source: 'http://azure', retrievedAt: '2026-09-23' } },
    { provider: 'azure', providerRegion: 'centralindia', sku: 'egress', kind: 'egress_gb', price: { value: 0.087, unit: 'USD', dataType: 'official', source: 'http://azure', retrievedAt: '2026-09-23' } },
  ],
  assumptions: {
    workloadProfiles: {
      web_app: { utilization: 0.4, allowedFamilies: ['general', 'compute'] },
    },
    performanceThresholds: { low: 0, standard: 40, high: 60, critical: 75 },
  },
  coefficients: {
    pue: {
      aws: { value: 1.15, unit: 'ratio', dataType: 'official', source: 'http://aws', retrievedAt: '2026-09-23' },
      gcp: { value: 1.10, unit: 'ratio', dataType: 'official', source: 'http://gcp', retrievedAt: '2026-09-23' },
      azure: { value: 1.18, unit: 'ratio', dataType: 'official', source: 'http://azure', retrievedAt: '2026-09-23' },
    },
    power: {
      minWattsPerVcpu: { value: 0.74, unit: 'W/vCPU', dataType: 'estimated', source: 'ccf', retrievedAt: '2026-09-23', methodology: 'm' },
      maxWattsPerVcpu: { value: 3.50, unit: 'W/vCPU', dataType: 'estimated', source: 'ccf', retrievedAt: '2026-09-23', methodology: 'm' },
      memoryKwhPerGbHour: { value: 0.000392, unit: 'kWh/GB-hour', dataType: 'estimated', source: 'ccf', retrievedAt: '2026-09-23', methodology: 'm' },
      storageKwhPerGbHour: { value: 0.0000012, unit: 'kWh/GB-hour', dataType: 'estimated', source: 'ccf', retrievedAt: '2026-09-23', methodology: 'm' },
      networkKwhPerGb: { value: 0.001, unit: 'kWh/GB', dataType: 'estimated', source: 'ccf', retrievedAt: '2026-09-23', methodology: 'm' },
    },
  },
  gridIntensity: {
    'ap-south-1': { value: 708, unit: 'gCO2e/kWh', dataType: 'estimated', source: 'ember', retrievedAt: '2026-09-23', methodology: 'm' },
    'asia-south1': { value: 708, unit: 'gCO2e/kWh', dataType: 'estimated', source: 'ember', retrievedAt: '2026-09-23', methodology: 'm' },
    'centralindia': { value: 708, unit: 'gCO2e/kWh', dataType: 'estimated', source: 'ember', retrievedAt: '2026-09-23', methodology: 'm' },
  },
  benchmarks: {
    aws_graviton3: { cpuFamilyIndex: 88, dataType: 'benchmark', source: 'spec', retrievedAt: '2026-09-23', methodology: 'm' },
    aws_intel_cascade_lake: { cpuFamilyIndex: 80, dataType: 'benchmark', source: 'spec', retrievedAt: '2026-09-23', methodology: 'm' },
    gcp_intel_cascade_lake: { cpuFamilyIndex: 82, dataType: 'benchmark', source: 'spec', retrievedAt: '2026-09-23', methodology: 'm' },
    azure_intel_ice_lake: { cpuFamilyIndex: 84, dataType: 'benchmark', source: 'spec', retrievedAt: '2026-09-23', methodology: 'm' },
  },
};

describe('Recommendation Engine Candidate Generator & Estimators', () => {
  const input: WorkloadInput = {
    workloadType: 'web_app',
    cpuCores: 2,
    ramGb: 8,
    storageGb: 100,
    runtimeHoursPerDay: 8,
    dataTransferGbPerDay: 20,
    requestsPerDay: 0,
    regionGroup: 'india',
    performanceRequirement: 'standard',
  };

  it('computes deterministic metrics for AWS, GCP, Azure', () => {
    const res = generateCandidates(input, { cost: 50, carbon: 30, performance: 20 }, mockDataset);
    expect(res.candidates.length).toBeGreaterThanOrEqual(3);
    expect(res.recommendations.lowerCost).toBeDefined();
    expect(res.recommendations.lowerCarbon).toBeDefined();
    expect(res.recommendations.balanced).toBeDefined();
  });

  it('property test: 100/0/0 cost priority produces Balanced equal to Lower Cost', () => {
    const res = generateCandidates(input, { cost: 100, carbon: 0, performance: 0 }, mockDataset);
    expect(res.recommendations.balanced).toBe(res.recommendations.lowerCost);
  });

  it('property test: 0/100/0 carbon priority produces Balanced equal to Lower Carbon', () => {
    const res = generateCandidates(input, { cost: 0, carbon: 100, performance: 0 }, mockDataset);
    expect(res.recommendations.balanced).toBe(res.recommendations.lowerCarbon);
  });

  it('property test: monotonicity - increasing runtime or storage never decreases cost or carbon', () => {
    const baseInst = mockDataset.instances[1]; // m5.large
    const cost1 = computeMonthlyCost(baseInst, 'ap-south-1', { ...input, runtimeHoursPerDay: 8 }, mockDataset);
    const cost2 = computeMonthlyCost(baseInst, 'ap-south-1', { ...input, runtimeHoursPerDay: 16 }, mockDataset);
    expect(cost2.monthlyCostUsd.value).toBeGreaterThan(cost1.monthlyCostUsd.value);

    const carbon1 = computeMonthlyCarbon(baseInst, 'ap-south-1', { ...input, runtimeHoursPerDay: 8 }, mockDataset);
    const carbon2 = computeMonthlyCarbon(baseInst, 'ap-south-1', { ...input, runtimeHoursPerDay: 16 }, mockDataset);
    expect(carbon2.value).toBeGreaterThan(carbon1.value);
  });
});
