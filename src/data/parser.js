const HEADERS = [
  'Launch_Tag', 'Launch_Date', 'Piece', 'Type', 'Name', 'PLName',
  'JCAT', 'SatOwner', 'SatState', 'LV_Type', 'Flight_ID', 'Platform',
  'Launch_Site', 'Launch_Pad', 'Ascent_Site', 'Ascent_Pad', 'Agency',
  'LVState', 'Launch_Code', 'LTCite'
];

export async function fetchAndParse(url = `${import.meta.env.BASE_URL}launchlog.tsv`) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
  const text = await res.text();
  return parseTSV(text);
}

function parseTSV(text) {
  const rows = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('#')) continue;
    const cols = line.split('\t');
    if (cols.length < HEADERS.length) continue;
    const row = {};
    for (let j = 0; j < HEADERS.length; j++) {
      const val = (cols[j] || '').trim();
      row[HEADERS[j]] = val === '-' ? null : val;
    }
    rows.push(row);
  }
  return rows;
}
