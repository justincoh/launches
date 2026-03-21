import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseUrlFilters, startUrlSync } from './urlSync.js';
import { filterState } from './filterState.js';

let locationBackup;
let historyBackup;
let globalHistoryBackup;

beforeEach(() => {
  locationBackup = globalThis.window?.location;
  historyBackup = globalThis.window?.history;
  globalHistoryBackup = globalThis.history;

  globalThis.window = globalThis.window || {};
  globalThis.window.location = { search: '', pathname: '/' };
  globalThis.window.history = { replaceState: vi.fn() };
  globalThis.history = globalThis.window.history;

  filterState.reset();
});

afterEach(() => {
  if (locationBackup) {
    globalThis.window.location = locationBackup;
    globalThis.window.history = historyBackup;
  }
  if (globalHistoryBackup) {
    globalThis.history = globalHistoryBackup;
  } else {
    delete globalThis.history;
  }
});

describe('parseUrlFilters', () => {
  it('returns null when no params are present', () => {
    window.location.search = '';
    expect(parseUrlFilters()).toBeNull();
  });

  it('parses country param', () => {
    window.location.search = '?country=US';
    expect(parseUrlFilters()).toEqual({ country: 'US' });
  });

  it('parses agency param', () => {
    window.location.search = '?agency=NASA';
    expect(parseUrlFilters()).toEqual({ agency: 'NASA' });
  });

  it('parses vehicle param', () => {
    window.location.search = '?vehicle=Atlas';
    expect(parseUrlFilters()).toEqual({ vehicle: 'Atlas' });
  });

  it('parses site param', () => {
    window.location.search = '?site=CCAS';
    expect(parseUrlFilters()).toEqual({ site: 'CCAS' });
  });

  it('parses pad param', () => {
    window.location.search = '?pad=LC17';
    expect(parseUrlFilters()).toEqual({ pad: 'LC17' });
  });

  it('parses q param as payloadSearch', () => {
    window.location.search = '?q=hubble';
    expect(parseUrlFilters()).toEqual({ payloadSearch: 'hubble' });
  });

  it('parses from/to as yearMin/yearMax integers', () => {
    window.location.search = '?from=1990&to=2020';
    expect(parseUrlFilters()).toEqual({ yearMin: 1990, yearMax: 2020 });
  });

  it('parses multiple params together', () => {
    window.location.search = '?country=RU&agency=RKA&from=2000';
    expect(parseUrlFilters()).toEqual({ country: 'RU', agency: 'RKA', yearMin: 2000 });
  });

  it('ignores default yearMin value (1957)', () => {
    window.location.search = '?from=1957';
    expect(parseUrlFilters()).toBeNull();
  });

  it('ignores default yearMax value (2026)', () => {
    window.location.search = '?to=2026';
    expect(parseUrlFilters()).toBeNull();
  });

  it('ignores empty payloadSearch', () => {
    window.location.search = '?q=';
    expect(parseUrlFilters()).toBeNull();
  });

  it('ignores non-numeric year values', () => {
    window.location.search = '?from=abc&to=xyz';
    expect(parseUrlFilters()).toBeNull();
  });

  it('ignores unknown params', () => {
    window.location.search = '?foo=bar&baz=qux';
    expect(parseUrlFilters()).toBeNull();
  });

  it('handles URL-encoded values', () => {
    window.location.search = '?vehicle=CZ-2%2FC';
    expect(parseUrlFilters()).toEqual({ vehicle: 'CZ-2/C' });
  });
});

describe('startUrlSync', () => {
  it('writes non-default filter values to URL', () => {
    startUrlSync();
    filterState.set({ country: 'US' });
    const call = history.replaceState.mock.calls.at(-1);
    expect(call[2]).toBe('/?country=US');
  });

  it('writes year range to URL with from/to params', () => {
    startUrlSync();
    filterState.set({ yearMin: 2000, yearMax: 2020 });
    const call = history.replaceState.mock.calls.at(-1);
    expect(call[2]).toContain('from=2000');
    expect(call[2]).toContain('to=2020');
  });

  it('writes payloadSearch as q param', () => {
    startUrlSync();
    filterState.set({ payloadSearch: 'dragon' });
    const call = history.replaceState.mock.calls.at(-1);
    expect(call[2]).toBe('/?q=dragon');
  });

  it('omits default values from URL', () => {
    startUrlSync();
    filterState.set({ yearMin: 1957, yearMax: 2026, country: null });
    const call = history.replaceState.mock.calls.at(-1);
    expect(call[2]).toBe('/');
  });

  it('omits empty payloadSearch', () => {
    startUrlSync();
    filterState.set({ payloadSearch: '' });
    const call = history.replaceState.mock.calls.at(-1);
    expect(call[2]).toBe('/');
  });

  it('combines multiple filters in URL', () => {
    startUrlSync();
    filterState.set({ country: 'CN', agency: 'CNSA', yearMin: 2000 });
    const call = history.replaceState.mock.calls.at(-1);
    const url = call[2];
    expect(url).toContain('country=CN');
    expect(url).toContain('agency=CNSA');
    expect(url).toContain('from=2000');
  });
});
