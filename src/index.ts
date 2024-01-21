const handler: ExportedHandler = {
  async fetch(request) {
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });

    const url = new URL(request.url);
    if (url.pathname !== '/') return new Response('Not found', { status: 404 });
    if (!url.searchParams.has('url')) return new Response('Missing URL parameter', { status: 400 });

    const result = await fetch(url.searchParams.get('url') as string);
    if (!result.ok) return new Response('Internal error', { status: 500 });
    if (!result.headers.get('content-type')?.startsWith('image/')) return new Response('Not an image', { status: 400 });

    return result;
  },
};

export default handler;
