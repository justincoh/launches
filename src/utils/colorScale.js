import * as d3 from 'd3';

const OUTCOME_DEFAULTS = {
  Success: '#22c55e',
  Failure: '#ef4444',
  Suborbital: '#8b5cf6',
  Unknown: '#6b7280',
};

const OUTCOME_CSS_VARS = {
  Success: '--success',
  Failure: '--failure',
  Suborbital: '--suborbital',
};

function readCssVar(name) {
  if (typeof getComputedStyle === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name).trim();
}

function getTheme() {
  if (typeof document === 'undefined') return null;
  return document.documentElement.getAttribute('data-theme');
}

export const outcomeColors = new Proxy(OUTCOME_DEFAULTS, {
  get(target, prop) {
    if (prop in OUTCOME_CSS_VARS) {
      const val = readCssVar(OUTCOME_CSS_VARS[prop]);
      return val || target[prop];
    }
    return target[prop];
  }
});

const DEFAULT_PALETTE = [
  '#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#e879f9', '#fbbf24', '#34d399', '#fb7185', '#a78bfa',
];

const ATOMPUNK_PALETTE = [
  '#d4943c', '#7d8a3e', '#b85c38', '#4a8a7a', '#9a7040',
  '#b84a3a', '#6a8a5a', '#c47030', '#3a7a8a', '#c8a850',
  '#9a6060', '#6a7a3a', '#aa7040', '#5a6a8a', '#b89030',
];

export function categoryColor(keys) {
  const palette = getTheme() === 'atompunk' ? ATOMPUNK_PALETTE : DEFAULT_PALETTE;
  const scale = d3.scaleOrdinal().domain(keys).range(palette);
  return scale;
}

export function heatmapColor(maxVal) {
  const interpolator = getTheme() === 'atompunk'
    ? d3.interpolateOranges
    : d3.interpolateReds;
  return d3.scaleSequential()
    .domain([0, maxVal])
    .interpolator(interpolator);
}
