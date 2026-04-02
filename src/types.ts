export interface Env {
  CONFIG: {
    WHITELIST: string[];
    WHITELIST_EXACT: boolean;
    CACHE_TTL: number;
    MAX_IMAGE_BYTES: number;
    MAX_IMAGE_PIXELS: number;
    MAX_REDIRECTS: number;
    TRANSFORM_RESTRICTIONS: { SIZE: { MIN: number; MAX: number } };
  };
}

export type WorkerFetchInit = RequestInit & {
  cf?: {
    cacheTtl: number;
    cacheEverything: boolean;
  };
};

export type FetchLike = (input: string | URL | Request, init?: WorkerFetchInit) => Promise<Response>;

export interface ResizableImage {
  width: number;
  height: number;
  resize(options: { width?: number; height?: number }): ResizableImage;
}

export interface EncodedImage {
  body: Uint8Array;
  contentType: string;
}

export interface HandlerDependencies {
  fetch: FetchLike;
  decodeImage: (data: Uint8Array) => ResizableImage;
  encodeImage: (image: ResizableImage, sourceContentType: string) => EncodedImage;
}
