/* Raleigh Donut Map — list filtering.
   Progressive enhancement: the full list is in the HTML. This only hides and
   shows what is already there, so the page works with JS off. */
(function () {
  'use strict';

  var form = document.getElementById('filters');
  if (!form) return;

  var q = document.getElementById('q');
  var clear = document.getElementById('clear');
  var results = document.getElementById('results');
  var noresults = document.getElementById('noresults');
  var shops = Array.prototype.slice.call(document.querySelectorAll('.shop'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('.cat'));
  var boxes = Array.prototype.slice.call(form.querySelectorAll('input[name="tag"]'));

  // The query only applies once it is submitted, so that the announced result
  // count always matches what the user asked for.
  var query = '';

  function checkedTags() {
    return boxes.filter(function (b) { return b.checked; })
                .map(function (b) { return b.value; });
  }

  function matches(shop, tags) {
    if (query && shop.getAttribute('data-search').indexOf(query) === -1) return false;
    if (!tags.length) return true;
    var own = shop.getAttribute('data-tags').split(' ');
    // Any selected tag is enough — narrowing with every tag checked would
    // almost always return nothing.
    return tags.some(function (t) { return own.indexOf(t) !== -1; });
  }

  function describe(n) {
    var parts = [];
    if (query) parts.push('matching "' + query + '"');
    var tags = checkedTags().length;
    if (tags === 1) parts.push('tagged with 1 tag');
    else if (tags > 1) parts.push('tagged with any of ' + tags + ' tags');
    var noun = n === 1 ? 'spot' : 'spots';
    if (!parts.length) return n + ' ' + noun;
    return n + ' ' + noun + ' ' + parts.join(', ');
  }

  function apply(announce) {
    var tags = checkedTags();
    // A shop in two categories is listed twice, so count distinct shops.
    var seen = {};
    var total = 0;

    shops.forEach(function (shop) {
      var ok = matches(shop, tags);
      shop.hidden = !ok;
      var id = shop.getAttribute('data-id');
      if (ok && !seen[id]) { seen[id] = true; total++; }
    });

    // A category heading with nothing under it is hidden entirely.
    sections.forEach(function (section) {
      var visible = Array.prototype.slice.call(section.querySelectorAll('.shop'))
        .filter(function (s) { return !s.hidden; });
      section.hidden = visible.length === 0;
      var count = section.querySelector('.cat__count');
      if (count) {
        count.textContent = visible.length + (visible.length === 1 ? ' spot' : ' spots');
      }
    });

    noresults.hidden = total !== 0;
    if (announce) results.textContent = describe(total);
    return total;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    query = q.value.trim().toLowerCase();
    apply(true);
  });

  boxes.forEach(function (box) {
    box.addEventListener('change', function () { apply(true); });
  });

  clear.addEventListener('click', function () {
    q.value = '';
    query = '';
    boxes.forEach(function (b) { b.checked = false; });
    apply(true);
    q.focus();
  });

  // Clearing the field with the search input's own X should restore the list.
  q.addEventListener('search', function () {
    if (q.value === '') {
      query = '';
      apply(true);
    }
  });

  apply(false);
})();
