import type { SaveState } from "../types.js";

const key = (slot: number) => `walk-back-home:html-prototype:v1:slot-${slot}`;
const autosaveKey = "walk-back-home:html-prototype:v1:autosave";

export class SaveManager {
  save(slot: number, state: SaveState): void {
    localStorage.setItem(key(slot), JSON.stringify({ ...state, slot, savedAt: new Date().toISOString() }));
  }

  autosave(state: SaveState): void {
    localStorage.setItem(autosaveKey, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
  }

  load(slot: number): SaveState | null {
    return this.parse(localStorage.getItem(key(slot)));
  }

  loadAutosave(): SaveState | null {
    return this.parse(localStorage.getItem(autosaveKey));
  }

  delete(slot: number): void {
    localStorage.removeItem(key(slot));
  }

  list(): Array<SaveState | null> {
    return [1, 2, 3].map((slot) => this.load(slot));
  }

  private parse(value: string | null): SaveState | null {
    if (!value) return null;
    const parsed = JSON.parse(value) as SaveState;
    return parsed.version === 1 ? parsed : null;
  }
}
