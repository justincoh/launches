import './styles/main.css';
import './styles/filters.css';
import './styles/charts.css';
import './styles/atompunk.css';

import { fetchAndParse } from './data/parser.js';
import { normalize } from './data/normalizer.js';
import { createDualRangeSlider } from './filters/dualRangeSlider.js';
import { createTypeahead } from './filters/typeahead.js';
import { createVehicleBarChart } from './charts/vehicleBarChart.js';
import { createSuccessFailure } from './charts/successFailure.js';
import { createTopRankings } from './charts/topRankings.js';
import { fmtDate } from './utils/formatters.js';
import { initThemeToggle } from './themeToggle.js';

export async function initDetailPage(config) {
  initThemeToggle();

  const {
    paramKey, field, displayName, pageTitle, notFoundMsg, searchPrompt,
    typeaheadOptions, headerExtra, sfOptions, trOptions,
  } = config;

  const params = new URLSearchParams(window.location.search);
  const paramValue = params.get(paramKey);
  const urlFrom = params.get('from') ? parseInt(params.get('from'), 10) : null;
  const urlTo = params.get('to') ? parseInt(params.get('to'), 10) : null;

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

    let yearMin = (urlFrom && !isNaN(urlFrom) && urlFrom >= minYear) ? urlFrom : minYear;
    let yearMax = (urlTo && !isNaN(urlTo) && urlTo <= maxYear) ? urlTo : maxYear;

    function syncUrl() {
      const newParams = new URLSearchParams(window.location.search);
      if (yearMin !== minYear) newParams.set('from', yearMin); else newParams.delete('from');
      if (yearMax !== maxYear) newParams.set('to', yearMax); else newParams.delete('to');
      const qs = newParams.toString();
      const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      history.replaceState(null, '', url);
    }

    const rangeSlider = createDualRangeSlider(minYear, maxYear, yearMin, yearMax, (min, max) => {
      yearMin = min;
      yearMax = max;
      updateCharts();
      syncUrl();
    });
    filterBarEl.appendChild(rangeSlider.el);

    // Create charts
    let prevYearMin = null;
    let prevYearMax = null;

    const barChart = createVehicleBarChart(document.getElementById('chart-detail-bar'), {
      onDrillYear(year) {
        if (year !== null) {
          prevYearMin = yearMin;
          prevYearMax = yearMax;
          yearMin = year;
          yearMax = year;
        } else {
          yearMin = prevYearMin ?? minYear;
          yearMax = prevYearMax ?? maxYear;
          prevYearMin = null;
          prevYearMax = null;
        }
        rangeSlider.setValues(yearMin, yearMax);
        updateCharts();
        syncUrl();
      }
    });
    const sfChart = createSuccessFailure(document, sfOptions);
    const trChart = createTopRankings(document, trOptions);

    function updateCharts() {
      const yearFiltered = filtered.filter(d => d.year >= yearMin && d.year <= yearMax);
      barChart.update(yearFiltered, { yearMin, yearMax });
      sfChart.update(yearFiltered);
      trChart.update(yearFiltered);
    }

    // Show dashboard
    loadingEl.style.display = 'none';
    dashboardEl.style.display = '';

    updateCharts();

    // Re-render charts when theme changes (colors update)
    window.addEventListener('theme-change', () => updateCharts());

  } catch (err) {
    loadingEl.innerHTML = `<p style="color: var(--failure);">Failed to load data: ${err.message}</p>`;
    console.error(err);
  }
}
