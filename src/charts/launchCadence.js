import * as d3 from 'd3';
import { cadenceData } from '../data/aggregator.js';
import { tooltip } from '../utils/tooltip.js';
import { heatmapColor } from '../utils/colorScale.js';
import { fmtDate } from '../utils/formatters.js';
import { observeResize } from '../utils/responsive.js';

export function createLaunchCadence(container) {
  const section = document.getElementById('chart-launch-cadence');
  const body = section.querySelector('.chart-body');
  const controls = section.querySelector('.chart-controls');

  let currentLaunches = [];
  let scopeStart = 2000;

  const scopeSelect = document.createElement('select');
  scopeSelect.className = 'chart-select';
  scopeSelect.innerHTML = `
    <option value="1957">All Years</option>
    <option value="1990">1990+</option>
    <option value="2000" selected>2000+</option>
    <option value="2010">2010+</option>
    <option value="2020">2020+</option>
  `;
  controls.appendChild(scopeSelect);
  scopeSelect.addEventListener('change', () => {
    scopeStart = +scopeSelect.value;
    draw();
  });

  function draw() {
    body.innerHTML = '';
    const data = cadenceData(currentLaunches).filter(d => d.year >= scopeStart);
    if (!data.length) return;

    const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
    const yearIdx = new Map(years.map((y, i) => [y, i]));
    const maxCount = d3.max(data, d => d.count) || 1;
    const color = heatmapColor(maxCount);

    const cellSize = 3;
    const cellGap = 1;
    const step = cellSize + cellGap;
    const margin = { top: 15, right: 10, bottom: 10, left: 40 };
    const w = margin.left + margin.right + 366 * step;
    const h = margin.top + margin.bottom + years.length * step;

    const svg = d3.select(body)
      .append('svg')
      .attr('viewBox', `0 0 ${w} ${h}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Background
    g.append('rect')
      .attr('width', 366 * step)
      .attr('height', years.length * step)
      .attr('fill', 'rgba(255,255,255,0.02)')
      .attr('rx', 2);

    // Only render cells with data using a data join
    g.selectAll('.heatmap-cell')
      .data(data)
      .join('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', d => d.day * step)
      .attr('y', d => yearIdx.get(d.year) * step)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('fill', d => color(d.count))
      .attr('rx', 0.5)
      .on('mousemove', function(event, d) {
        const date = new Date(d.year, 0, d.day + 1);
        tooltip.show(
          `<div class="tt-title">${fmtDate(date)}</div>
           <div class="tt-row"><span class="tt-label">Launches</span><span class="tt-value">${d.count}</span></div>`,
          event
        );
      })
      .on('mouseleave', () => tooltip.hide());

    // Year labels
    g.selectAll('.year-label')
      .data(years)
      .join('text')
      .attr('x', -6)
      .attr('y', (d, i) => i * step + cellSize)
      .attr('text-anchor', 'end')
      .attr('fill', 'var(--text-muted)')
      .attr('font-size', Math.min(step, 10) + 'px')
      .text(d => d);

    // Month labels
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthDays = monthNames.map((_, m) =>
      Math.floor((new Date(2024, m, 1) - new Date(2024, 0, 1)) / 86400000)
    );
    g.selectAll('.month-label')
      .data(monthNames)
      .join('text')
      .attr('x', (d, i) => monthDays[i] * step)
      .attr('y', -4)
      .attr('fill', 'var(--text-muted)')
      .attr('font-size', '8px')
      .text(d => d);
  }

  observeResize(body, () => draw());

  return {
    update(launches) {
      currentLaunches = launches;
      draw();
    }
  };
}
