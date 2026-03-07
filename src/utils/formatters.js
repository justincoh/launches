export function fmtNum(n) {
  return n.toLocaleString('en-US');
}

export function fmtPct(n, total) {
  if (!total) return '0%';
  return (n / total * 100).toFixed(1) + '%';
}

export function fmtDate(d) {
  if (!(d instanceof Date)) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
