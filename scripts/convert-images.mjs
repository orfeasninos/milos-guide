import sharp from 'sharp';
import { readdirSync } from 'fs';
import { join, parse } from 'path';

const dir = 'public/images/beaches';
const MAX_WIDTH = 1920;

const files = readdirSync(dir).filter(f => /\.(jpe?g|png)$/i.test(f));

for (const file of files) {
  const { name } = parse(file);
  const input = join(dir, file);

  const base = sharp(input).resize({ width: MAX_WIDTH, withoutEnlargement: true });

  await base.clone().webp({ quality: 93 }).toFile(join(dir, `${name}.webp`));
  console.log(`✓ ${name}.webp`);

  await base.clone().avif({ quality: 82 }).toFile(join(dir, `${name}.avif`));
  console.log(`✓ ${name}.avif`);
}

console.log('Done!');
