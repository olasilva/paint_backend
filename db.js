import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './seed.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const file = path.join(dir, 'db.json');
fs.mkdirSync(dir, { recursive: true });
let db;

export function load() {
  if (fs.existsSync(file)) db = JSON.parse(fs.readFileSync(file, 'utf8'));
  else { db = seed(); save(); }
  return db;
}
export function save() {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, file);
}
