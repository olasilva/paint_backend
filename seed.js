import crypto from 'crypto';
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const per = 'Covers 80 to 140 square metres per bucket depending on the surface.';

const P = (name, category, tag, description) => ({ id: id(), name, category, tag, description, image: '', featured: true, createdAt: now() });

const products = [
  P('Legend Graphitex', 'exterior', 'Exterior / Specialty', 'A pre-mixed, creamy plaster of silica powders in varied grains and selected aggregates of micronized inorganic pigments, bound in synthetic acrylic and formulated for the African climate. Covers the roughest wall surfaces: 4.5 square metres per 20 litres.'),
  P('Marble Trowel', 'exterior', 'Exterior / Specialty', 'Non-combustible mixture of calibrated marble grits, precious stones and synthetic resins. Contains silica that glitters under light. Fire retardant, covers wall defects and is washable. Packed in 20 litres with 2kg acrylic resins.'),
  P('Legend Flexcote', 'exterior', 'Exterior / Interior', 'A creamy wall paint of siliceous powders in a synthetic emulsion resin, coloured with micronized inorganic pigments. Also works as a paste for internal and external screeding.'),
  P('Legend Textured', 'exterior', 'Exterior', 'Sculpted texture in myriad colours for exterior decoration, made with heterogeneous aggregates. A 20 litre container covers 15 to 18 square metres.'),
  P('Matt Textured', 'exterior', 'Exterior / Interior', 'An alkali-resistant matt finish that stops surface cracks reforming. Good obliteration and maximum opacity make it easy to apply inside and out.'),
  P('Legend Standard Emulsion', 'interior', 'Interior', 'Everyday emulsion for walls and ceilings that do not need a premium finish. Dependable coverage and even colour at the most accessible price in the range. ' + per),
  P('Legend Acrylic Emulsion', 'interior', 'Interior', 'A higher-grade acrylic binder for walls that take a beating: corridors, rental units and rooms with temperature swings. Resists cracking through wet and dry seasons. ' + per),
  P('Legend Satin Emulsion', 'interior', 'Interior', 'A soft mid-sheen finish for living and dining areas. Wipes clean, so marks and fingerprints come off without a repaint. ' + per),
  P('Legend Royalé Emulsion', 'interior', 'Interior', 'Our top-of-range interior emulsion: richer pigment, deeper colour and a smoother lay-down. Made for feature walls and statement rooms. ' + per),
  P('Legend Gloss', 'wood-metal', 'Wood & Metal', 'Pigments ground in a varnished medium for a shiny, durable finish on wood and metal.'),
];

// Hex values other than Cameo are screen approximations. Edit them in the admin panel.
const C = (code, name, family, hex, finish = 'Matt') => ({ id: id(), code: String(code), name, family, hex, product: 'Emulsion', finish, createdAt: now() });
const W = 'Whites & Neutrals', B = 'Blues', G = 'Greens', Y = 'Yellows & Earth', R = 'Reds & Browns', L = 'Rose & Lilac';
const colors = [
  C(1001,'Warm White',W,'#F5EFE3'), C(1002,'Off White',W,'#EFEAE0'), C(1003,'Pale Beige',W,'#E4D8C3'), C(1004,'Pale Mushroom',W,'#CFC3B3'),
  C(1005,'Silver Grey',W,'#BDBFC0'), C(1006,'Neutral',W,'#A9A59E'), C(1007,'Dove Grey',W,'#9A9C9E'), C(1008,'Ash Grey',W,'#7E8183'), C(1009,'Dark Grey',W,'#4A4D50'),
  C(1010,'Pale Blue',B,'#CFE0EC'), C(1011,'Sky Blue',B,'#9CC6E4'), C(1012,'Light Blue',B,'#7FB2DA'), C(1013,'Nursery Blue',B,'#B5D5E8'),
  C(1014,'Pacific Blue',B,'#2F7FA6'), C(1015,'Brilliant Blue',B,'#1D5FB8'), C(1016,'Midnight Blue',B,'#14284B'),
  C(1017,'Light Green',G,'#BFDDB5'), C(1018,'Leaf Green',G,'#6FAE4F'), C(1019,'Apple Green',G,'#8DC63F'), C(1020,'Green Gage',G,'#6C9A4B'), C(1021,'National Green',G,'#1F7A3A'),
  C(1022,'Cream',Y,'#F2E6B8'), C(1023,'Bluff',Y,'#D9C08A'), C(1024,'Buff',Y,'#D8B98A'), C(1025,'Cameo',Y,'#D2A375'), C(1026,'Bamboo',Y,'#C8B173'),
  C(1027,'Mustard',Y,'#C99A1E'), C(1028,'Sun Flower',Y,'#F0B90B'), C(1029,'Golden Yellow',Y,'#F2A900'), C(1030,'Sand',Y,'#D8BE98'),
  C(1031,'Post Office Red',R,'#C8202A'), C(1032,'Tile Red',R,'#A8442C'), C(1033,'Red Oxide',R,'#8A3A27'), C(1034,'Orange',R,'#E8731E'),
  C(1035,'Sienna',R,'#9A5A2E'), C(1036,'Rich Brown',R,'#5E3A22'), C(1037,'Chocolate',R,'#43281B'), C(1038,'Laterite Red',R,'#9C4A33'),
  C(1039,'Rose Pink',L,'#E8A5B5'), C(1040,'Lilac Haze',L,'#C7B8D9'),
];
colors.find(c => c.code === '1025').blurb = 'Soft café-au-lait for easy elegance.';

const posts = [
  { id: id(), title: 'Why exterior paint fails in Lagos humidity', slug: 'why-exterior-paint-fails-in-lagos-humidity', published: true, createdAt: now(),
    excerpt: 'Damp walls, algae and harsh sun break down ordinary paint. Here is what to look for before you repaint.',
    body: 'Lagos walls live between heavy rain and strong sun. Moisture trapped behind a coat of paint blisters it from below, and algae settles on any surface that stays damp.\n\nBefore repainting, scrub off mould and let the wall dry fully. Fill cracks, and choose a finish made for exterior use. Anti-fungal and UV-resistant formulations hold colour and resist the dark streaks that appear after the rainy season.\n\nIf you are painting an estate or a multi-storey site, ask for batch-matched colour so touch-ups blend into the original coat.' },
  { id: id(), title: 'Cameo: our 2026 Colour of the Year', slug: 'cameo-2026-colour-of-the-year', published: true, createdAt: now(),
    excerpt: 'A soft café-au-lait warmth that turns evening light to gold.',
    body: 'Cameo (1025) is a calm, grounded neutral with a warm undertone. It works as a main wall in living rooms and bedrooms, and pairs well with deeper browns and off-whites.\n\nTry it in the Colour Studio to see it on a main wall or an accent wall before you order.' },
];

export function seed() { return { products, colors, posts, quotes: [] }; }
