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
  var shops = Array.prototype.slice.call(document.querySelectorAll('.shop'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('.cat'));
  var boxes = Array.prototype.slice.call(form.querySelectorAll('input[name="tag"]'));

  // The query only applies once it is submitted, so the announced result count
  // always matches what the user asked for.
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
    var spots = n + ' donut ' + (n === 1 ? 'spot' : 'spots');
    var tags = checkedTags().length;
    var tagPart = tags ? ' using ' + tags + ' ' + (tags === 1 ? 'tag' : 'tags') : '';
    var queryPart = query ? ' matching "' + query + '"' : '';
    if (!tagPart && !queryPart) return spots;
    return spots + ' found' + queryPart + tagPart;
  }

  function apply(announce, prefix) {
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
    if (announce) results.textContent = (prefix || '') + describe(total);
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

  // Clears the text query only; the tag checkboxes stay as they are.
  clearSearch.addEventListener('click', function () {
    q.value = '';
    query = '';
    apply(true, 'Search cleared. ');
    q.focus();
  });

  clearAll.addEventListener('click', function () {
    q.value = '';
    query = '';
    boxes.forEach(function (b) { b.checked = false; });
    // Say what happened before focus moves, or the move is all the user gets.
    apply(true, 'Cleared. ');
    q.focus();
  });

  // Escape in a search field still clears it natively.
  q.addEventListener('search', function () {
    if (q.value === '' && query !== '') {
      query = '';
      apply(true, 'Search cleared. ');
    }
  });

  apply(false);
})();
