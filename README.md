# doughnut-days-v2

Static landing page for Doughnut Days. No build step — plain HTML, CSS and images.

## Structure

```
site/                           everything that gets deployed
  index.html                    the whole page
  styles.css                    all styles (tokens at the top of the file)
  assets/                       hero photo, cruller photo
design_handoff_doughnut_days/   design system, prototypes, screenshots — not deployed
netlify.toml                    publish directory
```

## Local preview

Open `site/index.html` in a browser, or run any static server from `site/`.

## Netlify

Publish directory: `site`.
Build command: none.
Base directory: none (repo root).

`netlify.toml` at the repo root already sets this and overrides the dashboard
fields. The handoff bundle sits outside `site/`, so it stays version controlled
without being deployed.

## Still placeholder

- Google My Maps embed — see the `TODO` comment in `site/index.html` (`.mapcard`); drop the iframe in where the `.mapcard__frame` div is.
- `hello@doughnutdays.com` in the footer is invented — replace with the real address.
- The Donut Map Contact Form the copy promises does not exist yet.
- `#blog` and the maps link point at anchors on this page; they need real pages before launch.
