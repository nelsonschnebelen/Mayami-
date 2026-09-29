// Turns the venue's original photography in raw/ into web-sized WebP in
// public/images/. raw/ is gitignored (≈100 MB of originals pulled from
// mayamiwynwood.com); re-run `npm run images` after swapping a source.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = 'public/images';
mkdirSync(OUT, { recursive: true });

// name → [source file, max width]. Sources under 1600px only get the small size.
// raw/pdf/ holds images pulled from Mayami's corporate events deck
// (`pdfimages -all "CORPORATE FINAL.pdf" raw/pdf/p`).
const IMAGES = {
  hero:      ['19.jpg', 2200],
  dining:    ['01.jpg', 1600],
  terrace:   ['02.jpg', 1600],
  tree:      ['03.jpg', 1600],
  vip:       ['04.jpg', 1600],
  outdoor:   ['pdf/p-078.jpg', 1600],
  buyout:    ['pdf/p-071.jpg', 1600],
  facade:    ['pdf/p-077.jpg', 1600],
  groupdine: ['pdf/p-068.jpg', 1600],
  parade:    ['pdf/p-070.jpg', 1600],
  lounge:    ['pdf/p-075.jpg', 1600],
  bar:       ['pdf/p-010.jpg', 1600],
  pasta:     ['pdf/p-072.jpg', 1100],
  menu2:     ['pdf/p-036.jpg', 1000],
  menu3:     ['pdf/p-041.jpg', 1000],
  menu4:     ['pdf/p-046.jpg', 1000],
  brunch:    ['pdf/p-059.jpg', 1000],
  // These two sit inside full-slide canvases; `crop` cuts the photo out of the slide.
  menu1:     ['pdf/p-030.jpg', 800, { left: 168, top: 290, width: 606, height: 566 }],
  chef:      ['pdf/p-026.jpg', 800, { left: 168, top: 290, width: 606, height: 566 }],
  sushi:     ['12.jpg', 1600],
  fire:      ['13.jpg', 1200],
  birthday:  ['15.jpg', 1600],
};

for (const [name, [src, max, crop]] of Object.entries(IMAGES)) {
  const img = sharp(`raw/${src}`).rotate();
  if (crop) img.extract(crop);
  await img.clone().resize({ width: Math.min(max, 800), withoutEnlargement: true })
    .webp({ quality: 72 }).toFile(`${OUT}/${name}-800.webp`);
  if (max > 800) {
    await img.clone().resize({ width: max, withoutEnlargement: true })
      .webp({ quality: 70 }).toFile(`${OUT}/${name}.webp`);
  }
  console.log('✓', name);
}

// The brand lock-up ships as brown line-art on a sand card. Knock the sand out
// to transparency and recolor the lines so the mark sits on the dark page.
const { data, info } = await sharp('raw/22.png').ensureAlpha().raw()
  .toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  const a = Math.max(0, Math.min(255, (205 - lum) * 2.6)); // sand ≈ 205, lines ≈ 110
  data[i] = 233; data[i + 1] = 220; data[i + 2] = 203; data[i + 3] = a;
}
await sharp(data, { raw: info }).trim().resize({ width: 520 })
  .png({ compressionLevel: 9 }).toFile(`${OUT}/logo.png`);
console.log('✓ logo');
