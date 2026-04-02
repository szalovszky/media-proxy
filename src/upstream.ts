import { HttpError } from './errors';
import type { Env, FetchLike } from './types';
import { validateTargetUrl } from './validation';

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

const concatChunks = function (chunks: Uint8Array[], totalLength: number) {
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return result;
};

export const fetchWithValidatedRedirects = async function (
  targetUrl: URL,
  env: Env,
  fetchImpl: FetchLike,
) {
  let currentUrl = new URL(targetUrl.toString());
  let redirectCount = 0;
  const seenUrls = new Set<string>();

  while (true) {
    validateTargetUrl(currentUrl, env);

    if (seenUrls.has(currentUrl.href)) {
      throw new HttpError(502, 'Redirect loop detected');
    }
    seenUrls.add(currentUrl.href);

    let response: Response;
    try {
      response = await fetchImpl(currentUrl.toString(), {
        redirect: 'manual',
        cf: { cacheTtl: env.CONFIG.CACHE_TTL, cacheEverything: true },
      });
    } catch {
      throw new HttpError(502, 'Upstream fetch failed');
    }

    if (!REDIRECT_STATUSES.has(response.status)) {
      return response;
    }

    if (redirectCount >= env.CONFIG.MAX_REDIRECTS) {
      throw new HttpError(502, 'Too many redirects');
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new HttpError(502, 'Malformed upstream redirect');
    }

    try {
      currentUrl = new URL(location, currentUrl);
    } catch {
      throw new HttpError(502, 'Malformed upstream redirect');
    }

    redirectCount += 1;
  }
};

export const readBodyWithByteLimit = async function (response: Response, maxBytes: number) {
  const contentLengthHeader = response.headers.get('content-length');
  if (contentLengthHeader && /^\d+$/u.test(contentLengthHeader)) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (contentLength > maxBytes) {
      throw new HttpError(413, 'Image exceeds byte limit');
    }
  }

  if (!response.body) {
    return new Uint8Array();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel('image exceeds byte limit');
        throw new HttpError(413, 'Image exceeds byte limit');
      }

      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(502, 'Failed to read upstream body');
  }

  return concatChunks(chunks, totalBytes);
};
