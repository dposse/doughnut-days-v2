/* Raleigh Donut Map — list filtering.
   Progressive enhancement: the full list is in the HTML. This only hides and
   shows what is already there, so the page works with JS off. */
(function () {
  'use strict';

  var form = document.getElementById('filters');
  if (!form) return;

  var q = document.getElementById('q');
  var clearAll = document.getElementById('clear');
  var clearSearch = document.getElementById('clear-search');
  var results = document.getElementById('results');
  var noresults = document.getElementById('noresults');
  var sections = Array.prototype.slice.call(document.querySelectorAll('.cat'));
  var boxes = Array.prototype.slice.call(form.querySelectorAll('input[name="tag"]'));
  var catBoxes = Array.prototype.slice.call(form.querySelectorAll('input[name="category"]'));

  // The query only applies once it is submitted, so the announced result count
  // always matches what the user asked for. `query` is what was typed, kept for
  // the message; the other two are what actually get matched.
  var query = '';
  var qLoose = '';
  var qSquash = '';

  /* Must fold exactly the way the index in build-maps.mjs does, or a search
     that should hit will miss. Curly quotes to straight, then punctuation to
     spaces; the squashed form also matches a name typed without its
     apostrophe. */
  function foldQuotes(s) {
    return s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  }
  function setQuery(raw) {
    query = raw.trim();
    qLoose = foldQuotes(query).replace(/[^a-z0-9]+/g, ' ').trim();
    qSquash = foldQuotes(query).replace(/[^a-z0-9]+/g, '');
  }

  function checkedTags() {
    return boxes.filter(function (b) { return b.checked; })
                .map(function (b) { return b.value; });
  }

  function checkedCats() {
    return catBoxes.filter(function (b) { return b.checked; });
  }

  function matches(shop, tags) {
    if (qLoose) {
      var hay = shop.getAttribute('data-search');
      var hit = hay.indexOf(qLoose) !== -1 ||
                (qSquash && hay.indexOf(qSquash) !== -1);
      if (!hit) return false;
    }
    if (!tags.length) return true;
    var own = shop.getAttribute('data-tags').split(' ');
    // Any selected tag is enough — narrowing with every tag checked would
    // almost always return nothing.
    return tags.some(function (t) { return own.indexOf(t) !== -1; });
  }

  function describe(n) {
    var spots = n + ' donut ' + (n === 1 ? 'spot' : 'spots');
    var parts = '';
    if (query) parts += ' matching "' + query + '"';
    var tags = checkedTags().length;
    if (tags) parts += ' using ' + tags + ' ' + (tags === 1 ? 'tag' : 'tags');
    var cats = checkedCats();
    // One category is worth naming; several are not worth listing out.
    if (cats.length === 1) parts += ' in ' + cats[0].getAttribute('data-name');
    else if (cats.length > 1) parts += ' in ' + cats.length + ' categories';
    return parts ? spots + ' found' + parts : spots;
  }

  function apply(announce, prefix) {
    var tags = checkedTags();
    var cats = checkedCats().map(function (b) { return b.value; });
    // A shop in two categories is listed twice, so count distinct shops.
    var seen = {};
    var total = 0;

    // Walked section by section, because a shop's row only survives if its
    // section survives — the same shop can be kept in one category and dropped
    // in another.
    sections.forEach(function (section) {
      var allowed = !cats.length || cats.indexOf(section.getAttribute('data-cat')) !== -1;
      var shown = 0;

      Array.prototype.slice.call(section.querySelectorAll('.shop')).forEach(function (shop) {
        var ok = allowed && matches(shop, tags);
        shop.hidden = !ok;
        if (!ok) return;
        shown++;
        var id = shop.getAttribute('data-id');
        if (!seen[id]) { seen[id] = true; total++; }
      });

      // A category heading with nothing under it is hidden entirely.
      section.hidden = shown === 0;
      var count = section.querySelector('.cat__count');
      if (count) count.textContent = shown + (shown === 1 ? ' spot' : ' spots');
    });

    noresults.hidden = total !== 0;
    if (announce) results.textContent = (prefix || '') + describe(total);
    return total;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setQuery(q.value);
    apply(true);
  });

  boxes.concat(catBoxes).forEach(function (box) {
    box.addEventListener('change', function () { apply(true); });
  });

  // Clears the text query only; the checkboxes stay as they are.
  clearSearch.addEventListener('click', function () {
    q.value = '';
    setQuery('');
    apply(true, 'Search cleared. ');
    q.focus();
  });

  clearAll.addEventListener('click', function () {
    q.value = '';
    setQuery('');
    boxes.concat(catBoxes).forEach(function (b) { b.checked = false; });
    // Say what happened before focus moves, or the move is all the user gets.
    apply(true, 'Cleared. ');
    q.focus();
  });

  // Escape in a search field still clears it natively.
  q.addEventListener('search', function () {
    if (q.value === '' && query !== '') {
      setQuery('');
      apply(true, 'Search cleared. ');
    }
  });

  apply(false);
})();
