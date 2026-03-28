const MONTHS = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

const DATE_RE = /^(\d{4})\s+(\w{3})\s+(\d{1,2})(?:\s+(\d{2})(\d{2})(?::(\d{2}))?)?$/;

function parseDate(str) {
  if (!str) return null;
  const m = str.match(DATE_RE);
  if (!m) return null;
  const year = +m[1];
  const currentYear = new Date().getFullYear();
  if (year < 1957 || year > currentYear) return null;
  const month = MONTHS[m[2]];
  if (month === undefined) return null;
  const day = +m[3];
  const hour = m[4] ? +m[4] : 0;
  const min = m[5] ? +m[5] : 0;
  const sec = m[6] ? +m[6] : 0;
  return { date: new Date(year, month, day, hour, min, sec), year };
}

function classifyOutcome(code) {
  if (!code) return 'Unknown';
  const c = code.trim();
  if (c === 'OS' || c === 'DS' || /^OS\d+$/.test(c)) return 'Success';
  if (c === 'OF' || /^OF\d+$/.test(c)) return 'Failure';
  if (c === 'XS') return 'Suborbital';
  return 'Unknown';
}

export function normalize(rows) {
  // Add parsed date, year, and outcome to each row
  for (const row of rows) {
    const parsed = parseDate(row.Launch_Date);
    row.date = parsed ? parsed.date : null;
    row.year = parsed ? parsed.year : null;
    row.outcome = classifyOutcome(row.Launch_Code);
  }

  // Group by Launch_Tag to separate launches from payloads
  const groups = new Map();
  for (const row of rows) {
    const tag = row.Launch_Tag;
    if (!tag) continue;
    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag).push(row);
  }

  const launches = [];
  const payloads = rows.filter(r => r.Launch_Tag);

  for (const [tag, group] of groups) {
    const first = group[0];
    launches.push({
      ...first,
      payloadCount: group.length,
    });
  }

  // Sort by date
  launches.sort((a, b) => (a.date || 0) - (b.date || 0));

  return { launches, payloads };
}
