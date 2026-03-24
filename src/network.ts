interface ErrorRecord
{
  [key: string]: unknown;
}

export interface GitHubErrorSummary
{
  message: string;
  status?: number;
  code?: string;
  requestId?: string;
  retryable: boolean;
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([
  'ABORT_ERR',
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'UND_ERR_ABORTED',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
]);

function isRecord(value: unknown): value is ErrorRecord
{
  return !!value && typeof value === 'object';
}

function readString(source: ErrorRecord, key: string): string | undefined
{
  const value = source[key];
  return typeof value === 'string' ? value : undefined;
}

function readNumber(source: ErrorRecord, key: string): number | undefined
{
  const value = source[key];
  return typeof value === 'number' ? value : undefined;
}

function readRecord(source: ErrorRecord, key: string): ErrorRecord | undefined
{
  const value = source[key];
  return isRecord(value) ? value : undefined;
}

function getCauseRecord(error: unknown): ErrorRecord | undefined
{
  if (!isRecord(error)) return undefined;
  return readRecord(error, 'cause');
}

function getStatus(error: unknown): number | undefined
{
  if (!isRecord(error)) return undefined;
  return readNumber(error, 'status');
}

function getCode(error: unknown): string | undefined
{
  if (!isRecord(error)) return undefined;
  const code = readString(error, 'code');
  if (code) return code;
  const cause = getCauseRecord(error);
  return cause ? readString(cause, 'code') : undefined;
}

function getMessage(error: unknown): string
{
  if (error instanceof Error)
  {
    if (error.message) return error.message;
    const cause = getCauseRecord(error);
    if (cause)
    {
      const causeMessage = readString(cause, 'message');
      if (causeMessage) return causeMessage;
    }
    return error.name || '未知错误';
  }
  if (typeof error === 'string') return error;
  if (isRecord(error))
  {
    const message = readString(error, 'message');
    if (message) return message;
  }
  return '未知错误';
}

function getRequestId(error: unknown): string | undefined
{
  if (!isRecord(error)) return undefined;
  const response = readRecord(error, 'response');
  if (!response) return undefined;
  const headers = readRecord(response, 'headers');
  if (!headers) return undefined;
  const requestId = headers['x-github-request-id'];
  return typeof requestId === 'string' ? requestId : undefined;
}

export function summarizeGitHubError(error: unknown): GitHubErrorSummary
{
  const status = getStatus(error);
  const code = getCode(error);
  const requestId = getRequestId(error);
  const message = getMessage(error);
  const retryable = !!(
    (status && RETRYABLE_STATUS_CODES.has(status))
    || (code && RETRYABLE_ERROR_CODES.has(code))
  );

  return {
    message,
    status,
    code,
    requestId,
    retryable,
  };
}

export function isRetryableGitHubError(error: unknown): boolean
{
  return summarizeGitHubError(error).retryable;
}

export function formatGitHubError(error: unknown): string
{
  const summary = summarizeGitHubError(error);
  const segments = [summary.message];

  if (summary.code) segments.push(`code=${summary.code}`);
  if (summary.status) segments.push(`status=${summary.status}`);
  if (summary.requestId) segments.push(`requestId=${summary.requestId}`);

  return segments.join(', ');
}
