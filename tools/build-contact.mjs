/* Builds site/Contact-Us/ and site/Contact-Us/thanks/.
 *
 *   node tools/build-contact.mjs
 *
 * The form posts to Netlify Forms. Three attributes make that work:
 *   data-netlify="true"            Netlify picks the form up at deploy time
 *   name="contact"                 the form's name in the Netlify dashboard
 *   netlify-honeypot="bot-field"   spam trap, see the hidden field below
 *
 * The hidden form-name input is required for the POST to be attributed
 * correctly. `action` sends a successful submission to the thanks page rather
 * than Netlify's own generic one. None of this needs JavaScript.
 *
 * After the first deploy the form appears under Forms in the Netlify dashboard,
 * where notification emails are configured.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { head, header, footer, foot, EMAIL, esc } from './layout.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTDIR = join(ROOT, 'site', 'Contact-Us');

const page = head({
  title: 'Contact Us — Doughnut Days',
  description: 'Found a donut spot that is not on our map, or want to work with us? Get in touch.',
  depth: 1,
}) + header('/Contact-Us/') + `
  <section class="band band--pagehead">
    <h1 class="pagetitle tape" id="main" tabindex="-1">Contact Us</h1>
  </section>

  <section class="band">
    <div class="contact__intro">
      <p>Find a donut spot that's not on our map? Want to work with us?</p>
      <p>Fill out the contact form below or email
        <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
    </div>

    <h2 class="tape tilt-l">Contact Form</h2>

    <!-- Shown in place of the form once a submission goes through. The text is
         in the markup rather than built in script, so the live region has
         something to announce the moment it is unhidden. -->
    <div class="formnote" id="form-success" role="status" tabindex="-1" hidden>
      <p>Thanks! Your message has been successfully sent.</p>
    </div>

    <!-- required and type=email stay in the markup so the browser still
         validates with JavaScript off. contact.js sets novalidate and takes
         over, because the browsers' own messages differ from each other and
         cannot be restyled.

         action is the no-JavaScript path: a normal POST, which Netlify
         redirects to the thanks page. With script running, the submission goes
         in the background and the page is not left. -->
    <form class="contactform" id="contactform" name="contact" method="POST"
          data-netlify="true" netlify-honeypot="bot-field"
          action="/Contact-Us/thanks/">
      <input type="hidden" name="form-name" value="contact">
      <p class="hp">
        <label>Leave this field empty: <input name="bot-field" tabindex="-1" autocomplete="off"></label>
      </p>

      <div class="field">
        <label for="name">Name</label>
        <input id="name" name="name" type="text" autocomplete="name" required
               aria-describedby="name-error">
        <p class="field__error" id="name-error" role="alert" hidden></p>
      </div>

      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" required
               aria-describedby="email-error">
        <p class="field__error" id="email-error" role="alert" hidden></p>
      </div>

      <div class="field">
        <label for="message">Message</label>
        <textarea id="message" name="message" rows="8" required
                  aria-describedby="message-error"></textarea>
        <p class="field__error" id="message-error" role="alert" hidden></p>
      </div>

      <button class="btn btn--solid" id="send" type="submit">Send</button>
      <p class="field__error" id="form-error" role="alert" hidden></p>
    </form>
  </section>
` + footer() + foot({ depth: 1, script: 'contact.js' });

const thanks = head({
  title: 'Message sent — Doughnut Days',
  description: 'Your message has been sent to Doughnut Days.',
  depth: 2,
}) + header('/Contact-Us/') + `
  <section class="band band--pagehead">
    <h1 class="pagetitle tape" id="main" tabindex="-1">Message Sent</h1>
  </section>

  <section class="band">
    <div class="contact__intro">
      <p>Thanks — we got it. We read everything, though it might take us a
        little while to write back.</p>
      <p>If you would rather email us directly, we are at
        <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
    </div>

    <div class="actions">
      <a class="btn btn--solid" href="/Raleigh-Donut-Map/">Back to the donut maps</a>
      <a class="btn" href="/">Back to the home page</a>
    </div>
  </section>
` + footer() + foot({ depth: 2 });

mkdirSync(join(OUTDIR, 'thanks'), { recursive: true });
writeFileSync(join(OUTDIR, 'index.html'), page, 'utf8');
writeFileSync(join(OUTDIR, 'thanks', 'index.html'), thanks, 'utf8');
console.log('wrote', OUTDIR, 'and thanks/');
