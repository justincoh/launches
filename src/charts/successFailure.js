import * as d3 from 'd3';
import { outcomeBreakdown, outcomeByDimension } from '../data/aggregator.js';
import { tooltip } from '../utils/tooltip.js';
import { outcomeColors } from '../utils/colorScale.js';
import { fmtNum, fmtPct } from '../utils/formatters.js';
import { observeResize } from '../utils/responsive.js';

const ALL_DIMENSIONS = [
  { value: 'decade', label: 'By Decade' },
  { value: 'LVState', label: 'By Country' },
  { value: 'Agency', label: 'By Agency' },
  { value: 'LV_Type', label: 'By Vehicle' },
];

export function createSuccessFailure(container, options = {}) {
  const section = container.querySelector
    ? container.querySelector('#chart-success-failure') || document.getElementById('chart-success-failure')
    : document.getElementById('chart-success-failure');
  const controls = section.querySelector('.chart-controls');
  const body = section.querySelector('.chart-body');

  const excludeDimensions = options.excludeDimensions || [];
  const donutOnly = options.donutOnly || false;
  const dims = ALL_DIMENSIONS.filter(d => !excludeDimensions.includes(d.value));

  let dim = dims[0]?.value || 'decade';
  let currentLaunches = [];

  if (!donutOnly) {
    const dimSelect = document.createElement('select');
    dimSelect.className = 'chart-select';
    dimSelect.innerHTML = dims.map(d =>
      `<option value="${d.value}">${d.label}</option>`
    ).join('');
    controls.appendChild(dimSelect);
    dimSelect.addEventListener('change', () => {
      dim = dimSelect.value;
      draw();
    });
  }

  function draw() {
    body.innerHTML = '';
    if (donutOnly) {
      drawDonut(body, currentLaunches);
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'success-failure-grid';
    body.appendChild(grid);

    drawDonut(grid, currentLaunches);
    drawBars(grid, currentLaunches);
  }

  function drawDonut(grid, launches) {
    const container = document.createElement('div');
    if (donutOnly) container.style.maxWidth = '220px';
    grid.appendChild(container);

    const data = outcomeBreakdown(launches);
    const total = d3.sum(data, d => d.count);
    const successCount = data.find(d => d.outcome === 'Success')?.count || 0;
    const rate = total ? (successCount / total * 100).toFixed(1) : 0;

    const size = 220;
    const radius = size / 2;
    const innerRadius = radius * 0.6;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${size} ${size}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')
      .attr('transform', `translate(${radius},${radius})`);

    const pie = d3.pie().value(d => d.count).sort(null);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius - 4);

    svg.selectAll('path')
      .data(pie(data))
      .join('path')
      .attr('d', arc)
      .attr('fill', d => outcomeColors[d.data.outcome])
      .attr('stroke', 'var(--surface)')
      .attr('stroke-width', 2)
      .on('mousemove', function(event, d) {
        tooltip.show(
          `<div class="tt-title">${d.data.outcome}</div>
           <div class="tt-row"><span class="tt-label">Count</span><span class="tt-value">${fmtNum(d.data.count)}</span></div>
           <div class="tt-row"><span class="tt-label">Share</span><span class="tt-value">${fmtPct(d.data.count, total)}</span></div>`,
          event
        );
      })
      .on('mouseleave', () => tooltip.hide());

    // Center text
    svg.append('text')
      .attr('class', 'donut-center-total')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.1em')
      .text(fmtNum(total));

    svg.append('text')
      .attr('class', 'donut-center-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .text(`${rate}% success`);
  }

  function drawBars(grid, launches) {
    const container = document.createElement('div');
    grid.appendChild(container);

    const data = outcomeByDimension(launches, dim);
    if (!data.length) return;

    const w = 360;
    const barH = 22;
    const margin = { top: 5, right: 15, bottom: 25, left: 80 };
    const h = margin.top + margin.bottom + data.length * (barH + 4);

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${w} ${h}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const innerW = w - margin.left - margin.right;

    const maxVal = d3.max(data, d => d.Success + d.Failure + d.Suborbital);

    const x = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const y = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, data.length * (barH + 4)])
      .padding(0.15);

    const keys = ['Success', 'Failure', 'Suborbital'];
    const stack = d3.stack().keys(keys);
    const series = stack(data);

    for (const s of series) {
      g.selectAll(`.bar-${s.key}`)
        .data(s)
        .join('rect')
        .attr('x', d => x(d[0]))
        .attr('y', d => y(d.data.label))
        .attr('width', d => x(d[1]) - x(d[0]))
        .attr('height', y.bandwidth())
        .attr('fill', outcomeColors[s.key])
        .attr('rx', 2)
        .on('mousemove', function(event, d) {
          tooltip.show(
            `<div class="tt-title">${d.data.label}</div>
             <div class="tt-row"><span class="tt-label">Success</span><span class="tt-value">${fmtNum(d.data.Success)}</span></div>
             <div class="tt-row"><span class="tt-label">Failure</span><span class="tt-value">${fmtNum(d.data.Failure)}</span></div>
             <div class="tt-row"><span class="tt-label">Suborbital</span><span class="tt-value">${fmtNum(d.data.Suborbital)}</span></div>`,
            event
          );
        })
        .on('mouseleave', () => tooltip.hide());
    }

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '0.65rem');

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${data.length * (barH + 4)})`)
      .call(d3.axisBottom(x).ticks(5));

    // Legend
    const legend = d3.select(container).append('div').attr('class', 'chart-legend');
    for (const k of keys) {
      legend.append('span')
        .attr('class', 'legend-item')
        .html(`<span class="legend-swatch" style="background:${outcomeColors[k]}"></span>${k}`);
    }
  }

  observeResize(body, () => draw());

  return {
    update(launches) {
      currentLaunches = launches;
      draw();
    }
  };
}
