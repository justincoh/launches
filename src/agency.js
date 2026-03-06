import './styles/main.css';
import './styles/filters.css';
import './styles/charts.css';

import { fetchAndParse } from './data/parser.js';
import { normalize } from './data/normalizer.js';
import { createDualRangeSlider } from './filters/dualRangeSlider.js';
import { createAgencyTypeahead } from './filters/agencyTypeahead.js';
import { createVehicleBarChart } from './charts/vehicleBarChart.js';
import { createSuccessFailure } from './charts/successFailure.js';
import { createTopRankings } from './charts/topRankings.js';
import { fmtDate } from './utils/formatters.js';
import { AGENCY_NAMES } from './data/agencyNames.js';

const params = new URLSearchParams(window.location.search);
const agencyCode = params.get('a');

async function init() {
  const loadingEl = document.getElementById('loading');
  const dashboardEl = document.getElementById('dashboard');
  const filterBarEl = document.getElementById('filter-bar');
  const nameEl = document.getElementById('agency-name');
  const subtitleEl = document.getElementById('agency-subtitle');
  const notFoundEl = document.getElementById('not-found');

  try {
    const rows = await fetchAndParse();
    const { launches } = normalize(rows);

    // Build agency list for typeahead
    const agencySet = new Set();
    for (const d of launches) {
      if (d.Agency) agencySet.add(d.Agency);
    }
    const allAgencies = [...agencySet].sort();

    // Set up typeahead in header
    createAgencyTypeahead(document.getElementById('agency-search'), allAgencies);

    if (!agencyCode) {
      loadingEl.style.display = 'none';
      nameEl.textContent = 'Agency Detail';
      subtitleEl.textContent = 'Search for an agency to see its launch history.';
      filterBarEl.style.display = 'none';
      return;
    }

    // Filter to this agency
    const agencyLaunches = launches.filter(d => d.Agency === agencyCode);

    if (!agencyLaunches.length) {
      loadingEl.style.display = 'none';
      notFoundEl.style.display = '';
      nameEl.textContent = AGENCY_NAMES[agencyCode] || agencyCode;
      subtitleEl.textContent = 'No launches found for this agency.';
      filterBarEl.style.display = 'none';
      createAgencyTypeahead(document.getElementById('not-found-search'), allAgencies);
      return;
    }

    // Populate header
    const displayName = AGENCY_NAMES[agencyCode] || agencyCode;
    nameEl.textContent = displayName;
    document.title = `${displayName} - Space Launch Stats`;

    const withDates = agencyLaunches.filter(d => d.date);
    const firstLaunch = withDates[0] || agencyLaunches[0];
    const lastLaunch = withDates[withDates.length - 1] || agencyLaunches[agencyLaunches.length - 1];
    const firstDate = firstLaunch.date ? fmtDate(firstLaunch.date) : String(firstLaunch.year);
    const lastDate = lastLaunch.date ? fmtDate(lastLaunch.date) : String(lastLaunch.year);
    subtitleEl.textContent = `${agencyLaunches.length} launches \u00B7 First: ${firstDate} \u00B7 Most recent: ${lastDate}`;

    // Year range
    const years = agencyLaunches.map(d => d.year).filter(Boolean);
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
    const barChart = createVehicleBarChart(document.getElementById('chart-agency-bar'));
    const sfChart = createSuccessFailure(document, {
      excludeDimensions: ['Agency', 'decade', 'LVState'],
    });
    const trChart = createTopRankings(document, {
      excludePanels: ['agency', 'country'],
      onBarClick: (filterKey, label) => {
        if (filterKey === 'vehicle') {
          window.location.href = '/vehicle?v=' + encodeURIComponent(label);
        }
      },
    });

    const charts = [barChart, sfChart, trChart];

    function updateCharts() {
      const filtered = agencyLaunches.filter(d => d.year >= yearMin && d.year <= yearMax);
      for (const chart of charts) {
        chart.update(filtered);
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

init();
