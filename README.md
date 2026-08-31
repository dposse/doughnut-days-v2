# doughnut-days-v2

Static site for Doughnut Days — plain HTML, CSS and images. Netlify builds
nothing; the pages are generated locally by Node scripts and committed.

## Structure

```
site/                           everything that gets deployed
  index.html                    landing page (hand-written)
  Raleigh-Donut-Map/            the donut map page (63 shops)      generated
  Blog/                         blog index + one page per post     generated
  Contact-Us/                   contact form + thanks page         generated
  maps.js                       tag + search filtering for the map page
  styles.css                    all styles (tokens at the top of the file)
  assets/                       hero photo, cruller photo
  assets/map-icons/             the five Google My Maps category pins
data/                           source of truth for generated content
tools/                          the generators
design_handoff_doughnut_days/   design system, prototypes, screenshots — not deployed
netlify.toml                    publish directory
```

Every page except the landing page is generated. Do not hand-edit them:

```
node tools/build.mjs
```

That runs `build-maps.mjs`, `build-blog.mjs` and `build-contact.mjs`. No npm
install. The header and footer come from `tools/layout.mjs`, so the nav is
defined once — except on `site/index.html`, which is hand-written and has its
own copy to keep in step.

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

## The blog

Posts live in `data/blog.json`. Add one to the `posts` array:

```json
{
  "title": "What Makes a Good Apple Fritter",
  "date": "2026-08-31",
  "body": ["First paragraph.", "Second paragraph."]
}
```

The URL comes from the title, so `/Blog/what-makes-a-good-apple-fritter/`.
Renaming a title changes the URL — the build deletes the old directory, so the
previous link will 404. Posts are ordered newest first by `date`, which must be
`YYYY-MM-DD`; it is displayed as "August 31st, 2026".

Everything currently in there is placeholder text.

## The contact form

The form posts to **Netlify Forms**. It needs no backend and no JavaScript, but
it only works once deployed — submitting from a local server does nothing.

After the first deploy the form shows up as "contact" under **Forms** in the
Netlify dashboard, where you turn on notification emails. Free tier is 100
submissions a month.

A successful submission lands on `/Contact-Us/thanks/`. Spam is filtered by a
honeypot field that is hidden from people but visible to bots.

`site/contact.js` replaces the browser's validation messages, which differ
between browsers and cannot be restyled. Each field gets a message below it,
tied to the input by `aria-describedby` and marked `role="alert"`, and focus
moves to the first bad field on submit so a screen reader reads the message on
arrival. Errors appear only after the first submit attempt, then clear as each
field is fixed.

`required` and `type="email"` stay in the markup and `novalidate` is set from
script, so with JavaScript off the browser still validates the old way rather
than not at all.

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
  the two spots that need the URL: the embed itself and the "Open in Google Maps"
  link, in `tools/build-maps.mjs`, plus `.mapcard` in `site/index.html`. All the
  prose around them is now the owner's real copy.
- Every blog post in `data/blog.json` is placeholder text.
- `hello@doughnut-days.com` is the address the owner's sketch gives, but the
  mailbox has not been confirmed as live.
- Netlify Forms only starts capturing after the first deploy, and notification
  emails have to be switched on in the dashboard.
