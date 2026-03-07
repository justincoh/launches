import './styles/main.css';
import './styles/filters.css';
import './styles/charts.css';

import { fetchAndParse } from './data/parser.js';
import { normalize } from './data/normalizer.js';
import { createDualRangeSlider } from './filters/dualRangeSlider.js';
import { createTypeahead } from './filters/typeahead.js';
import { createVehicleBarChart } from './charts/vehicleBarChart.js';
import { createSuccessFailure } from './charts/successFailure.js';
import { createTopRankings } from './charts/topRankings.js';
import { fmtDate } from './utils/formatters.js';

export async function initDetailPage(config) {
  const {
    paramKey, field, displayName, pageTitle, notFoundMsg, searchPrompt,
    typeaheadOptions, headerExtra, sfOptions, trOptions,
  } = config;

  const params = new URLSearchParams(window.location.search);
  const paramValue = params.get(paramKey);

  const loadingEl = document.getElementById('loading');
  const dashboardEl = document.getElementById('dashboard');
  const filterBarEl = document.getElementById('filter-bar');
  const nameEl = document.getElementById('detail-name');
  const extraEl = document.getElementById('detail-extra');
  const subtitleEl = document.getElementById('detail-subtitle');
  const notFoundEl = document.getElementById('not-found');

  try {
    const rows = await fetchAndParse();
    const { launches } = normalize(rows);

    // Build item list for typeahead
    const itemSet = new Set();
    for (const d of launches) {
      if (d[field]) itemSet.add(d[field]);
    }
    const allItems = [...itemSet].sort();

    // Set up typeahead in header
    createTypeahead(document.getElementById('detail-search'), allItems, typeaheadOptions);

    if (!paramValue) {
      loadingEl.style.display = 'none';
      nameEl.textContent = pageTitle;
      subtitleEl.textContent = searchPrompt;
      filterBarEl.style.display = 'none';
      return;
    }

    // Filter to this item
    const filtered = launches.filter(d => d[field] === paramValue);

    if (!filtered.length) {
      loadingEl.style.display = 'none';
      notFoundEl.style.display = '';
      nameEl.textContent = displayName(paramValue);
      subtitleEl.textContent = notFoundMsg;
      filterBarEl.style.display = 'none';
      createTypeahead(document.getElementById('not-found-search'), allItems, typeaheadOptions);
      return;
    }

    // Populate header
    const name = displayName(paramValue);
    nameEl.textContent = name;
    if (headerExtra) {
      const extra = headerExtra(filtered);
      if (extra) extraEl.textContent = extra;
    }
    document.title = `${name} - Space Launch Stats`;

    const withDates = filtered.filter(d => d.date);
    const firstLaunch = withDates[0] || filtered[0];
    const lastLaunch = withDates[withDates.length - 1] || filtered[filtered.length - 1];
    const firstDate = firstLaunch.date ? fmtDate(firstLaunch.date) : String(firstLaunch.year);
    const lastDate = lastLaunch.date ? fmtDate(lastLaunch.date) : String(lastLaunch.year);
    subtitleEl.textContent = `${filtered.length} launches \u00B7 First: ${firstDate} \u00B7 Most recent: ${lastDate}`;

    // Year range
    const years = filtered.map(d => d.year).filter(Boolean);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    let yearMin = minYear;
    let yearMax = maxYear;

    const rangeSlider = createDualRangeSlider(minYear, maxYear, minYear, maxYear, (min, max) => {
      yearMin = min;
      yearMax = max;
      updateCharts();
    });
    filterBarEl.appendChild(rangeSlider.el);

    // Create charts
    const barChart = createVehicleBarChart(document.getElementById('chart-detail-bar'));
    const sfChart = createSuccessFailure(document, sfOptions);
    const trChart = createTopRankings(document, trOptions);

    const charts = [barChart, sfChart, trChart];

    function updateCharts() {
      const yearFiltered = filtered.filter(d => d.year >= yearMin && d.year <= yearMax);
      for (const chart of charts) {
        chart.update(yearFiltered);
      }
    }

    // Show dashboard
    loadingEl.style.display = 'none';
    dashboardEl.style.display = '';

    updateCharts();

  } catch (err) {
    loadingEl.innerHTML = `<p style="color: var(--failure);">Failed to load data: ${err.message}</p>`;
    console.error(err);
  }
}
