export function createVehicleTypeahead(container, vehicles) {
  const wrap = document.createElement('div');
  wrap.className = 'vehicle-search-wrap typeahead-wrap';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'filter-search-input';
  input.placeholder = 'Search vehicles...';
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
    for (let i = 0; i < vehicles.length && matches.length < 8; i++) {
      if (vehicles[i].toLowerCase().includes(q)) matches.push(vehicles[i]);
    }
    if (!matches.length) return;

    for (const name of matches) {
      const item = document.createElement('div');
      item.className = 'typeahead-item';
      const idx = name.toLowerCase().indexOf(q);
      item.innerHTML =
        escapeHtml(name.slice(0, idx)) +
        '<strong>' + escapeHtml(name.slice(idx, idx + query.length)) + '</strong>' +
        escapeHtml(name.slice(idx + query.length));
      item.addEventListener('click', () => {
        window.location.href = '/vehicle?v=' + encodeURIComponent(name);
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

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
