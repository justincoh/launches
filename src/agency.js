import { initDetailPage } from './detailPage.js';
import { AGENCY_NAMES } from './data/agencyNames.js';
import { escapeHtml } from './utils/formatters.js';
import { vehicleUrl, agencyUrl, siteUrl, countryUrl } from './utils/navigation.js';

initDetailPage({
  paramKey: 'a',
  field: 'Agency',
  displayName: (code) => AGENCY_NAMES[code] || code,
  pageTitle: 'Agency Detail',
  notFoundMsg: 'No launches found for this agency.',
  searchPrompt: 'Search for an agency to see its launch history.',
  typeaheadOptions: {
    placeholder: 'Search agencies...',
    match: (code, q) => {
      const name = AGENCY_NAMES[code] || code;
      return code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    },
    render: (code) => {
      const name = AGENCY_NAMES[code] || code;
      return name !== code ? escapeHtml(`${code} (${name})`) : escapeHtml(code);
    },
    url: (code) => agencyUrl(code),
  },
  sfOptions: { excludeDimensions: ['Agency', 'decade', 'LVState'] },
  trOptions: {
    excludePanels: ['agency'],
    onBarClick: (filterKey, label) => {
      if (filterKey === 'vehicle') window.location.href = vehicleUrl(label);
      if (filterKey === 'site') window.location.href = siteUrl(label);
      if (filterKey === 'country') window.location.href = countryUrl(label);
    },
  },
});
