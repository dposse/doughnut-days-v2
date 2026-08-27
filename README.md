# doughnut-days-v2

Static landing page for Doughnut Days. No build step — plain HTML, CSS and images.

## Structure

```
site/                           everything that gets deployed
  index.html                    landing page
  Raleigh-Donut-Map/index.html  the donut map page (63 shops)
  maps.js                       tag + search filtering for the map page
  styles.css                    all styles (tokens at the top of the file)
  assets/                       hero photo, cruller photo
  assets/map-icons/             the five Google My Maps category pins
design_handoff_doughnut_days/   design system, prototypes, screenshots — not deployed
netlify.toml                    publish directory
```

Filtering is progressive enhancement — the full list is in the HTML and `maps.js`
only hides and shows rows, so the page still works with JavaScript off.

## Regenerating the donut map list

`site/Raleigh-Donut-Map/index.html` is generated. Do not hand-edit the shop
list — edit `data/raleigh-donut-map.json`, then:

```
node tools/build-maps.mjs
```

No npm install. The build rebuilds the whole page, so edits to the page's
wording, blurbs and TODOs belong in `tools/build-maps.mjs`, not in the
generated HTML.

`data/raleigh-donut-map.json` is the source of truth for the shop list. One
entry per shop:

```json
{
  "name": "Baker's Dozen (Durham)",
  "address": "3438 Hillsborough Rd, Durham, NC 27705",
  "website": "https://example.com",
  "categories": ["Traditional"],
  "tags": ["Yeast", "Cake"],
  "description": "..."
}
```

- `website` is `null` when a shop has none; the page then shows "No website"
  as plain text instead of a link.
- `categories` must come from: Traditional, Novelty, Gourmet, Gluten-Friendly,
  Vegan. A shop may list two and is then shown under both.
- `tags` are free text. "Yeast-Raised" is treated as "Yeast".

The build fails loudly on a missing field or an unknown category, so a bad edit
does not reach the page.

## CSS conventions

`site/styles.css` uses one cascade layer, `base`. Rules that set a default for
an element or a whole region go inside `@layer base { ... }`; rules that style
one named component stay unlayered.

Unlayered beats layered regardless of specificity, so a component class always
wins against a default without needing a defensive selector. Before this,
`.band p` silently overrode `.cat__count`, and `h3.tape` overrode
`.key__heading` — the declarations were there but never applied.

When adding CSS:

- styling an element or a whole region? put it in `@layer base`
- styling one named thing? leave it unlayered

Layering only settles conflicts over the *same* property. A component that
never declares `padding` still inherits the region's, which is why the nav and
footer link rules keep their `:not(.ig)`.

## Local preview

Any static server pointed at `site/` works. With Node installed:

```
npx --yes serve site -l 3000
```

Then open http://localhost:3000. `.claude/launch.json` runs exactly this
command, so Claude Code can start the preview itself.

Opening `site/index.html` as a `file://` URL mostly works too, but relative
paths and the Google Fonts request behave differently there — prefer the
server when checking a change.

## Netlify

Publish directory: `site`.
Build command: none.
Base directory: none (repo root).

`netlify.toml` at the repo root already sets this and overrides the dashboard
fields. The handoff bundle sits outside `site/`, so it stays version controlled
without being deployed.

## Still placeholder

- Google My Maps embed — the map is built but not public yet. `TODO` comments mark
  both spots: `site/index.html` (`.mapcard`) and `site/Raleigh-Donut-Map/index.html`
  (the embed, the blurb beside it, and the "Open in Google Maps" link).
- The About blurb and the blurb beside the map on the donut map page are
  placeholder text.
- `hello@doughnutdays.com` in the footer is invented — replace with the real address.
- The Donut Map Contact Form the copy promises does not exist yet.
- `#blog` and the maps link point at anchors on this page; they need real pages before launch.
