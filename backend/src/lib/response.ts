export interface ApiErrorPayload {
  error: {
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'NO_CANDIDATES' | 'INTERNAL';
    message: string;
    details?: unknown[];
  };
}

export function jsonResponse(statusCode: number, body: unknown) {
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

export function errorResponse(
  statusCode: number,
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'NO_CANDIDATES' | 'INTERNAL',
  message: string,
  details?: unknown[]
) {
  const payload: ApiErrorPayload = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return jsonResponse(statusCode, payload);
}
