import { filterState } from './filterState.js';
import { createSearchableDropdown } from './searchableDropdown.js';
import { uniqueValues } from '../data/aggregator.js';

let dropdowns = {};

export function initFilterBar(container, launches) {
  container.innerHTML = '';

  const configs = [
    { key: 'country', label: 'Country', field: 'SatState' },
    { key: 'agency', label: 'Agency', field: 'Agency' },
    { key: 'vehicle', label: 'Vehicle', field: 'LV_Type' },
    { key: 'site', label: 'Site', field: 'Launch_Site' },
    { key: 'pad', label: 'Pad', field: 'Launch_Pad' },
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
    });
    dropdowns[cfg.key] = { dd, field: cfg.field };

    // Mobile version
    const group = document.createElement('div');
    group.className = 'filter-group';
    group.innerHTML = `<label>${cfg.label}</label>`;
    const mobileDd = createSearchableDropdown(group, {
      label: cfg.label,
      options,
      value: state[cfg.key],
      onChange: (val) => filterState.set({ [cfg.key]: val }),
    });
    dropdowns[cfg.key + '_mobile'] = { dd: mobileDd, field: cfg.field };
    overlay.appendChild(group);
  }

  // Payload search
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'filter-search-input';
  searchInput.placeholder = 'Search payloads...';
  container.appendChild(searchInput);

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filterState.set({ payloadSearch: searchInput.value });
    }, 300);
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

  // Year range
  const rangeDiv = document.createElement('div');
  rangeDiv.className = 'filter-range';

  const minLabel = document.createElement('span');
  minLabel.className = 'range-label';
  minLabel.textContent = '1957';

  const minSlider = document.createElement('input');
  minSlider.type = 'range';
  minSlider.min = 1957;
  minSlider.max = 2026;
  minSlider.value = 1957;

  const sep = document.createElement('span');
  sep.textContent = '\u2013';

  const maxLabel = document.createElement('span');
  maxLabel.className = 'range-label';
  maxLabel.textContent = '2026';

  const maxSlider = document.createElement('input');
  maxSlider.type = 'range';
  maxSlider.min = 1957;
  maxSlider.max = 2026;
  maxSlider.value = 2026;

  rangeDiv.append(minLabel, minSlider, sep, maxSlider, maxLabel);
  container.appendChild(rangeDiv);

  minSlider.addEventListener('input', () => {
    const v = +minSlider.value;
    if (v > +maxSlider.value) minSlider.value = maxSlider.value;
    minLabel.textContent = minSlider.value;
    filterState.set({ yearMin: +minSlider.value });
  });

  maxSlider.addEventListener('input', () => {
    const v = +maxSlider.value;
    if (v < +minSlider.value) maxSlider.value = minSlider.value;
    maxLabel.textContent = maxSlider.value;
    filterState.set({ yearMax: +maxSlider.value });
  });

  // Mobile year range
  const mobileRangeGroup = document.createElement('div');
  mobileRangeGroup.className = 'filter-group';
  mobileRangeGroup.innerHTML = '<label>Year Range</label>';
  const mobileRangeDiv = rangeDiv.cloneNode(true);
  mobileRangeGroup.appendChild(mobileRangeDiv);
  overlay.appendChild(mobileRangeGroup);

  // Clear all
  const clearBtn = document.createElement('button');
  clearBtn.className = 'clear-btn';
  clearBtn.textContent = 'Clear All';
  clearBtn.addEventListener('click', () => {
    filterState.reset();
    searchInput.value = '';
    mobileSearchInput.value = '';
    minSlider.value = 1957;
    maxSlider.value = 2026;
    minLabel.textContent = '1957';
    maxLabel.textContent = '2026';
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
