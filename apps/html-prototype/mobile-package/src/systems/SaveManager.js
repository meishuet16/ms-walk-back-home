const key = (slot) => `walk-back-home:html-prototype:v1:slot-${slot}`;
const autosaveKey = "walk-back-home:html-prototype:v1:autosave";
export class SaveManager {
    save(slot, state) {
        localStorage.setItem(key(slot), JSON.stringify({ ...state, slot, savedAt: new Date().toISOString() }));
    }
    autosave(state) {
        localStorage.setItem(autosaveKey, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
    }
    load(slot) {
        return this.parse(localStorage.getItem(key(slot)));
    }
    loadAutosave() {
        return this.parse(localStorage.getItem(autosaveKey));
    }
    delete(slot) {
        localStorage.removeItem(key(slot));
    }
    list() {
        return [1, 2, 3].map((slot) => this.load(slot));
    }
    parse(value) {
        if (!value)
            return null;
        const parsed = JSON.parse(value);
        return parsed.version === 1 ? parsed : null;
    }
}
