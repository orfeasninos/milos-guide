import sharp from 'sharp';
import { readdirSync, existsSync } from 'fs';
import { join, parse } from 'path';

const dir = 'public/images/beaches';
const WIDTHS = [800, 1200, 1920];

// Only original source files — skip already-converted width variants
const files = readdirSync(dir).filter(f => /\.(jpe?g|png)$/i.test(f));

for (const file of files) {
  const { name } = parse(file);
  const input = join(dir, file);

  for (const w of WIDTHS) {
    const webpOut = join(dir, `${name}-${w}w.webp`);
    const avifOut = join(dir, `${name}-${w}w.avif`);

    if (!existsSync(webpOut)) {
      await sharp(input)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 93 })
        .toFile(webpOut);
      console.log(`✓ ${name}-${w}w.webp`);
    } else {
      console.log(`  skip ${name}-${w}w.webp`);
    }

    if (!existsSync(avifOut)) {
      await sharp(input)
        .resize({ width: w, withoutEnlargement: true })
        .avif({ quality: 82 })
        .toFile(avifOut);
      console.log(`✓ ${name}-${w}w.avif`);
    } else {
      console.log(`  skip ${name}-${w}w.avif`);
    }
  }
}

console.log('Done!');
