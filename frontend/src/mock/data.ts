import type { AnalysisResult, CandidateConfig, Priorities, ProviderId, RegionGroup, WorkloadInput } from "@/types";
import { chooseRecommendations, scoreCandidates } from "@/lib/scoring";

const now = "2026-09-23";

const providerConfigs: Record<ProviderId, { service: string; configName: string; cost: number; carbon: number; performance: number }> = {
  aws: { service: "Amazon EC2", configName: "t4g.medium", cost: 86, carbon: 33, performance: 84 },
  gcp: { service: "Google Cloud Compute Engine", configName: "e2-standard-2", cost: 78, carbon: 24, performance: 79 },
  azure: { service: "Azure Virtual Machines", configName: "B2s", cost: 92, carbon: 19, performance: 73 },
};

const regionLabels: Record<RegionGroup, { label: string; awsRegion: string; gcpRegion: string; azureRegion: string; costMult: number; carbonMult: number }> = {
  india: { label: "India", awsRegion: "ap-south-1", gcpRegion: "asia-south1", azureRegion: "centralindia", costMult: 0.92, carbonMult: 1.1 },
  us_east: { label: "US East", awsRegion: "us-east-1", gcpRegion: "us-east4", azureRegion: "eastus", costMult: 1.0, carbonMult: 1.0 },
  europe_west: { label: "Western Europe", awsRegion: "eu-west-1", gcpRegion: "europe-west1", azureRegion: "westeurope", costMult: 1.12, carbonMult: 0.75 },
  southeast_asia: { label: "Southeast Asia", awsRegion: "ap-southeast-1", gcpRegion: "asia-southeast1", azureRegion: "southeastasia", costMult: 1.04, carbonMult: 1.0 },
};

export function buildCandidates(input: WorkloadInput): CandidateConfig[] {
  const regInfo = regionLabels[input.regionGroup] || regionLabels.us_east;
  const scale = Math.max(0.35, input.cpuCores / 4 + input.ramGb / 32 + input.storageGb / 400 + input.runtimeHoursPerDay / 24 + input.dataTransferGbPerDay / 2000 + input.requestsPerDay / 250000000);
  const perfFactor = { low: 0.88, standard: 1.0, high: 1.1, critical: 1.2 }[input.performanceRequirement];
  const providers: ProviderId[] = ["aws", "gcp", "azure"];

  return providers.map((p, index) => {
    const base = providerConfigs[p];
    const cost = Math.round(base.cost * scale * regInfo.costMult * (input.workloadType === "machine_learning" && p === "aws" ? 1.12 : 1));
    const carbon = Math.round(base.carbon * scale * regInfo.carbonMult * (input.workloadType === "data_processing" && p === "azure" ? 0.9 : 1));
    const performance = Math.min(99, Math.round(base.performance * perfFactor + input.cpuCores / 4 + index));

    const computeCost = Math.round(cost * 0.85);
    const storageCost = Math.round(cost * 0.10);
    const transferCost = Math.round(cost * 0.05);

    const providerRegion = p === "aws" ? regInfo.awsRegion : p === "gcp" ? regInfo.gcpRegion : regInfo.azureRegion;

    return {
      id: `${p}-${Date.now()}-${index}`,
      provider: p,
      service: base.service,
      configName: base.configName,
      providerRegion,
      regionLabel: regInfo.label,
      vcpu: input.cpuCores,
      ramGb: input.ramGb,
      storageGb: input.storageGb,
      runtimeHoursPerDay: input.runtimeHoursPerDay,
      monthlyCostUsd: {
        value: cost,
        unit: "USD / mo",
        dataType: "mock",
        source: "Mock data, not real",
        retrievedAt: now,
        methodology: "Invented round-number rates scaled to the workload inputs."
      },
      monthlyCo2eKg: {
        value: carbon,
        unit: "kg CO₂e / mo",
        dataType: "mock",
        source: "Mock data, not real",
        retrievedAt: now,
        methodology: "Illustrative intensity factors by provider and region."
      },
      performanceScore: {
        value: performance,
        unit: "score / 100",
        dataType: "mock",
        source: "Mock data, not real",
        retrievedAt: now,
        methodology: "Illustrative benchmark score based on requested performance."
      },
      overallScore: 0,
      costBreakdownUsd: { compute: computeCost, storage: storageCost, transfer: transferCost, requests: 0 },
    };
  });
}

export function createAnalysis(input: WorkloadInput, priorities: Priorities, id = `analysis-${Date.now()}`): AnalysisResult {
  const candidates = scoreCandidates(buildCandidates(input), priorities);
  const providerBest: Record<ProviderId, string | null> = {
    aws: candidates.find((c) => c.provider === "aws")?.id ?? null,
    gcp: candidates.find((c) => c.provider === "gcp")?.id ?? null,
    azure: candidates.find((c) => c.provider === "azure")?.id ?? null,
  };

  return {
    id,
    createdAt: new Date().toISOString(),
    dataMode: "mock" as const,
    datasetVersion: "2026-09-23-mock",
    input,
    priorities,
    candidates,
    providerBest,
    recommendations: chooseRecommendations(candidates),
    warnings: ["Figures are placeholders for testing the interface, not real prices or emissions."],
  };
}
