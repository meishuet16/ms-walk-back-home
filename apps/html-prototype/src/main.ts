import { WalkBackHomeApp } from "./app.js";
import { installAuthoredCutsceneLifecycleBridge } from "./systems/AuthoredCutsceneLifecycleBridge.js";
import { installLabisLifecycleBridge } from "./systems/LabisLifecycleBridge.js";
import { installRecordsScrollStabilityBridge } from "./systems/RecordsScrollStabilityBridge.js";
import { installRecordsLibraryVisibilityBridge } from "./systems/RecordsLibraryVisibilityBridge.js";
import { installReflectionWallUi } from "./systems/ReflectionWallUiBridge.js";
import { installCapsuleMachineBridge } from "./systems/CapsuleMachineBridge.js";
import { installCapsuleMenuBridge } from "./systems/CapsuleMenuBridge.js";
import { installCapsuleAudioCaptureBridge } from "./systems/CapsuleAudioCaptureBridge.js";
import { installCapsuleKeptOrganizerBridge } from "./systems/CapsuleKeptOrganizerBridge.js";
import { installLocalBackupSupplementBridge } from "./systems/LocalBackupSupplementBridge.js";
import { installChapterMusicBridge } from "./systems/ChapterMusicBridge.js";
import { installFinalDreamBridge } from "./systems/FinalDreamBridge.js";
import { initializeStoryRouteStartup, installStoryRouteBridge } from "./systems/StoryRouteBridge.js";
import { installStoryRouteMobileFixBridge } from "./systems/StoryRouteMobileFixBridge.js";
import { SceneDebugEditor } from "./systems/SceneDebugEditor.js";

installAuthoredCutsceneLifecycleBridge(WalkBackHomeApp.prototype);
installLabisLifecycleBridge(WalkBackHomeApp.prototype);
installRecordsScrollStabilityBridge(WalkBackHomeApp.prototype);
installRecordsLibraryVisibilityBridge(WalkBackHomeApp.prototype as unknown as Parameters<typeof installRecordsLibraryVisibilityBridge>[0]);
installReflectionWallUi(WalkBackHomeApp.prototype);
installCapsuleMachineBridge(WalkBackHomeApp.prototype as unknown as { activateRoomInteraction?: (interaction: { id: string }) => void });
installCapsuleMenuBridge(WalkBackHomeApp.prototype);
installCapsuleAudioCaptureBridge();
installCapsuleKeptOrganizerBridge();
installLocalBackupSupplementBridge(WalkBackHomeApp.prototype);
installChapterMusicBridge(WalkBackHomeApp.prototype as unknown as { enterCurrentMemory?: () => Promise<void>; finishReturnToForest?: () => void });
installFinalDreamBridge(WalkBackHomeApp.prototype as unknown as { enterCurrentMemory?: () => Promise<void> });
installStoryRouteBridge(WalkBackHomeApp.prototype as unknown as Parameters<typeof installStoryRouteBridge>[0]);
installStoryRouteMobileFixBridge(WalkBackHomeApp.prototype as unknown as Parameters<typeof installStoryRouteMobileFixBridge>[0]);

const root = document.querySelector<HTMLElement>("#app")!;
if (new URLSearchParams(window.location.search).get("debug") === "scene") {
  void new SceneDebugEditor(root).mount();
} else {
  const app = new WalkBackHomeApp(root);
  initializeStoryRouteStartup(app);

  const overlay = root.querySelector<HTMLElement>(".overlay");
  const hud = root.querySelector<HTMLElement>(".hud");
  if (overlay) {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      hud?.style.removeProperty("visibility");
      window.removeEventListener("keydown", onTitleKeydown);
      (app as unknown as { newMemory: () => void }).newMemory();
    };
    const onTitleKeydown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      start();
    };

    hud?.style.setProperty("visibility", "hidden");
    overlay.innerHTML = `
      <section class="story-title-screen" aria-label="Walk Back Home title screen">
        <div class="story-title-shade" aria-hidden="true"></div>
        <div class="story-title-copy">
          <small>A walk through memories that still glow</small>
          <h1>Walk Back Home</h1>
          <p>Where every memory leads me home.</p>
        </div>
        <button class="story-title-start" type="button">Begin the walk <span>→</span></button>
        <p class="story-title-hint">Tap anywhere · Enter</p>
      </section>`;

    overlay.querySelector<HTMLElement>(".story-title-screen")?.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).closest("button, a")) return;
      start();
    });
    overlay.querySelector<HTMLButtonElement>(".story-title-start")?.addEventListener("click", (event) => {
      event.stopPropagation();
      start();
    });
    window.addEventListener("keydown", onTitleKeydown);
  }
}
