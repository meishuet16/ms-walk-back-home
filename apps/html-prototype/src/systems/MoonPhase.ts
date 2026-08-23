export type MoonPhase = {
  index: number;
  label: string;
  ageDays: number;
  illuminationPercent: number;
};

const synodicMonth = 29.530588853;
const referenceNewMoon = Date.parse("2000-01-06T18:14:00.000Z");
const labels = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];

export function moonPhaseIndex(date: Date): number {
  const elapsedDays = (date.getTime() - referenceNewMoon) / 86400000;
  const age = ((elapsedDays % synodicMonth) + synodicMonth) % synodicMonth;
  return Math.floor((age / synodicMonth) * 8 + .5) % 8;
}

export function calculateMoonPhase(date: Date = new Date()): MoonPhase {
  const elapsedDays = (date.getTime() - referenceNewMoon) / 86400000;
  const ageDays = ((elapsedDays % synodicMonth) + synodicMonth) % synodicMonth;
  const illuminationPercent = Math.round((1 - Math.cos((ageDays / synodicMonth) * Math.PI * 2)) * 50);
  return { index: moonPhaseIndex(date), label: labels[moonPhaseIndex(date)], ageDays, illuminationPercent };
}
