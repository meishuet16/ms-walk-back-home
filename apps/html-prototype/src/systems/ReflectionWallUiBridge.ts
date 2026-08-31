import { installReflectionWallContinuumBridge } from "./ReflectionWallContinuumBridge.js";
import { installReflectionWallExperienceBridge } from "./ReflectionWallExperienceBridge.js";
import { installReflectionWallOverlayCleanupBridge } from "./ReflectionWallOverlayCleanupBridge.js";
import { installReflectionWallPaperBoundsBridge } from "./ReflectionWallPaperBoundsBridge.js";
import { installReflectionWallPaperCatalog } from "./ReflectionWallPaperCatalogBridge.js";
import { installReflectionWallVisualPolishBridge } from "./ReflectionWallVisualPolishBridge.js";

/**
 * Installs the Reflection Wall UI as one feature boundary.
 *
 * The internal bridges stay split by responsibility, but their install order is intentionally
 * centralized here so main.ts cannot accidentally reorder lifecycle wrappers and reintroduce
 * the background/search/cleanup bugs found during mobile QA.
 */
export function installReflectionWallUi(prototype: object): void {
  installReflectionWallPaperCatalog();
  installReflectionWallExperienceBridge(prototype);
  installReflectionWallPaperBoundsBridge(prototype);
  installReflectionWallVisualPolishBridge(prototype);
  installReflectionWallContinuumBridge(prototype);
  installReflectionWallOverlayCleanupBridge(prototype);
}
