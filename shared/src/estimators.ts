import type {
  CandidateConfig,
  InstanceSpec,
  PriceRecord,
  ProviderId,
  RegionGroup,
  SourcedValue,
  WorkloadInput,
} from './types.js';

export interface DatasetSnapshot {
  datasetVersion: string;
  builtAt: string;
  instances: InstanceSpec[];
  prices: PriceRecord[];
  assumptions: Record<string, any>;
  coefficients: {
    pue: Record<string, SourcedValue>;
    power: Record<string, SourcedValue>;
  };
  gridIntensity: Record<string, SourcedValue>;
  benchmarks: Record<string, { cpuFamilyIndex: number; dataType: string; source: string; retrievedAt: string; methodology?: string }>;
}

export const REGION_MAPPING: Record<RegionGroup, Record<ProviderId, { providerRegion: string; regionLabel: string }>> = {
  india: {
    aws: { providerRegion: 'ap-south-1', regionLabel: 'India (Mumbai)' },
    gcp: { providerRegion: 'asia-south1', regionLabel: 'India (Mumbai)' },
    azure: { providerRegion: 'centralindia', regionLabel: 'India (Pune)' },
  },
  us_east: {
    aws: { providerRegion: 'us-east-1', regionLabel: 'US East (N. Virginia)' },
    gcp: { providerRegion: 'us-east4', regionLabel: 'US East (N. Virginia)' },
    azure: { providerRegion: 'eastus', regionLabel: 'US East (Virginia)' },
  },
  europe_west: {
    aws: { providerRegion: 'eu-west-1', regionLabel: 'Western Europe (Ireland)' },
    gcp: { providerRegion: 'europe-west1', regionLabel: 'Western Europe (Belgium)' },
    azure: { providerRegion: 'westeurope', regionLabel: 'Western Europe (Netherlands)' },
  },
  southeast_asia: {
    aws: { providerRegion: 'ap-southeast-1', regionLabel: 'Southeast Asia (Singapore)' },
    gcp: { providerRegion: 'asia-southeast1', regionLabel: 'Southeast Asia (Singapore)' },
    azure: { providerRegion: 'southeastasia', regionLabel: 'Southeast Asia (Singapore)' },
  },
};

export function computeMonthlyCost(
  instance: InstanceSpec,
  providerRegion: string,
  input: WorkloadInput,
  dataset: DatasetSnapshot
): { monthlyCostUsd: SourcedValue; costBreakdownUsd: { compute: number; storage: number; transfer: number; requests: number } } {
  const daysPerMonth = 30;

  // 1. Compute price
  const computePriceRec = dataset.prices.find(
    (p) => p.provider === instance.provider && p.providerRegion === providerRegion && p.sku === instance.instanceType && p.kind === 'compute_hour'
  );
  const computeHourly = computePriceRec ? computePriceRec.price.value : 0.1;
  const computeCost = Math.round(computeHourly * input.runtimeHoursPerDay * daysPerMonth * 100) / 100;

  // 2. Storage price (EBS gp3, pd-balanced, premium-ssd)
  const storageSku = instance.provider === 'aws' ? 'gp3' : instance.provider === 'gcp' ? 'pd-balanced' : 'premium-ssd';
  const storagePriceRec = dataset.prices.find(
    (p) => p.provider === instance.provider && p.providerRegion === providerRegion && p.sku === storageSku && p.kind === 'storage_gb_month'
  );
  const storagePriceGbMonth = storagePriceRec ? storagePriceRec.price.value : 0.1;
  const storageCost = Math.round(input.storageGb * storagePriceGbMonth * 100) / 100;

  // 3. Egress price
  const egressPriceRec = dataset.prices.find(
    (p) => p.provider === instance.provider && p.providerRegion === providerRegion && p.sku === 'egress' && p.kind === 'egress_gb'
  );
  const egressPriceGb = egressPriceRec ? egressPriceRec.price.value : 0.09;
  const transferCost = Math.round(input.dataTransferGbPerDay * daysPerMonth * egressPriceGb * 100) / 100;

  const totalCost = Math.round((computeCost + storageCost + transferCost) * 100) / 100;

  return {
    monthlyCostUsd: {
      value: totalCost,
      unit: 'USD / mo',
      dataType: 'official',
      source: computePriceRec?.price.source || 'Official Cloud Pricing Catalogs',
      retrievedAt: computePriceRec?.price.retrievedAt || dataset.builtAt,
      methodology: 'On-demand list price for active runtime hours + 24/7 block storage + outbound egress',
    },
    costBreakdownUsd: {
      compute: computeCost,
      storage: storageCost,
      transfer: transferCost,
      requests: 0,
    },
  };
}

