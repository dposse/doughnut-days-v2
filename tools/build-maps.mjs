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
import { head, header, footer, foot, esc, slug, EMAIL, MAP_EMBED, MAP_VIEW } from './layout.mjs';

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

/* Search index. Typing an apostrophe the other way round should still find the
   shop: 11 names here use a curly apostrophe and 14 use a straight one, so
   matching the raw text makes it a coin flip whether a search works.
   Curly quotes are folded to straight, then all punctuation becomes a space, so
   "stuf'd", "stuf’d" and "gluten friendly" all match. The squashed name is
   appended as well, so "stufd" and "burneys" find them too. */
const foldQuotes = s => s.toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
const loose = s => foldQuotes(s).replace(/[^a-z0-9]+/g, ' ').trim();
const squash = s => foldQuotes(s).replace(/[^a-z0-9]+/g, '');

function shopHtml(r) {
  const blob = [r.Name, r.Address, r.tags.join(' '), r.Description].join(' ');
  const search = loose(blob) + ' ' + squash(r.Name);
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
  return `      <section class="cat" data-category="${esc(cat)}" data-cat="${slug(cat)}" id="cat-${slug(cat)}">
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

// data-name carries the display name so the result message can say "in Novelty"
// rather than "in 1 category".
const categoryBoxes = CATEGORY_ORDER.map(c =>
  `          <label class="tagbox">
            <input type="checkbox" name="category" value="${slug(c)}" data-name="${esc(c)}">
            <span>${esc(c)} <span class="tagbox__n">(${recs.filter(r => r.categories.includes(c)).length})</span></span>
          </label>`).join('\n');

const categoryList = CATEGORY_ORDER.map(c => `        <li>${esc(c)}</li>`).join('\n');
const tagListAbout = allTags.map(t => `        <li>${esc(t)}</li>`).join('\n');

const html = head({
  title: 'Raleigh Donut Map',
  description: 'Every donut spot on the 2026 Raleigh Donut Map, grouped by category and filterable by tag.',
  depth: 1,
}) + header('/Raleigh-Donut-Map/') + `
  <section class="band band--pagehead">
    <h1 class="pagetitle tape" id="main" tabindex="-1">Raleigh Donut Map</h1>
  </section>

  <section class="band" id="about">
    <h2 class="tape tilt-l">About</h2>
    <div class="aboutcard">
      <p>During the pandemic and before AI, we started hunting for every location
      around the triangle that offered donuts. The origin is admittedly simple,
      literally just googling "Raleigh donut", but eventually moved into more
      laboriously documenting what we found on a map, creating a list by hand,
      and sharing on social media. We've been lucky to have folks reach out and
      share any locations we've missed and our updated donut data sets come from
      this work. If we've missed a spot, let us know by filling out the form on
      our <a href="/Contact-Us/">contact page</a> or sending an email to
      <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
    </div>
  </section>

  <section class="band" id="how-they-work">
    <h2 class="tape tilt-r">How they work</h2>
    <div class="prose">
      <p>Our map features local donut shops and makers within 60 miles of the
      North Carolina State Capitol Building. Chain shops like Krispy Kreme, Dunkin’,
      Rise, or Duck Donuts have been excluded from our map. Our focus is on
      local business, but some exceptions have been made for culturally
      significant locations. This is still Krispy Kreme town, after all.</p>
      <p>There is a Google Map to navigate through as well as a list that can be
      filtered and searched through. The map and list are sorted into 5
      categories and searchable by the tags, all listed below.</p>
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
    <h2 class="tape tilt-l" id="map-heading" tabindex="-1">Google Map Embed</h2>

    <!-- Off-screen until focused, like the page's skip link. Sits before the
         embed so keyboard users meet it before the map's own focus stops. -->
    <a class="btn btn--skipmap" href="#list-heading">Skip Google Map</a>

    <div class="maplayout">
      <div class="mapcard mapcard--tall">
        <iframe src="${MAP_EMBED}" title="2026 Raleigh Donut Map"
                loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
      <div class="mapside">
        <div class="mapside__blurb">
          <p>Our map features local donut shops and makers within 60 miles of the
          North Carolina State Capitol Building. If we've missed a spot, let us know by
          filling out the form on our <a href="/Contact-Us/">contact page</a> or
          sending an email to <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
        </div>
        <a class="btn" href="${MAP_VIEW}">Open in Google Maps</a>
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
    <h2 class="tape tilt-r" id="list-heading" tabindex="-1">Donut Map List</h2>

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

      <!-- Category before tag: it is the coarser cut, and checking one leaves
           that section alone on the page. -->
      <fieldset class="filters__group">
        <legend>Filter by category</legend>
        <div class="tagboxes">
${categoryBoxes}
        </div>
      </fieldset>

      <fieldset class="filters__group">
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

` + footer() + foot({ depth: 1, script: 'maps.js' });

writeFileSync(OUT, html, 'utf8');

const dupBases = Object.entries(baseCount).filter(([, n]) => n > 1).map(([b, n]) => `${b} x${n}`);
console.log('wrote', OUT);
console.log('shops:', recs.length);
console.log('sections:', CATEGORY_ORDER.map(c => `${c}=${recs.filter(r => r.categories.includes(c)).length}`).join(', '));
console.log('tag checkboxes:', allTags.length);
console.log('shops sharing a base name (city added to link label):', dupBases.join(', ') || 'none');
