/* Contact form validation.
   The browser's own messages are inconsistent between browsers and cannot be
   restyled, so they are switched off and replaced with a message under each
   field.

   Progressive enhancement: `novalidate` is set here, in script, not in the
   HTML. With JavaScript off the markup still carries `required` and
   `type="email"`, so the browser validates the old way rather than not at
   all. */
(function () {
  'use strict';

  var form = document.getElementById('contactform');
  if (!form) return;

  form.setAttribute('novalidate', '');

  // Deliberately loose: something, an @, something, a dot, something. Anything
  // stricter starts rejecting addresses that are perfectly real.
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var fields = [
    { id: 'name', required: 'Name is required' },
    {
      id: 'email',
      required: 'Email is required',
      check: function (v) {
        return EMAIL.test(v) ? '' : 'Enter a valid email in format email@domain.com';
      }
    },
    { id: 'message', required: 'Message is required' }
  ];

  // Errors only start following along after the first submit attempt, so
  // nothing shouts at someone who is still filling the form in.
  var submitted = false;

  function errorFor(id) { return document.getElementById(id + '-error'); }

  function problem(field) {
    var el = document.getElementById(field.id);
    var value = el.value.trim();
    if (!value) return field.required;
    return field.check ? field.check(value) : '';
  }

  function show(field, message) {
    var el = document.getElementById(field.id);
    var box = errorFor(field.id);
    if (message) {
      // Only touch the DOM when the message actually changes, or role="alert"
      // re-announces the same text on every keystroke.
      if (box.textContent !== message) box.textContent = message;
      box.hidden = false;
      el.setAttribute('aria-invalid', 'true');
    } else {
      box.textContent = '';
      box.hidden = true;
      el.removeAttribute('aria-invalid');
    }
    return Boolean(message);
  }

  fields.forEach(function (field) {
    var el = document.getElementById(field.id);
    el.addEventListener('blur', function () {
      if (submitted) show(field, problem(field));
    });
    el.addEventListener('input', function () {
      // Clear a showing error as soon as it is fixed, but do not raise a new
      // one mid-typing.
      if (submitted && el.getAttribute('aria-invalid') === 'true' && !problem(field)) {
        show(field, '');
      }
    });
  });

  var button = document.getElementById('send');
  var success = document.getElementById('form-success');
  var sendError = document.getElementById('form-error');

  function failed(message) {
    sendError.textContent = message;
    sendError.hidden = false;
    button.disabled = false;
    button.textContent = 'Send';
  }

  function succeeded() {
    form.hidden = true;
    success.hidden = false;
    // Focus the message as well as announcing it. A live region alone is
    // easily missed; focus makes sure it is read, and puts the reading
    // position somewhere sensible now that the form is gone.
    success.focus();
  }

  function send() {
    sendError.hidden = true;
    sendError.textContent = '';
    button.disabled = true;
    button.textContent = 'Sending…';

    // Netlify reads the submission from the form-name field, not the path.
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      succeeded();
    }).catch(function () {
      failed('Your message could not be sent. Try again, or email us directly.');
    });
  }

  form.addEventListener('submit', function (e) {
    submitted = true;
    var firstBad = null;

    fields.forEach(function (field) {
      var message = problem(field);
      if (show(field, message) && !firstBad) firstBad = field;
    });

    if (firstBad) {
      e.preventDefault();
      // Focus carries the announcement: the field's aria-describedby points at
      // its error, so a screen reader reads the message on arrival. That works
      // even where a live region would be missed.
      document.getElementById(firstBad.id).focus();
      return;
    }

    // Valid. Submit in the background so the page is not left.
    e.preventDefault();
    send();
  });
})();
