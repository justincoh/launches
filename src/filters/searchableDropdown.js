export function createSearchableDropdown(container, { label, options, value, onChange, displayNames }) {
  const item = document.createElement('div');
  item.className = 'filter-item';

  function displayLabel(val) {
    if (!val) return label;
    if (displayNames && displayNames[val]) return `${val} (${displayNames[val]})`;
    return val;
  }

  const trigger = document.createElement('button');
  trigger.className = 'filter-trigger' + (value ? ' has-value' : '');
  trigger.innerHTML = `<span class="label">${displayLabel(value)}</span><span class="arrow">\u25BC</span>`;

  const panel = document.createElement('div');
  panel.className = 'dropdown-panel';
  panel.style.display = 'none';

  const searchDiv = document.createElement('div');
  searchDiv.className = 'dropdown-search';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = `Search ${label.toLowerCase()}...`;
  searchDiv.appendChild(searchInput);

  const optList = document.createElement('div');
  optList.className = 'dropdown-options';

  panel.appendChild(searchDiv);
  panel.appendChild(optList);
  item.appendChild(trigger);
  item.appendChild(panel);
  container.appendChild(item);

  let isOpen = false;
  let highlighted = -1;
  let filtered = [];

  function renderOptions(query = '') {
    const q = query.toLowerCase();
    filtered = q
      ? options.filter(o => {
          if (o.value.toLowerCase().includes(q)) return true;
          if (displayNames && displayNames[o.value] && displayNames[o.value].toLowerCase().includes(q)) return true;
          return false;
        })
      : options;

    optList.innerHTML = '';

    // "All" option
    const allOpt = document.createElement('div');
    allOpt.className = 'dropdown-option' + (!value ? ' selected' : '');
    allOpt.textContent = `All ${label}`;
    allOpt.addEventListener('click', () => {
      select(null);
    });
    optList.appendChild(allOpt);

    for (let i = 0; i < filtered.length; i++) {
      const o = filtered[i];
      const div = document.createElement('div');
      div.className = 'dropdown-option' + (o.value === value ? ' selected' : '');
      const nameSpan = displayNames && displayNames[o.value]
        ? `${o.value} <span class="full-name">(${displayNames[o.value]})</span>`
        : o.value;
      div.innerHTML = `<span>${nameSpan}</span><span class="count">${o.count}</span>`;
      div.addEventListener('click', () => select(o.value));
      optList.appendChild(div);
    }
    highlighted = -1;
  }

  function select(val) {
    close();
    onChange(val);
  }

  function open() {
    isOpen = true;
    panel.style.display = 'flex';
    trigger.classList.add('open');
    searchInput.value = '';
    renderOptions();
    searchInput.focus();
  }

  function close() {
    isOpen = false;
    panel.style.display = 'none';
    trigger.classList.remove('open');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) close(); else open();
  });

  panel.addEventListener('click', e => e.stopPropagation());

  searchInput.addEventListener('input', () => {
    renderOptions(searchInput.value);
  });

  searchInput.addEventListener('keydown', (e) => {
    const items = optList.querySelectorAll('.dropdown-option');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlighted = Math.min(highlighted + 1, items.length - 1);
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlighted = Math.max(highlighted - 1, 0);
      updateHighlight(items);
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      items[highlighted].click();
    } else if (e.key === 'Escape') {
      close();
    }
  });

  function updateHighlight(items) {
    items.forEach((el, i) => {
      el.classList.toggle('highlighted', i === highlighted);
    });
    if (items[highlighted]) {
      items[highlighted].scrollIntoView({ block: 'nearest' });
    }
  }

  document.addEventListener('click', () => {
    if (isOpen) close();
  });

  return {
    update(newOptions, newValue) {
      options = newOptions;
      value = newValue;
      trigger.className = 'filter-trigger' + (value ? ' has-value' : '');
      trigger.querySelector('.label').textContent = displayLabel(value);
      if (isOpen) renderOptions(searchInput.value);
    }
  };
}
