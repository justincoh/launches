import { initDetailPage } from './detailPage.js';
import { AGENCY_NAMES } from './data/agencyNames.js';
import { escapeHtml } from './utils/formatters.js';
import { vehicleUrl, siteUrl } from './utils/navigation.js';

initDetailPage({
  paramKey: 'v',
  field: 'LV_Type',
  displayName: (name) => name,
  pageTitle: 'Vehicle Detail',
  notFoundMsg: 'No launches found for this vehicle.',
  searchPrompt: 'Search for a vehicle to see its launch history.',
  typeaheadOptions: {
    placeholder: 'Search vehicles...',
    match: (item, q) => item.toLowerCase().includes(q),
    render: (item, query) => {
      const q = query.toLowerCase();
      const idx = item.toLowerCase().indexOf(q);
      return escapeHtml(item.slice(0, idx)) +
        '<strong>' + escapeHtml(item.slice(idx, idx + query.length)) + '</strong>' +
        escapeHtml(item.slice(idx + query.length));
    },
    url: (item) => vehicleUrl(item),
  },
  headerExtra: (launches) => {
    const agencyCode = launches[0].Agency || '';
    return AGENCY_NAMES[agencyCode] || agencyCode;
  },
  sfOptions: { donutOnly: true },
  trOptions: {
    excludePanels: ['vehicle', 'agency', 'country'],
    onBarClick: (filterKey, label) => {
      if (filterKey === 'site') window.location.href = siteUrl(label);
    },
  },
});
