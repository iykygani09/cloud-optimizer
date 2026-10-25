import http from 'node:http';
import { URL } from 'node:url';
import { routeRequest } from './handlers/router.js';
import { InMemoryHistoryRepository } from './repository/HistoryRepository.js';
import { snapshotAnalyzeEngine } from './index.js';
const PORT = parseInt(process.env.PORT || '3000', 10);
const repo = new InMemoryHistoryRepository();
const server = http.createServer(async (req, res) => {
    const method = req.method?.toUpperCase() || 'GET';
    const fullUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost:3000'}`);
    // Read body if POST/PUT/PATCH
    let body = '';
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        body = Buffer.concat(chunks).toString('utf-8');
    }
    // Convert HTTP headers into Record<string, string>
    const headers = {};
    for (const [key, val] of Object.entries(req.headers)) {
        if (val !== undefined) {
            headers[key.toLowerCase()] = Array.isArray(val) ? val.join(', ') : val;
        }
    }
    const event = {
        version: '2.0',
        routeKey: `${method} ${fullUrl.pathname}`,
        rawPath: fullUrl.pathname,
        rawQueryString: fullUrl.search ? fullUrl.search.slice(1) : '',
        headers,
        requestContext: {
            accountId: '123456789012',
            apiId: 'local-dev-api',
            domainName: 'localhost',
            domainPrefix: 'localhost',
            http: {
                method,
                path: fullUrl.pathname,
                protocol: 'HTTP/1.1',
                sourceIp: req.socket.remoteAddress || '127.0.0.1',
                userAgent: req.headers['user-agent'] || 'local-dev',
            },
            requestId: `req-${Date.now()}`,
            routeKey: `${method} ${fullUrl.pathname}`,
            stage: '$default',
            time: new Date().toISOString(),
            timeEpoch: Date.now(),
        },
        body: body || undefined,
        isBase64Encoded: false,
    };
    try {
        const result = await routeRequest(event, repo, snapshotAnalyzeEngine);
        if (typeof result === 'string') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(result);
            return;
        }
        const statusCode = result.statusCode || 200;
        const responseHeaders = (result.headers || {});
        res.writeHead(statusCode, responseHeaders);
        if (result.body) {
            res.end(result.body);
        }
        else {
            res.end();
        }
    }
    catch (err) {
        console.error('Dev Server Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: { code: 'INTERNAL', message: err?.message || 'Server error' } }));
    }
});
server.listen(PORT, () => {
    console.log(`🚀 Cloud Optimizer Backend Dev Server running at http://localhost:${PORT}`);
});
