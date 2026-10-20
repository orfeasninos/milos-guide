// Build-time checks for files in /public. Server-only (uses node:fs), so never import
// this from a client <script>. import.meta.glob was used before, but it made Vite copy
// every matched image into _astro/ as well, doubling the deployed image weight.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC_DIR = join(process.cwd(), 'public');

export const publicFileExists = (path: string): boolean =>
  !/^(https?:)?\/\//.test(path) && existsSync(join(PUBLIC_DIR, path));

// Local photos live in /public/images/beaches/<slug>.jpg (with AVIF/WebP variants for SmartImage).
export function beachPhoto(b: { slug: string; image?: string | null }): string | null {
  if (b.image) return b.image;
  const local = `/images/beaches/${b.slug}.jpg`;
  return publicFileExists(local) ? local : null;
}

// Small WebP variant for plain <img> tags (map popups) where SmartImage isn't available.
export function beachThumb(b: { slug: string; image?: string | null }): string | null {
  const photo = beachPhoto(b);
  return photo?.startsWith('/images/') ? photo.replace(/\.jpg$/, '-800w.webp') : photo;
}
