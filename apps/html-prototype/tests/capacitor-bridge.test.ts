import assert from "node:assert/strict";
import test from "node:test";
import { handleNativeBackButton, setNativeFullscreen, type NativeBackHandler, type NativeSystemBars } from "../src/systems/CapacitorBridge.js";

function fakeClassList() {
  const tokens = new Set<string>();
  return {
    add: (token: string) => tokens.add(token),
    remove: (token: string) => tokens.delete(token),
    contains: (token: string) => tokens.has(token),
  };
}

test("native fullscreen hides/shows system bars and mirrors state on the game shell", async () => {
  const shell = { classList: fakeClassList() };
  const calls: string[] = [];
  const systemBars: NativeSystemBars = {
    hide: async () => { calls.push("hide"); },
    show: async () => { calls.push("show"); },
  };

  await setNativeFullscreen(shell, true, systemBars);
  assert.deepEqual(calls, ["hide"]);
  assert.equal(shell.classList.contains("native-fullscreen"), true);

  await setNativeFullscreen(shell, false, systemBars);
  assert.deepEqual(calls, ["hide", "show"]);
  assert.equal(shell.classList.contains("native-fullscreen"), false);
});

test("native Back gives the application first chance to close its topmost state", () => {
  const calls: string[] = [];
  const app: NativeBackHandler = { handleNativeBackButton: () => { calls.push("app"); return true; } };

  handleNativeBackButton(app, true, () => calls.push("history"), () => calls.push("exit"));

  assert.deepEqual(calls, ["app"]);
});

test("native Back uses browser history when the application has nothing to close", () => {
  const calls: string[] = [];
  const app: NativeBackHandler = { handleNativeBackButton: () => false };

  handleNativeBackButton(app, true, () => calls.push("history"), () => calls.push("exit"));

  assert.deepEqual(calls, ["history"]);
});

test("native Back exits only when the application and history have nothing to handle", () => {
  const calls: string[] = [];
  const app: NativeBackHandler = { handleNativeBackButton: () => false };

  handleNativeBackButton(app, false, () => calls.push("history"), () => calls.push("exit"));

  assert.deepEqual(calls, ["exit"]);
});
