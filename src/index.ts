import { Image } from 'image-js';

export interface Env {
  CONFIG: { WHITELIST: string[]; CACHE_TTL: number; TRANSFORM_RESTRICTIONS: { SIZE: { MIN: number; MAX: number } } };
}

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

const handler: ExportedHandler<Env> = {
  async fetch(request, env) {
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });

    const url = new URL(request.url);
    if (url.pathname !== '/') return new Response('Not found', { status: 404 });

    const urlParam = url.searchParams.get('url');
    if (!urlParam || !url.searchParams.has('url')) return new Response('Missing URL parameter', { status: 400 });

    const requestUrl = new URL(urlParam);
    if (!env.CONFIG.WHITELIST.includes(requestUrl.hostname))
      return new Response('Domain not whitelisted', { status: 403 });

    const response = await fetch(urlParam, { cf: { cacheTtl: env.CONFIG.CACHE_TTL, cacheEverything: true } });
    if (!response.ok || !response.body) return new Response('Internal error', { status: 500 });

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) return new Response('Not an image', { status: 400 });

    const blob = await response.blob();

    const transforms = {
      width: url.searchParams.get('w')
        ? clampTransformSize(parseInt(url.searchParams.get('w') as string), env)
        : undefined,
      height: url.searchParams.get('h')
        ? clampTransformSize(parseInt(url.searchParams.get('h') as string), env)
        : undefined,
    };

    let image = undefined;
    if ([...Object.values(transforms)].length > 0) {
      image = await Image.load(await blob.arrayBuffer());
      if (transforms.width ?? transforms.height)
        image = image.resize({ width: transforms.width, height: transforms.height });
    }

    return new Response(image ? image.toBuffer() : blob, { status: 200, headers: { 'content-type': contentType } });
  },
};

export default handler;
