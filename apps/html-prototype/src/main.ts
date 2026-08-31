import { WalkBackHomeApp } from "./app.js";
import { installAuthoredCutsceneLifecycleBridge } from "./systems/AuthoredCutsceneLifecycleBridge.js";
import { installLabisLifecycleBridge } from "./systems/LabisLifecycleBridge.js";
import { installReflectionWallExperienceBridge } from "./systems/ReflectionWallExperienceBridge.js";
import { installReflectionWallOverlayCleanupBridge } from "./systems/ReflectionWallOverlayCleanupBridge.js";
import { installReflectionWallPaperBoundsBridge } from "./systems/ReflectionWallPaperBoundsBridge.js";
import { installReflectionWallPaperCatalog } from "./systems/ReflectionWallPaperCatalogBridge.js";
import { installReflectionWallVisualPolishBridge } from "./systems/ReflectionWallVisualPolishBridge.js";
import { SceneDebugEditor } from "./systems/SceneDebugEditor.js";

installAuthoredCutsceneLifecycleBridge(WalkBackHomeApp.prototype);
installLabisLifecycleBridge(WalkBackHomeApp.prototype);
installReflectionWallPaperCatalog();
installReflectionWallExperienceBridge(WalkBackHomeApp.prototype);
installReflectionWallPaperBoundsBridge(WalkBackHomeApp.prototype);
installReflectionWallVisualPolishBridge(WalkBackHomeApp.prototype);
installReflectionWallOverlayCleanupBridge(WalkBackHomeApp.prototype);

const root = document.querySelector<HTMLElement>("#app")!;
if (new URLSearchParams(window.location.search).get("debug") === "scene") {
  void new SceneDebugEditor(root).mount();
} else {
  new WalkBackHomeApp(root);
}
