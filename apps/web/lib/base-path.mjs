/** Build-time mount point for static project hosting; never a URL or traversal. */
export function validateBasePath(value = '') {
  if (typeof value !== 'string' || (value !== '' && !/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(value))) {
    throw new Error('Base path must be empty or slash-prefixed path segments containing letters, digits, underscores or hyphens, without a trailing slash.');
  }
  return value;
}
