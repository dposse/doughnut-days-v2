/* Regenerates site/Raleigh-Donut-Map/index.html from the owner's spreadsheet.
 *
 *   node tools/build-maps.mjs
 *
 * Reads data/raleigh-donut-map.xlsx and rewrites the shop list. No npm
 * dependencies — the .xlsx is a zip of XML, and Node can unzip it with zlib.
 * Edit the spreadsheet, run this, commit the result.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const XLSX = join(ROOT, 'data', 'raleigh-donut-map.xlsx');
const OUT = join(ROOT, 'site', 'Raleigh-Donut-Map', 'index.html');

/* ---------- minimal zip reader ---------- */
function unzip(buf) {
  // End of central directory, scanned backwards past any trailing comment.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip file');

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = {};

  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);

    // The local header repeats the name/extra lengths, which can differ.
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + compSize);

    files[name] = method === 0 ? raw : inflateRawSync(raw);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

/* ---------- sheet -> records ---------- */
const dec = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d))
  .replace(/&amp;/g, '&');

const zip = unzip(readFileSync(XLSX));
const ssXml = zip['xl/sharedStrings.xml'].toString('utf8');
const shared = [...ssXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m =>
  [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => dec(t[1])).join(''));

const sheetXml = zip['xl/worksheets/sheet1.xml'].toString('utf8');
const rows = [];
for (const rm of sheetXml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
  const cells = {};
  for (const cm of rm[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
    const [, col, attrs, body] = cm;
    const t = (attrs.match(/t="([^"]+)"/) || [])[1];
    const v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
    const inline = body.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/);
    let val;
    if (t === 's') val = shared[+v];
    else if (inline) val = dec(inline[1]);
    else if (v !== undefined) val = dec(v);
    if (val !== undefined && String(val).trim() !== '') cells[col] = String(val).trim();
  }
  if (Object.keys(cells).length) rows.push(cells);
}

const header = rows[0];
const cols = Object.keys(header);
const recs = rows.slice(1).map(r => Object.fromEntries(cols.map(c => [header[c], (r[c] ?? '').trim()])));

/* ---------- shaping ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const splitList = s => s.split(',').map(x => x.trim()).filter(Boolean);

// "Yeast-Raised" is the same thing as "Yeast" — merged for display and filtering.
const TAG_ALIASES = { 'Yeast-Raised': 'Yeast' };
const CATEGORY_ORDER = ['Traditional', 'Novelty', 'Gourmet', 'Gluten-Friendly', 'Vegan'];
const ICONS = {
  Traditional: 'Traditional.png', Novelty: 'Novelty.png', Gourmet: 'Gourmet.png',
  'Gluten-Friendly': 'Gluten-Friendly.png', Vegan: 'Vegan.png',
};

const baseName = n => n.replace(/\s*\([^)]*\)\s*$/, '').trim();
const cityOf = a => { const m = a.match(/,\s*([^,]+),\s*NC/); return m ? m[1].trim() : ''; };

for (const r of recs) {
  r.categories = splitList(r['Map Category']);
  r.tags = [...new Set(splitList(r['List Tags']).map(t => TAG_ALIASES[t] || t))];
  r.hasSite = !/^no website/i.test(r.Website);
  r.city = cityOf(r.Address);
  r.base = baseName(r.Name);
}

// Shops sharing a base name get their city in the link label, so the website
// links are distinguishable when a screen reader lists them out of context.
const baseCount = {};
for (const r of recs) baseCount[r.base] = (baseCount[r.base] || 0) + 1;

const unknown = [...new Set(recs.flatMap(r => r.categories))].filter(c => !CATEGORY_ORDER.includes(c));
if (unknown.length) throw new Error('Unknown Map Category: ' + unknown.join(', '));

const allTags = [...new Set(recs.flatMap(r => r.tags))].sort((a, b) => a.localeCompare(b));
const tagCount = t => recs.filter(r => r.tags.includes(t)).length;

/* ---------- markup ---------- */
// Shop names already carry their own location ("Baker's Dozen (Durham)"), so the
// name alone is a unique label. City is only appended if a repeated name ever
// arrives without one — trusting the name over the address, since the two
// disagree in the data today.
function siteLabel(r) {
  const hasOwnLocation = /\([^)]*\)/.test(r.Name);
  const needsCity = baseCount[r.base] > 1 && !hasOwnLocation && r.city;
  return needsCity ? `${r.Name} in ${r.city} website` : `${r.Name} website`;
}

