import { filterState } from '../filters/filterState.js';
import { filterData } from '../data/aggregator.js';

const charts = [];
let allLaunches = [];
let allPayloads = [];

export const chartManager = {
  init(launches, payloads) {
    allLaunches = launches;
    allPayloads = payloads;

    filterState.subscribe(() => this.update());
  },

  register(chart) {
    charts.push(chart);
  },

  update() {
    const filters = filterState.get();
    const { launches, payloads } = filterData(allLaunches, allPayloads, filters);

    requestAnimationFrame(() => {
      for (const chart of charts) {
        chart.update(launches, payloads, filters);
      }
    });
  },

  initialRender() {
    const filters = filterState.get();
    const { launches, payloads } = filterData(allLaunches, allPayloads, filters);
    for (const chart of charts) {
      chart.update(launches, payloads, filters);
    }
  }
};
