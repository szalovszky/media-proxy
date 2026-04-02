export const withSecurityHeaders = function (headers?: HeadersInit, cacheable = true) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('X-Content-Type-Options', 'nosniff');

  if (!cacheable) {
    responseHeaders.set('Cache-Control', 'no-store');
  }

  return responseHeaders;
};

export const textResponse = function (status: number, message: string, cacheable = false) {
  return new Response(message, {
    status,
    headers: withSecurityHeaders({ 'content-type': 'text/plain; charset=utf-8' }, cacheable),
  });
};
