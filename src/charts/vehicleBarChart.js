import * as d3 from 'd3';
import { tooltip } from '../utils/tooltip.js';
import { outcomeColors } from '../utils/colorScale.js';
import { fmtNum } from '../utils/formatters.js';
import { observeResize, isMobile } from '../utils/responsive.js';
import { MONTH_LABELS } from '../data/aggregator.js';

export function createVehicleBarChart(section, options = {}) {
  const { onDrillYear } = options;
  const body = section.querySelector('.chart-body');
  const controls = section.querySelector('.chart-controls');
  const heading = section.querySelector('h2');

  let currentLaunches = [];
  let drillYear = null;

  // Back button
  const backBtn = document.createElement('button');
  backBtn.className = 'toggle-btn';
  backBtn.textContent = '\u2190 All Years';
  backBtn.style.display = 'none';
  backBtn.addEventListener('click', () => {
    drillYear = null;
    backBtn.style.display = 'none';
    heading.textContent = 'Launches by Year';
    if (onDrillYear) {
      onDrillYear(null);
    } else {
      draw();
    }
  });
  if (controls) {
    controls.prepend(backBtn);
  } else {
    heading.after(backBtn);
  }

  function drillInto(year) {
    drillYear = year;
    backBtn.style.display = '';
    heading.textContent = `Launches in ${year}`;
    if (onDrillYear) {
      onDrillYear(year);
    } else {
      draw();
    }
  }

  function draw() {
    body.innerHTML = '';
    if (!currentLaunches.length) return;

    let data;
    let xDomainField;
    let xTickFormat;

    if (drillYear !== null) {
      // Monthly view
      const monthMap = new Map();
      for (let m = 0; m < 12; m++) monthMap.set(m, { Success: 0, Failure: 0, Suborbital: 0 });
      for (const d of currentLaunches) {
        if (d.year !== drillYear || d.date == null) continue;
        const m = d.date.getMonth();
        const bucket = monthMap.get(m);
        if (bucket[d.outcome] !== undefined) bucket[d.outcome]++;
      }
      data = [...monthMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([month, counts]) => ({ month, ...counts }));
      xDomainField = 'month';
      xTickFormat = d => MONTH_LABELS[d];
    } else {
      // Yearly view
      const yearMap = new Map();
      for (const d of currentLaunches) {
        if (d.year == null) continue;
        if (!yearMap.has(d.year)) yearMap.set(d.year, { Success: 0, Failure: 0, Suborbital: 0 });
        const bucket = yearMap.get(d.year);
        if (bucket[d.outcome] !== undefined) bucket[d.outcome]++;
      }
      data = [...yearMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([year, counts]) => ({ year, ...counts }));
      xDomainField = 'year';
      xTickFormat = null;
    }

    if (!data.length) return;

    const keys = ['Success', 'Failure', 'Suborbital'].filter(k => data.some(d => d[k]));
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
      .domain(data.map(d => d[xDomainField]))
      .range([0, innerW])
      .padding(0.15);

    const stack = d3.stack().keys(keys);
    const series = stack(data);

    const y = d3.scaleLinear()
      .domain([0, d3.max(series, s => d3.max(s, d => d[1])) * 1.05 || 1])
      .nice()
      .range([innerH, 0]);

    // Grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(''));

    for (const s of series) {
      g.selectAll(`.bar-${s.key}`)
        .data(s)
        .join('rect')
        .attr('x', d => x(d.data[xDomainField]))
        .attr('y', d => y(d[1]))
        .attr('width', x.bandwidth())
        .attr('height', d => y(d[0]) - y(d[1]))
        .attr('fill', outcomeColors[s.key])
        .attr('rx', 2);
    }

    // Invisible overlay for tooltips + click
    g.selectAll('.hover-bar')
      .data(data)
      .join('rect')
      .attr('class', 'hover-bar')
      .attr('x', d => x(d[xDomainField]))
      .attr('y', 0)
      .attr('width', x.bandwidth())
      .attr('height', innerH)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .style('cursor', drillYear === null ? 'pointer' : 'default')
      .on('mousemove', function (event, d) {
        const label = drillYear !== null ? `${MONTH_LABELS[d.month]} ${drillYear}` : d.year;
        tooltip.show(
          `<div class="tt-title">${label}</div>
           <div class="tt-row"><span class="tt-label">Success</span><span class="tt-value">${fmtNum(d.Success)}</span></div>
           <div class="tt-row"><span class="tt-label">Failure</span><span class="tt-value">${fmtNum(d.Failure)}</span></div>
           ${d.Suborbital ? `<div class="tt-row"><span class="tt-label">Suborbital</span><span class="tt-value">${fmtNum(d.Suborbital)}</span></div>` : ''}`,
          event
        );
      })
      .on('mouseleave', () => tooltip.hide())
      .on('click', drillYear === null ? (event, d) => drillInto(d.year) : null);

    // Axes
    let xAxis;
    if (drillYear !== null) {
      xAxis = d3.axisBottom(x).tickFormat(xTickFormat);
    } else {
      const maxTicks = isMobile() ? 5 : 15;
      const allYears = data.map(d => d.year);
      const ticks = data.length > maxTicks
        ? data.filter((_, i) => i % Math.ceil(data.length / maxTicks) === 0).map(d => d.year)
        : allYears;
      xAxis = d3.axisBottom(x).tickValues(ticks);
    }
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
    update(launches, yearRange) {
      currentLaunches = launches;
      // Exit drill mode if year range no longer matches the drilled year
      if (drillYear !== null && yearRange) {
        if (yearRange.yearMin !== drillYear || yearRange.yearMax !== drillYear) {
          drillYear = null;
          backBtn.style.display = 'none';
          heading.textContent = 'Launches by Year';
        }
      }
      draw();
    }
  };
}