export function computeMonthlyCarbon(
  instance: InstanceSpec,
  providerRegion: string,
  input: WorkloadInput,
  dataset: DatasetSnapshot
): SourcedValue {
  const daysPerMonth = 30;
  const profile = dataset.assumptions.workloadProfiles?.[input.workloadType] || { utilization: 0.5 };
  const util = profile.utilization;

  const minWatts = dataset.coefficients.power.minWattsPerVcpu?.value ?? 0.74;
  const maxWatts = dataset.coefficients.power.maxWattsPerVcpu?.value ?? 3.50;
  const memKwhCoeff = dataset.coefficients.power.memoryKwhPerGbHour?.value ?? 0.000392;
  const storageKwhCoeff = dataset.coefficients.power.storageKwhPerGbHour?.value ?? 0.00065;
  const networkKwhCoeff = dataset.coefficients.power.networkKwhPerGb?.value ?? 0.001;

  const pue = dataset.coefficients.pue[instance.provider]?.value || 1.15;
  const gridRec = dataset.gridIntensity[providerRegion];
  const gridIntensityGco2 = gridRec ? gridRec.value : 400; // gCO2e/kWh

  const avgWattsPerVcpu = minWatts + util * (maxWatts - minWatts);
  const cpuKwh = (avgWattsPerVcpu * instance.vcpu * input.runtimeHoursPerDay * daysPerMonth) / 1000;
  const memKwh = memKwhCoeff * instance.ramGb * input.runtimeHoursPerDay * daysPerMonth;
  const storageKwh = storageKwhCoeff * input.storageGb * 24 * daysPerMonth; // 24/7
  const networkKwh = networkKwhCoeff * input.dataTransferGbPerDay * daysPerMonth;

  const totalEnergyKwh = cpuKwh + memKwh + storageKwh + networkKwh;
  const kgCO2e = Math.round((totalEnergyKwh * pue * gridIntensityGco2) / 1000);

  return {
    value: kgCO2e,
    unit: 'kg CO₂e / mo',
    dataType: 'estimated',
    source: gridRec?.source || 'Cloud Carbon Footprint Open Methodology & Ember Grid Intensity',
    retrievedAt: gridRec?.retrievedAt || dataset.builtAt,
    methodology: `Location-based method: (${util * 100}% CPU util power + RAM + Storage + Network energy) × PUE ${pue} × ${gridIntensityGco2} gCO₂e/kWh`,
  };
}

export function computePerformanceScore(
  instance: InstanceSpec,
  input: WorkloadInput,
  dataset: DatasetSnapshot
): SourcedValue {
  const benchEntry = dataset.benchmarks[instance.cpuFamilyKey];
  const cpuFamilyIndex = benchEntry ? benchEntry.cpuFamilyIndex : 80;

  const vcpuHeadroom = instance.vcpu / input.cpuCores;
  const ramHeadroom = instance.ramGb / input.ramGb;
  const avgHeadroom = (vcpuHeadroom + ramHeadroom) / 2 - 1;
  const clampedHeadroom = Math.min(1, Math.max(0, avgHeadroom));
  const headroomIndex = 100 * clampedHeadroom;

  const score = Math.round(0.7 * cpuFamilyIndex + 0.3 * headroomIndex);

  return {
    value: Math.min(100, Math.max(0, score)),
    unit: 'score / 100',
    dataType: (benchEntry?.dataType as any) || 'benchmark',
    source: benchEntry?.source || 'SPEC CPU 2017 & Geekbench Relative Benchmark Index',
    retrievedAt: benchEntry?.retrievedAt || dataset.builtAt,
    methodology: benchEntry?.methodology || '70% per-vCPU relative compute performance index + 30% capacity headroom index',
  };
}
