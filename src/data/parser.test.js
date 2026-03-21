import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAndParse } from './parser.js';

function mockFetch(text) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, text: () => Promise.resolve(text) })
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchAndParse', () => {
  it('parses a basic TSV row into an object with correct headers', async () => {
    const tsv = 'L001\t2000 Jan 15\tA\tR\tSat-1\tSAT 1\tJ001\tOwner\tUS\tAtlas\tF001\tPlat\tCCAS\tLC17\tASC\tAP\tNASA\tUS\tOS\tCite';
    mockFetch(tsv);
    const rows = await fetchAndParse('http://test');
    expect(rows).toHaveLength(1);
    expect(rows[0].Launch_Tag).toBe('L001');
    expect(rows[0].Launch_Date).toBe('2000 Jan 15');
    expect(rows[0].LV_Type).toBe('Atlas');
    expect(rows[0].Agency).toBe('NASA');
    expect(rows[0].LVState).toBe('US');
    expect(rows[0].Launch_Code).toBe('OS');
  });

  it('converts "-" values to null', async () => {
    const tsv = 'L002\t-\tA\tR\t-\tPL\tJ\tO\tS\tDelta\tF\tP\tVAFB\tSLC2\tA\tA\tULA\tUS\t-\tC';
    mockFetch(tsv);
    const rows = await fetchAndParse('http://test');
    expect(rows[0].Launch_Date).toBeNull();
    expect(rows[0].Name).toBeNull();
    expect(rows[0].Launch_Code).toBeNull();
  });

  it('skips comment lines starting with #', async () => {
    const tsv = [
      '# this is a comment',
      'L001\t2000 Jan 15\tA\tR\tSat\tPL\tJ\tO\tS\tAtlas\tF\tP\tCCAS\tLC17\tA\tA\tNASA\tUS\tOS\tC',
    ].join('\n');
    mockFetch(tsv);
    const rows = await fetchAndParse('http://test');
    expect(rows).toHaveLength(1);
    expect(rows[0].Launch_Tag).toBe('L001');
  });

  it('skips empty lines', async () => {
    const tsv = [
      '',
      'L001\t2000 Jan 15\tA\tR\tSat\tPL\tJ\tO\tS\tAtlas\tF\tP\tCCAS\tLC17\tA\tA\tNASA\tUS\tOS\tC',
      '',
      'L002\t2001 Feb 10\tA\tR\tSat\tPL\tJ\tO\tS\tDelta\tF\tP\tVAFB\tSLC2\tA\tA\tULA\tUS\tDS\tC',
      '',
    ].join('\n');
    mockFetch(tsv);
    const rows = await fetchAndParse('http://test');
    expect(rows).toHaveLength(2);
  });

  it('skips rows with fewer columns than expected', async () => {
    const tsv = [
      'L001\t2000 Jan 15\tA\tR\tSat\tPL\tJ\tO\tS\tAtlas\tF\tP\tCCAS\tLC17\tA\tA\tNASA\tUS\tOS\tC',
      'short\trow\tonly',
    ].join('\n');
    mockFetch(tsv);
    const rows = await fetchAndParse('http://test');
    expect(rows).toHaveLength(1);
  });

  it('trims whitespace from values', async () => {
    const tsv = 'L001\t 2000 Jan 15 \t A \tR\tSat\tPL\tJ\tO\tS\t Atlas \tF\tP\tCCAS\tLC17\tA\tA\t NASA \tUS\tOS\tC';
    mockFetch(tsv);
    const rows = await fetchAndParse('http://test');
    expect(rows[0].Launch_Date).toBe('2000 Jan 15');
    expect(rows[0].LV_Type).toBe('Atlas');
    expect(rows[0].Agency).toBe('NASA');
  });

  it('parses multiple rows', async () => {
    const tsv = [
      'L001\t2000 Jan 15\tA\tR\tSat\tPL\tJ\tO\tS\tAtlas\tF\tP\tCCAS\tLC17\tA\tA\tNASA\tUS\tOS\tC',
      'L002\t2001 Feb 10\tA\tR\tSat\tPL\tJ\tO\tS\tDelta\tF\tP\tVAFB\tSLC2\tA\tA\tULA\tUS\tDS\tC',
      'L003\t2002 Mar 20\tA\tR\tSat\tPL\tJ\tO\tS\tSoyuz\tF\tP\tBKOS\tLC1\tA\tA\tRKA\tRU\tOF\tC',
    ].join('\n');
    mockFetch(tsv);
    const rows = await fetchAndParse('http://test');
    expect(rows).toHaveLength(3);
    expect(rows[0].Launch_Tag).toBe('L001');
    expect(rows[1].Launch_Tag).toBe('L002');
    expect(rows[2].Launch_Tag).toBe('L003');
  });

  it('throws on non-ok response', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 404 })
    );
    await expect(fetchAndParse('http://test')).rejects.toThrow('Failed to load data: 404');
  });

  it('returns empty array for empty input', async () => {
    mockFetch('');
    const rows = await fetchAndParse('http://test');
    expect(rows).toHaveLength(0);
  });

  it('returns empty array for comments-only input', async () => {
    mockFetch('# comment 1\n# comment 2\n');
    const rows = await fetchAndParse('http://test');
    expect(rows).toHaveLength(0);
  });
});
