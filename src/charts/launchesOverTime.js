import * as d3 from 'd3';
import { launchesByYear, launchesByYearStacked } from '../data/aggregator.js';
import { tooltip } from '../utils/tooltip.js';
import { categoryColor } from '../utils/colorScale.js';
import { fmtNum } from '../utils/formatters.js';
import { COUNTRY_NAMES } from '../data/countryNames.js';
import { AGENCY_NAMES } from '../data/agencyNames.js';
import { observeResize } from '../utils/responsive.js';
import { vehicleUrl } from '../utils/navigation.js';

export function createLaunchesOverTime(container) {
  const section = document.getElementById('chart-launches-over-time');
  const controls = section.querySelector('.chart-controls');
  const body = section.querySelector('.chart-body');

  let chartMode = 'area'; // 'area' | 'bars' | 'stacked'
  let stackField = 'LVState';
  let currentData = { launches: [], payloads: [] };

  // Toggle buttons
  const areaBtn = document.createElement('button');
  areaBtn.className = 'toggle-btn active';
  areaBtn.textContent = 'Total';
  const stackBtn = document.createElement('button');
  stackBtn.className = 'toggle-btn';
  stackBtn.textContent = 'By Country';
  const agencyBtn = document.createElement('button');
  agencyBtn.className = 'toggle-btn';
  agencyBtn.textContent = 'By Agency';
  const vehicleBtn = document.createElement('button');
  vehicleBtn.className = 'toggle-btn';
  vehicleBtn.textContent = 'By Vehicle';

  controls.append(areaBtn, stackBtn, agencyBtn, vehicleBtn);

  function setMode(mode) {
    chartMode = mode;
    if (mode === 'stacked') stackField = 'LVState';
    else if (mode === 'stackedAgency') stackField = 'Agency';
    else if (mode === 'stackedVehicle') stackField = 'LV_Type';
    areaBtn.classList.toggle('active', mode === 'area');
    stackBtn.classList.toggle('active', mode === 'stacked');
    agencyBtn.classList.toggle('active', mode === 'stackedAgency');
    vehicleBtn.classList.toggle('active', mode === 'stackedVehicle');
    draw();
  }

  areaBtn.addEventListener('click', () => setMode('area'));
  stackBtn.addEventListener('click', () => setMode('stacked'));
  agencyBtn.addEventListener('click', () => setMode('stackedAgency'));
  vehicleBtn.addEventListener('click', () => setMode('stackedVehicle'));

  const margin = { top: 20, right: 20, bottom: 35, left: 50 };
  const isMobile = () => window.innerWidth <= 768;

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

    if (chartMode === 'stacked' || chartMode === 'stackedAgency' || chartMode === 'stackedVehicle') {
      drawStacked(g, launches, innerW, innerH, svg, w, h);
    } else {
      drawArea(g, launches, payloads, innerW, innerH, svg, w, h);
    }
  }

  function drawArea(g, launches, payloads, innerW, innerH, svg, w, h) {
    const data = launchesByYear(launches, payloads, 'launches');
    if (!data.length) return;

    const x = d3.scaleBand()
      .domain(data.map(d => d.year))
      .range([0, innerW])
      .padding(0.15);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) * 1.1])
      .nice()
      .range([innerH, 0]);

    // Grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''));

    // Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.year))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => innerH - y(d.count))
      .attr('fill', '#6366f1')
      .attr('opacity', 0.85)
      .on('mousemove', (event, d) => {
        tooltip.show(
          `<div class="tt-title">${d.year}</div>
           <div class="tt-row"><span class="tt-label">Launches</span><span class="tt-value">${fmtNum(d.count)}</span></div>`,
          event
        );
      })
      .on('mouseleave', () => tooltip.hide());

    // Axes
    const tickYears = data.map(d => d.year).filter(yr => yr % 5 === 0);
    const xAxis = d3.axisBottom(x).tickValues(tickYears).tickFormat(d3.format('d'));
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis);

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));
  }

  function drawStacked(g, launches, innerW, innerH, svg, w, h) {
    const { data, keys } = launchesByYearStacked(launches, stackField);
    if (!data.length) return;

    const color = categoryColor(keys);

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

    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''));

    // Stacked bars
    g.selectAll('.stack-group')
      .data(series)
      .join('g')
      .attr('class', 'stack-group')
      .attr('fill', d => color(d.key))
      .selectAll('rect')
      .data(d => d.map(pt => ({ ...pt, key: d.key })))
      .join('rect')
      .attr('x', d => x(d.data.year))
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth())
      .attr('opacity', 0.85);

    const nameMap = stackField === 'Agency' ? AGENCY_NAMES : stackField === 'LVState' ? COUNTRY_NAMES : {};

    // Invisible overlay rects per year for tooltips
    g.selectAll('.hover-bar')
      .data(data)
      .join('rect')
      .attr('class', 'hover-bar')
      .attr('x', d => x(d.year))
      .attr('y', 0)
      .attr('width', x.bandwidth())
      .attr('height', innerH)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', (event, d) => {
        const rows = keys.filter(k => d[k] > 0).map(k =>
          `<div class="tt-row"><span class="tt-label"><span class="tt-swatch" style="background:${color(k)}"></span>${nameMap[k] || k}</span><span class="tt-value">${d[k]}</span></div>`
        ).join('');
        tooltip.show(`<div class="tt-title">${d.year}</div>${rows}`, event);
      })
      .on('mouseleave', () => tooltip.hide());

    const tickYears = data.map(d => d.year).filter(yr => yr % 5 === 0);
    const xAxis = d3.axisBottom(x).tickValues(tickYears).tickFormat(d3.format('d'));
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis);

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    // Legend
    const legend = d3.select(body).append('div').attr('class', 'chart-legend');
    for (const key of keys) {
      const displayName = nameMap[key] || key;
      const item = legend.append('span')
        .attr('class', 'legend-item')
        .html(`<span class="legend-swatch" style="background:${color(key)}"></span>${displayName}`);
      if (stackField === 'LV_Type' && key !== 'Other') {
        item.style('cursor', 'pointer')
          .on('click', () => {
            window.location.href = vehicleUrl(key);
          });
      }
    }
  }

  observeResize(body, () => draw());

  return {
    update(launches, payloads) {
      currentData = { launches, payloads };
      draw();
    }
  };
}
