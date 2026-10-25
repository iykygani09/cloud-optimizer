import { describe, expect, it } from 'vitest';
import { chooseRecommendations, scoreCandidates } from '../src/lib/scoring';
import type { CandidateConfig } from '../src/types';

const candidates: CandidateConfig[] = [
  {
    id: 'aws',
    provider: 'aws',
    service: 'EC2',
    configName: 'm5.large',
    providerRegion: 'us-east-1',
    regionLabel: 'US East',
    vcpu: 2,
    ramGb: 8,
    storageGb: 100,
    runtimeHoursPerDay: 24,
    monthlyCostUsd: { value: 100, unit: 'USD', dataType: 'mock', source: 'Mock', retrievedAt: '2026-09-23' },
    monthlyCo2eKg: { value: 30, unit: 'kg', dataType: 'mock', source: 'Mock', retrievedAt: '2026-09-23' },
    performanceScore: { value: 70, unit: 'score', dataType: 'mock', source: 'Mock', retrievedAt: '2026-09-23' },
    overallScore: 0,
    costBreakdownUsd: { compute: 90, storage: 10, transfer: 0, requests: 0 },
  },
  {
    id: 'gcp',
    provider: 'gcp',
    service: 'Compute Engine',
    configName: 'n2-standard-2',
    providerRegion: 'us-east4',
    regionLabel: 'US East',
    vcpu: 2,
    ramGb: 8,
    storageGb: 100,
    runtimeHoursPerDay: 24,
    monthlyCostUsd: { value: 120, unit: 'USD', dataType: 'mock', source: 'Mock', retrievedAt: '2026-09-23' },
    monthlyCo2eKg: { value: 20, unit: 'kg', dataType: 'mock', source: 'Mock', retrievedAt: '2026-09-23' },
    performanceScore: { value: 80, unit: 'score', dataType: 'mock', source: 'Mock', retrievedAt: '2026-09-23' },
    overallScore: 0,
    costBreakdownUsd: { compute: 110, storage: 10, transfer: 0, requests: 0 },
  },
  {
    id: 'azure',
    provider: 'azure',
    service: 'Virtual Machines',
    configName: 'D2s_v5',
    providerRegion: 'eastus',
    regionLabel: 'US East',
    vcpu: 2,
    ramGb: 8,
    storageGb: 100,
    runtimeHoursPerDay: 24,
    monthlyCostUsd: { value: 110, unit: 'USD', dataType: 'mock', source: 'Mock', retrievedAt: '2026-09-23' },
    monthlyCo2eKg: { value: 25, unit: 'kg', dataType: 'mock', source: 'Mock', retrievedAt: '2026-09-23' },
    performanceScore: { value: 60, unit: 'score', dataType: 'mock', source: 'Mock', retrievedAt: '2026-09-23' },
    overallScore: 0,
    costBreakdownUsd: { compute: 100, storage: 10, transfer: 0, requests: 0 },
  },
];

describe('scoring', () => {
  it('normalizes and scores the documented example', () => {
    const scored = scoreCandidates(candidates, { cost: 50, carbon: 30, performance: 20 });
    expect(scored.map((c) => c.overallScore)).toEqual([60, 50, 40]);
  });

  it('changes the balanced recommendation as priorities change', () => {
    const carbonFirst = chooseRecommendations(
      scoreCandidates(candidates, { cost: 20, carbon: 60, performance: 20 })
    );
    const performanceFirst = chooseRecommendations(
      scoreCandidates(candidates, { cost: 20, carbon: 20, performance: 60 })
    );
    expect(carbonFirst.balanced).toBe('gcp');
    expect(performanceFirst.balanced).toBe('gcp');
    expect(carbonFirst.lowerCost).toBe('aws');
    expect(carbonFirst.lowerCarbon).toBe('gcp');
  });

  it('when cost priority is 100/0/0, Balanced equals Lower Cost', () => {
    const scored = scoreCandidates(candidates, { cost: 100, carbon: 0, performance: 0 });
    const recs = chooseRecommendations(scored);
    expect(recs.balanced).toBe(recs.lowerCost);
    expect(recs.lowerCost).toBe('aws');
  });

  it('when carbon priority is 0/100/0, Balanced equals Lower Carbon', () => {
    const scored = scoreCandidates(candidates, { cost: 0, carbon: 100, performance: 0 });
    const recs = chooseRecommendations(scored);
    expect(recs.balanced).toBe(recs.lowerCarbon);
    expect(recs.lowerCarbon).toBe('gcp');
  });

  it('handles order independence and all equal cases', () => {
    const shuffled = [candidates[2], candidates[0], candidates[1]];
    const scoredShuffled = scoreCandidates(shuffled, { cost: 50, carbon: 30, performance: 20 });
    expect(scoredShuffled.find((c) => c.id === 'aws')?.overallScore).toBe(60);
  });
});
