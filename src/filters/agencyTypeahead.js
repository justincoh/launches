import { AGENCY_NAMES } from '../data/agencyNames.js';

export function createAgencyTypeahead(container, agencies) {
  const wrap = document.createElement('div');
  wrap.className = 'vehicle-search-wrap typeahead-wrap';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'filter-search-input';
  input.placeholder = 'Search agencies...';
  wrap.appendChild(input);

  const list = document.createElement('div');
  list.className = 'typeahead-list';
  wrap.appendChild(list);

  container.appendChild(wrap);

  let highlightedIdx = -1;

  input.addEventListener('input', () => {
    showSuggestions(input.value.trim());
  });

  input.addEventListener('keydown', (e) => {
    const items = list.querySelectorAll('.typeahead-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedIdx = Math.min(highlightedIdx + 1, items.length - 1);
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedIdx = Math.max(highlightedIdx - 1, 0);
      updateHighlight(items);
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault();
      items[highlightedIdx].click();
    } else if (e.key === 'Escape') {
      list.innerHTML = '';
      highlightedIdx = -1;
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      list.innerHTML = '';
      highlightedIdx = -1;
    }, 150);
  });

  function showSuggestions(query) {
    list.innerHTML = '';
    highlightedIdx = -1;
    if (!query || query.length < 1) return;

    const q = query.toLowerCase();
    const matches = [];
    for (let i = 0; i < agencies.length && matches.length < 8; i++) {
      const code = agencies[i];
      const name = AGENCY_NAMES[code] || code;
      if (code.toLowerCase().includes(q) || name.toLowerCase().includes(q)) {
        matches.push(code);
      }
    }
    if (!matches.length) return;

    for (const code of matches) {
      const name = AGENCY_NAMES[code] || code;
      const display = name !== code ? `${code} (${name})` : code;
      const item = document.createElement('div');
      item.className = 'typeahead-item';
      item.textContent = display;
      item.addEventListener('click', () => {
        window.location.href = '/agency?a=' + encodeURIComponent(code);
      });
      list.appendChild(item);
    }
  }

  function updateHighlight(items) {
    items.forEach((el, i) => el.classList.toggle('highlighted', i === highlightedIdx));
    if (items[highlightedIdx]) items[highlightedIdx].scrollIntoView({ block: 'nearest' });
  }

  return { input };
}
