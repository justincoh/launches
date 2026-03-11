import { describe, it, expect } from 'vitest';
import { normalize } from './normalizer.js';

function makeRow(overrides = {}) {
  return {
    Launch_Tag: 'T001',
    Launch_Date: '2000 Jan 15',
    Launch_Code: 'OS',
    Name: 'Sat-1',
    PLName: 'SAT 1',
    LVState: 'US',
    Agency: 'NASA',
    LV_Type: 'Atlas',
    Launch_Site: 'CCAS',
    Launch_Pad: 'LC17',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Date parsing
// ---------------------------------------------------------------------------
describe('normalize — date parsing', () => {
  it('parses a standard date string', () => {
    const { launches } = normalize([makeRow({ Launch_Date: '2020 Jun 15' })]);
    expect(launches[0].date).toBeInstanceOf(Date);
    expect(launches[0].year).toBe(2020);
    expect(launches[0].date.getMonth()).toBe(5); // June = 5
    expect(launches[0].date.getDate()).toBe(15);
  });

  it('parses a date with time', () => {
    const { launches } = normalize([makeRow({ Launch_Date: '2020 Jun 15 1430' })]);
    expect(launches[0].date).toBeInstanceOf(Date);
    expect(launches[0].date.getHours()).toBe(14);
    expect(launches[0].date.getMinutes()).toBe(30);
  });

  it('parses a date with seconds', () => {
    const { launches } = normalize([makeRow({ Launch_Date: '2020 Jun 15 1430:45' })]);
    expect(launches[0].date).toBeInstanceOf(Date);
    expect(launches[0].date.getSeconds()).toBe(45);
  });

  it('sets date/year to null when Launch_Date is null', () => {
    const { launches } = normalize([makeRow({ Launch_Date: null })]);
    expect(launches[0].date).toBeNull();
    expect(launches[0].year).toBeNull();
  });

  it('sets date/year to null when Launch_Date is empty string', () => {
    const { launches } = normalize([makeRow({ Launch_Date: '' })]);
    expect(launches[0].date).toBeNull();
    expect(launches[0].year).toBeNull();
  });

  it('sets date/year to null for malformed date', () => {
    const { launches } = normalize([makeRow({ Launch_Date: 'not a date' })]);
    expect(launches[0].date).toBeNull();
    expect(launches[0].year).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Outcome classification
// ---------------------------------------------------------------------------
describe('normalize — classifyOutcome', () => {
  it.each([
    ['OS',   'Success'],
    ['DS',   'Success'],
    ['OS2',  'Success'],  // numbered variant
    [' OS ', 'Success'],  // whitespace trimmed
    ['OF',   'Failure'],
    ['OF1',  'Failure'],  // numbered variant
    ['XS',   'Suborbital'],
    [null,   'Unknown'],
    ['',     'Unknown'],
    ['ZZ',   'Unknown'],  // unrecognized code
  ])('classifies %p as %s', (code, expected) => {
    const { launches } = normalize([makeRow({ Launch_Code: code })]);
    expect(launches[0].outcome).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Deduplication by Launch_Tag
// ---------------------------------------------------------------------------
describe('normalize — deduplication', () => {
  it('produces one launch per unique Launch_Tag', () => {
    const rows = [
      makeRow({ Launch_Tag: 'T001', Name: 'Sat-A' }),
      makeRow({ Launch_Tag: 'T001', Name: 'Sat-B' }),
      makeRow({ Launch_Tag: 'T002', Name: 'Sat-C' }),
    ];
    const { launches } = normalize(rows);
    expect(launches).toHaveLength(2);
  });

  it('records payloadCount correctly', () => {
    const rows = [
      makeRow({ Launch_Tag: 'T001', Name: 'Sat-A' }),
      makeRow({ Launch_Tag: 'T001', Name: 'Sat-B' }),
      makeRow({ Launch_Tag: 'T001', Name: 'Sat-C' }),
    ];
    const { launches } = normalize(rows);
    expect(launches[0].payloadCount).toBe(3);
  });

  it('payloads array contains all rows with a Launch_Tag', () => {
    const rows = [
      makeRow({ Launch_Tag: 'T001', Name: 'Sat-A' }),
      makeRow({ Launch_Tag: 'T001', Name: 'Sat-B' }),
      makeRow({ Launch_Tag: null,   Name: 'No-Tag' }),
    ];
    const { payloads } = normalize(rows);
    expect(payloads).toHaveLength(2);
  });

  it('skips rows with no Launch_Tag from the launches array', () => {
    const rows = [
      makeRow({ Launch_Tag: null }),
      makeRow({ Launch_Tag: 'T001' }),
    ];
    const { launches } = normalize(rows);
    expect(launches).toHaveLength(1);
    expect(launches[0].Launch_Tag).toBe('T001');
  });
});

// ---------------------------------------------------------------------------
// Sort order
// ---------------------------------------------------------------------------
describe('normalize — sort order', () => {
  it('sorts launches by date ascending', () => {
    const rows = [
      makeRow({ Launch_Tag: 'T002', Launch_Date: '2020 Jun 15' }),
      makeRow({ Launch_Tag: 'T001', Launch_Date: '2010 Jan 01' }),
    ];
    const { launches } = normalize(rows);
    expect(launches[0].Launch_Tag).toBe('T001');
    expect(launches[1].Launch_Tag).toBe('T002');
  });
});
