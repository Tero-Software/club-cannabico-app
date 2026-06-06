export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function subMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() - n);
  return r;
}

export function subDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - n);
  return r;
}

export function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

const MONTH_LABELS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map((n) => parseInt(n, 10));
  const label = MONTH_LABELS[m - 1];
  return `${label} ${String(y).slice(2)}`;
}

export function last12MonthKeys(now: Date): string[] {
  const keys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    keys.push(monthKey(subMonths(now, i)));
  }
  return keys;
}

const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function weekdayShort(d: Date): string {
  return WEEKDAY_SHORT[d.getDay()];
}

export const WEEKDAYS_ORDERED = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function groupByMonth<T>(
  items: T[],
  getDate: (t: T) => Date,
  getValue: (t: T) => number,
  now: Date,
): { month: string; label: string; value: number }[] {
  const keys = last12MonthKeys(now);
  const totals = new Map<string, number>();
  for (const k of keys) totals.set(k, 0);
  for (const it of items) {
    const k = monthKey(getDate(it));
    if (totals.has(k)) totals.set(k, (totals.get(k) ?? 0) + getValue(it));
  }
  return keys.map((k) => ({
    month: k,
    label: monthLabel(k),
    value: totals.get(k) ?? 0,
  }));
}

export function groupByWeekdayAverage<T>(
  items: T[],
  getDate: (t: T) => Date,
  getValue: (t: T) => number,
): { weekday: string; value: number }[] {
  const sums = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const w of WEEKDAYS_ORDERED) {
    sums.set(w, 0);
    counts.set(w, 0);
  }
  const days = new Map<string, Set<string>>();
  for (const w of WEEKDAYS_ORDERED) days.set(w, new Set());
  for (const it of items) {
    const d = getDate(it);
    const w = weekdayShort(d);
    sums.set(w, (sums.get(w) ?? 0) + getValue(it));
    days.get(w)?.add(d.toISOString().slice(0, 10));
  }
  return WEEKDAYS_ORDERED.map((w) => {
    const total = sums.get(w) ?? 0;
    const nDays = days.get(w)?.size ?? 0;
    return { weekday: w, value: nDays > 0 ? total / nDays : 0 };
  });
}

export function topN<T>(
  items: T[],
  keyFn: (t: T) => string,
  labelFn: (t: T) => string,
  valueFn: (t: T) => number,
  n: number,
): { key: string; label: string; value: number }[] {
  const sums = new Map<string, { label: string; value: number }>();
  for (const it of items) {
    const k = keyFn(it);
    const cur = sums.get(k);
    if (cur) cur.value += valueFn(it);
    else sums.set(k, { label: labelFn(it), value: valueFn(it) });
  }
  return Array.from(sums.entries())
    .map(([key, v]) => ({ key, label: v.label, value: v.value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

export function histogramBuckets(
  values: number[],
  buckets: { label: string; min: number; max: number }[],
): { label: string; count: number }[] {
  return buckets.map((b) => ({
    label: b.label,
    count: values.filter((v) => v >= b.min && v < b.max).length,
  }));
}

export function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  );
}
