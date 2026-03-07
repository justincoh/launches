export function createTypeahead(container, items, options = {}) {
  const { placeholder = 'Search...', match, render, url } = options;

  const wrap = document.createElement('div');
  wrap.className = 'vehicle-search-wrap typeahead-wrap';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'filter-search-input';
  input.placeholder = placeholder;
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
    const listItems = list.querySelectorAll('.typeahead-item');
    if (!listItems.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedIdx = Math.min(highlightedIdx + 1, listItems.length - 1);
      updateHighlight(listItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedIdx = Math.max(highlightedIdx - 1, 0);
      updateHighlight(listItems);
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault();
      listItems[highlightedIdx].click();
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
    for (let i = 0; i < items.length && matches.length < 8; i++) {
      if (match(items[i], q)) matches.push(items[i]);
    }
    if (!matches.length) return;

    for (const item of matches) {
      const el = document.createElement('div');
      el.className = 'typeahead-item';
      el.innerHTML = render(item, query);
      el.addEventListener('click', () => {
        window.location.href = url(item);
      });
      list.appendChild(el);
    }
  }

  function updateHighlight(listItems) {
    listItems.forEach((el, i) => el.classList.toggle('highlighted', i === highlightedIdx));
    if (listItems[highlightedIdx]) listItems[highlightedIdx].scrollIntoView({ block: 'nearest' });
  }

  return { input };
}
