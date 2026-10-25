export class InMemoryHistoryRepository {
    store = new Map();
    async save(clientId, analysis) {
        const list = this.store.get(clientId) || [];
        const summary = {
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
    async listSummaries(clientId, limit = 50) {
        const list = this.store.get(clientId) || [];
        return list.slice(0, limit).map((item) => item.summary);
    }
    async getById(clientId, id) {
        const list = this.store.get(clientId) || [];
        const found = list.find((item) => item.result.id === id);
        return found ? found.result : null;
    }
    async deleteById(clientId, id) {
        const list = this.store.get(clientId) || [];
        const initialLength = list.length;
        const filtered = list.filter((item) => item.result.id !== id);
        this.store.set(clientId, filtered);
        return filtered.length < initialLength;
    }
    toRecSummary(candidateId, analysis) {
        const cand = analysis.candidates.find((c) => c.id === candidateId);
        return {
            candidateId: candidateId || '',
            provider: cand ? cand.provider : 'aws',
            configName: cand ? cand.configName || cand.service : '',
            monthlyCostUsd: cand ? cand.monthlyCostUsd.value : 0,
            monthlyCo2eKg: cand ? cand.monthlyCo2eKg.value : 0,
        };
    }
}
