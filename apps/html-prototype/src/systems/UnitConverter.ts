type ConversionCategory = Record<string, number>;

export const converterCategories = ["length", "weight", "temperature", "storage", "time"] as const;
export type ConverterCategory = typeof converterCategories[number];

const units: Record<string, ConversionCategory> = {
  length: { cm: 0.01, m: 1, km: 1000, inch: 0.0254, ft: 0.3048, mile: 1609.344 },
  weight: { g: 0.001, kg: 1, oz: 0.028349523125, lb: 0.45359237 },
  storage: { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 },
  time: { seconds: 1, minutes: 60, hours: 3600, days: 86400 }
};

export function convertUnit(category: string, amount: number, from: string, to: string): number | null {
  if (!Number.isFinite(amount)) return null;
  if (category === "temperature") {
    if (from === to && ["C", "F"].includes(from)) return amount;
    if (from === "C" && to === "F") return amount * 9 / 5 + 32;
    if (from === "F" && to === "C") return (amount - 32) * 5 / 9;
    return null;
  }
  const categoryUnits = units[category];
  const source = categoryUnits?.[from];
  const target = categoryUnits?.[to];
  return source === undefined || target === undefined ? null : amount * source / target;
}

export function unitsForCategory(category: string): string[] {
  if (category === "temperature") return ["C", "F"];
  return Object.keys(units[category] ?? {});
}

export function swapUnits(from: string, to: string): { from: string; to: string } {
  return { from: to, to: from };
}

export function formatUnitValue(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "";
  return String(Number((Object.is(value, -0) ? 0 : value).toPrecision(10)));
}
