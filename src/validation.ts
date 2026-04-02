import { HttpError } from './errors';
import type { Env } from './types';

const clamp = function (value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
};

const clampTransformSize = function (size: number, env: Env) {
  return clamp(
    clamp(size, 0, Number.MAX_SAFE_INTEGER),
    env.CONFIG.TRANSFORM_RESTRICTIONS.SIZE.MIN,
    env.CONFIG.TRANSFORM_RESTRICTIONS.SIZE.MAX,
  );
};

export const normalizeHostname = function (hostname: string) {
  return hostname.trim().replace(/\.+$/u, '').toLowerCase();
};

export const isWhitelistedHost = function (hostname: string, env: Env) {
  const normalizedHostname = normalizeHostname(hostname);
  if (!normalizedHostname) return false;

  return env.CONFIG.WHITELIST.some((domain) => {
    const normalizedDomain = normalizeHostname(domain);
    if (!normalizedDomain) return false;

    if (env.CONFIG.WHITELIST_EXACT) {
      return normalizedHostname === normalizedDomain;
    }

    return (
      normalizedHostname === normalizedDomain || normalizedHostname.endsWith(`.${normalizedDomain}`)
    );
  });
};

export const isSupportedScheme = function (url: URL) {
  return url.protocol === 'http:' || url.protocol === 'https:';
};

export const hasRequestedTransform = function (width?: number, height?: number) {
  return width !== undefined || height !== undefined;
};

export const validateTargetUrl = function (url: URL, env: Env) {
  if (!isSupportedScheme(url)) {
    throw new HttpError(400, 'Unsupported URL scheme');
  }

  if (!isWhitelistedHost(url.hostname, env)) {
    throw new HttpError(403, 'Domain not whitelisted');
  }
};

export const parseResizeParam = function (name: 'w' | 'h', value: string | null, env: Env) {
  if (value === null) return undefined;
  if (!/^[0-9]+$/u.test(value)) throw new HttpError(400, `Invalid ${name}`);

  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    throw new HttpError(400, `Invalid ${name}`);
  }

  return clampTransformSize(parsedValue, env);
};
