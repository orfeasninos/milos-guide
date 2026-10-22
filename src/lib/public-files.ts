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

// Restaurant photos go in /public/images/taverns/<slug>.jpg (the localPhoto path). Until
// the file is there the pages simply show no photo.
export function restaurantPhoto(r: { localPhoto?: string | null }): string | null {
  return r.localPhoto && publicFileExists(r.localPhoto) ? r.localPhoto : null;
}

// Accommodation photos go in /public/images/accommodations/<slug>.jpg, same rule as above.
export const stayPhoto = restaurantPhoto;

// Small WebP variant for plain <img> tags (map popups) where SmartImage isn't available.
const thumb = (photo: string | null): string | null =>
  photo?.startsWith('/images/') ? photo.replace(/\.jpg$/, '-800w.webp') : photo;

export const beachThumb = (b: { slug: string; image?: string | null }) => thumb(beachPhoto(b));
export const restaurantThumb = (r: { localPhoto?: string | null }) => thumb(restaurantPhoto(r));
