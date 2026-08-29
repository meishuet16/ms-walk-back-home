import { WalkBackHomeApp } from "./app.js";
import { installAuthoredCutsceneLifecycleBridge } from "./systems/AuthoredCutsceneLifecycleBridge.js";
import { installLabisLifecycleBridge } from "./systems/LabisLifecycleBridge.js";
import { SceneDebugEditor } from "./systems/SceneDebugEditor.js";
import { installSpinWheelEnhancement } from "./systems/SpinWheelEnhancement.js";

installAuthoredCutsceneLifecycleBridge(WalkBackHomeApp.prototype);
installLabisLifecycleBridge(WalkBackHomeApp.prototype);
installSpinWheelEnhancement();

const root = document.querySelector<HTMLElement>("#app")!;
if (new URLSearchParams(window.location.search).get("debug") === "scene") {
  void new SceneDebugEditor(root).mount();
} else {
  new WalkBackHomeApp(root);
}