function shopHtml(r) {
  const search = [r.Name, r.Address, r.tags.join(' '), r.Description].join(' ').toLowerCase();
  const website = r.hasSite
    ? `<a class="shop__site" href="${esc(r.Website)}" aria-label="${esc(siteLabel(r))}">Website</a>`
    : `<span class="shop__site shop__site--none">No website</span>`;
  // data-id is shared by the two listings of a shop that has two categories, so
  // the result count can count shops rather than rows.
  return `        <li class="shop" data-id="${esc(slug(r.Name))}" data-tags="${esc(r.tags.map(slug).join(' '))}" data-search="${esc(search)}">
          <h3 class="shop__name">${esc(r.Name)}</h3>
          <p class="shop__address">${esc(r.Address)}</p>
          ${website}
          <ul class="shop__tags">
${r.tags.map(t => `            <li class="chip">${esc(t)}</li>`).join('\n')}
          </ul>
          <p class="shop__desc">${esc(r.Description)}</p>
        </li>`;
}

const sections = CATEGORY_ORDER.map((cat, i) => {
  const shops = recs.filter(r => r.categories.includes(cat));
  return `      <section class="cat" data-category="${esc(cat)}" id="cat-${slug(cat)}">
        <h2 class="tape ${i % 2 ? 'tilt-r' : 'tilt-l'}">${esc(cat)}</h2>
        <p class="cat__count">${shops.length} ${shops.length === 1 ? 'spot' : 'spots'}</p>
        <ul class="shops">
${shops.map(shopHtml).join('\n')}
        </ul>
      </section>`;
}).join('\n\n');

const keyItems = CATEGORY_ORDER.map(cat =>
  `        <li class="key__item">
          <img src="../assets/map-icons/${ICONS[cat]}" alt="" width="512" height="645">
          <span>${esc(cat)}</span>
        </li>`).join('\n');

const tagBoxes = allTags.map(t =>
  `          <label class="tagbox">
            <input type="checkbox" name="tag" value="${slug(t)}">
            <span>${esc(t)} <span class="tagbox__n">(${tagCount(t)})</span></span>
          </label>`).join('\n');

