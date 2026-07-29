/* Рендеры изделий: пересборка из оригиналов 1500×2000 без потери качества.
   Прежний конвейер ужимал их до 1100px System.Drawing'ом — отсюда мыло.
   Теперь: webp с альфой, полный размер + компактная версия для карточек.
   ВАЖНО: у G04-3 нумерация цветов в исходниках перепутана: (1)=белый, (2)=чёрный. */
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'C:/Users/123/Downloads/Telegram Desktop';
const OUT = 'E:/Новая папка/gambardini/img';

const JOBS = [
  ['G01-32 (1).png', 'g01-b'], ['G01-32 (2).png', 'g01-w'],
  ['G02 (1).png', 'g02-b'], ['G02 (2).png', 'g02-w'],
  ['G03(1).png', 'g03-b'], ['G03(2).png', 'g03-w'],
  ['G04-1(1).png', 'g04-b'], ['G04-1(2).png', 'g04-w'],
  ['G04-3(2).png', 'g043-b'], ['G04-3(1).png', 'g043-w'],   /* цвета перепутаны в исходниках */
  ['G05-1(1).png', 'g05-b'], ['G05-1(2).png', 'g05-w'],
  ['G06-1(1).png', 'g06-b'], ['G06-1(2).png', 'g06-w'],
];

for (const [src, out] of JOBS) {
  const p = join(SRC, src);
  if (!existsSync(p)) { console.log('НЕТ:', src); continue; }
  /* полный размер — для модалки и ретины */
  await sharp(p).webp({ quality: 88, alphaQuality: 90 }).toFile(join(OUT, out + '.webp'));
  /* компактный — для карточек на обычных экранах */
  await sharp(p)
    .resize({ width: 750, kernel: sharp.kernel.lanczos3 })
    .webp({ quality: 86, alphaQuality: 90 })
    .toFile(join(OUT, out + '-sm.webp'));
  console.log(out, 'ok');
}
