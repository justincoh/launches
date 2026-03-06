import * as d3 from 'd3';
import { tooltip } from '../utils/tooltip.js';
import { outcomeColors } from '../utils/colorScale.js';
import { fmtNum } from '../utils/formatters.js';
import { observeResize } from '../utils/responsive.js';

export function createVehicleBarChart(section) {
  const body = section.querySelector('.chart-body');

  let currentLaunches = [];

  function draw() {
    body.innerHTML = '';
    if (!currentLaunches.length) return;

    // Group by year and outcome
    const yearMap = new Map();
    for (const d of currentLaunches) {
      if (d.year == null) continue;
      if (!yearMap.has(d.year)) yearMap.set(d.year, { Success: 0, Failure: 0, Suborbital: 0 });
      const bucket = yearMap.get(d.year);
      if (bucket[d.outcome] !== undefined) bucket[d.outcome]++;
    }

    const data = [...yearMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, counts]) => ({ year, ...counts }));

    if (!data.length) return;

    const keys = ['Success', 'Failure', 'Suborbital'];
    const w = body.clientWidth || 600;
    const h = 350;
    const margin = { top: 20, right: 20, bottom: 35, left: 50 };
    const innerW = w - margin.left - margin.right;
    const innerH = h - margin.top - margin.bottom;

    const svg = d3.select(body)
      .append('svg')
      .attr('viewBox', `0 0 ${w} ${h}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.year))
      .range([0, innerW])
      .padding(0.15);

    const stack = d3.stack().keys(keys);
    const series = stack(data);

    const y = d3.scaleLinear()
      .domain([0, d3.max(series, s => d3.max(s, d => d[1])) * 1.05])
      .nice()
      .range([innerH, 0]);

    // Grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''));

    for (const s of series) {
      g.selectAll(`.bar-${s.key}`)
        .data(s)
        .join('rect')
        .attr('x', d => x(d.data.year))
        .attr('y', d => y(d[1]))
        .attr('width', x.bandwidth())
        .attr('height', d => y(d[0]) - y(d[1]))
        .attr('fill', outcomeColors[s.key])
        .attr('rx', 2)
        .on('mousemove', function (event, d) {
          tooltip.show(
            `<div class="tt-title">${d.data.year}</div>
             <div class="tt-row"><span class="tt-label">Success</span><span class="tt-value">${fmtNum(d.data.Success)}</span></div>
             <div class="tt-row"><span class="tt-label">Failure</span><span class="tt-value">${fmtNum(d.data.Failure)}</span></div>
             ${d.data.Suborbital ? `<div class="tt-row"><span class="tt-label">Suborbital</span><span class="tt-value">${fmtNum(d.data.Suborbital)}</span></div>` : ''}`,
            event
          );
        })
        .on('mouseleave', () => tooltip.hide());
    }

    // Axes
    const xAxis = d3.axisBottom(x).tickValues(
      data.length > 20
        ? data.filter((_, i) => i % Math.ceil(data.length / 15) === 0).map(d => d.year)
        : data.map(d => d.year)
    );
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis);

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    // Legend
    const legend = d3.select(body).append('div').attr('class', 'chart-legend');
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
