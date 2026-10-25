import fs from 'node:fs';
import path from 'node:path';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  generateCandidates,
  type AnalysisResult,
  type DatasetSnapshot,
  type Priorities,
  type WorkloadInput,
} from 'shared';
import { routeRequest } from './handlers/router.js';
import { DynamoHistoryRepository } from './repository/DynamoHistoryRepository.js';
import { InMemoryHistoryRepository, type HistoryRepository } from './repository/HistoryRepository.js';

let repoInstance: HistoryRepository;
let datasetCache: DatasetSnapshot | null = null;

function getRepository(): HistoryRepository {
  if (!repoInstance) {
    const tableName = process.env.TABLE_NAME;
    if (tableName && process.env.AWS_EXECUTION_ENV) {
      repoInstance = new DynamoHistoryRepository(tableName);
    } else {
      repoInstance = new InMemoryHistoryRepository();
    }
  }
  return repoInstance;
}

export function getDatasetSnapshot(): DatasetSnapshot {
  if (!datasetCache) {
    const candidatePaths = [
      process.env.DATASET_PATH ? path.resolve(process.env.DATASET_PATH) : null,
      path.resolve(process.cwd(), 'data/snapshot/dataset.json'),
      path.resolve(process.cwd(), '../data/snapshot/dataset.json'),
    ].filter(Boolean) as string[];

    const datasetPath = candidatePaths.find((p) => fs.existsSync(p));

    if (datasetPath) {
      datasetCache = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
    } else {
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
  return datasetCache!;
}

export function snapshotAnalyzeEngine(
  input: WorkloadInput,
  priorities: Priorities,
  id = `analysis-${Date.now()}`
): AnalysisResult {
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

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const repo = getRepository();
  return routeRequest(event, repo, snapshotAnalyzeEngine);
}
