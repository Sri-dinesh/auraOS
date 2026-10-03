/**
 * Builds icons/icon.ico from the PNGs in this directory.
 *
 * Windows installers (NSIS/WiX) need a real .ico. An ICO may embed PNG data
 * directly for any size >= 32, so no image library is required — we only have
 * to wrap the existing PNGs in the ICO container format.
 *
 * Run with: node icons/build-ico.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const sources = [
  { file: '32x32.png', size: 32 },
  { file: '128x128.png', size: 128 },
  { file: 'icon.png', size: 256 },
];

const images = sources.map(({ file, size }) => {
  const data = readFileSync(join(here, file));
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (width !== size || height !== size) {
    throw new Error(`${file} is ${width}x${height}, expected ${size}x${size}`);
  }
  return { data, size };
});

const HEADER = 6;
const ENTRY = 16;
const tableSize = HEADER + images.length * ENTRY;

let offset = tableSize;
const header = Buffer.alloc(HEADER);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(images.length, 4);

const entries = images.map(({ data, size }) => {
  const entry = Buffer.alloc(ENTRY);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // width  (0 means 256)
  entry.writeUInt8(size === 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette size
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(data.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += data.length;
  return entry;
});

const ico = Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
writeFileSync(join(here, 'icon.ico'), ico);

console.log(`icon.ico written: ${ico.length} bytes, ${images.map((i) => i.size).join('/')}`);