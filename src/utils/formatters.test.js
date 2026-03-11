import { describe, it, expect } from 'vitest';
import { fmtNum, fmtPct, fmtDate, escapeHtml } from './formatters.js';

describe('fmtNum', () => {
  it('formats zero', () => {
    expect(fmtNum(0)).toBe('0');
  });

  it('formats a small integer', () => {
    expect(fmtNum(42)).toBe('42');
  });

  it('formats thousands with comma separator', () => {
    expect(fmtNum(1000)).toBe('1,000');
    expect(fmtNum(1234567)).toBe('1,234,567');
  });
});

describe('fmtPct', () => {
  it('returns 0% when total is 0', () => {
    expect(fmtPct(5, 0)).toBe('0%');
  });

  it('returns 0% when total is falsy (null)', () => {
    expect(fmtPct(5, null)).toBe('0%');
  });

  it('formats a simple percentage', () => {
    expect(fmtPct(1, 2)).toBe('50.0%');
  });

  it('formats 100%', () => {
    expect(fmtPct(10, 10)).toBe('100.0%');
  });

  it('rounds to one decimal', () => {
    expect(fmtPct(1, 3)).toBe('33.3%');
  });
});

describe('fmtDate', () => {
  it('returns empty string for non-Date input', () => {
    expect(fmtDate(null)).toBe('');
    expect(fmtDate(undefined)).toBe('');
    expect(fmtDate('2020-01-01')).toBe('');
    expect(fmtDate(12345)).toBe('');
  });

  it('formats a valid Date', () => {
    const d = new Date(2020, 0, 15); // Jan 15 2020
    const result = fmtDate(d);
    expect(result).toMatch(/2020/);
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
  });
});

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes less-than', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('leaves plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('escapes multiple characters in one string', () => {
    expect(escapeHtml('<a href="x">foo & bar</a>')).toBe('&lt;a href="x"&gt;foo &amp; bar&lt;/a&gt;');
  });
});
