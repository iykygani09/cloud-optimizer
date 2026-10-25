import { describe, expect, it } from 'vitest';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { routeRequest } from '../src/handlers/router.js';
import { InMemoryHistoryRepository } from '../src/repository/HistoryRepository.js';
import { snapshotAnalyzeEngine } from '../src/index.js';

function makeEvent(
  method: string,
  path: string,
  body?: unknown,
  clientId = 'test-client-123'
): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: `${method} ${path}`,
    rawPath: path,
    rawQueryString: '',
    headers: {
      'content-type': 'application/json',
      'x-client-id': clientId,
    },
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'test.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'test',
      http: {
        method,
        path,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'vitest',
      },
      requestId: 'req-123',
      routeKey: `${method} ${path}`,
      stage: '$default',
      time: '23/Sep/2026:18:00:00 +0000',
      timeEpoch: 1790186400000,
    },
    body: body ? JSON.stringify(body) : undefined,
    isBase64Encoded: false,
  };
}

describe('Backend API Router Handlers', () => {
  const repo = new InMemoryHistoryRepository();

  it('handles GET /meta', async () => {
    const event = makeEvent('GET', '/meta');
    const resp = await routeRequest(event, repo, snapshotAnalyzeEngine);
    expect(resp.statusCode).toBe(200);

    const body = JSON.parse(resp.body as string);
    expect(body.datasetVersion).toBeDefined();
    expect(body.regionGroups).toHaveLength(4);
    expect(body.workloadTypes).toHaveLength(5);
  });

  it('handles POST /analyses with valid payload', async () => {
    const payload = {
      input: {
        workloadType: 'web_app',
        cpuCores: 4,
        ramGb: 16,
        storageGb: 100,
        runtimeHoursPerDay: 8,
        dataTransferGbPerDay: 20,
        requestsPerDay: 0,
        regionGroup: 'india',
        performanceRequirement: 'standard',
      },
      priorities: { cost: 50, carbon: 30, performance: 20 },
    };

    const event = makeEvent('POST', '/analyses', payload);
    const resp = await routeRequest(event, repo, snapshotAnalyzeEngine);
    expect(resp.statusCode).toBe(201);

    const result = JSON.parse(resp.body as string);
    expect(result.id).toBeDefined();
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.recommendations.lowerCost).toBeDefined();
  });

  it('rejects POST /analyses when priorities do not sum to 100', async () => {
    const payload = {
      input: {
        workloadType: 'web_app',
        cpuCores: 4,
        ramGb: 16,
        storageGb: 100,
        runtimeHoursPerDay: 8,
        dataTransferGbPerDay: 20,
        requestsPerDay: 0,
        regionGroup: 'india',
        performanceRequirement: 'standard',
      },
      priorities: { cost: 50, carbon: 50, performance: 50 }, // Sum = 150
    };

    const event = makeEvent('POST', '/analyses', payload);
    const resp = await routeRequest(event, repo, snapshotAnalyzeEngine);
    expect(resp.statusCode).toBe(400);

    const body = JSON.parse(resp.body as string);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('handles GET /analyses and GET /analyses/{id}', async () => {
    // 1. Submit analysis
    const payload = {
      input: {
        workloadType: 'api',
        cpuCores: 2,
        ramGb: 8,
        storageGb: 50,
        runtimeHoursPerDay: 24,
        dataTransferGbPerDay: 10,
        requestsPerDay: 1000,
        regionGroup: 'us_east',
        performanceRequirement: 'standard',
      },
      priorities: { cost: 40, carbon: 40, performance: 20 },
    };

    const postEvent = makeEvent('POST', '/analyses', payload, 'client-456');
    const postResp = await routeRequest(postEvent, repo, snapshotAnalyzeEngine);
    const created = JSON.parse(postResp.body as string);

    // 2. List summaries
    const listEvent = makeEvent('GET', '/analyses', undefined, 'client-456');
    const listResp = await routeRequest(listEvent, repo, snapshotAnalyzeEngine);
    expect(listResp.statusCode).toBe(200);

    const summaries = JSON.parse(listResp.body as string);
    expect(summaries.length).toBeGreaterThan(0);

    // 3. Get by ID
    const getEvent = makeEvent('GET', `/analyses/${created.id}`, undefined, 'client-456');
    const getResp = await routeRequest(getEvent, repo, snapshotAnalyzeEngine);
    expect(getResp.statusCode).toBe(200);

    const fetched = JSON.parse(getResp.body as string);
    expect(fetched.id).toBe(created.id);
  });

  it('handles DELETE /analyses/{id}', async () => {
    const payload = {
      input: {
        workloadType: 'other',
        cpuCores: 1,
        ramGb: 2,
        storageGb: 20,
        runtimeHoursPerDay: 1,
        dataTransferGbPerDay: 0,
        requestsPerDay: 0,
        regionGroup: 'europe_west',
        performanceRequirement: 'low',
      },
      priorities: { cost: 34, carbon: 33, performance: 33 },
    };

    const postEvent = makeEvent('POST', '/analyses', payload, 'client-789');
    const postResp = await routeRequest(postEvent, repo, snapshotAnalyzeEngine);
    const created = JSON.parse(postResp.body as string);

    const deleteEvent = makeEvent('DELETE', `/analyses/${created.id}`, undefined, 'client-789');
    const deleteResp = await routeRequest(deleteEvent, repo, snapshotAnalyzeEngine);
    expect(deleteResp.statusCode).toBe(204);

    const getEvent = makeEvent('GET', `/analyses/${created.id}`, undefined, 'client-789');
    const getResp = await routeRequest(getEvent, repo, snapshotAnalyzeEngine);
    expect(getResp.statusCode).toBe(404);
  });
});
