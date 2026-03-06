import './styles/main.css';
import './styles/filters.css';
import './styles/charts.css';

import { fetchAndParse } from './data/parser.js';
import { normalize } from './data/normalizer.js';
import { createDualRangeSlider } from './filters/dualRangeSlider.js';
import { createVehicleTypeahead } from './filters/vehicleTypeahead.js';
import { createVehicleBarChart } from './charts/vehicleBarChart.js';
import { createSuccessFailure } from './charts/successFailure.js';
import { createTopRankings } from './charts/topRankings.js';
import { fmtDate } from './utils/formatters.js';

const params = new URLSearchParams(window.location.search);
const vehicleName = params.get('v');

async function init() {
  const loadingEl = document.getElementById('loading');
  const dashboardEl = document.getElementById('dashboard');
  const filterBarEl = document.getElementById('filter-bar');
  const nameEl = document.getElementById('vehicle-name');
  const subtitleEl = document.getElementById('vehicle-subtitle');
  const notFoundEl = document.getElementById('not-found');

  try {
    const rows = await fetchAndParse();
    const { launches } = normalize(rows);

    // Build vehicle list for typeahead
    const vehicleSet = new Set();
    for (const d of launches) {
      if (d.LV_Type) vehicleSet.add(d.LV_Type);
    }
    const allVehicles = [...vehicleSet].sort();

    // Set up typeahead in header
    createVehicleTypeahead(document.getElementById('vehicle-search'), allVehicles);

    if (!vehicleName) {
      // No vehicle specified — show search-only UI
      loadingEl.style.display = 'none';
      nameEl.textContent = 'Vehicle Detail';
      subtitleEl.textContent = 'Search for a vehicle to see its launch history.';
      filterBarEl.style.display = 'none';
      return;
    }

    // Filter to this vehicle
    const vehicleLaunches = launches.filter(d => d.LV_Type === vehicleName);

    if (!vehicleLaunches.length) {
      loadingEl.style.display = 'none';
      notFoundEl.style.display = '';
      nameEl.textContent = vehicleName;
      subtitleEl.textContent = 'No launches found for this vehicle.';
      filterBarEl.style.display = 'none';
      // Also add search to the not-found section
      createVehicleTypeahead(document.getElementById('not-found-search'), allVehicles);
      return;
    }

    // Populate header
    nameEl.textContent = vehicleName;
    document.title = `${vehicleName} - Space Launch Stats`;

    const withDates = vehicleLaunches.filter(d => d.date);
    const firstLaunch = withDates[0] || vehicleLaunches[0];
    const lastLaunch = withDates[withDates.length - 1] || vehicleLaunches[vehicleLaunches.length - 1];
    const firstDate = firstLaunch.date ? fmtDate(firstLaunch.date) : String(firstLaunch.year);
    const lastDate = lastLaunch.date ? fmtDate(lastLaunch.date) : String(lastLaunch.year);
    subtitleEl.textContent = `${vehicleLaunches.length} launches \u00B7 First: ${firstDate} \u00B7 Most recent: ${lastDate}`;

    // Year range for this vehicle
    const years = vehicleLaunches.map(d => d.year).filter(Boolean);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    // Year slider
    let yearMin = minYear;
    let yearMax = maxYear;

    const rangeSlider = createDualRangeSlider(minYear, maxYear, minYear, maxYear, (min, max) => {
      yearMin = min;
      yearMax = max;
      updateCharts();
    });
    filterBarEl.appendChild(rangeSlider.el);

    // Create charts
    const barChart = createVehicleBarChart(document.getElementById('chart-vehicle-bar'));
    const sfChart = createSuccessFailure(document, {
      donutOnly: true,
    });
    const trChart = createTopRankings(document, {
      excludePanels: ['vehicle', 'agency'],
      onBarClick: () => {},  // no-op on vehicle page
    });

    const charts = [barChart, sfChart, trChart];

    function updateCharts() {
      const filtered = vehicleLaunches.filter(d => d.year >= yearMin && d.year <= yearMax);
      for (const chart of charts) {
        chart.update(filtered);
      }
    }

    // Show dashboard
    loadingEl.style.display = 'none';
    dashboardEl.style.display = '';

    // Initial render
    updateCharts();

  } catch (err) {
    loadingEl.innerHTML = `<p style="color: var(--failure);">Failed to load data: ${err.message}</p>`;
    console.error(err);
  }
}

init();