const categoryList = CATEGORY_ORDER.map(c => `        <li>${esc(c)}</li>`).join('\n');
const tagListAbout = allTags.map(t => `        <li>${esc(t)}</li>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Raleigh Donut Map — Doughnut Days</title>
<meta name="description" content="Every donut spot on the 2026 Raleigh Donut Map, grouped by category and filterable by tag.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="page">

  <header class="masthead">
    <a class="wordmark" href="/">@doughnut_days</a>
    <nav class="nav">
      <ul>
        <li><a href="/Raleigh-Donut-Map/" aria-current="page">Donut Maps</a></li>
        <li><a href="/#blog">Blog</a></li>
        <li><a href="/#contact">Contact Us</a></li>
        <li>
          <a class="ig" href="https://instagram.com/doughnut_days" aria-label="Doughnut Days on Instagram">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"></circle></svg>
          </a>
        </li>
      </ul>
    </nav>
  </header>

  <section class="band band--pagehead">
    <h1 class="pagetitle tape" id="main" tabindex="-1">Raleigh Donut Maps</h1>
  </section>

  <section class="band" id="about">
    <h2 class="tape tilt-l">About</h2>
    <div class="aboutcard">
      <!-- TODO: replace with the real blurb about the maps. -->
      <p>Placeholder. A short paragraph about what these maps cover, how they were
      put together, and how to use them goes here. Local donut spots within 60
      miles of the Raleigh State Capitol Building, sorted into ${CATEGORY_ORDER.length}
      categories and tagged by what they make.</p>
    </div>

    <div class="about__lists">
      <div>
        <h3>Categories</h3>
        <ul class="plainlist">
${categoryList}
        </ul>
      </div>
      <div>
        <h3>Tags</h3>
        <ul class="plainlist plainlist--wrap">
${tagListAbout}
        </ul>
      </div>
    </div>
  </section>

  <section class="band" id="map">
    <h2 class="tape tilt-r" id="map-heading">Google Map Embed</h2>

    <!-- Off-screen until focused, like the page's skip link. Sits before the
         embed so keyboard users meet it before the map's own focus stops. -->
    <a class="btn btn--skipmap" href="#list-heading">Skip Google Map</a>

    <div class="maplayout">
      <div class="mapcard">
        <!-- TODO: replace this placeholder with the Google My Maps iframe once the
             map is public:
             <iframe src="https://www.google.com/maps/d/embed?mid=YOUR_MAP_ID" title="2026 Raleigh Donut Map" loading="lazy"></iframe> -->
        <div class="mapcard__frame mapcard__frame--tall">
          <span>Google My Maps embed</span>
          <span>2026 Raleigh Donut Map · placeholder until the map is public</span>
        </div>
      </div>
      <div class="mapside">
        <div class="mapside__blurb">
          <!-- TODO: replace with the real blurb. -->
          <p>Placeholder. A sentence or two about the map itself — what the pins
          mean and how to open it in Google Maps.</p>
        </div>
        <!-- TODO: point at the public My Maps URL. -->
        <a class="btn" href="#map">Open in Google Maps</a>
      </div>
    </div>

    <h3 class="key__heading">Key</h3>
    <ul class="key">
${keyItems}
    </ul>
  </section>

  <section class="band" id="list">
    <h2 class="tape tilt-l" id="list-heading" tabindex="-1">Donut Map List</h2>

    <form class="filters" id="filters">
      <div class="filters__search">
        <label for="q">Search the Raleigh Donut Map List</label>
        <div class="filters__searchrow">
          <input type="search" id="q" name="q" autocomplete="off"
                 placeholder="Name, city, tag or description">
          <button type="submit" class="btn btn--solid">Search</button>
          <button type="button" class="btn" id="clear-search">Clear search</button>
        </div>
      </div>

      <fieldset class="filters__tags">
        <legend>Filter by tag</legend>
        <div class="tagboxes">
${tagBoxes}
        </div>
      </fieldset>

      <!-- After the checkboxes in tab order, so clearing does not mean
           shift-tabbing back past every tag. -->
      <div class="filters__actions">
        <button type="button" class="btn" id="clear">Clear filters</button>
      </div>
    </form>

    <p class="results" id="results" role="status" aria-live="polite">${recs.length} donut spots</p>
    <p class="noresults" id="noresults" hidden>No donut spots match those filters. Try clearing the search or unchecking some tags.</p>

    <div id="cats">
${sections}
    </div>
  </section>

  <footer class="foot" id="contact">
    <div>
      <h2 class="tape tape--invert tilt-l">Pages</h2>
      <ul>
        <li><a href="/Raleigh-Donut-Map/">Donut Maps</a></li>
        <li><a href="/#blog">Blog</a></li>
        <li><a href="/#contact">Contact Us</a></li>
      </ul>
    </div>
    <div>
      <h2 class="tape tape--invert tilt-r">Contact Us</h2>
      <a class="email" href="mailto:hello@doughnutdays.com">hello@doughnutdays.com</a>
      <div>
        <a class="ig" href="https://instagram.com/doughnut_days" aria-label="Doughnut Days on Instagram">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"></circle></svg>
        </a>
      </div>
    </div>
  </footer>

</div>
<script src="../maps.js"></script>
</body>
</html>
`;

writeFileSync(OUT, html, 'utf8');

const dupBases = Object.entries(baseCount).filter(([, n]) => n > 1).map(([b, n]) => `${b} x${n}`);
console.log('wrote', OUT);
console.log('shops:', recs.length);
console.log('sections:', CATEGORY_ORDER.map(c => `${c}=${recs.filter(r => r.categories.includes(c)).length}`).join(', '));
console.log('tag checkboxes:', allTags.length);
console.log('shops sharing a base name (city added to link label):', dupBases.join(', ') || 'none');
