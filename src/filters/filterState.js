const DEFAULT = {
  country: null,
  agency: null,
  vehicle: null,
  site: null,
  pad: null,
  payloadSearch: '',
  yearMin: 1957,
  yearMax: 2026,
};

let state = { ...DEFAULT };
const listeners = new Set();

export const filterState = {
  get() {
    return { ...state };
  },

  set(partial) {
    state = { ...state, ...partial };
    this._notify();
  },

  reset() {
    state = { ...DEFAULT };
    this._notify();
  },

  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  _notify() {
    const s = this.get();
    for (const cb of listeners) cb(s);
  },

  activeCount() {
    let n = 0;
    if (state.country) n++;
    if (state.agency) n++;
    if (state.vehicle) n++;
    if (state.site) n++;
    if (state.pad) n++;
    if (state.payloadSearch) n++;
    if (state.yearMin !== DEFAULT.yearMin || state.yearMax !== DEFAULT.yearMax) n++;
    return n;
  }
};
