# Doughnut Days — Design System

The zine/cut-and-paste system used across doughnut-days.com. Every new page and
update should be built from these rules. If a value isn't here, derive it from
the nearest thing that is rather than inventing a new one.

---

## 1. Principle

Photocopied zine, not polished web. The page is paper white and near-black ink,
with real photographs pasted onto it. Headings are typed labels taped down at
slight angles. Structure comes from hard 2px rules, not from cards, gradients,
or rounded corners.

Two colors only. No accent color, no gradients, no border radius anywhere.

---

## 2. Color

| Token | Value | Use |
|---|---|---|
| Paper | `#f9f7f1` | Page background; text on dark surfaces |
| Ink | `#111` | All text, all rules and borders, dark surfaces |
| Ink shadow | `rgba(17,17,17,.9)` | Hard offset shadows on pasted elements |
| Hatch | `rgba(17,17,17,.05)` | Placeholder fill (45° repeating stripes) |
| Hatch rule | `rgba(17,17,17,.4)` | 1px dashed border on placeholders |
| Muted ink | `#555` | Small secondary caption text only |

Never use pure white (`#fff`) — the paper white is warm and the difference is
visible when the two sit side by side.

The brand guide also specifies `#fdc689` (doughnut base), `#fff200` (frosting)
and `#eb3c8e` (text pink). These were tested and deliberately removed. Do not
reintroduce them without a decision: `#eb3c8e` on paper measures 3.5:1, which
fails WCAG AA for body-size text.

---

## 3. Type

Two families, loaded from Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

**Special Elite** — the typewriter voice. Headings, buttons, captions, the
wordmark, placeholder labels. Always weight 400. Never used for body copy.

**IBM Plex Sans** — everything readable. Body paragraphs, nav, filter chips,
footer links. Weights 400 / 500 / 600.

### Scale

| Role | Family | Size | Other |
|---|---|---|---|
| h1 (hero) | Special Elite | 74px | line-height 1, letter-spacing .005em |
| Hero subhead | Special Elite | 28px | in its own black box, separate from the h1 |
| h2 (section) | Special Elite | 34px | line-height 1.1 |
| h2 (footer) | Special Elite | 19px | letter-spacing .06em |
| Body | IBM Plex Sans | 17px | line-height 1.65, `text-wrap: pretty` |
| Hero intro | IBM Plex Sans | 16.5px | line-height 1.6 |
| Wordmark | Special Elite | 19px | letter-spacing .01em |
| Nav | IBM Plex Sans 500 | 13.5px | uppercase, letter-spacing .08em |
| Buttons | Special Elite | 16px | |
| Footer links | IBM Plex Sans | 15px | |
| Caption | Special Elite | 12.5px | |
| Filter chip | IBM Plex Sans 500 | 11.5px | uppercase, letter-spacing .07em |
| Small meta | IBM Plex Sans | 12px | letter-spacing .04em, `#555` |

**Headings are Title Case, never all-caps.** Nav items and filter chips are the
only uppercase elements, and they are uppercased with `text-transform` on
short labels — never on a heading or a sentence.

---

## 4. The taped label

The signature element. Every section heading is one.

```html
<h2 style="display:inline-block;font-family:'Special Elite',monospace;
  font-weight:400;font-size:34px;line-height:1.1;color:#f9f7f1;
  background:#111;padding:11px 18px;transform:rotate(-1deg)">Heading</h2>
```

- `display:inline-block` so the box hugs the text — never full width.
- Paper text on ink. On a dark surface (the footer) invert: ink text on paper.
- Rotation between `-1.5deg` and `1.5deg`. **Alternate the direction** down the
  page so no two adjacent labels lean the same way.
- Padding scales with size: 16px 26px at 74px, 11px 18px at 34px, 8px 14px at 19px.

---

## 5. The pasted photo

Photographs are objects sitting on the page, not backgrounds bleeding into it.

```html
<figure style="transform:rotate(1.8deg)">
  <img style="width:100%;height:300px;object-fit:cover;border:2px solid #111;
    box-shadow:7px 7px 0 rgba(17,17,17,.9)">
  <figcaption style="font-family:'Special Elite',monospace;font-size:12.5px;
    color:#f9f7f1;background:#111;display:inline-block;padding:4px 9px;
    transform:rotate(-2.2deg)">Caption</figcaption>
</figure>
```

- 2px ink border, hard offset shadow `7px 7px 0`, no blur, no softness.
- Rotate the figure; rotate the caption the *opposite* way, slightly more.
- Captions name the subject and the bakery: "Heart crullers, Little Blue Bakehouse".
- The hero image is the one exception: full-bleed, no border, no rotation, and
  purely decorative — `alt=""`.

The same treatment (2px border + `7px 7px 0` shadow) applies to any pasted
panel: the hero intro card, the map card.

