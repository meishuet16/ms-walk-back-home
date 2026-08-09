import assert from "node:assert/strict";
import test from "node:test";
import { resolveAudioSource, sameAudioSource } from "../src/systems/AudioManager.js";

test("audio manager resolves encoded local mp3 sources against the current page", () => {
  const base = "http://localhost:4173/room/index.html";
  const source = "assets/audio/Dear%20D%20(%E4%BA%B2%E7%88%B1%E7%9A%84%E5%91%8A%E8%AF%89%E4%BD%A0)-%E9%A1%B9%E7%9D%BF%E5%A8%B4.mp3";

  assert.equal(
    resolveAudioSource(source, base),
    "http://localhost:4173/room/assets/audio/Dear%20D%20(%E4%BA%B2%E7%88%B1%E7%9A%84%E5%91%8A%E8%AF%89%E4%BD%A0)-%E9%A1%B9%E7%9D%BF%E5%A8%B4.mp3"
  );
});

test("audio manager compares sources after URL normalization", () => {
  const base = "http://localhost:4173/";
  const source = "assets/audio/%E5%B0%8F%E5%AD%A9-%E7%BD%97%E6%A3%AE%E6%B6%9B.mp3";
  const absolute = "http://localhost:4173/assets/audio/%E5%B0%8F%E5%AD%A9-%E7%BD%97%E6%A3%AE%E6%B6%9B.mp3";

  assert.equal(sameAudioSource(absolute, source, base), true);
  assert.equal(sameAudioSource(absolute, "assets/audio/forest.mp3", base), false);
});
