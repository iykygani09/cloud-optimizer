import fs from 'node:fs';
import path from 'node:path';
import { generateCandidates, } from 'shared';
import { routeRequest } from './handlers/router.js';
import { DynamoHistoryRepository } from './repository/DynamoHistoryRepository.js';
import { InMemoryHistoryRepository } from './repository/HistoryRepository.js';
let repoInstance;
let datasetCache = null;
function getRepository() {
    if (!repoInstance) {
        const tableName = process.env.TABLE_NAME;
        if (tableName && process.env.AWS_EXECUTION_ENV) {
            repoInstance = new DynamoHistoryRepository(tableName);
        }
        else {
            repoInstance = new InMemoryHistoryRepository();
        }
    }
    return repoInstance;
}
export function getDatasetSnapshot() {
    if (!datasetCache) {
        const candidatePaths = [
            process.env.DATASET_PATH ? path.resolve(process.env.DATASET_PATH) : null,
            path.resolve(process.cwd(), 'data/snapshot/dataset.json'),
            path.resolve(process.cwd(), '../data/snapshot/dataset.json'),
        ].filter(Boolean);
        const datasetPath = candidatePaths.find((p) => fs.existsSync(p));
        if (datasetPath) {
            datasetCache = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
        }
        else {
            // Fallback empty snapshot
            datasetCache = {
                datasetVersion: '2026-09-23-fallback',
                builtAt: new Date().toISOString(),
                instances: [],
                prices: [],
                assumptions: {},
                coefficients: { pue: {}, power: {} },
                gridIntensity: {},
                benchmarks: {},
            };
        }
    }
    return datasetCache;
}
export function snapshotAnalyzeEngine(input, priorities, id = `analysis-${Date.now()}`) {
    const dataset = getDatasetSnapshot();
    const genResult = generateCandidates(input, priorities, dataset);
    return {
        id,
        createdAt: new Date().toISOString(),
        dataMode: 'live',
        datasetVersion: dataset.datasetVersion,
        input,
        priorities,
        candidates: genResult.candidates,
        providerBest: genResult.providerBest,
        recommendations: genResult.recommendations,
        warnings: genResult.warnings,
    };
}
export async function handler(event) {
    const repo = getRepository();
    return routeRequest(event, repo, snapshotAnalyzeEngine);
}
