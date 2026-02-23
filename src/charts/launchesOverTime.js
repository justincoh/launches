import * as d3 from 'd3';
import { launchesByYear, launchesByYearStacked } from '../data/aggregator.js';
import { tooltip } from '../utils/tooltip.js';
import { categoryColor } from '../utils/colorScale.js';
import { fmtNum } from '../utils/formatters.js';
import { observeResize } from '../utils/responsive.js';

export function createLaunchesOverTime(container) {
  const section = document.getElementById('chart-launches-over-time');
  const controls = section.querySelector('.chart-controls');
  const body = section.querySelector('.chart-body');

  let stacked = false;
  let stackField = 'SatState';
  let currentData = { launches: [], payloads: [] };

  // Toggle buttons
  const stackBtn = document.createElement('button');
  stackBtn.className = 'toggle-btn';
  stackBtn.textContent = 'Stacked';

  controls.append(stackBtn);

  stackBtn.addEventListener('click', () => {
    stacked = !stacked;
    stackBtn.classList.toggle('active', stacked);
    draw();
  });

  const margin = { top: 20, right: 20, bottom: 35, left: 50 };

  function draw() {
    body.innerHTML = '';
    const { launches, payloads } = currentData;
    const w = body.clientWidth || 600;
    const h = 350;

    const svg = d3.select(body)
      .append('svg')
      .attr('viewBox', `0 0 ${w} ${h}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const innerW = w - margin.left - margin.right;
    const innerH = h - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    if (stacked) {
      drawStacked(g, launches, innerW, innerH, svg, w, h);
    } else {
      drawArea(g, launches, payloads, innerW, innerH, svg, w, h);
    }
  }

  function drawArea(g, launches, payloads, innerW, innerH, svg, w, h) {
    const data = launchesByYear(launches, payloads, 'launches');
    if (!data.length) return;

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([0, innerW]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) * 1.1])
      .nice()
      .range([innerH, 0]);

    // Grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''));

    // Area
    const area = d3.area()
      .x(d => x(d.year))
      .y0(innerH)
      .y1(d => y(d.count))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'rgba(99, 102, 241, 0.2)')
      .attr('d', area);

    // Line
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Axes
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    // Hover interaction
    const hoverLine = g.append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0)
      .attr('y2', innerH)
      .style('display', 'none');

    const hoverDot = g.append('circle')
      .attr('r', 4)
      .attr('fill', '#6366f1')
      .style('display', 'none');

    const overlay = g.append('rect')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');

    const bisect = d3.bisector(d => d.year).left;

    overlay.on('mousemove', function(event) {
      const [mx] = d3.pointer(event);
      const yr = x.invert(mx);
      const idx = bisect(data, yr, 1);
      const d0 = data[idx - 1];
      const d1 = data[idx];
      const d = d1 && (yr - d0.year > d1.year - yr) ? d1 : d0;
      if (!d) return;

      hoverLine.attr('x1', x(d.year)).attr('x2', x(d.year)).style('display', null);
      hoverDot.attr('cx', x(d.year)).attr('cy', y(d.count)).style('display', null);
      tooltip.show(
        `<div class="tt-title">${d.year}</div>
         <div class="tt-row"><span class="tt-label">Launches</span><span class="tt-value">${fmtNum(d.count)}</span></div>`,
        event
      );
    });

    overlay.on('mouseleave', () => {
      hoverLine.style('display', 'none');
      hoverDot.style('display', 'none');
      tooltip.hide();
    });
  }

  function drawStacked(g, launches, innerW, innerH, svg, w, h) {
    const { data, keys } = launchesByYearStacked(launches, stackField);
    if (!data.length) return;

    const color = categoryColor(keys);

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([0, innerW]);

    const stack = d3.stack().keys(keys);
    const series = stack(data);

    const y = d3.scaleLinear()
      .domain([0, d3.max(series, s => d3.max(s, d => d[1])) * 1.05])
      .nice()
      .range([innerH, 0]);

    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''));

    const area = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    g.selectAll('.stack-area')
      .data(series)
      .join('path')
      .attr('class', 'stack-area')
      .attr('fill', d => color(d.key))
      .attr('opacity', 0.75)
      .attr('d', area);

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    // Legend
    const legend = d3.select(body).append('div').attr('class', 'chart-legend');
    for (const key of keys) {
      legend.append('span')
        .attr('class', 'legend-item')
        .html(`<span class="legend-swatch" style="background:${color(key)}"></span>${key}`);
    }

    // Hover
    const overlay = g.append('rect')
      .attr('width', innerW).attr('height', innerH)
      .attr('fill', 'none').attr('pointer-events', 'all');

    const hoverLine = g.append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0).attr('y2', innerH)
      .style('display', 'none');

    const bisect = d3.bisector(d => d.year).left;

    overlay.on('mousemove', function(event) {
      const [mx] = d3.pointer(event);
      const yr = x.invert(mx);
      const idx = bisect(data, yr, 1);
      const d0 = data[idx - 1];
      const d1 = data[idx];
      const d = d1 && (yr - d0.year > d1.year - yr) ? d1 : d0;
      if (!d) return;

      hoverLine.attr('x1', x(d.year)).attr('x2', x(d.year)).style('display', null);
      const rows = keys.map(k =>
        `<div class="tt-row"><span class="tt-label"><span class="tt-swatch" style="background:${color(k)}"></span>${k}</span><span class="tt-value">${d[k]}</span></div>`
      ).join('');
      tooltip.show(`<div class="tt-title">${d.year}</div>${rows}`, event);
    });

    overlay.on('mouseleave', () => {
      hoverLine.style('display', 'none');
      tooltip.hide();
    });
  }

  observeResize(body, () => draw());

  return {
    update(launches, payloads) {
      currentData = { launches, payloads };
      draw();
    }
  };
}
