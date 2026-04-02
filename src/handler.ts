import { getImageContentType } from './content';
import { defaultDependencies } from './dependencies';
import { HttpError } from './errors';
import { textResponse, withSecurityHeaders } from './responses';
import type { Env, HandlerDependencies } from './types';
import { fetchWithValidatedRedirects, readBodyWithByteLimit } from './upstream';
import { hasRequestedTransform, parseResizeParam, validateTargetUrl } from './validation';

export const handleRequest = async function (
  request: Request,
  env: Env,
  dependencies: HandlerDependencies = defaultDependencies,
) {
  if (request.method !== 'GET') return textResponse(405, 'Method not allowed');

  const requestUrl = new URL(request.url);
  if (requestUrl.pathname === '/') return textResponse(404, 'Not found');
  if (requestUrl.pathname.length <= 1) return textResponse(400, 'Missing URL');

  const targetUrlString = (requestUrl.pathname + requestUrl.search).substring(1);

  let targetUrl: URL;
  try {
    targetUrl = new URL(targetUrlString);
  } catch {
    return textResponse(400, 'Invalid URL');
  }

  try {
    validateTargetUrl(targetUrl, env);

    const width = parseResizeParam('w', requestUrl.searchParams.get('w'), env);
    const height = parseResizeParam('h', requestUrl.searchParams.get('h'), env);

    const upstreamResponse = await fetchWithValidatedRedirects(targetUrl, env, dependencies.fetch);
    if (!upstreamResponse.ok) {
      return textResponse(upstreamResponse.status, upstreamResponse.statusText || 'Upstream request failed');
    }

    const upstreamContentType = upstreamResponse.headers.get('content-type');
    const imageContentType = getImageContentType(upstreamContentType);
    if (!imageContentType) {
      return textResponse(415, 'Upstream response is not an image');
    }

    const body = await readBodyWithByteLimit(upstreamResponse, env.CONFIG.MAX_IMAGE_BYTES);
    if (!hasRequestedTransform(width, height)) {
      return new Response(body, {
        status: 200,
        headers: withSecurityHeaders({ 'content-type': upstreamContentType ?? imageContentType }),
      });
    }

    let image: ReturnType<HandlerDependencies['decodeImage']>;
    try {
      image = dependencies.decodeImage(body);
    } catch {
      return textResponse(502, 'Image decode failed');
    }

    if (image.width * image.height > env.CONFIG.MAX_IMAGE_PIXELS) {
      return textResponse(413, 'Decoded image exceeds pixel limit');
    }

    let transformedImage: typeof image;
    try {
      transformedImage = image.resize({ width, height });
    } catch {
      return textResponse(502, 'Image transform failed');
    }

    try {
      const encodedImage = dependencies.encodeImage(transformedImage, imageContentType);

      return new Response(encodedImage.body, {
        status: 200,
        headers: withSecurityHeaders({ 'content-type': encodedImage.contentType }),
      });
    } catch {
      return textResponse(502, 'Image transform failed');
    }
  } catch (error) {
    if (error instanceof HttpError) {
      return textResponse(error.status, error.message);
    }

    return textResponse(502, 'Bad gateway');
  }
};
