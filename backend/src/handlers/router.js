import { CreateAnalysisSchema } from 'shared';
import { errorResponse, jsonResponse, noContentResponse } from '../lib/response.js';
export const metaData = {
    datasetVersion: '2026-09-23',
    retrievedAt: new Date().toISOString(),
    regionGroups: [
        { id: 'india', label: 'India (Mumbai / Pune)' },
        { id: 'us_east', label: 'US East (N. Virginia)' },
        { id: 'europe_west', label: 'Western Europe (Ireland / Belgium / Netherlands)' },
        { id: 'southeast_asia', label: 'Southeast Asia (Singapore)' },
    ],
    workloadTypes: [
        { id: 'web_app', label: 'Web Application', utilization: 0.4, families: ['general', 'compute'] },
        { id: 'api', label: 'API / Microservices', utilization: 0.4, families: ['general', 'compute'] },
        { id: 'data_processing', label: 'Data Processing / Batch', utilization: 0.7, families: ['general', 'compute', 'memory'] },
        { id: 'machine_learning', label: 'Machine Learning (CPU)', utilization: 0.7, families: ['general', 'compute', 'memory'] },
        { id: 'other', label: 'Other', utilization: 0.5, families: ['general', 'compute', 'memory'] },
    ],
    assumptions: {
        daysPerMonth: { value: 30, unit: 'days', dataType: 'estimated', source: 'PRD Section 8.1', retrievedAt: '2026-09-23', methodology: 'Standard 30-day billing month' },
        pricingModel: { value: 0, unit: 'on-demand', dataType: 'official', source: 'Provider Pricing Pages', retrievedAt: '2026-09-23', methodology: 'On-demand list pricing' },
        carbonMethod: { value: 0, unit: 'location-based', dataType: 'estimated', source: 'Cloud Carbon Footprint Methodology', retrievedAt: '2026-09-23', methodology: 'Grid emissions intensity × PUE × hardware power' },
    },
    sources: [
        { id: 'aws-price-list', name: 'AWS Price List', url: 'https://aws.amazon.com/pricing/', type: 'official', retrievedAt: '2026-09-23' },
        { id: 'azure-retail-prices', name: 'Azure Retail Prices API', url: 'https://azure.microsoft.com/en-us/pricing/', type: 'official', retrievedAt: '2026-09-23' },
        { id: 'gcp-billing-catalog', name: 'Google Cloud Billing Catalog API', url: 'https://cloud.google.com/billing/docs/resources/api', type: 'official', retrievedAt: '2026-09-23' },
        { id: 'ccf-coefficients', name: 'Cloud Carbon Footprint Coefficients', url: 'https://www.cloudcarbonfootprint.org/docs/coefficients-pipeline', type: 'estimated', retrievedAt: '2026-09-23' },
    ],
};
export async function routeRequest(event, repo, analyzeEngine) {
    const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
    const path = event.rawPath || event.path || '/';
    // Handle CORS preflight OPTIONS
    if (method === 'OPTIONS') {
        return noContentResponse();
    }
    const clientId = event.headers['x-client-id'] || event.headers['X-Client-Id'] || 'anonymous-client';
    // Route 1: GET /meta
    if (method === 'GET' && path === '/meta') {
        return jsonResponse(200, metaData);
    }
    // Route 2: POST /analyses
    if (method === 'POST' && path === '/analyses') {
        if (!event.body) {
            return errorResponse(400, 'VALIDATION_ERROR', 'Request body is required');
        }
        let parsedBody;
        try {
            parsedBody = JSON.parse(event.body);
        }
        catch {
            return errorResponse(400, 'VALIDATION_ERROR', 'Invalid JSON body');
        }
        const valResult = CreateAnalysisSchema.safeParse(parsedBody);
        if (!valResult.success) {
            return errorResponse(400, 'VALIDATION_ERROR', 'Validation failed for analysis request', valResult.error.errors);
        }
        const { input, priorities } = valResult.data;
        let result;
        if (analyzeEngine) {
            try {
                result = analyzeEngine(input, priorities);
            }
            catch (err) {
                console.error('Engine error:', err);
                return errorResponse(500, 'INTERNAL', err?.message || 'Recommendation engine calculation failed');
            }
        }
        else {
            return errorResponse(500, 'INTERNAL', 'Recommendation engine is not initialized');
        }
        await repo.save(clientId, result);
        return jsonResponse(201, result);
    }
    // Route 3: GET /analyses
    if (method === 'GET' && path === '/analyses') {
        const summaries = await repo.listSummaries(clientId, 50);
        return jsonResponse(200, summaries);
    }
    // Route 4: GET /analyses/{id}
    const getByIdMatch = path.match(/^\/analyses\/([a-zA-Z0-9_-]+)$/);
    if (method === 'GET' && getByIdMatch) {
        const id = getByIdMatch[1];
        const analysis = await repo.getById(clientId, id);
        if (!analysis) {
            return errorResponse(404, 'NOT_FOUND', `Analysis with ID '${id}' was not found`);
        }
        return jsonResponse(200, analysis);
    }
    // Route 5: DELETE /analyses/{id}
    if (method === 'DELETE' && getByIdMatch) {
        const id = getByIdMatch[1];
        const deleted = await repo.deleteById(clientId, id);
        if (!deleted) {
            return errorResponse(404, 'NOT_FOUND', `Analysis with ID '${id}' was not found`);
        }
        return noContentResponse();
    }
    return errorResponse(404, 'NOT_FOUND', `Route ${method} ${path} not found`);
}
