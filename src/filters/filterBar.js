import { filterState } from './filterState.js';
import { createSearchableDropdown } from './searchableDropdown.js';
import { uniqueValues } from '../data/aggregator.js';
import { SITE_NAMES } from '../data/siteNames.js';
import { AGENCY_NAMES } from '../data/agencyNames.js';
import { COUNTRY_NAMES } from '../data/countryNames.js';

let dropdowns = {};

export function initFilterBar(container, launches) {
  container.innerHTML = '';

  const configs = [
    { key: 'country', label: 'Country', field: 'SatState', displayNames: COUNTRY_NAMES },
    { key: 'agency', label: 'Agency', field: 'Agency', displayNames: AGENCY_NAMES },
    { key: 'vehicle', label: 'Vehicle', field: 'LV_Type' },
    { key: 'site', label: 'Site', field: 'Launch_Site', displayNames: SITE_NAMES },
    { key: 'pad', label: 'Pad', field: 'Launch_Pad', displayNames: SITE_NAMES },
  ];

  // Mobile filter button
  const mobileBtn = document.createElement('button');
  mobileBtn.className = 'mobile-filter-btn';
  mobileBtn.textContent = 'Filters';
  container.appendChild(mobileBtn);

  // Mobile overlay
  const overlay = document.createElement('div');
  overlay.className = 'filter-overlay';
  overlay.innerHTML = `
    <div class="overlay-header">
      <h2>Filters</h2>
      <button class="overlay-close">&times;</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const overlayClose = overlay.querySelector('.overlay-close');
  const applyBtn = document.createElement('button');
  applyBtn.className = 'overlay-apply';
  applyBtn.textContent = 'Apply Filters';

  // Create dropdowns
  for (const cfg of configs) {
    const options = uniqueValues(launches, cfg.field);
    const state = filterState.get();
    const dd = createSearchableDropdown(container, {
      label: cfg.label,
      options,
      value: state[cfg.key],
      onChange: (val) => filterState.set({ [cfg.key]: val }),
      displayNames: cfg.displayNames,
    });
    dropdowns[cfg.key] = { dd, field: cfg.field, displayNames: cfg.displayNames };

    // Mobile version
    const group = document.createElement('div');
    group.className = 'filter-group';
    group.innerHTML = `<label>${cfg.label}</label>`;
    const mobileDd = createSearchableDropdown(group, {
      label: cfg.label,
      options,
      value: state[cfg.key],
      onChange: (val) => filterState.set({ [cfg.key]: val }),
      displayNames: cfg.displayNames,
    });
    dropdowns[cfg.key + '_mobile'] = { dd: mobileDd, field: cfg.field, displayNames: cfg.displayNames };
    overlay.appendChild(group);
  }

  // Build payload name index for typeahead
  const payloadNames = buildPayloadIndex(launches);

  // Payload search with typeahead
  const searchWrap = document.createElement('div');
  searchWrap.className = 'typeahead-wrap';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'filter-search-input';
  searchInput.placeholder = 'Search payloads...';
  searchWrap.appendChild(searchInput);

  const suggestionList = document.createElement('div');
  suggestionList.className = 'typeahead-list';
  searchWrap.appendChild(suggestionList);

  container.appendChild(searchWrap);

  let debounceTimer;
  let highlightedIdx = -1;

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = searchInput.value.trim();
    showSuggestions(q, suggestionList, payloadNames, searchInput);
    debounceTimer = setTimeout(() => {
      filterState.set({ payloadSearch: searchInput.value });
    }, 300);
  });

  searchInput.addEventListener('keydown', (e) => {
    const items = suggestionList.querySelectorAll('.typeahead-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedIdx = Math.min(highlightedIdx + 1, items.length - 1);
      updateTypeaheadHighlight(items, highlightedIdx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedIdx = Math.max(highlightedIdx - 1, 0);
      updateTypeaheadHighlight(items, highlightedIdx);
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault();
      items[highlightedIdx].click();
    } else if (e.key === 'Escape') {
      suggestionList.innerHTML = '';
      highlightedIdx = -1;
    }
  });

  searchInput.addEventListener('blur', () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      suggestionList.innerHTML = '';
      highlightedIdx = -1;
    }, 150);
  });

  // Mobile payload search
  const mobileSearchGroup = document.createElement('div');
  mobileSearchGroup.className = 'filter-group';
  mobileSearchGroup.innerHTML = '<label>Payload Search</label>';
  const mobileSearchInput = document.createElement('input');
  mobileSearchInput.type = 'text';
  mobileSearchInput.className = 'filter-search-input';
  mobileSearchInput.placeholder = 'Search payloads...';
  mobileSearchInput.style.width = '100%';
  mobileSearchGroup.appendChild(mobileSearchInput);
  overlay.appendChild(mobileSearchGroup);

  // Year range — dual-thumb slider
  const rangeSlider = createDualRangeSlider(1957, 2026, 1957, 2026, (min, max) => {
    filterState.set({ yearMin: min, yearMax: max });
  });
  container.appendChild(rangeSlider.el);

  // Mobile year range
  const mobileRangeGroup = document.createElement('div');
  mobileRangeGroup.className = 'filter-group';
  mobileRangeGroup.innerHTML = '<label>Year Range</label>';
  const mobileRangeSlider = createDualRangeSlider(1957, 2026, 1957, 2026, (min, max) => {
    filterState.set({ yearMin: min, yearMax: max });
  });
  mobileRangeGroup.appendChild(mobileRangeSlider.el);
  overlay.appendChild(mobileRangeGroup);

  // Clear all
  const clearBtn = document.createElement('button');
  clearBtn.className = 'clear-btn';
  clearBtn.textContent = 'Clear All';
  clearBtn.addEventListener('click', () => {
    filterState.reset();
    searchInput.value = '';
    mobileSearchInput.value = '';
    rangeSlider.reset();
    mobileRangeSlider.reset();
  });
  container.appendChild(clearBtn);

  // Mobile overlay controls
  overlay.appendChild(applyBtn);

  mobileBtn.addEventListener('click', () => {
    overlay.classList.add('open');
    updateMobileBtn();
  });

  overlayClose.addEventListener('click', () => overlay.classList.remove('open'));
  applyBtn.addEventListener('click', () => {
    overlay.classList.remove('open');
    if (mobileSearchInput.value !== searchInput.value) {
      searchInput.value = mobileSearchInput.value;
      filterState.set({ payloadSearch: mobileSearchInput.value });
    }
  });

  function updateMobileBtn() {
    const n = filterState.activeCount();
    mobileBtn.textContent = n > 0 ? `Filters (${n})` : 'Filters';
  }

  // Update dropdown options when filters change
  filterState.subscribe((state) => {
    updateMobileBtn();
    for (const cfg of configs) {
      const dd = dropdowns[cfg.key];
      const mdd = dropdowns[cfg.key + '_mobile'];
      if (dd) {
        const options = uniqueValues(launches, cfg.field);
        dd.dd.update(options, state[cfg.key]);
      }
      if (mdd) {
        const options = uniqueValues(launches, cfg.field);
        mdd.dd.update(options, state[cfg.key]);
      }
    }
  });
}

function buildPayloadIndex(launches) {
  const names = new Set();
  for (const d of launches) {
    if (d.Name) names.add(d.Name);
  }
  return [...names].sort();
}

function showSuggestions(query, listEl, names, input) {
  listEl.innerHTML = '';
  if (!query || query.length < 1) return;

  const q = query.toLowerCase();
  const matches = [];
  for (let i = 0; i < names.length && matches.length < 8; i++) {
    if (names[i].toLowerCase().includes(q)) matches.push(names[i]);
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
      input.value = name;
      listEl.innerHTML = '';
      filterState.set({ payloadSearch: name });
    });
    listEl.appendChild(item);
  }
}

function updateTypeaheadHighlight(items, idx) {
  items.forEach((el, i) => el.classList.toggle('highlighted', i === idx));
  if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function createDualRangeSlider(absMin, absMax, initMin, initMax, onChange) {
  let curMin = initMin;
  let curMax = initMax;

  const el = document.createElement('div');
  el.className = 'dual-range';

  const minLabel = document.createElement('span');
  minLabel.className = 'range-label';
  minLabel.textContent = curMin;

  const maxLabel = document.createElement('span');
  maxLabel.className = 'range-label';
  maxLabel.textContent = curMax;

  const track = document.createElement('div');
  track.className = 'dual-range-track';

  const fill = document.createElement('div');
  fill.className = 'dual-range-fill';
  track.appendChild(fill);

  const thumbMin = document.createElement('div');
  thumbMin.className = 'dual-range-thumb';
  thumbMin.tabIndex = 0;
  track.appendChild(thumbMin);

  const thumbMax = document.createElement('div');
  thumbMax.className = 'dual-range-thumb';
  thumbMax.tabIndex = 0;
  track.appendChild(thumbMax);

  el.append(minLabel, track, maxLabel);

  function valToFrac(val) {
    return (val - absMin) / (absMax - absMin);
  }

  function fracToVal(frac) {
    return Math.round(absMin + frac * (absMax - absMin));
  }

  function updatePositions() {
    const minFrac = valToFrac(curMin) * 100;
    const maxFrac = valToFrac(curMax) * 100;
    thumbMin.style.left = minFrac + '%';
    thumbMax.style.left = maxFrac + '%';
    fill.style.left = minFrac + '%';
    fill.style.width = (maxFrac - minFrac) + '%';
    minLabel.textContent = curMin;
    maxLabel.textContent = curMax;
  }

  function startDrag(thumb, isMin) {
    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = track.getBoundingClientRect();
      let frac = (clientX - rect.left) / rect.width;
      frac = Math.max(0, Math.min(1, frac));
      let val = fracToVal(frac);

      if (isMin) {
        val = Math.min(val, curMax);
        curMin = val;
      } else {
        val = Math.max(val, curMin);
        curMax = val;
      }
      updatePositions();
      onChange(curMin, curMax);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
  }

  thumbMin.addEventListener('mousedown', (e) => { e.preventDefault(); startDrag(thumbMin, true); });
  thumbMin.addEventListener('touchstart', (e) => { startDrag(thumbMin, true); }, { passive: true });
  thumbMax.addEventListener('mousedown', (e) => { e.preventDefault(); startDrag(thumbMax, false); });
  thumbMax.addEventListener('touchstart', (e) => { startDrag(thumbMax, false); }, { passive: true });

  updatePositions();

  return {
    el,
    reset() {
      curMin = initMin;
      curMax = initMax;
      updatePositions();
    }
  };
}
