import { decode, encode } from 'image-js';

import { getEncodableFormat } from './content';
import type { HandlerDependencies } from './types';

export const defaultDependencies: HandlerDependencies = {
  fetch: (input, init) => fetch(input, init),
  decodeImage: (data) => decode(data),
  encodeImage: (image, sourceContentType) => {
    const sourceFormat = getEncodableFormat(sourceContentType);
    const imageInput = image as Parameters<typeof encode>[0];

    if (sourceFormat) {
      try {
        return {
          body: encode(imageInput, { format: sourceFormat }),
          contentType:
            sourceFormat === 'bmp'
              ? 'image/bmp'
              : sourceFormat === 'png'
                ? 'image/png'
                : 'image/jpeg',
        };
      } catch {
        if (sourceFormat === 'png') {
          throw new Error('png encode failed');
        }
      }
    }

    return {
      body: encode(imageInput, { format: 'png' }),
      contentType: 'image/png',
    };
  },
};
