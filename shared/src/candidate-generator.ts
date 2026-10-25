import type {
  CandidateConfig,
  InstanceSpec,
  Priorities,
  ProviderId,
  WorkloadInput,
} from './types.js';
import {
  computeMonthlyCarbon,
  computeMonthlyCost,
  computePerformanceScore,
  REGION_MAPPING,
  type DatasetSnapshot,
} from './estimators.js';
import { chooseRecommendations, scoreCandidates } from './scoring.js';

export interface GenerationResult {
  candidates: CandidateConfig[];
  providerBest: Record<ProviderId, string | null>;
  recommendations: { lowerCost: string; lowerCarbon: string; balanced: string };
  warnings: string[];
}

export function generateCandidates(
  input: WorkloadInput,
  priorities: Priorities,
  dataset: DatasetSnapshot
): GenerationResult {
  const warnings: string[] = [];
  const rawCandidates: CandidateConfig[] = [];

  const profile = dataset.assumptions.workloadProfiles?.[input.workloadType] || {
    utilization: 0.5,
    allowedFamilies: ['general', 'compute', 'memory'],
  };
  const allowedFamilies: string[] = profile.allowedFamilies || ['general', 'compute', 'memory'];

  const perfThresholds = dataset.assumptions.performanceThresholds || {
    low: 0,
    standard: 40,
    high: 60,
    critical: 75,
  };
  const minPerfScore = perfThresholds[input.performanceRequirement] ?? 40;

  const providers: ProviderId[] = ['aws', 'gcp', 'azure'];

  for (const provider of providers) {
    const regMap = REGION_MAPPING[input.regionGroup]?.[provider];
    if (!regMap) {
      warnings.push(`Region group '${input.regionGroup}' is not mapped for provider '${provider}'`);
      continue;
    }

    const { providerRegion, regionLabel } = regMap;

    // 1. Filter matching provider instances
    const providerInstances = dataset.instances.filter((inst) => inst.provider === provider);

    let qualifying = providerInstances.filter(
      (inst) => inst.vcpu >= input.cpuCores && inst.ramGb >= input.ramGb && allowedFamilies.includes(inst.family)
    );

    // 2. Drop instances > 2x requested CPU or RAM unless none qualify
    const reasonable = qualifying.filter(
      (inst) => inst.vcpu <= 2 * input.cpuCores && inst.ramGb <= 2 * input.ramGb
    );
    if (reasonable.length > 0) {
      qualifying = reasonable;
    }

    if (qualifying.length === 0) {
      const allowedInsts = providerInstances.filter((inst) => allowedFamilies.includes(inst.family));
      if (allowedInsts.length > 0) {
        const maxVcpu = Math.max(...allowedInsts.map((i) => i.vcpu));
        qualifying = allowedInsts.filter((i) => i.vcpu === maxVcpu);
        warnings.push(`Requested ${input.cpuCores} vCPU / ${input.ramGb} GB RAM exceeds dataset catalog max (${maxVcpu} vCPU). Capped to largest available instance for provider '${provider.toUpperCase()}'.`);
      } else {
        warnings.push(`Provider '${provider.toUpperCase()}' has no instances for families '${allowedFamilies.join('/')}'`);
        continue;
      }
    }

    // 3. Keep smallest 1-2 per family
    const selectedInstances: InstanceSpec[] = [];
    const familiesPresent = Array.from(new Set(qualifying.map((inst) => inst.family)));

    for (const fam of familiesPresent) {
      const famInsts = qualifying
        .filter((inst) => inst.family === fam)
        .sort((a, b) => a.vcpu - b.vcpu || a.ramGb - b.ramGb);
      selectedInstances.push(...famInsts.slice(0, 2));
    }

    // 4. Compute metrics & check performance threshold
    const candidatePool: CandidateConfig[] = [];
    for (const inst of selectedInstances) {
      const { monthlyCostUsd, costBreakdownUsd } = computeMonthlyCost(inst, providerRegion, input, dataset);
      const monthlyCo2eKg = computeMonthlyCarbon(inst, providerRegion, input, dataset);
      const performanceScore = computePerformanceScore(inst, input, dataset);

      candidatePool.push({
        id: `${provider}-${inst.instanceType}-${input.regionGroup}`,
        provider,
        service: inst.service,
        configName: inst.instanceType,
        providerRegion,
        regionLabel,
        vcpu: inst.vcpu,
        ramGb: inst.ramGb,
        storageGb: input.storageGb,
        runtimeHoursPerDay: input.runtimeHoursPerDay,
        monthlyCostUsd,
        monthlyCo2eKg,
        performanceScore,
        overallScore: 0,
        costBreakdownUsd,
      });
    }

    const qualifyingPerf = candidatePool.filter((c) => c.performanceScore.value >= minPerfScore);
    if (qualifyingPerf.length > 0) {
      rawCandidates.push(...qualifyingPerf);
    } else if (candidatePool.length > 0) {
      // Fallback: pick candidate with highest performance score
      candidatePool.sort((a, b) => b.performanceScore.value - a.performanceScore.value);
      const bestPerf = candidatePool[0];
      if (bestPerf) {
        rawCandidates.push(bestPerf);
        warnings.push(`Provider '${provider.toUpperCase()}' candidates did not meet performance threshold '${input.performanceRequirement}' (score >= ${minPerfScore}). Included best available candidate '${bestPerf.configName}' (score: ${bestPerf.performanceScore.value}).`);
      }
    }
  }

  // 5. Score candidates and pick recommendations
  const scoredCandidates = scoreCandidates(rawCandidates, priorities);
  const recs = chooseRecommendations(scoredCandidates);

  return {
    candidates: scoredCandidates,
    providerBest: recs.providerBest,
    recommendations: {
      lowerCost: recs.lowerCost,
      lowerCarbon: recs.lowerCarbon,
      balanced: recs.balanced,
    },
    warnings,
  };
}
