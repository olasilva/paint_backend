import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { load, save } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@legendpaints.ng').toLowerCase();
const ADMIN_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 10);
if (process.env.NODE_ENV === 'production' && (SECRET === 'dev-secret-change-me' || !process.env.ADMIN_PASSWORD)) {
  console.error('Set JWT_SECRET and ADMIN_PASSWORD before running in production.');
  process.exit(1);
}

const db = load();
const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '200kb' }));

const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir, { maxAge: '7d' }));

// ---------- helpers ----------
const tokenOf = (req) => (req.headers.authorization || '').replace(/^Bearer /, '');
const isAdmin = (req) => { try { jwt.verify(tokenOf(req), SECRET); return true; } catch { return false; } };
const auth = (req, res, next) => (isAdmin(req) ? next() : res.status(401).json({ error: 'Please sign in again.' }));
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, typeof o[k] === 'string' ? o[k].trim() : o[k]]));
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function resource(name, { fields, required = [], publicFilter, prepare }) {
  const r = express.Router();
  const list = () => db[name];
  r.get('/', (req, res) => {
    let items = list();
    if (publicFilter && !isAdmin(req)) items = items.filter(publicFilter);
    res.json([...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });
  r.get('/:key', (req, res) => {
    const item = list().find((i) => i.id === req.params.key || i.slug === req.params.key);
    if (!item || (publicFilter && !publicFilter(item) && !isAdmin(req))) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });
  r.post('/', auth, (req, res) => {
    const body = pick(req.body, fields);
    const missing = required.filter((k) => !body[k] && body[k] !== false);
    if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
    const item = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...body };
    prepare?.(item, null, list());
    list().push(item); save(); res.status(201).json(item);
  });
  r.put('/:id', auth, (req, res) => {
    const item = list().find((i) => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    Object.assign(item, pick(req.body, fields), { updatedAt: new Date().toISOString() });
    const missing = required.filter((k) => !item[k] && item[k] !== false);
    if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
    prepare?.(item, item, list());
    save(); res.json(item);
  });
  r.delete('/:id', auth, (req, res) => {
    const i = list().findIndex((x) => x.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: 'Not found' });
    list().splice(i, 1); save(); res.json({ ok: true });
  });
  return r;
}

// ---------- auth ----------
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Try again in 15 minutes.' } });
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const ok = email.trim().toLowerCase() === ADMIN_EMAIL && bcrypt.compareSync(password, ADMIN_HASH);
  if (!ok) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: jwt.sign({ role: 'admin' }, SECRET, { expiresIn: '12h' }) });
});
app.get('/api/auth/me', auth, (req, res) => res.json({ email: ADMIN_EMAIL }));

// ---------- content ----------
app.use('/api/products', resource('products', {
  fields: ['name', 'category', 'tag', 'description', 'image', 'featured'],
  required: ['name', 'category', 'description'],
}));
app.use('/api/colors', resource('colors', {
  fields: ['code', 'name', 'family', 'hex', 'product', 'finish', 'blurb'],
  required: ['code', 'name', 'hex'],
  prepare: (item) => { if (!/^#[0-9a-f]{6}$/i.test(item.hex)) item.hex = '#CCCCCC'; },
}));
app.use('/api/posts', resource('posts', {
  fields: ['title', 'slug', 'excerpt', 'body', 'published'],
  required: ['title', 'body'],
  publicFilter: (p) => p.published,
  prepare: (item, _e, all) => {
    const base = slugify(item.slug || item.title) || 'post';
    let s = base;
    while (all.some((p) => p.slug === s && p.id !== item.id)) s = `${base}-${crypto.randomBytes(2).toString('hex')}`;
    item.slug = s;
  },
}));

// ---------- quotes ----------
const quoteLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Too many requests. Please call 08023202635.' } });
app.post('/api/quotes', quoteLimiter, (req, res) => {
  const q = pick(req.body || {}, ['name', 'company', 'phone', 'email', 'details']);
  if (!q.name || !q.phone || !q.details) return res.status(400).json({ error: 'Name, phone number and project details are required.' });
  if (!/^[+\d][\d\s-]{6,19}$/.test(q.phone)) return res.status(400).json({ error: 'Enter a valid phone number.' });
  for (const k of Object.keys(q)) q[k] = String(q[k]).slice(0, k === 'details' ? 2000 : 200);
  const item = {
    id: crypto.randomUUID(),
    ...q,
    status: 'new',
    reply: '',
    replyChannel: '',
    repliedAt: null,
    createdAt: new Date().toISOString(),
  };
  db.quotes.push(item); save();
  res.status(201).json({ ok: true, quote: item });
});
const quotes = express.Router();
quotes.use(auth);
quotes.get('/', (req, res) => res.json([...db.quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
quotes.put('/:id', (req, res) => {
  const q = db.quotes.find((x) => x.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Not found' });
  if (!['new', 'contacted', 'won', 'closed'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
  q.status = req.body.status; save(); res.json(q);
});
quotes.post('/:id/reply', (req, res) => {
  const q = db.quotes.find((x) => x.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Not found' });
  const reply = typeof req.body.reply === 'string' ? req.body.reply.trim() : '';
  const replyChannel = typeof req.body.replyChannel === 'string' ? req.body.replyChannel.trim() : '';
  if (!reply) return res.status(400).json({ error: 'Reply message is required.' });
  if (!['email', 'whatsapp', 'phone', ''].includes(replyChannel)) {
    return res.status(400).json({ error: 'Invalid reply channel.' });
  }
  q.reply = reply.slice(0, 4000);
  q.replyChannel = replyChannel;
  q.repliedAt = new Date().toISOString();
  if (q.status === 'new') q.status = 'contacted';
  save();
  res.json(q);
});
quotes.delete('/:id', (req, res) => {
  db.quotes = db.quotes.filter((x) => x.id !== req.params.id); save(); res.json({ ok: true });
});
app.use('/api/admin/quotes', quotes);

// ---------- uploads ----------
const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + ext[file.mimetype]),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(ext[file.mimetype] ? null : Object.assign(new Error('Upload a JPG, PNG or WebP image.'), { status: 400 }), !!ext[file.mimetype]),
});
app.post('/api/admin/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received.' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- serve the built React app in production ----------
const dist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  const status = err instanceof multer.MulterError ? 400 : err.status || 500;
  res.status(status).json({ error: status === 500 ? 'Something went wrong.' : err.message });
  if (status === 500) console.error(err);
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Legend Paints API on http://localhost:${PORT}`));
}

export default app;
