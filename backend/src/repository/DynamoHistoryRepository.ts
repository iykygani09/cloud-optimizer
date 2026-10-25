import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import type { AnalysisResult, AnalysisSummary } from 'shared';
import type { HistoryRepository } from './HistoryRepository.js';

export class DynamoHistoryRepository implements HistoryRepository {
  private docClient: DynamoDBDocumentClient;

  constructor(
    private tableName: string,
    client?: DynamoDBClient
  ) {
    const dbClient = client || new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(dbClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  async save(clientId: string, analysis: AnalysisResult): Promise<void> {
    const pk = `CLIENT#${clientId}`;
    const sk = `ANALYSIS#${analysis.createdAt}#${analysis.id}`;
    const ttl = Math.floor(Date.now() / 1000) + 90 * 24 * 3600; // 90 days

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

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: pk,
          SK: sk,
          id: analysis.id,
          summary,
          result: analysis,
          ttl,
        },
      })
    );
  }

  async listSummaries(clientId: string, limit = 50): Promise<AnalysisSummary[]> {
    const pk = `CLIENT#${clientId}`;
    const response = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': pk,
        },
        ScanIndexForward: false, // Descending order
        Limit: limit,
      })
    );

    return (response.Items || []).map((item) => item.summary as AnalysisSummary);
  }

  async getById(clientId: string, id: string): Promise<AnalysisResult | null> {
    const pk = `CLIENT#${clientId}`;
    const response = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':pk': pk,
          ':id': id,
        },
      })
    );

    if (response.Items && response.Items.length > 0) {
      return response.Items[0].result as AnalysisResult;
    }
    return null;
  }

  async deleteById(clientId: string, id: string): Promise<boolean> {
    const pk = `CLIENT#${clientId}`;
    const queryResp = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':pk': pk,
          ':id': id,
        },
      })
    );

    if (!queryResp.Items || queryResp.Items.length === 0) {
      return false;
    }

    const item = queryResp.Items[0];
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
      })
    );
    return true;
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
