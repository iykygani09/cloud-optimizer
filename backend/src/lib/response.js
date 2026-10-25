export function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Client-Id,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
        },
        body: JSON.stringify(body),
    };
}
export function noContentResponse() {
    return {
        statusCode: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Client-Id,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
        },
    };
}
export function errorResponse(statusCode, code, message, details) {
    const payload = {
        error: {
            code,
            message,
            ...(details ? { details } : {}),
        },
    };
    return jsonResponse(statusCode, payload);
}
