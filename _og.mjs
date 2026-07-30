/* OG-карточка 1200×630 для мессенджеров — jpeg, webp понимают не все */
import sharp from 'sharp';

await sharp('img/hero-b@2x.webp')
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile('img/og.jpg');

const meta = await sharp('img/og.jpg').metadata();
console.log('og.jpg', meta.width + 'x' + meta.height);
