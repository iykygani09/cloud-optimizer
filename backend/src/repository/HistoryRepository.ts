import type { AnalysisResult, AnalysisSummary } from 'shared';

export interface HistoryRepository {
  save(clientId: string, analysis: AnalysisResult): Promise<void>;
  listSummaries(clientId: string, limit?: number): Promise<AnalysisSummary[]>;
  getById(clientId: string, id: string): Promise<AnalysisResult | null>;
  deleteById(clientId: string, id: string): Promise<boolean>;
}

export class InMemoryHistoryRepository implements HistoryRepository {
  private store: Map<string, { summary: AnalysisSummary; result: AnalysisResult }[]> = new Map();

  async save(clientId: string, analysis: AnalysisResult): Promise<void> {
    const list = this.store.get(clientId) || [];
    const summary: AnalysisSummary = {
      id: analysis.id,
      createdAt: analysis.createdAt,
      input: analysis.input,
      priorities: analysis.priorities,
      recommendations: {
        lowerCost: this.toRecSummary(analysis.recommendations.lowerCost, analysis),
        lowerCarbon: this.toRecSummary(analysis.recommendations.lowerCarbon, analysis),
        balanced: this.toRecSummary(analysis.recommendations.balanced, analysis),
      },
    };

    // Prepend to list
    const filtered = list.filter((item) => item.result.id !== analysis.id);
    this.store.set(clientId, [{ summary, result: analysis }, ...filtered]);
  }

  async listSummaries(clientId: string, limit = 50): Promise<AnalysisSummary[]> {
    const list = this.store.get(clientId) || [];
    return list.slice(0, limit).map((item) => item.summary);
  }

  async getById(clientId: string, id: string): Promise<AnalysisResult | null> {
    const list = this.store.get(clientId) || [];
    const found = list.find((item) => item.result.id === id);
    return found ? found.result : null;
  }

  async deleteById(clientId: string, id: string): Promise<boolean> {
    const list = this.store.get(clientId) || [];
    const initialLength = list.length;
    const filtered = list.filter((item) => item.result.id !== id);
    this.store.set(clientId, filtered);
    return filtered.length < initialLength;
  }

  private toRecSummary(candidateId: string, analysis: AnalysisResult) {
    const cand = analysis.candidates.find((c) => c.id === candidateId);
    return {
      candidateId: candidateId || '',
      provider: cand ? cand.provider : ('aws' as const),
      configName: cand ? cand.configName || cand.service : '',
      monthlyCostUsd: cand ? cand.monthlyCostUsd.value : 0,
      monthlyCo2eKg: cand ? cand.monthlyCo2eKg.value : 0,
    };
  }
}
