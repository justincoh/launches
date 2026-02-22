import * as d3 from 'd3';

export const outcomeColors = {
  Success: '#22c55e',
  Failure: '#ef4444',
  Suborbital: '#8b5cf6',
  Unknown: '#6b7280',
};

const PALETTE = [
  '#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#e879f9', '#fbbf24', '#34d399', '#fb7185', '#a78bfa',
];

export function categoryColor(keys) {
  const scale = d3.scaleOrdinal().domain(keys).range(PALETTE);
  return scale;
}

export function heatmapColor(maxVal) {
  return d3.scaleSequential()
    .domain([0, maxVal])
    .interpolator(d3.interpolateReds);
}
