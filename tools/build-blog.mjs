/* Builds site/Blog/index.html and one page per post at site/Blog/<slug>/.
 *
 *   node tools/build-blog.mjs
 *
 * Source of truth is data/blog.json. Posts are ordered newest first by date.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { head, header, footer, foot, esc, slug, DONUT_SVG } from './layout.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data', 'blog.json');
const OUTDIR = join(ROOT, 'site', 'Blog');

const db = JSON.parse(readFileSync(DATA, 'utf8'));
if (!Array.isArray(db.posts)) throw new Error('data/blog.json has no "posts" array');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// "August 31st, 2026" — the format the sketch asks for, ordinal and all.
function ordinal(d) {
  if (d > 3 && d < 21) return d + 'th';
  return d + ({ 1: 'st', 2: 'nd', 3: 'rd' }[d % 10] || 'th');
}
function longDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`date "${iso}" must be YYYY-MM-DD`);
  const [, y, mo, d] = m;
  return `${MONTHS[+mo - 1]} ${ordinal(+d)}, ${y}`;
}

/* Body paragraphs are plain text, with one exception: [label](href) becomes a
   link. The text is escaped FIRST and the syntax expanded after, so the only
   HTML a post can produce is an anchor — pasting copy with a stray < into
   blog.json still cannot inject markup.
   Hrefs are restricted to internal paths, https and mailto. */
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const plain = t => t.replace(LINK, '$1');
function inline(text, where) {
  return esc(text).replace(LINK, (m, label, href) => {
    if (!/^(\/|https:\/\/|mailto:)/.test(href)) {
      throw new Error(`${where}: link "${href}" must start with /, https:// or mailto:`);
    }
    return `<a href="${href}">${label}</a>`;
  });
}

/* Width and height are written onto the <img> so the page does not jump when
   the photo loads. Read straight out of the JPEG's SOF marker. */
function jpegSize(file) {
  const b = readFileSync(file);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`could not read the dimensions of ${file}`);
}

const IMAGE_DIR = join(ROOT, 'site', 'assets', 'blog');

const posts = db.posts.map((p, i) => {
  for (const f of ['title', 'date']) {
    if (!p[f]) throw new Error(`post ${i} ("${p.title || '?'}") is missing ${f}`);
  }
  if (!Array.isArray(p.body) || !p.body.length) {
    throw new Error(`post "${p.title}" has no body paragraphs`);
  }
  let image = null;
  if (p.image) {
    if (!p.image.src) throw new Error(`post "${p.title}": image needs a src`);
    // Missing alt is a mistake; alt: "" is a decision, and means decorative.
    if (typeof p.image.alt !== 'string') {
      throw new Error(`post "${p.title}": image needs alt text (use "" only if it is decorative)`);
    }
    const file = join(IMAGE_DIR, p.image.src);
    if (!existsSync(file)) throw new Error(`post "${p.title}": no such image, site/assets/blog/${p.image.src}`);
    image = { ...p.image, ...jpegSize(file) };
  }
  return { ...p, image, slug: slug(p.title), display: longDate(p.date) };
}).sort((a, b) => b.date.localeCompare(a.date));

const dupes = posts.map(p => p.slug).filter((s, i, a) => a.indexOf(s) !== i);
if (dupes.length) throw new Error('two posts produce the same URL: ' + dupes.join(', '));

/* ---------- index ---------- */
const entries = posts.map(p => `        <li class="post">
          <h3 class="post__title"><a href="/Blog/${p.slug}/">${esc(p.title)}</a></h3>
          <p class="post__date"><time datetime="${esc(p.date)}">${esc(p.display)}</time></p>
          <div class="post__rule">${DONUT_SVG}<span></span></div>
        </li>`).join('\n');

const index = head({
  title: 'Blog',
  description: 'Our thoughts and ramblings on doughnuts and other things.',
  depth: 1,
}) + header('/Blog/') + `
  <section class="band band--pagehead">
    <h1 class="pagetitle tape" id="main" tabindex="-1">Doughnut Days Blog</h1>
  </section>

  <section class="band">
    <p class="blog__intro">${esc(db.intro)}</p>

    <h2 class="tape tilt-r">Blog Posts</h2>
    <ul class="posts">
${entries}
    </ul>
  </section>
` + footer() + foot({ depth: 1 });

mkdirSync(OUTDIR, { recursive: true });

// Drop post directories that no longer match a post, so renaming a title does
// not leave a stale page served at the old URL.
if (existsSync(OUTDIR)) {
  const keep = new Set(posts.map(p => p.slug));
  for (const name of readdirSync(OUTDIR, { withFileTypes: true })) {
    if (name.isDirectory() && !keep.has(name.name)) {
      rmSync(join(OUTDIR, name.name), { recursive: true, force: true });
      console.log('removed stale post directory:', name.name);
    }
  }
}

writeFileSync(join(OUTDIR, 'index.html'), index, 'utf8');

/* ---------- one page per post ---------- */
for (const p of posts) {
  const paras = p.body.map(t => `      <p>${inline(t, p.title)}</p>`).join('\n');
  const figure = p.image ? `
    <figure class="postimage">
      <img src="/assets/blog/${esc(p.image.src)}" alt="${esc(p.image.alt)}"
           width="${p.image.w}" height="${p.image.h}" loading="lazy">
    </figure>
` : '';
  const page = head({
    title: p.title,
    description: plain(p.body[0]).slice(0, 155),
    depth: 2,
  }) + header('/Blog/') + `
  <section class="band band--pagehead">
    <h1 class="pagetitle tape" id="main" tabindex="-1">${esc(p.title)}</h1>
  </section>

  <section class="band">
    <p class="post__date"><time datetime="${esc(p.date)}">${esc(p.display)}</time></p>
${figure}
    <article class="postbody">
${paras}
    </article>

    <p class="postback"><a href="/Blog/">← All blog posts</a></p>
  </section>
` + footer() + foot({ depth: 2 });

  mkdirSync(join(OUTDIR, p.slug), { recursive: true });
  writeFileSync(join(OUTDIR, p.slug, 'index.html'), page, 'utf8');
}

console.log('wrote', OUTDIR);
console.log('posts:', posts.length);
for (const p of posts) console.log(`  ${p.display}  /Blog/${p.slug}/`);
