import { describe, it, expect } from 'vitest';
import { outcomeColors, categoryColor, heatmapColor } from './colorScale.js';

describe('outcomeColors', () => {
  it('has colors for all four outcome types', () => {
    expect(outcomeColors).toHaveProperty('Success');
    expect(outcomeColors).toHaveProperty('Failure');
    expect(outcomeColors).toHaveProperty('Suborbital');
    expect(outcomeColors).toHaveProperty('Unknown');
  });

  it('has valid hex color values', () => {
    for (const color of Object.values(outcomeColors)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('has distinct colors for each outcome', () => {
    const values = Object.values(outcomeColors);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('categoryColor', () => {
  it('returns a D3 scale function', () => {
    const scale = categoryColor(['US', 'RU', 'CN']);
    expect(typeof scale).toBe('function');
  });

  it('maps each key to a color string', () => {
    const keys = ['US', 'RU', 'CN'];
    const scale = categoryColor(keys);
    for (const key of keys) {
      expect(scale(key)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('assigns different colors to different keys', () => {
    const keys = ['US', 'RU', 'CN'];
    const scale = categoryColor(keys);
    const colors = keys.map(k => scale(k));
    expect(new Set(colors).size).toBe(keys.length);
  });

  it('returns consistent color for the same key', () => {
    const scale = categoryColor(['A', 'B']);
    expect(scale('A')).toBe(scale('A'));
  });

  it('handles more keys than palette colors by cycling', () => {
    const keys = Array.from({ length: 20 }, (_, i) => `K${i}`);
    const scale = categoryColor(keys);
    for (const key of keys) {
      expect(typeof scale(key)).toBe('string');
    }
  });
});

describe('heatmapColor', () => {
  it('returns a scale function', () => {
    const scale = heatmapColor(100);
    expect(typeof scale).toBe('function');
  });

  it('returns a light color for 0', () => {
    const scale = heatmapColor(100);
    const color = scale(0);
    expect(typeof color).toBe('string');
  });

  it('returns a darker color for max than for 0', () => {
    const scale = heatmapColor(100);
    const low = scale(0);
    const high = scale(100);
    expect(low).not.toBe(high);
  });

  it('returns intermediate colors for middle values', () => {
    const scale = heatmapColor(100);
    const low = scale(0);
    const mid = scale(50);
    const high = scale(100);
    expect(mid).not.toBe(low);
    expect(mid).not.toBe(high);
  });
});
