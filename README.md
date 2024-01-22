# media-proxy

This Cloudflare Worker service provides a simple and efficient solution for proxying and caching images. By leveraging [Cloudflare Workers](https://workers.cloudflare.com/), you can offload image requests from your origin server, reduce latency, and enhance overall website performance.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/szalovszky/media-proxy)

## Features

- **Image Proxying**: Directs image requests through the Cloudflare Worker, acting as a middle layer between clients and your origin server.

- **Caching**: Implements a smart caching mechanism to store frequently requested images at the edge, reducing the load on your origin server and improving response times.

## Configuration Options

- `WHITELIST`: Array of whitelisted domains that are allowed to be proxied.
- `CACHE_TTL`: Time-to-live (TTL) for cached images (in seconds).

## License

media-proxy is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support and Contributions

For bug reports, feature requests, or contributions, please open an issue or submit a pull request on the GitHub repository.
