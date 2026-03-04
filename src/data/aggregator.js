export function filterData(launches, payloads, filters) {
  let fl = launches;
  let fp = payloads;

  if (filters.country) {
    fl = fl.filter(d => d.SatState === filters.country);
    fp = fp.filter(d => d.SatState === filters.country);
  }
  if (filters.agency) {
    fl = fl.filter(d => d.Agency === filters.agency);
    fp = fp.filter(d => d.Agency === filters.agency);
  }
  if (filters.vehicle) {
    fl = fl.filter(d => d.LV_Type === filters.vehicle);
    fp = fp.filter(d => d.LV_Type === filters.vehicle);
  }
  if (filters.site) {
    fl = fl.filter(d => d.Launch_Site === filters.site);
    fp = fp.filter(d => d.Launch_Site === filters.site);
  }
  if (filters.pad) {
    fl = fl.filter(d => d.Launch_Pad === filters.pad);
    fp = fp.filter(d => d.Launch_Pad === filters.pad);
  }
  if (filters.payloadSearch) {
    const q = filters.payloadSearch.toLowerCase();
    const matchingTags = new Set();
    fp = fp.filter(d => {
      const match = (d.Name && d.Name.toLowerCase().includes(q)) ||
                    (d.PLName && d.PLName.toLowerCase().includes(q));
      if (match) matchingTags.add(d.Launch_Tag);
      return match;
    });
    fl = fl.filter(d => matchingTags.has(d.Launch_Tag));
  }
  if (filters.yearMin != null) {
    fl = fl.filter(d => d.year >= filters.yearMin);
    fp = fp.filter(d => d.year >= filters.yearMin);
  }
  if (filters.yearMax != null) {
    fl = fl.filter(d => d.year <= filters.yearMax);
    fp = fp.filter(d => d.year <= filters.yearMax);
  }

  return { launches: fl, payloads: fp };
}

export function launchesByYear(launches, payloads, mode = 'launches') {
  const data = mode === 'payloads' ? payloads : launches;
  const map = new Map();
  for (const d of data) {
    if (d.year == null) continue;
    map.set(d.year, (map.get(d.year) || 0) + (mode === 'payloads' ? 1 : 1));
  }
  const result = [];
  for (const [year, count] of map) {
    result.push({ year, count });
  }
  return result.sort((a, b) => a.year - b.year);
}

export function launchesByYearStacked(launches, field = 'SatState', topN = 5) {
  // Count by field value
  const totals = new Map();
  for (const d of launches) {
    const key = d[field] || 'Unknown';
    totals.set(key, (totals.get(key) || 0) + 1);
  }
  const topKeys = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(d => d[0]);
  const topSet = new Set(topKeys);

  // Group by year and key
  const yearMap = new Map();
  for (const d of launches) {
    if (d.year == null) continue;
    if (!yearMap.has(d.year)) yearMap.set(d.year, {});
    const bucket = yearMap.get(d.year);
    const key = topSet.has(d[field]) ? d[field] : 'Other';
    bucket[key] = (bucket[key] || 0) + 1;
  }

  const hasOther = [...yearMap.values()].some(bucket => bucket['Other'] > 0);
  const keys = hasOther ? [...topKeys, 'Other'] : [...topKeys];
  const result = [];
  for (const [year, bucket] of yearMap) {
    const row = { year };
    for (const k of keys) row[k] = bucket[k] || 0;
    result.push(row);
  }
  return { data: result.sort((a, b) => a.year - b.year), keys };
}

export function outcomeBreakdown(launches) {
  const map = { Success: 0, Failure: 0, Suborbital: 0, Unknown: 0 };
  for (const d of launches) {
    map[d.outcome] = (map[d.outcome] || 0) + 1;
  }
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .map(([outcome, count]) => ({ outcome, count }));
}

export function outcomeByDimension(launches, dim = 'decade') {
  const groups = new Map();

  for (const d of launches) {
    let key;
    if (dim === 'decade') {
      if (d.year == null) continue;
      key = `${Math.floor(d.year / 10) * 10}s`;
    } else {
      key = d[dim] || 'Unknown';
    }
    if (!groups.has(key)) groups.set(key, { Success: 0, Failure: 0, Suborbital: 0 });
    const bucket = groups.get(key);
    if (bucket[d.outcome] !== undefined) bucket[d.outcome]++;
  }

  // Sort and take top entries if not decade
  let entries = [...groups.entries()];
  if (dim === 'decade') {
    entries.sort((a, b) => a[0].localeCompare(b[0]));
  } else {
    entries.sort((a, b) => {
      const totalA = a[1].Success + a[1].Failure + a[1].Suborbital;
      const totalB = b[1].Success + b[1].Failure + b[1].Suborbital;
      return totalB - totalA;
    });
    entries = entries.slice(0, 15);
  }

  return entries.map(([label, counts]) => ({ label, ...counts }));
}

export function topN(launches, field, n = 10) {
  const map = new Map();
  for (const d of launches) {
    const key = d[field] || 'Unknown';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));
}

export function vehicleLifespans(launches, topCount = 30) {
  const map = new Map();
  for (const d of launches) {
    if (!d.LV_Type || d.year == null) continue;
    const key = d.LV_Type;
    if (!map.has(key)) {
      map.set(key, { vehicle: key, firstYear: d.year, lastYear: d.year, count: 0, state: d.LVState });
    }
    const entry = map.get(key);
    entry.firstYear = Math.min(entry.firstYear, d.year);
    entry.lastYear = Math.max(entry.lastYear, d.year);
    entry.count++;
  }
  return [...map.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, topCount);
}

export function uniqueValues(data, field) {
  const map = new Map();
  for (const d of data) {
    const val = d[field];
    if (val) map.set(val, (map.get(val) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));
}
