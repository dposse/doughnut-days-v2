/* Regenerates site/Raleigh-Donut-Map/index.html from the shop database.
 *
 *   node tools/build-maps.mjs
 *
 * Reads data/raleigh-donut-map.json — the source of truth for the shop list.
 * Edit that file, run this, commit the result. No npm dependencies.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data', 'raleigh-donut-map.json');
const OUT = join(ROOT, 'site', 'Raleigh-Donut-Map', 'index.html');

const db = JSON.parse(readFileSync(DATA, 'utf8'));
if (!Array.isArray(db.shops)) throw new Error('data file has no "shops" array');

const recs = db.shops.map((s, i) => {
  for (const field of ['name', 'address', 'description']) {
    if (!s[field]) throw new Error(`shop ${i} ("${s.name || '?'}") is missing ${field}`);
  }
  if (!Array.isArray(s.categories) || !s.categories.length) {
    throw new Error(`shop "${s.name}" has no categories`);
  }
  return s;
});

/* ---------- shaping ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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
  r.Name = r.name;
  r.Address = r.address;
  r.Website = r.website;
  r.Description = r.description;
  r.tags = [...new Set((r.tags || []).map(t => TAG_ALIASES[t] || t))];
  r.hasSite = Boolean(r.website);
  r.city = cityOf(r.address);
  r.base = baseName(r.name);
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
          <p class="shop__address"><span class="shop__label">Address:</span> ${esc(r.Address)}</p>
          ${website}
          <div class="shop__tagrow">
            <p class="shop__label">Tags:</p>
            <ul class="shop__tags">
${r.tags.map(t => `              <li class="chip">${esc(t)}</li>`).join('\n')}
            </ul>
          </div>
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
        <h3 class="tape tilt-l">Categories</h3>
        <ul class="plainlist">
${categoryList}
        </ul>
      </div>
      <div>
        <h3 class="tape tilt-r">Tags</h3>
        <ul class="plainlist plainlist--wrap">
${tagListAbout}
        </ul>
      </div>
    </div>
  </section>

  <section class="band" id="map">
    <h2 class="tape tilt-r" id="map-heading" tabindex="-1">Google Map Embed</h2>

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

    <!-- The mirror of the one above: someone shift-tabbing up from the list
         reaches this before the map's own focus stops, and it puts them back
         above the embed. -->
    <a class="btn btn--skipmap" href="#map-heading">Skip Google Map<span class="sr-only">, back to the Google Map Embed heading</span></a>

    <h3 class="tape tilt-l key__heading">Key</h3>
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
