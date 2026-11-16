'use strict';
// Tạo assets/icon.png (256x256) từ một sprite pixel 16x16 – không cần thư viện ngoài.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const MAP = [
  '................',
  '.....pp..pp.....',
  '....pPPppPPp....',
  '....pPyyyyPp....',
  '.....pyooyp.....',
  '....pPyyyyPp....',
  '....pPPppPPp....',
  '.....pp.gpp.....',
  '.........g..ll..',
  '..ll.....g.lLl..',
  '..lLl....gll....',
  '....ll...g......',
  '..cccccccccccc..',
  '...rrrrrrrrrr...',
  '....rrrrrrrrd...',
  '.....rrrrrrd....',
];
const PAL = {
  p: [255, 79, 163], P: [214, 40, 120], y: [255, 210, 63], o: [230, 140, 20],
  g: [47, 122, 52], l: [114, 192, 75], L: [37, 96, 42], c: [160, 80, 50], r: [200, 85, 61], d: [140, 55, 40],
};
function build(alert) {
const SIZE = 256; const K = SIZE / 16;
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  for (let x = 0; x < SIZE; x++) {
    const ch = MAP[Math.floor(y / K)][Math.floor(x / K)];
    const c = PAL[ch];
    const o = y * (SIZE * 4 + 1) + 1 + x * 4;
    if (c) { raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2]; raw[o + 3] = 255; }
    // chấm đỏ thông báo ở góc trên phải
    const dx = x - 196; const dy = y - 60;
    if (alert && dx * dx + dy * dy < 56 * 56) {
      const edge = dx * dx + dy * dy > 46 * 46;
      raw[o] = edge ? 255 : 229; raw[o + 1] = edge ? 255 : 56; raw[o + 2] = edge ? 255 : 59; raw[o + 3] = 255;
    }
  }
}
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
]);
return png;
}
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'icon.png'), build(false));
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'icon-alert.png'), build(true));
console.log('Đã tạo assets/icon.png và assets/icon-alert.png');
