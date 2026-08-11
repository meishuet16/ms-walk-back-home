import assert from "node:assert/strict";
import test from "node:test";
import { AccountManager } from "../src/systems/AccountManager.js";
import { SaveManager } from "../src/systems/SaveManager.js";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }
  get length(): number {
    return this.values.size;
  }
}

function installStorage(): MemoryStorage {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage
  });
  return storage;
}

test("guest mode is the deterministic default and never requires a paid provider", () => {
  installStorage();
  const account = new AccountManager();

  assert.equal(account.current().mode, "guest");
  assert.equal(account.current().ownerId, "guest");
  assert.equal(account.current().provider, "local");
});

test("login switches to a private account namespace without deleting guest data", () => {
  installStorage();
  const account = new AccountManager();
  const guestSave = new SaveManager(account.current().ownerId);

  guestSave.saveReflectionWall({
    version: 1,
    savedAt: "now",
    defaultStyleId: "paper-mix",
    migratedLegacyKeys: [],
    notes: [{ id: "guest-note", text: "guest only", createdAt: "2026-08-11T00:00:00.000Z", styleId: "cream-torn", x: 10, y: 10, rotation: 0, source: "manual" }]
  });

  account.signInWithConfiguredProvider({ provider: "google", userId: "user-a", email: "a@example.test" });
  const userSave = new SaveManager(account.current().ownerId);

  assert.equal(userSave.loadReflectionWall(), null);
  assert.equal(guestSave.loadReflectionWall()?.notes[0].text, "guest only");
});

test("claiming guest local data copies once into the signed-in account", () => {
  installStorage();
  const account = new AccountManager();
  const guestSave = new SaveManager(account.current().ownerId);
  guestSave.saveDiaryLibrary({ version: 1, savedAt: "now", entries: [{ id: "d1", date: "2026-08-11", title: "Guest", body: "kept", memoryKind: "diary" }], legacyArtifacts: [] });

  account.signInWithConfiguredProvider({ provider: "google", userId: "user-a", email: "a@example.test" });
  account.claimGuestData();
  account.claimGuestData();

  const userSave = new SaveManager(account.current().ownerId);
  assert.equal(userSave.loadDiaryLibrary()?.entries.length, 1);
  assert.equal(userSave.loadDiaryLibrary()?.entries[0].body, "kept");
});
