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

const posts = db.posts.map((p, i) => {
  for (const f of ['title', 'date']) {
    if (!p[f]) throw new Error(`post ${i} ("${p.title || '?'}") is missing ${f}`);
  }
  if (!Array.isArray(p.body) || !p.body.length) {
    throw new Error(`post "${p.title}" has no body paragraphs`);
  }
  return { ...p, slug: slug(p.title), display: longDate(p.date) };
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
  title: 'Doughnut Days Blog',
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
  const paras = p.body.map(t => `      <p>${esc(t)}</p>`).join('\n');
  const page = head({
    title: `${p.title} — Doughnut Days`,
    description: p.body[0].slice(0, 155),
    depth: 2,
  }) + header('/Blog/') + `
  <section class="band band--pagehead">
    <h1 class="pagetitle tape" id="main" tabindex="-1">${esc(p.title)}</h1>
  </section>

  <section class="band">
    <p class="post__date"><time datetime="${esc(p.date)}">${esc(p.display)}</time></p>

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
