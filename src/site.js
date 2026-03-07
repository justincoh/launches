import { initDetailPage } from './detailPage.js';
import { SITE_NAMES } from './data/siteNames.js';
import { escapeHtml } from './utils/formatters.js';
import { siteUrl, vehicleUrl, agencyUrl, countryUrl } from './utils/navigation.js';

initDetailPage({
  paramKey: 's',
  field: 'Launch_Site',
  displayName: (code) => SITE_NAMES[code] || code,
  pageTitle: 'Site Detail',
  notFoundMsg: 'No launches found for this site.',
  searchPrompt: 'Search for a launch site to see its launch history.',
  typeaheadOptions: {
    placeholder: 'Search sites...',
    match: (code, q) => {
      const name = SITE_NAMES[code] || code;
      return code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    },
    render: (code) => {
      const name = SITE_NAMES[code] || code;
      return name !== code ? escapeHtml(`${code} (${name})`) : escapeHtml(code);
    },
    url: (code) => siteUrl(code),
  },
  sfOptions: { excludeDimensions: ['Launch_Site', 'decade', 'LVState'] },
  trOptions: {
    excludePanels: ['site'],
    extraPanels: [{ title: 'Top Pads', field: 'Launch_Pad', filterKey: 'pad' }],
    onBarClick: (filterKey, label) => {
      if (filterKey === 'vehicle') window.location.href = vehicleUrl(label);
      if (filterKey === 'agency') window.location.href = agencyUrl(label);
      if (filterKey === 'country') window.location.href = countryUrl(label);
    },
  },
});
