import { describe, it, expect, beforeEach } from 'vitest';
import { filterState } from './filterState.js';

beforeEach(() => {
  filterState.reset();
});

describe('filterState — initial state', () => {
  it('country is null', () => {
    expect(filterState.get().country).toBeNull();
  });

  it('yearMin is 1957', () => {
    expect(filterState.get().yearMin).toBe(1957);
  });

  it('yearMax is 2026', () => {
    expect(filterState.get().yearMax).toBe(2026);
  });

  it('payloadSearch is empty string', () => {
    expect(filterState.get().payloadSearch).toBe('');
  });
});

describe('filterState — set()', () => {
  it('merges partial updates', () => {
    filterState.set({ country: 'US' });
    const state = filterState.get();
    expect(state.country).toBe('US');
    expect(state.agency).toBeNull(); // untouched
  });

  it('get() returns a copy, not the internal reference', () => {
    const s1 = filterState.get();
    s1.country = 'XX';
    expect(filterState.get().country).toBeNull();
  });

  it('multiple set() calls accumulate', () => {
    filterState.set({ country: 'US' });
    filterState.set({ agency: 'NASA' });
    const state = filterState.get();
    expect(state.country).toBe('US');
    expect(state.agency).toBe('NASA');
  });
});

describe('filterState — reset()', () => {
  it('restores all defaults', () => {
    filterState.set({ country: 'US', agency: 'NASA', yearMin: 2000 });
    filterState.reset();
    const state = filterState.get();
    expect(state.country).toBeNull();
    expect(state.agency).toBeNull();
    expect(state.yearMin).toBe(1957);
  });
});

describe('filterState — subscribe()', () => {
  it('calls subscriber when set() is called', () => {
    let called = 0;
    const unsub = filterState.subscribe(() => called++);
    filterState.set({ country: 'US' });
    expect(called).toBe(1);
    unsub();
  });

  it('passes current state to subscriber', () => {
    let received;
    const unsub = filterState.subscribe(s => { received = s; });
    filterState.set({ country: 'RU' });
    expect(received.country).toBe('RU');
    unsub();
  });

  it('calls subscriber on reset()', () => {
    let called = 0;
    const unsub = filterState.subscribe(() => called++);
    filterState.reset();
    expect(called).toBe(1);
    unsub();
  });

  it('unsubscribe stops notifications', () => {
    let called = 0;
    const unsub = filterState.subscribe(() => called++);
    unsub();
    filterState.set({ country: 'US' });
    expect(called).toBe(0);
  });

  it('multiple subscribers all receive updates', () => {
    let a = 0, b = 0;
    const unsubA = filterState.subscribe(() => a++);
    const unsubB = filterState.subscribe(() => b++);
    filterState.set({ country: 'US' });
    expect(a).toBe(1);
    expect(b).toBe(1);
    unsubA();
    unsubB();
  });
});

describe('filterState — activeCount()', () => {
  it('returns 0 for default state', () => {
    expect(filterState.activeCount()).toBe(0);
  });

  it('counts each active filter key', () => {
    filterState.set({ country: 'US' });
    expect(filterState.activeCount()).toBe(1);
    filterState.set({ agency: 'NASA' });
    expect(filterState.activeCount()).toBe(2);
  });

  it('counts year range as 1 even if both changed', () => {
    filterState.set({ yearMin: 2000, yearMax: 2010 });
    expect(filterState.activeCount()).toBe(1);
  });

  it('does not count yearMin/yearMax if both are still at defaults', () => {
    filterState.set({ yearMin: 1957, yearMax: 2026 });
    expect(filterState.activeCount()).toBe(0);
  });

  it('counts payloadSearch when non-empty', () => {
    filterState.set({ payloadSearch: 'hubble' });
    expect(filterState.activeCount()).toBe(1);
  });

  it('does not count payloadSearch when empty string', () => {
    filterState.set({ payloadSearch: '' });
    expect(filterState.activeCount()).toBe(0);
  });
});
