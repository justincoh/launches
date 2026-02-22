import './styles/main.css';
import './styles/filters.css';
import './styles/charts.css';

import { fetchAndParse } from './data/parser.js';
import { normalize } from './data/normalizer.js';
import { initFilterBar } from './filters/filterBar.js';
import { chartManager } from './charts/chartManager.js';
import { createLaunchesOverTime } from './charts/launchesOverTime.js';
import { createSuccessFailure } from './charts/successFailure.js';
import { createTopRankings } from './charts/topRankings.js';
import { createLaunchCadence } from './charts/launchCadence.js';
import { createVehicleTimeline } from './charts/vehicleTimeline.js';

async function init() {
  const loadingEl = document.getElementById('loading');
  const dashboardEl = document.getElementById('dashboard');
  const filterBarEl = document.getElementById('filter-bar');

  try {
    const rows = await fetchAndParse();
    const { launches, payloads } = normalize(rows);

    console.log(`Loaded ${launches.length} launches, ${payloads.length} payloads`);

    // Init filter bar
    initFilterBar(filterBarEl, launches);

    // Init chart manager
    chartManager.init(launches, payloads);

    // Create charts
    const lotChart = createLaunchesOverTime(dashboardEl);
    const sfChart = createSuccessFailure(dashboardEl);
    const trChart = createTopRankings(dashboardEl);
    const lcChart = createLaunchCadence(dashboardEl);
    const vtChart = createVehicleTimeline(dashboardEl);

    chartManager.register(lotChart);
    chartManager.register(sfChart);
    chartManager.register(trChart);
    chartManager.register(lcChart);
    chartManager.register(vtChart);

    // Show dashboard
    loadingEl.style.display = 'none';
    dashboardEl.style.display = '';

    // Initial render
    chartManager.initialRender();

  } catch (err) {
    loadingEl.innerHTML = `<p style="color: var(--failure);">Failed to load data: ${err.message}</p>`;
    console.error(err);
  }
}

init();
