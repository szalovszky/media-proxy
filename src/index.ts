export default {
	async fetch(request: Request, ctx: ExecutionContext): Promise<Response> {
		if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
		const url = new URL(request.url);
		if (url.pathname !== '/') return new Response('Not found', { status: 404 });
		if (!url.searchParams.has('url')) return new Response('Missing URL parameter', { status: 400 });
		return await fetch(url.searchParams.get('url') as string);
	},
};
