import type {
  CandidateConfig,
  Priorities,
  ProviderId,
} from './types.js';

export function norm(x: number, min: number, max: number): number {
  if (max === min) return 0;
  return (x - min) / (max - min);
}

export function scoreCandidates(
  candidates: CandidateConfig[],
  priorities: Priorities
): CandidateConfig[] {
  if (candidates.length === 0) return [];

  const costs = candidates.map((c) => c.monthlyCostUsd.value);
  const carbons = candidates.map((c) => c.monthlyCo2eKg.value);
  const perfs = candidates.map((c) => c.performanceScore.value);

  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);

  const minCarbon = Math.min(...carbons);
  const maxCarbon = Math.max(...carbons);

  const minPerf = Math.min(...perfs);
  const maxPerf = Math.max(...perfs);

  const totalW =
    priorities.cost + priorities.carbon + priorities.performance || 1;
  const wCost = priorities.cost / totalW;
  const wCarbon = priorities.carbon / totalW;
  const wPerf = priorities.performance / totalW;

  return candidates.map((c) => {
    const costN = norm(c.monthlyCostUsd.value, minCost, maxCost);
    const carbonN = norm(c.monthlyCo2eKg.value, minCarbon, maxCarbon);
    const perfN = norm(c.performanceScore.value, minPerf, maxPerf);

    const overallScore = Math.round(
      100 * (wCost * (1 - costN) + wCarbon * (1 - carbonN) + wPerf * perfN)
    );

    return {
      ...c,
      overallScore,
    };
  });
}

export function chooseRecommendations(candidates: CandidateConfig[]): {
  lowerCost: string;
  lowerCarbon: string;
  balanced: string;
  providerBest: Record<ProviderId, string | null>;
} {
  if (candidates.length === 0) {
    return {
      lowerCost: '',
      lowerCarbon: '',
      balanced: '',
      providerBest: { aws: null, gcp: null, azure: null },
    };
  }

  // Lower Cost: min monthlyCostUsd. Ties: lower carbon, higher perf, id
  const lowerCostCand = [...candidates].sort((a, b) => {
    if (a.monthlyCostUsd.value !== b.monthlyCostUsd.value) {
      return a.monthlyCostUsd.value - b.monthlyCostUsd.value;
    }
    if (a.monthlyCo2eKg.value !== b.monthlyCo2eKg.value) {
      return a.monthlyCo2eKg.value - b.monthlyCo2eKg.value;
    }
    if (a.performanceScore.value !== b.performanceScore.value) {
      return b.performanceScore.value - a.performanceScore.value;
    }
    return a.id.localeCompare(b.id);
  })[0];

  // Lower Carbon: min monthlyCo2eKg. Ties: lower cost, higher perf, id
  const lowerCarbonCand = [...candidates].sort((a, b) => {
    if (a.monthlyCo2eKg.value !== b.monthlyCo2eKg.value) {
      return a.monthlyCo2eKg.value - b.monthlyCo2eKg.value;
    }
    if (a.monthlyCostUsd.value !== b.monthlyCostUsd.value) {
      return a.monthlyCostUsd.value - b.monthlyCostUsd.value;
    }
    if (a.performanceScore.value !== b.performanceScore.value) {
      return b.performanceScore.value - a.performanceScore.value;
    }
    return a.id.localeCompare(b.id);
  })[0];

  // Balanced: max overallScore. Ties: lower cost, lower carbon, id
  const balancedCand = [...candidates].sort((a, b) => {
    if (a.overallScore !== b.overallScore) {
      return b.overallScore - a.overallScore;
    }
    if (a.monthlyCostUsd.value !== b.monthlyCostUsd.value) {
      return a.monthlyCostUsd.value - b.monthlyCostUsd.value;
    }
    if (a.monthlyCo2eKg.value !== b.monthlyCo2eKg.value) {
      return a.monthlyCo2eKg.value - b.monthlyCo2eKg.value;
    }
    return a.id.localeCompare(b.id);
  })[0];

  const providerBest: Record<ProviderId, string | null> = {
    aws: null,
    gcp: null,
    azure: null,
  };

  const providers: ProviderId[] = ['aws', 'gcp', 'azure'];
  for (const p of providers) {
    const pCandidates = candidates.filter((c) => c.provider === p);
    if (pCandidates.length > 0) {
      const best = [...pCandidates].sort((a, b) => {
        if (a.overallScore !== b.overallScore) {
          return b.overallScore - a.overallScore;
        }
        if (a.monthlyCostUsd.value !== b.monthlyCostUsd.value) {
          return a.monthlyCostUsd.value - b.monthlyCostUsd.value;
        }
        return a.monthlyCo2eKg.value - b.monthlyCo2eKg.value;
      })[0];
      if (best) {
        providerBest[p] = best.id;
      }
    }
  }

  return {
    lowerCost: lowerCostCand ? lowerCostCand.id : '',
    lowerCarbon: lowerCarbonCand ? lowerCarbonCand.id : '',
    balanced: balancedCand ? balancedCand.id : '',
    providerBest,
  };
}
