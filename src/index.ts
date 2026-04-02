import { handleRequest } from './handler';

export { handleRequest } from './handler';
export { HttpError } from './errors';
export { textResponse, withSecurityHeaders } from './responses';
export { defaultDependencies } from './dependencies';
export { fetchWithValidatedRedirects, readBodyWithByteLimit } from './upstream';
export {
  hasRequestedTransform,
  isSupportedScheme,
  isWhitelistedHost,
  normalizeHostname,
  parseResizeParam,
  validateTargetUrl,
} from './validation';
export { getEncodableFormat, getImageContentType } from './content';
export type {
  EncodedImage,
  Env,
  FetchLike,
  HandlerDependencies,
  ResizableImage,
  WorkerFetchInit,
} from './types';

const handler: ExportedHandler<import('./types').Env> = {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};

export default handler;
