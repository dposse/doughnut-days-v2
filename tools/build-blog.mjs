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

/* Body paragraphs are plain text, with two exceptions: [label](href) becomes
   a link and *text* becomes <em>text</em>. The text is escaped FIRST and the
   syntax expanded after, so the only HTML a post can produce is an anchor or
   an em — pasting copy with a stray < into blog.json still cannot inject
   markup.
   Hrefs are restricted to internal paths, https and mailto. */
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const ITALIC = /\*([^*]+)\*/g;
const plain = t => t.replace(LINK, '$1').replace(ITALIC, '$1');
function inline(text, where) {
  return esc(text).replace(LINK, (m, label, href) => {
    if (!/^(\/|https:\/\/|mailto:)/.test(href)) {
      throw new Error(`${where}: link "${href}" must start with /, https:// or mailto:`);
    }
    return `<a href="${href}">${label}</a>`;
  }).replace(ITALIC, '<em>$1</em>');
}

/* The EXIF Orientation tag, or null. Values 5-8 mean the browser turns the
   photo a quarter turn, which swaps the dimensions it ends up displaying. */
function exifOrientation(b) {
  const app1 = b.indexOf(Buffer.from('Exif\0\0'));
  if (app1 < 0) return null;
  const tiff = app1 + 6;
  const le = b.toString('ascii', tiff, tiff + 2) === 'II';
  const u16 = o => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
  const u32 = o => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
  const ifd0 = tiff + u32(tiff + 4);
  const count = u16(ifd0);
  for (let i = 0; i < count; i++) {
    const entry = ifd0 + 2 + i * 12;
    if (u16(entry) === 0x0112) return u16(entry + 8);
  }
  return null;
}

/* Width and height are written onto the <img> so the page does not jump when
   the photo loads.
 *
 * A photo that leans on EXIF to sit the right way up is rejected. Browsers
 * honour the tag, but link-preview scrapers generally do not — so the post
 * looked fine on the site and arrived sideways when someone shared it in a
 * message. Rotate the pixels for real and drop the tag. */
function jpegSize(file, postTitle) {
  const b = readFileSync(file);
  const turned = [5, 6, 7, 8].includes(exifOrientation(b));
  if (turned) {
    throw new Error(
      `post "${postTitle}": ${file.split(/[\\/]/).pop()} relies on EXIF rotation to display upright. ` +
      `Link previews ignore that and will show it sideways — rotate the actual pixels and re-save it.`);
  }
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
  // A body entry is a paragraph (a string), a section heading
  // ({ heading: "..." }, rendered h2), a subheading ({ subheading: "..." },
  // rendered h3, for grouping under a heading) or a bulleted list
  // ({ list: [...] }).
  for (const item of p.body) {
    if (typeof item === 'string') continue;
    if (item && typeof item.heading === 'string' && item.heading.trim()) continue;
    if (item && typeof item.subheading === 'string' && item.subheading.trim()) continue;
    if (item && Array.isArray(item.list) && item.list.length &&
        item.list.every(li => typeof li === 'string')) continue;
    throw new Error(`post "${p.title}": a body entry must be a string, { "heading": "..." }, { "subheading": "..." } or { "list": ["...", "..."] }`);
  }
  if (typeof p.body[0] !== 'string') {
    throw new Error(`post "${p.title}": the first body entry must be a paragraph, not a list`);
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
    image = { ...p.image, ...jpegSize(file, p.title) };
  }
  // A post may pin its own URL. Without one the title supplies it, which means
  // a long title makes a long URL and editing a title moves the page.
  if ('slug' in p && (typeof p.slug !== 'string' || !slug(p.slug))) {
    throw new Error(`post "${p.title}": slug must be a non-empty string`);
  }
  return { ...p, image, slug: slug(p.slug || p.title), display: longDate(p.date) };
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
  // Section headings are h2, subheadings under them are h3 — the post title
  // is the page's only h1, so no level is skipped. Tilt alternates across
  // both levels together, the way the section headings elsewhere do.
  let headings = 0;
  const paras = p.body.map(item => {
    if (typeof item === 'string') return `      <p>${inline(item, p.title)}</p>`;
    if (item.heading) {
      const tilt = headings++ % 2 ? 'tilt-r' : 'tilt-l';
      return `      <h2 class="tape ${tilt} postheading">${inline(item.heading, p.title)}</h2>`;
    }
    if (item.subheading) {
      const tilt = headings++ % 2 ? 'tilt-r' : 'tilt-l';
      return `      <h3 class="tape ${tilt} postsubheading">${inline(item.subheading, p.title)}</h3>`;
    }
    return `      <ul class="postlist">\n` +
      item.list.map(li => `        <li>${inline(li, p.title)}</li>`).join('\n') +
      `\n      </ul>`;
  }).join('\n');
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
