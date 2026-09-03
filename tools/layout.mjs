/* Shared page chrome for the generated pages.
 *
 * The header and footer live here only. Adding a page to the nav means editing
 * NAV below, not five HTML files.
 *
 * site/index.html is hand-written and is NOT generated from this — if you
 * change the nav here, change it there too.
 */

export const EMAIL = 'hello@doughnut-days.com';

/* The Google My Maps embed.
 *
 * Google's dialog hands you a URL containing /u/5/ — that 5 is the position of
 * the map owner's account in their own signed-in account list, not part of the
 * map's identity. Dropped here: the map is public, and the path without it is
 * what everyone else resolves.
 *
 * ehbc is the colour of Google's own header strip above the map; 2E312F is what
 * the dialog produced. The viewer URL is the same map as a full page, built
 * from the same id so the two cannot point at different maps.
 */
export const MAP_ID = '1roZ3uaRy9r6bIvwyGwJ3zP6Mp-n2z2A';
export const MAP_EMBED = `https://www.google.com/maps/d/embed?mid=${MAP_ID}&ehbc=2E312F`;
export const MAP_VIEW = `https://www.google.com/maps/d/viewer?mid=${MAP_ID}`;

/* Every generated page is titled "<Page Name> — Doughnut Days". head() appends
   the suffix, so callers pass only the page name and it cannot drift.
   site/index.html is the home page and is titled just "Doughnut Days" — it is
   the site, so it needs no page name in front. */
export const SITE = 'Doughnut Days';

const NAV = [
  { href: '/Raleigh-Donut-Map/', label: 'Donut Map' },
  { href: '/Blog/', label: 'Blog' },
  { href: '/Contact-Us/', label: 'Contact Us' },
];

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const IG_SVG = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"></circle></svg>';

/* A doughnut, in the two-colour house style. Decorative wherever it is used —
   the post title next to it carries the meaning. */
export const DONUT_SVG = `<svg class="donut" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"></circle>
        <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="2"></circle>
        <circle cx="12" cy="4.6" r="1.05" fill="currentColor"></circle>
        <circle cx="18.2" cy="8.4" r="1.05" fill="currentColor"></circle>
        <circle cx="18.2" cy="15.6" r="1.05" fill="currentColor"></circle>
        <circle cx="12" cy="19.4" r="1.05" fill="currentColor"></circle>
        <circle cx="5.8" cy="15.6" r="1.05" fill="currentColor"></circle>
        <circle cx="5.8" cy="8.4" r="1.05" fill="currentColor"></circle>
      </svg>`;

/* `depth` is how far the page sits below site/, so relative asset paths work:
   /Blog/ is 1, /Blog/a-post/ is 2. */
export function head({ title, description, depth = 1, script = null }) {
  const up = '../'.repeat(depth);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ${esc(SITE)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${up}styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="page">
`;
}

export function header(currentHref) {
  const items = NAV.map(n => {
    const current = n.href === currentHref ? ' aria-current="page"' : '';
    return `        <li><a href="${n.href}"${current}>${esc(n.label)}</a></li>`;
  }).join('\n');
  return `
  <header class="masthead">
    <a class="wordmark" href="/">@doughnut_days</a>
    <nav class="nav">
      <ul>
${items}
        <li>
          <a class="ig" href="https://instagram.com/doughnut_days" aria-label="Doughnut Days on Instagram">
            ${IG_SVG}
          </a>
        </li>
      </ul>
    </nav>
  </header>
`;
}

export function footer() {
  const links = NAV.map(n => `        <li><a href="${n.href}">${esc(n.label)}</a></li>`).join('\n');
  return `
  <footer class="foot" id="contact">
    <div>
      <h2 class="tape tape--invert tilt-l">Pages</h2>
      <ul>
${links}
      </ul>
    </div>
    <div>
      <h2 class="tape tape--invert tilt-r">Email Us</h2>
      <a class="email" href="mailto:${EMAIL}">${EMAIL}</a>
      <div>
        <a class="ig" href="https://instagram.com/doughnut_days" aria-label="Doughnut Days on Instagram">
          ${IG_SVG}
        </a>
      </div>
    </div>
  </footer>

</div>
`;
}

export function foot({ depth = 1, script = null } = {}) {
  const up = '../'.repeat(depth);
  return (script ? `<script src="${up}${script}"></script>\n` : '') + `</body>\n</html>\n`;
}
