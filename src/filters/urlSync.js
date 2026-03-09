import { filterState } from './filterState.js';

const PARAM_MAP = {
  country: 'country',
  agency: 'agency',
  vehicle: 'vehicle',
  site: 'site',
  pad: 'pad',
  q: 'payloadSearch',
  from: 'yearMin',
  to: 'yearMax',
};

const STATE_TO_PARAM = Object.fromEntries(
  Object.entries(PARAM_MAP).map(([param, key]) => [key, param])
);

const DEFAULTS = {
  country: null,
  agency: null,
  vehicle: null,
  site: null,
  pad: null,
  payloadSearch: '',
  yearMin: 1957,
  yearMax: 2026,
};

export function parseUrlFilters() {
  const params = new URLSearchParams(window.location.search);
  const result = {};

  for (const [param, key] of Object.entries(PARAM_MAP)) {
    const val = params.get(param);
    if (val == null) continue;

    if (key === 'yearMin' || key === 'yearMax') {
      const n = parseInt(val, 10);
      if (!isNaN(n) && n !== DEFAULTS[key]) {
        result[key] = n;
      }
    } else if (key === 'payloadSearch') {
      if (val !== DEFAULTS[key]) {
        result[key] = val;
      }
    } else {
      if (val !== DEFAULTS[key]) {
        result[key] = val;
      }
    }
  }

  return Object.keys(result).length ? result : null;
}

export function startUrlSync() {
  filterState.subscribe((state) => {
    const params = new URLSearchParams();

    for (const [key, param] of Object.entries(STATE_TO_PARAM)) {
      const val = state[key];
      const def = DEFAULTS[key];

      if (key === 'yearMin' || key === 'yearMax') {
        if (val !== def) params.set(param, val);
      } else if (key === 'payloadSearch') {
        if (val && val !== def) params.set(param, val);
      } else {
        if (val != null && val !== def) params.set(param, val);
      }
    }

    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    history.replaceState(null, '', url);
  });
}
