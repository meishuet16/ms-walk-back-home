import { WalkBackHomeApp } from "./app.js";
import { SceneDebugEditor } from "./systems/SceneDebugEditor.js";

const root = document.querySelector<HTMLElement>("#app")!;
if (new URLSearchParams(window.location.search).get("debug") === "scene") {
  void new SceneDebugEditor(root).mount();
} else {
  new WalkBackHomeApp(root);
}
