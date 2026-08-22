export type SpinPreset = { id: string; name: string; choices: string[] };

export function createSpinPreset(id: string, name: string, choices: string[] = []): SpinPreset {
  return { id, name: name.trim() || "Untitled preset", choices: [...choices] };
}

export function addSpinChoice(choices: string[], value: string): string[] {
  const next = value.trim();
  return next ? [...choices, next] : [...choices];
}

export function removeSpinChoice(choices: string[], index: number): string[] {
  return index >= 0 && index < choices.length ? choices.filter((_, itemIndex) => itemIndex !== index) : [...choices];
}

export function spinChoice(choices: string[], rng: () => number = secureRandom): string | null {
  if (!choices.length) return null;
  const value = Math.max(0, Math.min(0.999999999, Number(rng()) || 0));
  return choices[Math.floor(value * choices.length)] ?? null;
}

export function renameSpinPreset(preset: SpinPreset, name: string): SpinPreset {
  return { ...preset, name: name.trim() || preset.name };
}

export function deleteSpinPreset(presets: SpinPreset[], id: string): SpinPreset[] {
  return presets.filter((preset) => preset.id !== id);
}

function secureRandom(): number {
  const cryptoObject = globalThis.crypto;
  if (cryptoObject) {
    const buffer = new Uint32Array(1);
    cryptoObject.getRandomValues(buffer);
    return buffer[0] / 0x100000000;
  }
  return Math.random();
}