---

## 6. Layout

- Page: `max-width:1180px`, centered, with 2px ink borders left and right so the
  content reads as a sheet of paper on the screen.
- Sections separated by `border-bottom:2px solid #111` — full width, no gaps.
- Section padding: `56–60px` vertical, `52px` horizontal.
- Two-column sections use CSS grid with `gap:44–48px` and `align-items:start`.
  Ratios in use: `1fr 1fr` (equal text columns), `1.35fr 1fr` (text + photo),
  `1fr 1.1fr` (text + map).
- Always use flex/grid with `gap` for groups of siblings. Never space with margins
  on individual items or with source whitespace.

---

## 7. Components

### Header
Sticky, `z-index:20`, paper background, `padding:18px 32px`,
`border-bottom:2px solid #111`. Wordmark left, nav right.

The wordmark `@doughnut_days` stands in for a logo and links to `/`.

### Nav
`<nav>` containing a `<ul>` with `list-style:none` and `<li>` per item — links
in a list must be marked up as a list. No `aria-label` on the nav.

Items: Donut Maps, Blog, Contact Us, then the Instagram icon.

### Buttons

Primary — ink fill, inverts on hover:
```html
<a style="font-family:'Special Elite',monospace;font-size:16px;
  text-decoration:none;background:#111;color:#f9f7f1;border:2px solid #111;
  padding:12px 20px" style-hover="background:#f9f7f1;color:#111">Label →</a>
```

Secondary — paper fill, same geometry, inverts to ink on hover.

No shadow on buttons. An ink button with an ink shadow bleeds together and reads
as a smudge.

### Icon button
38×38, `box-shadow: inset 0 0 0 2px #111` for the ring — **not** `border`. A 2px
border on a box that lands on a fractional pixel drops an edge at some zoom
levels and device pixel ratios; an inset shadow renders crisply. Fills with ink
on hover.

### Filter chip
`border:2px solid #111`, `padding:4px 9px`, uppercase 11.5px. The active or
current chip inverts to ink fill. Current set: Vegan, Gluten-friendly, Fritters,
plus Search.

### Placeholder block
For content that doesn't exist yet (map embeds, unshot photos):
```html
<div style="background:repeating-linear-gradient(45deg,rgba(17,17,17,.05) 0 8px,
  transparent 8px 16px);border:1px dashed rgba(17,17,17,.4)">
  <span style="font-family:'Special Elite',monospace;font-size:15px">What goes here</span>
  <span style="font-size:12px;color:#555">detail · placeholder</span>
</div>
```
Always say what belongs there. Never leave an empty grey box.

### Footer
Ink background, paper text, `padding:44px 52px`, two equal grid columns.
Headings are inverted taped labels. Link lists are real `<ul>`s.

---

## 8. Interaction states

- **Links underline; they do not change color.** Text links get
  `border-bottom:2px solid transparent` plus `padding:4px 0` (2px in the footer),
  and the border takes the current text color on hover. Add `width:fit-content`
  in a flex column, or the underline spans the whole column.
- Buttons and icon buttons invert their fill and text on hover.
- Nothing moves, scales, or animates on hover.
- Focus: `:focus-visible { outline:2px solid #111; outline-offset:2px }`. Never
  leave the browser's default blue ring.

---

## 9. Accessibility rules (already applied — keep them)

- One `<h1>` per page. Headings are h1 → h2 with no skipped levels. Footer
  headings are h2s, not h3s — they aren't subsections of the content above.
- Headings are Title Case, not all-caps.
- Link groups are `<ul>`/`<li>`.
- Icon links carry a descriptive label — `aria-label="Doughnut Days on Instagram"`,
  not `"Instagram"`.
- A `→` in a link is announced by screen readers, so any link ending in an arrow
  needs an `aria-label` with the clean text: `aria-label="Open the Raleigh Donut Maps"`.
- Decorative images get `alt=""`. Content photos describe the subject.
- Body text must clear 4.5:1 against its background. Both colors in this system
  clear it comfortably; anything new must be checked.

---

## 10. Voice

From the 2026 brand guide. Archetype: Everyman / Jester.

Authentic, relatable, a little sarcastic — against the system, never against a
donut. The tone is an informant's: what you can get, what it costs, how hard it
was to get. Conversational, never markety. First person plural.

The site's copy is written by the owner and should be treated as verbatim.
Format it; don't rewrite it.

---

## 11. Not yet designed

Anything built for these should extend this system, not restart:

- Raleigh Donut Maps page — the landing page's primary destination. Google My
  Maps embed, filterable shop list, search.
- Blog index and post.
- Contact page and the Donut Map Contact Form promised in the copy.
- Mobile layouts. The landing page is desktop-only; the wireframe file has
  mobile sketches for the header, hero, and sections.
- Hamburger menu open state.
- 404.
