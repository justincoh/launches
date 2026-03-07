import * as d3 from 'd3';
import { topN } from '../data/aggregator.js';
import { tooltip } from '../utils/tooltip.js';
import { categoryColor } from '../utils/colorScale.js';
import { fmtNum } from '../utils/formatters.js';
import { filterState } from '../filters/filterState.js';
import { observeResize } from '../utils/responsive.js';
import { COUNTRY_NAMES } from '../data/countryNames.js';
import { AGENCY_NAMES } from '../data/agencyNames.js';
import { SITE_NAMES } from '../data/siteNames.js';
import { vehicleUrl, agencyUrl } from '../utils/navigation.js';

const PANELS = [
  { title: 'Top Countries', field: 'LVState', filterKey: 'country', displayNames: COUNTRY_NAMES },
  { title: 'Top Agencies', field: 'Agency', filterKey: 'agency', displayNames: AGENCY_NAMES },
  { title: 'Top Vehicles', field: 'LV_Type', filterKey: 'vehicle' },
  { title: 'Top Sites', field: 'Launch_Site', filterKey: 'site', displayNames: SITE_NAMES },
];

export function createTopRankings(container, options = {}) {
  const section = container.querySelector
    ? container.querySelector('#chart-top-rankings') || document.getElementById('chart-top-rankings')
    : document.getElementById('chart-top-rankings');
  const controls = section.querySelector('.chart-controls');
  const body = section.querySelector('.chart-body');

  const excludePanels = options.excludePanels || [];
  const onBarClick = options.onBarClick || null;
  const activePanels = PANELS.filter(p => !excludePanels.includes(p.filterKey));

  let n = 10;
  let currentLaunches = [];

  const nSelect = document.createElement('select');
  nSelect.className = 'chart-select';
  nSelect.innerHTML = `
    <option value="5">Top 5</option>
    <option value="10" selected>Top 10</option>
    <option value="20">Top 20</option>
  `;
  controls.appendChild(nSelect);
  nSelect.addEventListener('change', () => {
    n = +nSelect.value;
    draw();
  });

  function draw() {
    body.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'rankings-grid';
    body.appendChild(grid);

    for (const panel of activePanels) {
      drawPanel(grid, panel);
    }
  }

  function handleClick(panel, label) {
    if (onBarClick) onBarClick(panel.filterKey, label);
    else if (panel.filterKey === 'vehicle') window.location.href = vehicleUrl(label);
    else if (panel.filterKey === 'agency') window.location.href = agencyUrl(label);
    else filterState.set({ [panel.filterKey]: label });
  }

  function drawPanel(grid, panel) {
    const wrap = document.createElement('div');
    wrap.className = 'ranking-panel';
    wrap.innerHTML = `<h3>${panel.title}</h3>`;
    grid.appendChild(wrap);

    const data = topN(currentLaunches, panel.field, n);
    if (!data.length) return;

    const color = categoryColor(data.map(d => d.label));
    const hint = onBarClick ? '' : '<div class="tt-row" style="font-size:0.65rem;color:var(--text-muted)">Click to filter</div>';

    const margin = { top: 2, right: 40, bottom: 5, left: 90 };
    const barH = 20;
    const h = margin.top + margin.bottom + data.length * (barH + 3);
    const w = 320;

    const svg = d3.select(wrap)
      .append('svg')
      .attr('viewBox', `0 0 ${w} ${h}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const innerW = w - margin.left - margin.right;

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count)])
      .range([0, innerW]);

    const y = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, data.length * (barH + 3)])
      .padding(0.12);

    g.selectAll('.ranking-bar')
      .data(data)
      .join('rect')
      .attr('class', 'ranking-bar')
      .attr('x', 0)
      .attr('y', d => y(d.label))
      .attr('width', d => x(d.count))
      .attr('height', y.bandwidth())
      .attr('fill', d => color(d.label))
      .attr('rx', 3)
      .on('click', (event, d) => handleClick(panel, d.label))
      .on('mousemove', (event, d) => {
        const name = (panel.displayNames && panel.displayNames[d.label]) || d.label;
        tooltip.show(
          `<div class="tt-title">${name}</div>
           <div class="tt-row"><span class="tt-label">Launches</span><span class="tt-value">${fmtNum(d.count)}</span></div>
           ${hint}`,
          event
        );
      })
      .on('mouseleave', () => tooltip.hide());

    // Count labels
    g.selectAll('.count-label')
      .data(data)
      .join('text')
      .attr('x', d => x(d.count) + 4)
      .attr('y', d => y(d.label) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', 'var(--text-muted)')
      .attr('font-size', '0.65rem')
      .attr('font-family', 'var(--mono)')
      .text(d => fmtNum(d.count));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y).tickSize(0))
      .select('.domain').remove();

    g.selectAll('.axis text')
      .style('font-size', '0.65rem')
      .style('cursor', onBarClick ? 'default' : 'pointer')
      .on('click', (event, label) => handleClick(panel, label));
  }

  observeResize(body, () => draw());

  return {
    update(launches) {
      currentLaunches = launches;
      draw();
    }
  };
}
