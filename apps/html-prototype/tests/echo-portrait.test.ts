import assert from "node:assert/strict";
import test from "node:test";
import { renderEchoPortrait, resolveEchoPortraitLayout } from "../src/systems/EchoPortraitPresentation.js";

test("Echo Portrait resolves the approved June 24 portrait assets", () => {
  const portrait = resolveEchoPortraitLayout("june24-angela-st-echo", { orientation: "portrait", width: 390, height: 844 });
  const landscape = resolveEchoPortraitLayout("june24-angela-st-echo", { orientation: "landscape", width: 844, height: 390 });
  assert.equal(portrait.asset, "assets/624/echo-portraits/group-echoes/01-morning-angela-st.png");
  assert.equal(landscape.asset, portrait.asset);
  assert.equal(resolveEchoPortraitLayout("june24-room-study-echo", { orientation: "portrait", width: 390, height: 844 }).asset, "assets/624/echo-portraits/et-portraits/03-guilt-quiet.png");
  assert.equal(resolveEchoPortraitLayout("june24-haircut-echo", { orientation: "portrait", width: 390, height: 844 }).asset, "assets/624/echo-portraits/group-echoes/02-haircut-home-invite.png");
  assert.notEqual(portrait.width, landscape.width);
  assert.equal("x" in portrait, false);
  assert.equal("y" in portrait, false);
  assert.equal("anchor" in portrait, false);
  assert.equal("visualScale" in portrait, false);
});

test("Echo Portrait presentation is shared and has no world-coordinate coupling", () => {
  const markup = renderEchoPortrait({
    echoId: "june24-room-study-echo",
    speaker: "Memory",
    text: "我只是想起那天下午。",
    layout: resolveEchoPortraitLayout("june24-room-study-echo", { orientation: "portrait", width: 390, height: 844 }),
    canAdvance: true
  });
  assert.match(markup, /data-presentation="echo-portrait"/);
  assert.match(markup, /class="[^"]*echo-portrait/);
  assert.match(markup, /assets\/624\/echo-portraits\/et-portraits\/03-guilt-quiet\.png/);
  assert.doesNotMatch(markup, /SceneLayout|worldX|worldY|anchor|visualScale/);
});
