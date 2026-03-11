import { describe, it, expect } from 'vitest';
import {
  filterData,
  launchesByYear,
  launchesByYearStacked,
  launchesByMonth,
  launchesByMonthStacked,
  outcomeBreakdown,
  outcomeByDimension,
  topN,
  uniqueValues,
  vehicleLifespans,
} from './aggregator.js';
import { launches, payloads } from './fixtures.js';

// ---------------------------------------------------------------------------
// filterData
// ---------------------------------------------------------------------------
describe('filterData', () => {
  it('returns all data when filters are empty', () => {
    const { launches: fl, payloads: fp } = filterData(launches, payloads, {});
    expect(fl).toHaveLength(launches.length);
    expect(fp).toHaveLength(payloads.length);
  });

  it('filters by country', () => {
    const { launches: fl } = filterData(launches, payloads, { country: 'US' });
    expect(fl.every(d => d.LVState === 'US')).toBe(true);
    expect(fl.length).toBeGreaterThan(0);
  });

  it('filters by agency', () => {
    const { launches: fl } = filterData(launches, payloads, { agency: 'RKA' });
    expect(fl.every(d => d.Agency === 'RKA')).toBe(true);
    expect(fl.length).toBe(4);
  });

  it('filters by vehicle', () => {
    const { launches: fl } = filterData(launches, payloads, { vehicle: 'Soyuz' });
    expect(fl.every(d => d.LV_Type === 'Soyuz')).toBe(true);
    expect(fl.length).toBe(2);
  });

  it('filters by site', () => {
    const { launches: fl } = filterData(launches, payloads, { site: 'VAFB' });
    expect(fl.every(d => d.Launch_Site === 'VAFB')).toBe(true);
  });

  it('filters by pad', () => {
    const { launches: fl } = filterData(launches, payloads, { pad: 'LC40' });
    expect(fl.every(d => d.Launch_Pad === 'LC40')).toBe(true);
  });

  it('filters by yearMin', () => {
    const { launches: fl } = filterData(launches, payloads, { yearMin: 2003 });
    expect(fl.every(d => d.year == null || d.year >= 2003)).toBe(true);
  });

  it('filters by yearMax', () => {
    const { launches: fl } = filterData(launches, payloads, { yearMax: 2002 });
    expect(fl.every(d => d.year == null || d.year <= 2002)).toBe(true);
  });

  it('filters by yearMin and yearMax together', () => {
    const { launches: fl } = filterData(launches, payloads, { yearMin: 2002, yearMax: 2003 });
    const withYear = fl.filter(d => d.year != null);
    expect(withYear.every(d => d.year >= 2002 && d.year <= 2003)).toBe(true);
    expect(withYear.length).toBeGreaterThan(0);
  });

  it('filters payloadSearch by Name', () => {
    const { launches: fl, payloads: fp } = filterData(launches, payloads, { payloadSearch: 'hubble' });
    expect(fp.every(d => d.Name.toLowerCase().includes('hubble') || d.PLName.toLowerCase().includes('hubble'))).toBe(true);
    expect(fl.every(d => d.Launch_Tag === 'L001')).toBe(true);
  });

  it('filters payloadSearch by PLName', () => {
    const { launches: fl } = filterData(launches, payloads, { payloadSearch: 'dragon' });
    expect(fl.some(d => d.Launch_Tag === 'L009')).toBe(true);
  });

  it('payloadSearch returns empty when no match', () => {
    const { launches: fl, payloads: fp } = filterData(launches, payloads, { payloadSearch: 'xyzzy-no-match' });
    expect(fl).toHaveLength(0);
    expect(fp).toHaveLength(0);
  });

  it('combines country and vehicle filters', () => {
    const { launches: fl } = filterData(launches, payloads, { country: 'US', vehicle: 'Falcon' });
    expect(fl.every(d => d.LVState === 'US' && d.LV_Type === 'Falcon')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// launchesByYear
// ---------------------------------------------------------------------------
describe('launchesByYear', () => {
  it('returns sorted year/count pairs', () => {
    const result = launchesByYear(launches, payloads, 'launches');
    expect(result[0].year).toBeLessThan(result[result.length - 1].year);
    expect(result.every(r => r.count > 0)).toBe(true);
  });

  it('sums counts correctly for 2000', () => {
    const result = launchesByYear(launches, payloads, 'launches');
    const y2000 = result.find(r => r.year === 2000);
    expect(y2000).toBeDefined();
    expect(y2000.count).toBe(2); // L001 + L002
  });

  it('skips launches with null year', () => {
    const result = launchesByYear(launches, payloads, 'launches');
    expect(result.every(r => r.year != null)).toBe(true);
  });

  it('counts payloads when mode=payloads', () => {
    const result = launchesByYear(launches, payloads, 'payloads');
    const y2000 = result.find(r => r.year === 2000);
    expect(y2000.count).toBe(3); // L001 has 2 payloads, L002 has 1
  });
});

// ---------------------------------------------------------------------------
// launchesByYearStacked
// ---------------------------------------------------------------------------
describe('launchesByYearStacked', () => {
  it('returns data array and keys array', () => {
    const { data, keys } = launchesByYearStacked(launches, 'LVState', 3);
    expect(Array.isArray(data)).toBe(true);
    expect(Array.isArray(keys)).toBe(true);
  });

  it('top-N keys are highest-count values', () => {
    const { keys } = launchesByYearStacked(launches, 'LVState', 2);
    // US has most launches in fixture
    expect(keys).toContain('US');
  });

  it('includes Other bucket when values exceed topN', () => {
    const { keys } = launchesByYearStacked(launches, 'LVState', 1);
    expect(keys).toContain('Other');
  });

  it('data rows have year property', () => {
    const { data } = launchesByYearStacked(launches, 'LVState', 3);
    expect(data.every(r => r.year != null)).toBe(true);
  });

  it('data is sorted by year ascending', () => {
    const { data } = launchesByYearStacked(launches, 'LVState', 3);
    for (let i = 1; i < data.length; i++) {
      expect(data[i].year).toBeGreaterThanOrEqual(data[i - 1].year);
    }
  });
});

// ---------------------------------------------------------------------------
// outcomeBreakdown
// ---------------------------------------------------------------------------
describe('outcomeBreakdown', () => {
  it('returns non-zero outcomes', () => {
    const result = outcomeBreakdown(launches);
    const outcomes = result.map(r => r.outcome);
    expect(outcomes).toContain('Success');
    expect(outcomes).toContain('Failure');
    expect(outcomes).toContain('Suborbital');
  });

  it('counts successes correctly', () => {
    const result = outcomeBreakdown(launches);
    const s = result.find(r => r.outcome === 'Success');
    const expected = launches.filter(d => d.outcome === 'Success').length;
    expect(s.count).toBe(expected);
  });

  it('returns empty array for empty input', () => {
    const result = outcomeBreakdown([]);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// outcomeByDimension
// ---------------------------------------------------------------------------
describe('outcomeByDimension', () => {
  it('groups by decade correctly', () => {
    const result = outcomeByDimension(launches, 'decade');
    const decades = result.map(r => r.label);
    expect(decades).toContain('2000s');
  });

  it('decade rows have Success/Failure/Suborbital fields', () => {
    const result = outcomeByDimension(launches, 'decade');
    for (const row of result) {
      expect(row).toHaveProperty('Success');
      expect(row).toHaveProperty('Failure');
      expect(row).toHaveProperty('Suborbital');
    }
  });

  it('groups by LVState dimension', () => {
    const result = outcomeByDimension(launches, 'LVState');
    const labels = result.map(r => r.label);
    expect(labels).toContain('US');
    expect(labels).toContain('RU');
  });

  it('skips launches with null year when grouping by decade', () => {
    const result = outcomeByDimension(launches, 'decade');
    // L015 has null year — should be excluded, not produce a null label
    expect(result.every(r => r.label != null)).toBe(true);
    expect(result.some(r => r.label === '2000s')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// topN
// ---------------------------------------------------------------------------
describe('topN', () => {
  it('returns at most n entries', () => {
    const result = topN(launches, 'LV_Type', 3);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('entries are sorted by count descending', () => {
    const result = topN(launches, 'LV_Type', 10);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].count).toBeLessThanOrEqual(result[i - 1].count);
    }
  });

  it('uses Unknown for null field values', () => {
    const data = [{ LV_Type: null }, { LV_Type: 'Atlas' }];
    const result = topN(data, 'LV_Type', 5);
    expect(result.some(r => r.label === 'Unknown')).toBe(true);
  });

  it('returns label and count properties', () => {
    const result = topN(launches, 'Agency', 5);
    expect(result[0]).toHaveProperty('label');
    expect(result[0]).toHaveProperty('count');
  });
});

// ---------------------------------------------------------------------------
// uniqueValues
// ---------------------------------------------------------------------------
describe('uniqueValues', () => {
  it('returns distinct values with counts', () => {
    const result = uniqueValues(launches, 'LVState');
    const labels = result.map(r => r.value);
    expect(new Set(labels).size).toBe(labels.length); // unique
  });

  it('is sorted by count descending', () => {
    const result = uniqueValues(launches, 'LVState');
    for (let i = 1; i < result.length; i++) {
      expect(result[i].count).toBeLessThanOrEqual(result[i - 1].count);
    }
  });

  it('skips null/empty values', () => {
    const data = [{ x: 'a' }, { x: null }, { x: '' }, { x: 'b' }];
    const result = uniqueValues(data, 'x');
    expect(result.every(r => r.value)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// vehicleLifespans
// ---------------------------------------------------------------------------
describe('vehicleLifespans', () => {
  it('returns vehicles sorted by launch count descending', () => {
    const result = vehicleLifespans(launches, 20);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].count).toBeLessThanOrEqual(result[i - 1].count);
    }
  });

  it('computes firstYear and lastYear correctly', () => {
    const result = vehicleLifespans(launches, 20);
    const delta = result.find(r => r.vehicle === 'Delta');
    expect(delta).toBeDefined();
    expect(delta.firstYear).toBe(2001);
    expect(delta.lastYear).toBe(2005);
  });

  it('respects topCount limit', () => {
    const result = vehicleLifespans(launches, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('skips entries with null year or missing LV_Type', () => {
    const data = [{ LV_Type: null, year: 2000 }, { LV_Type: 'Atlas', year: null }];
    const result = vehicleLifespans(data, 5);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// launchesByMonth
// ---------------------------------------------------------------------------
describe('launchesByMonth', () => {
  it('returns 12 months', () => {
    const result = launchesByMonth(launches, 2003);
    expect(result).toHaveLength(12);
  });

  it('months are indexed 0–11', () => {
    const result = launchesByMonth(launches, 2003);
    expect(result[0].month).toBe(0);
    expect(result[11].month).toBe(11);
  });

  it('counts April launches in 2003 correctly', () => {
    // L007 (Apr 11) and L016 (Apr 15) both in 2003
    const result = launchesByMonth(launches, 2003);
    expect(result[3].count).toBe(2); // April = index 3
  });

  it('returns zero counts for empty months', () => {
    const result = launchesByMonth(launches, 2000);
    // 2000 fixture has L001 in Jan and L002 in Mar only
    expect(result[0].count).toBe(1);  // January
    expect(result[1].count).toBe(0);  // February (empty)
    expect(result[2].count).toBe(1);  // March
    expect(result.slice(3).every(r => r.count === 0)).toBe(true); // rest empty
  });

  it('ignores launches with null date', () => {
    // L015 has null date, should not throw
    expect(() => launchesByMonth(launches, null)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// launchesByMonthStacked
// ---------------------------------------------------------------------------
describe('launchesByMonthStacked', () => {
  it('returns data (12 rows) and keys', () => {
    const { data, keys } = launchesByMonthStacked(launches, 2004, 'Agency', 3);
    expect(data).toHaveLength(12);
    expect(Array.isArray(keys)).toBe(true);
  });

  it('data rows have month property', () => {
    const { data } = launchesByMonthStacked(launches, 2004, 'Agency', 3);
    expect(data[0].month).toBe(0);
    expect(data[11].month).toBe(11);
  });

  it('includes Other when agencies exceed topN', () => {
    const { keys } = launchesByMonthStacked(launches, 2004, 'Agency', 1);
    // 2004 has SpaceX and RKA — with topN=1 the other goes to Other
    expect(keys).toContain('Other');
  });

  it('returns empty keys for year with no launches', () => {
    const { data, keys } = launchesByMonthStacked(launches, 1999, 'Agency', 5);
    expect(data).toHaveLength(12);
    expect(keys).toHaveLength(0);
  });
});
