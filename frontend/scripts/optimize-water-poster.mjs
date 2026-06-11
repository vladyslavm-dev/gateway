#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_OUT = path.join(
  ROOT,
  "public",
  "stage",
  "world",
  "water-poster.jpg",
);

const sourceArg = process.argv[2];
if (!sourceArg) {
  console.error("Usage: node optimize-water-poster.mjs <source-path>");
  process.exit(1);
}

const source = path.resolve(sourceArg);

await mkdir(path.dirname(DEFAULT_OUT), { recursive: true });

await sharp(source)
  .resize({ width: 1600, height: 2000, fit: "cover", position: "center" })
  .blur(1.6)
  .jpeg({ quality: 72, mozjpeg: true, progressive: true })
  .toFile(DEFAULT_OUT);

const meta = await sharp(DEFAULT_OUT).metadata();
const sizeKB = (meta.size ?? 0) / 1024;
console.log(
  `wrote ${path.relative(ROOT, DEFAULT_OUT)} ${meta.width}x${meta.height} ${sizeKB.toFixed(1)} KB`,
);
