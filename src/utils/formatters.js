export function formatMoney(value) {
  const n = Number(value);

  if (Number.isNaN(n)) return "-";

  return (
    "RWF " +
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatDate(isoDate) {
  if (!isoDate) return "-";

  const d = new Date(isoDate + "T00:00:00");

  if (Number.isNaN(d.getTime())) return isoDate;

  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(isoDateTime) {
  if (!isoDateTime) return "-";

  const d = new Date(isoDateTime);

  if (Number.isNaN(d.getTime())) return isoDateTime;

  return (
    d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(isoDate) {
  if (!isoDate) return null;

  const today = new Date(todayISODate() + "T00:00:00");
  const target = new Date(isoDate + "T00:00:00");

  return Math.round((target - today) / 86400000);
}