import * as d3 from 'd3';
import { vehicleLifespans } from '../data/aggregator.js';
import { tooltip } from '../utils/tooltip.js';
import { categoryColor } from '../utils/colorScale.js';
import { fmtNum } from '../utils/formatters.js';
import { observeResize } from '../utils/responsive.js';
import { COUNTRY_NAMES } from '../data/countryNames.js';

export function createVehicleTimeline(container) {
  const section = document.getElementById('chart-vehicle-timeline');
  const controls = section.querySelector('.chart-controls');
  const body = section.querySelector('.chart-body');

  let currentLaunches = [];
  let sortMode = 'count';
  let topCount = 10;

  const sortSelect = document.createElement('select');
  sortSelect.className = 'chart-select';
  sortSelect.innerHTML = `
    <option value="count">Sort by Count</option>
    <option value="firstYear">Sort by First Launch</option>
    <option value="alpha">Sort Alphabetically</option>
  `;
  controls.appendChild(sortSelect);
  sortSelect.addEventListener('change', () => {
    sortMode = sortSelect.value;
    draw();
  });

  function draw() {
    body.innerHTML = '';
    let data = vehicleLifespans(currentLaunches, topCount);
    if (!data.length) return;

    if (sortMode === 'firstYear') data.sort((a, b) => a.firstYear - b.firstYear);
    else if (sortMode === 'alpha') data.sort((a, b) => a.vehicle.localeCompare(b.vehicle));
    // 'count' is default sort from aggregator

    const states = [...new Set(data.map(d => d.state).filter(Boolean))];
    const color = categoryColor(states);

    const margin = { top: 10, right: 20, bottom: 30, left: 150 };
    const rowH = 18;
    const h = margin.top + margin.bottom + data.length * (rowH + 2);
    const w = body.clientWidth || 800;
    const innerW = w - margin.left - margin.right;

    const svg = d3.select(body)
      .append('svg')
      .attr('viewBox', `0 0 ${w} ${h}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const allYears = data.flatMap(d => [d.firstYear, d.lastYear]);
    const x = d3.scaleLinear()
      .domain([d3.min(allYears) - 1, d3.max(allYears) + 1])
      .range([0, innerW]);

    const y = d3.scaleBand()
      .domain(data.map(d => d.vehicle))
      .range([0, data.length * (rowH + 2)])
      .padding(0.15);

    const maxCount = d3.max(data, d => d.count);
    const rScale = d3.scaleSqrt().domain([1, maxCount]).range([3, 10]);

    // Grid lines
    g.append('g').attr('class', 'grid')
      .attr('transform', `translate(0,${data.length * (rowH + 2)})`)
      .call(d3.axisBottom(x).tickSize(-(data.length * (rowH + 2))).tickFormat(''))
      .select('.domain').remove();

    // Lines
    g.selectAll('.timeline-line')
      .data(data)
      .join('line')
      .attr('class', 'timeline-line')
      .attr('x1', d => x(d.firstYear))
      .attr('x2', d => x(d.lastYear))
      .attr('y1', d => y(d.vehicle) + y.bandwidth() / 2)
      .attr('y2', d => y(d.vehicle) + y.bandwidth() / 2)
      .attr('stroke', d => color(d.state))
      .attr('opacity', 0.6);

    // Start dots
    g.selectAll('.timeline-dot-start')
      .data(data)
      .join('circle')
      .attr('class', 'timeline-dot')
      .attr('cx', d => x(d.firstYear))
      .attr('cy', d => y(d.vehicle) + y.bandwidth() / 2)
      .attr('r', d => rScale(d.count))
      .attr('fill', d => color(d.state))
      .on('mousemove', (event, d) => showTip(event, d))
      .on('mouseleave', () => tooltip.hide());

    // End dots (only if different from start)
    g.selectAll('.timeline-dot-end')
      .data(data.filter(d => d.lastYear !== d.firstYear))
      .join('circle')
      .attr('class', 'timeline-dot')
      .attr('cx', d => x(d.lastYear))
      .attr('cy', d => y(d.vehicle) + y.bandwidth() / 2)
      .attr('r', d => rScale(d.count))
      .attr('fill', d => color(d.state))
      .on('mousemove', (event, d) => showTip(event, d))
      .on('mouseleave', () => tooltip.hide());

    // Axes
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${data.length * (rowH + 2)})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y).tickSize(0))
      .select('.domain').remove();

    g.selectAll('.axis text')
      .style('font-size', '0.6rem');

    // Legend
    const legend = d3.select(body).append('div').attr('class', 'chart-legend');
    for (const s of states.slice(0, 10)) {
      legend.append('span')
        .attr('class', 'legend-item')
        .html(`<span class="legend-swatch" style="background:${color(s)}"></span>${COUNTRY_NAMES[s] || s}`);
    }
  }

  function showTip(event, d) {
    tooltip.show(
      `<div class="tt-title">${d.vehicle}</div>
       <div class="tt-row"><span class="tt-label">Country</span><span class="tt-value">${(d.state && COUNTRY_NAMES[d.state]) || d.state || 'Unknown'}</span></div>
       <div class="tt-row"><span class="tt-label">Active</span><span class="tt-value">${d.firstYear}\u2013${d.lastYear}</span></div>
       <div class="tt-row"><span class="tt-label">Launches</span><span class="tt-value">${fmtNum(d.count)}</span></div>`,
      event
    );
  }

  observeResize(body, () => draw());

  return {
    update(launches) {
      currentLaunches = launches;
      draw();
    }
  };
}
