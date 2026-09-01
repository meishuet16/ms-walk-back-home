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

const root = document.querySelector<HTMLElement>("#app")!;
if (new URLSearchParams(window.location.search).get("debug") === "scene") {
  void new SceneDebugEditor(root).mount();
} else {
  new WalkBackHomeApp(root);
}
