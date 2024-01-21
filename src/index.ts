export interface Env {
  CONFIG: { WHITELIST: string[] };
}

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

    const response = await fetch(url.searchParams.get('url') as string);
    if (!response.ok || !response.body) return new Response('Internal error', { status: 500 });

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) return new Response('Not an image', { status: 400 });

    const blob = await response.blob();
    return new Response(await blob.arrayBuffer(), { status: 200, headers: { 'content-type': contentType } });
  },
};

export default handler;
