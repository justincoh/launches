import { initDetailPage } from './detailPage.js';
import { COUNTRY_NAMES } from './data/countryNames.js';
import { escapeHtml } from './utils/formatters.js';
import { countryUrl, vehicleUrl, agencyUrl, siteUrl } from './utils/navigation.js';

initDetailPage({
  paramKey: 'c',
  field: 'LVState',
  displayName: (code) => COUNTRY_NAMES[code] || code,
  pageTitle: 'Country Detail',
  notFoundMsg: 'No launches found for this country.',
  searchPrompt: 'Search for a country to see its launch history.',
  typeaheadOptions: {
    placeholder: 'Search countries...',
    match: (code, q) => {
      const name = COUNTRY_NAMES[code] || code;
      return code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    },
    render: (code) => {
      const name = COUNTRY_NAMES[code] || code;
      return name !== code ? escapeHtml(`${code} (${name})`) : escapeHtml(code);
    },
    url: (code) => countryUrl(code),
  },
  sfOptions: { excludeDimensions: ['LVState', 'decade'] },
  trOptions: {
    excludePanels: ['country'],
    onBarClick: (filterKey, label) => {
      if (filterKey === 'vehicle') window.location.href = vehicleUrl(label);
      if (filterKey === 'agency') window.location.href = agencyUrl(label);
      if (filterKey === 'site') window.location.href = siteUrl(label);
    },
  },
});
