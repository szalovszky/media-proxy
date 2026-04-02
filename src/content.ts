const normalizeContentType = function (contentType: string | null) {
  return contentType?.split(';', 1)[0]?.trim().toLowerCase() ?? '';
};

export const getImageContentType = function (contentType: string | null) {
  const normalizedContentType = normalizeContentType(contentType);
  return normalizedContentType.startsWith('image/') ? normalizedContentType : undefined;
};

export const getEncodableFormat = function (contentType: string) {
  switch (normalizeContentType(contentType)) {
    case 'image/png':
      return 'png' as const;
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpeg' as const;
    case 'image/bmp':
      return 'bmp' as const;
    default:
      return undefined;
  }
};
