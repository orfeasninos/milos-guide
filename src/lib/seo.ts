// Search engines cut meta descriptions at roughly 155–160 characters, so trim at a
// word boundary instead of mid-word.
export function metaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.;:—–-]+$/, '') + '…';
}
