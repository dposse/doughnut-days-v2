# Handoff: Doughnut Days — Landing Page

## Overview

Doughnut Days is a website and Instagram account connecting donut lovers to
donut makers in Raleigh, North Carolina. It ran from 2020–2021, went dark, and
is relaunching in 2026 with updated maps.

This package covers the **landing page**, the first page of the relaunch. The
owner holds `doughnut-days.com` (registered through Squarespace). The site does
not exist yet — this is a new build, not a migration.

## About the design files

The files in this bundle are **design references created in HTML** — prototypes
showing intended look and behavior, not production code to lift directly. They
run on a preview runtime (`support.js`, `<x-dc>`, `style-hover` attributes) that
is not part of any real site.

The task is to **recreate these designs in the target environment** using its
established patterns. There is no existing codebase, so pick what suits a small
content site that will grow to five or six pages with an occasional blog —
Astro, Eleventy, or plain hand-authored HTML/CSS are all reasonable. Avoid
reaching for a heavy framework; this is a brochure site with maps.

All inline styles in the prototypes are an artifact of the authoring tool.
**Rewrite them as real CSS** against the tokens in `DESIGN_SYSTEM.md`.

## Fidelity

**High-fidelity.** Colors, typography, spacing, and hover states are final and
were iterated on with the owner. Recreate them faithfully.

Two caveats:
- The layout is **desktop-only**. No mobile breakpoint has been designed. Rough
  mobile sketches for each section live in `Doughnut Days Landing Wireframes.dc.html`
  (option 1b) — treat them as intent, not spec.
- The map embed is a labeled placeholder. The owner is still preparing the
  Google My Maps links.

## The design system

`DESIGN_SYSTEM.md` in this folder is the authority for colors, type, components,
spacing, interaction states, and accessibility rules. **Read it before writing
any code, and build new pages from it rather than from this page's markup.**

Short version: zine/cut-and-paste. Paper white `#f9f7f1` and ink `#111`, nothing
else. Special Elite for headings and buttons, IBM Plex Sans for body. Hard 2px
rules, hard offset shadows, no border radius, no gradients. Headings are typed
labels on black boxes, rotated a degree or two, alternating direction.

## Screens

### Landing page (`Doughnut Days Landing.dc.html`)

Single scrolling page, `max-width: 1180px`, centered, with 2px ink borders on the
left and right edges so it reads as a sheet of paper.

**1. Header** — sticky, `z-index: 20`, paper background, `padding: 18px 32px`,
2px bottom rule. Wordmark `@doughnut_days` (Special Elite 19px) at left, linking
to home. Nav at right: Donut Maps, Blog, Contact Us, Instagram icon button.
Nav items are IBM Plex Sans 500, 13.5px, uppercase, `letter-spacing: .08em`.

**2. Hero** — full-bleed photograph, 600px tall, `object-fit: cover`,
`object-position: center 40%`, decorative (`alt=""`). Three elements absolutely
positioned over it:
- h1 "Doughnut Days" — Special Elite 74px, paper on ink, `padding: 16px 26px`,
  `rotate(-1.4deg)`, at `top: 150px; left: 52px`.
- "(And Other Things)" — Special Elite 28px, its own ink box, `rotate(1.2deg)`,
  at `top: 264px; left: 210px`. A separate `<p>`, deliberately not part of the h1.
- Intro card — 560px wide, paper fill, 2px border, `7px 7px 0` ink shadow,
  `rotate(-.5deg)`, at `bottom: 38px; left: 52px`.

**3. Intro** — two equal grid columns, `gap: 44px`, `padding: 56px 52px`. Body
copy only, no heading. The first column contains two paragraphs separated by a
line break rather than a paragraph gap (the owner asked for this specifically).

**4. Supporting Our Local Bakeries** — grid `1.35fr 1fr`, `gap: 48px`. Taped h2
at `rotate(-1deg)`, two body paragraphs, and a pasted photo at `rotate(1.8deg)`
with an inverted caption at `rotate(-2.2deg)`.

**5. Raleigh Donut Maps** — taped h2 at `rotate(.8deg)`, then a grid of
`1fr 1.1fr`. Left: two paragraphs and two buttons ("Open the Raleigh maps →"
primary, "Suggest a spot" secondary). Right: a pasted card at `rotate(-.7deg)`
holding the map placeholder and a row of filter chips (Vegan, Gluten-friendly,
Fritters, Search — Search is the inverted/active one).

**6. Footer** — ink background, two equal columns, `padding: 44px 52px`. Both
headings are h2s in inverted taped labels. Left: "Pages" with a link list.
Right: "Contact Us" with an email link and the Instagram icon.

## Interactions

- **Text links underline on hover and do not change color.** Implemented as a
  transparent 2px bottom border that takes the text color. In flex columns the
  link needs `width: fit-content` or the underline runs the full column width.
- Buttons and icon buttons invert fill and text on hover.
- Nothing animates, moves, or scales. No transitions.
- Focus: `outline: 2px solid #111; outline-offset: 2px` on `:focus-visible`.
- The header is sticky; in-page anchors need `scroll-margin-top: 78px`.

## State

None. The page is static. State enters with the maps page (filters, search) and
the contact form.

## Assets

In `assets/`:

| File | Use |
|---|---|
| `hero-donut.jpg` | Current hero. Glazed ring and apple fritter, held. Portrait original, cropped by `object-position` — only a horizontal band shows. |
| `hero-sun.jpg` | Previous hero, the felt sun from the original site. Kept as an alternative; the owner is undecided. |
| `cruller-cutout.jpg` | Heart-shaped crullers from Little Blue Bakehouse, used in the bakeries section. |

All are the owner's own photographs, cropped from originals. If the hero is ever
reshot, shoot **landscape** — the current portrait source wastes most of the
frame at 600px tall.

Fonts are Google Fonts (Special Elite, IBM Plex Sans). No icon library — the
Instagram mark is a small inline SVG.

## Copy

Every word on the page comes from the owner's copy document and is **verbatim**.
Do not rewrite, tighten, or "fix" it. Two edits the owner made after the first
pass are already reflected: "local" removed from "no shortage of incredible
bakers," and the line break in the 2020/2021 paragraph.

## Before launch

Real blockers, roughly in priority order:

1. **Nav links go nowhere.** Donut Maps, Blog, and Contact Us are in-page
   anchors. Build those pages or remove the links.
2. **Map embed is a placeholder.** Owner is preparing the Google My Maps links.
   The copy also promises filters and search, which don't exist yet.
3. **Donut Map Contact Form** is named in the copy and doesn't exist.
4. **`hello@doughnutdays.com` is invented.** Needs the real address — and note
   the domain is `doughnut-days.com`, with a hyphen.
5. **No mobile layout.**
6. No 404, no hamburger menu.

## Files

| File | What it is |
|---|---|
| `DESIGN_SYSTEM.md` | **The design system. Read first.** |
| `Doughnut Days Landing.dc.html` | The final landing page design |
| `Doughnut Days Landing Wireframes.dc.html` | Three explored directions (1a, 1b, 1c) plus mobile sketches and the original build spec. 1b was chosen. |
| `assets/` | Photographs |
| `screenshots/` | The landing page captured top to bottom (`01`–`04`), desktop width |
| `support.js` | Preview runtime. Needed only to open the `.dc.html` files in a browser; not part of the site. |

## Deployment

`Deploying Doughnut Days.dc.html` in the parent project is a plain-language
guide written for the owner: static host (Netlify / Cloudflare Pages / Vercel)
plus DNS records added in Squarespace, keeping the domain where it is.
