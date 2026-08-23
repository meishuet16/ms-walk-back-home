export type SpinPreset = { id: string; name: string; choices: string[] };
export type SpinWheelSegment = { index: number; label: string; startAngle: number; endAngle: number; centerAngle: number };
export type SpinWheelGeometry = { segments: SpinWheelSegment[]; rotation: number };

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

export function spinChoiceIndex(choices: string[], rng: () => number = secureRandom): number | null {
  if (!choices.length) return null;
  const value = Math.max(0, Math.min(0.999999999, Number(rng()) || 0));
  return Math.floor(value * choices.length);
}

export function spinChoice(choices: string[], rng: () => number = secureRandom): string | null {
  const index = spinChoiceIndex(choices, rng);
  return index === null ? null : choices[index] ?? null;
}

export function spinWheelGeometry(choices: string[], rotation = 0): SpinWheelGeometry {
  const slice = choices.length ? (Math.PI * 2) / choices.length : Math.PI * 2;
  return {
    rotation,
    segments: choices.map((label, index) => ({
      index,
      label,
      startAngle: -Math.PI / 2 + rotation + index * slice,
      endAngle: -Math.PI / 2 + rotation + (index + 1) * slice,
      centerAngle: -Math.PI / 2 + rotation + (index + .5) * slice
    }))
  };
}

export function spinTargetRotation(choiceCount: number, winnerIndex: number, rng: () => number = secureRandom, reducedMotion = false, currentRotation = 0): number {
  if (choiceCount <= 0) return currentRotation;
  const slice = (Math.PI * 2) / choiceCount;
  const extraTurns = reducedMotion ? 1 : 4 + Math.floor(Math.max(0, Math.min(.999999, Number(rng()) || 0)) * 3);
  const pointerAngle = -(winnerIndex + .5) * slice;
  const turnsFromCurrent = Math.ceil((currentRotation - pointerAngle) / (Math.PI * 2));
  return (turnsFromCurrent + extraTurns) * Math.PI * 2 + pointerAngle;
}
export function winnerIndexAtPointer(rotation: number, choiceCount: number): number | null {
  if (choiceCount <= 0) return null;
  const slice = (Math.PI * 2) / choiceCount;
  const localPointer = ((-rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return Math.min(choiceCount - 1, Math.floor((localPointer + 1e-8) / slice));
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
