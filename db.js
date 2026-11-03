import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './seed.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const sourceFile = path.join(dir, 'db.json');
const file = process.env.VERCEL ? path.join('/tmp', 'legend-paints-db.json') : sourceFile;
fs.mkdirSync(dir, { recursive: true });
let db;

export function load() {
  if (fs.existsSync(file)) db = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  else if (fs.existsSync(sourceFile)) db = JSON.parse(fs.readFileSync(sourceFile, 'utf8').replace(/^\uFEFF/, ''));
  else { db = seed(); save(); }
  return db;
}
export function save() {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, file);
}
