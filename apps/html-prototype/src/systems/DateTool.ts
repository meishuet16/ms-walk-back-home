export type LocalDateParts = { year: number; month: number; day: number };

export function parseLocalDate(value: string): LocalDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const date = new Date(parts.year, parts.month - 1, parts.day);
  return date.getFullYear() === parts.year && date.getMonth() === parts.month - 1 && date.getDate() === parts.day ? parts : null;
}

export function dateDifference(start: string, end: string): number | null {
  const a = parseLocalDate(start);
  const b = parseLocalDate(end);
  if (!a || !b) return null;
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000);
}

export function addDateDays(value: string, days: number): string | null {
  const parts = parseLocalDate(value);
  if (!parts || !Number.isFinite(days)) return null;
  const date = new Date(parts.year, parts.month - 1, parts.day);
  date.setDate(date.getDate() + Math.trunc(days));
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function localDateString(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function relativeDateLabel(target: string, today = localDateString()): string {
  const difference = dateDifference(today, target);
  if (difference === null) return "Choose a valid date";
  if (difference === 0) return "Today";
  return difference > 0 ? `${difference} day${difference === 1 ? "" : "s"} until` : `${Math.abs(difference)} day${Math.abs(difference) === 1 ? "" : "s"} since`;
}
