import type { BackgroundRemovalAdapter } from "./types";

export function createFixtureBackgroundRemovalAdapter(): BackgroundRemovalAdapter {
  return {
    async isAvailable() {
      return true;
    },
    async removeBackground(input) {
      return {
        assetId: input.assetId,
        outputDataUrl: input.dataUrl,
        adapter: "fixture",
        changed: false,
        warning: "Fixture adapter leaves the image unchanged."
      };
    }
  };
}
