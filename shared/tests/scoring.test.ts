import { describe, expect, it } from 'vitest';
import { chooseRecommendations, norm, scoreCandidates } from '../src/scoring.js';
import type { CandidateConfig } from '../src/types.js';

const candidatesFixture: CandidateConfig[] = [
  {
    id: 'A',
    provider: 'aws',
    service: 'EC2',
    configName: 'm5.large',
    providerRegion: 'us-east-1',
    regionLabel: 'US East',
    vcpu: 2,
    ramGb: 8,
    storageGb: 100,
    runtimeHoursPerDay: 24,
    monthlyCostUsd: { value: 100, unit: 'USD', dataType: 'mock', source: 'test', retrievedAt: '2026-09-23' },
    monthlyCo2eKg: { value: 30, unit: 'kg', dataType: 'mock', source: 'test', retrievedAt: '2026-09-23' },
    performanceScore: { value: 70, unit: 'score', dataType: 'mock', source: 'test', retrievedAt: '2026-09-23' },
    overallScore: 0,
    costBreakdownUsd: { compute: 90, storage: 10, transfer: 0, requests: 0 },
  },
  {
    id: 'B',
    provider: 'gcp',
    service: 'Compute Engine',
    configName: 'n2-standard-2',
    providerRegion: 'us-east4',
    regionLabel: 'US East',
    vcpu: 2,
    ramGb: 8,
    storageGb: 100,
    runtimeHoursPerDay: 24,
    monthlyCostUsd: { value: 120, unit: 'USD', dataType: 'mock', source: 'test', retrievedAt: '2026-09-23' },
    monthlyCo2eKg: { value: 20, unit: 'kg', dataType: 'mock', source: 'test', retrievedAt: '2026-09-23' },
    performanceScore: { value: 80, unit: 'score', dataType: 'mock', source: 'test', retrievedAt: '2026-09-23' },
    overallScore: 0,
    costBreakdownUsd: { compute: 110, storage: 10, transfer: 0, requests: 0 },
  },
  {
    id: 'C',
    provider: 'azure',
    service: 'Virtual Machines',
    configName: 'D2s_v5',
    providerRegion: 'eastus',
    regionLabel: 'US East',
    vcpu: 2,
    ramGb: 8,
    storageGb: 100,
    runtimeHoursPerDay: 24,
    monthlyCostUsd: { value: 110, unit: 'USD', dataType: 'mock', source: 'test', retrievedAt: '2026-09-23' },
    monthlyCo2eKg: { value: 25, unit: 'kg', dataType: 'mock', source: 'test', retrievedAt: '2026-09-23' },
    performanceScore: { value: 60, unit: 'score', dataType: 'mock', source: 'test', retrievedAt: '2026-09-23' },
    overallScore: 0,
    costBreakdownUsd: { compute: 100, storage: 10, transfer: 0, requests: 0 },
  },
];

describe('scoring engine pure function', () => {
  it('correctly calculates min-max normalization', () => {
    expect(norm(10, 10, 20)).toBe(0);
    expect(norm(20, 10, 20)).toBe(1);
    expect(norm(15, 10, 20)).toBe(0.5);
    expect(norm(15, 15, 15)).toBe(0);
  });

  it('matches Section 9 worked example (scores 60, 50, 40)', () => {
    const scored = scoreCandidates(candidatesFixture, { cost: 50, carbon: 30, performance: 20 });
    const scores = scored.map((c) => c.overallScore);
    expect(scores).toEqual([60, 50, 40]);

    const recs = chooseRecommendations(scored);
    expect(recs.lowerCost).toBe('A');
    expect(recs.lowerCarbon).toBe('B');
    expect(recs.balanced).toBe('A');
  });

  it('when cost priority is 100/0/0, Balanced equals Lower Cost', () => {
    const scored = scoreCandidates(candidatesFixture, { cost: 100, carbon: 0, performance: 0 });
    const recs = chooseRecommendations(scored);
    expect(recs.balanced).toBe(recs.lowerCost);
    expect(recs.lowerCost).toBe('A');
  });

  it('when carbon priority is 0/100/0, Balanced equals Lower Carbon', () => {
    const scored = scoreCandidates(candidatesFixture, { cost: 0, carbon: 100, performance: 0 });
    const recs = chooseRecommendations(scored);
    expect(recs.balanced).toBe(recs.lowerCarbon);
    expect(recs.lowerCarbon).toBe('B');
  });

  it('handles order independence of candidate input array', () => {
    const shuffled = [candidatesFixture[2], candidatesFixture[0], candidatesFixture[1]];
    const scoredShuffled = scoreCandidates(shuffled, { cost: 50, carbon: 30, performance: 20 });
    
    const candidateA = scoredShuffled.find((c) => c.id === 'A')!;
    const candidateB = scoredShuffled.find((c) => c.id === 'B')!;
    const candidateC = scoredShuffled.find((c) => c.id === 'C')!;

    expect(candidateA.overallScore).toBe(60);
    expect(candidateB.overallScore).toBe(50);
    expect(candidateC.overallScore).toBe(40);
  });

  it('handles all equal metrics gracefully without crashing', () => {
    const equalCandidates: CandidateConfig[] = candidatesFixture.map((c) => ({
      ...c,
      monthlyCostUsd: { ...c.monthlyCostUsd, value: 100 },
      monthlyCo2eKg: { ...c.monthlyCo2eKg, value: 20 },
      performanceScore: { ...c.performanceScore, value: 80 },
    }));

    const scored = scoreCandidates(equalCandidates, { cost: 40, carbon: 40, performance: 20 });
    scored.forEach((c) => {
      expect(c.overallScore).toBeDefined();
      expect(typeof c.overallScore).toBe('number');
    });
  });
});
