function formatCount(label, count) {
  if (count === undefined || count === null) return '';
  const n = typeof count === 'number' ? count : 0;
  return `, ${n} ${label}`;
}

function infoRequest({ method, url, status, label, count, dbMs, totalMs }) {
  const dbPart = typeof dbMs === 'number' ? `, DB: ${dbMs.toFixed(0)}ms` : '';
  const totalPart = typeof totalMs === 'number' ? `, total: ${totalMs.toFixed(0)}ms` : '';
  const countPart = formatCount(label, count);
  console.log(`[INFO] ${method} ${url} → ${status}${countPart}${dbPart}${totalPart}`);
}

function perf(label, ms, extra) {
  const extraPart = extra ? `, ${extra}` : '';
  console.log(`[PERF] ${label} → ${ms.toFixed(0)}ms${extraPart}`);
}

module.exports = { infoRequest, perf };
