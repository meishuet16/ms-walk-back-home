import { describe, expect, it } from "vitest";
import { createFixtureBackgroundRemovalAdapter } from "../cutout/fixture-background-removal";

describe("createFixtureBackgroundRemovalAdapter", () => {
  it("returns a deterministic no-cost cutout result", async () => {
    const adapter = createFixtureBackgroundRemovalAdapter();

    await expect(adapter.isAvailable()).resolves.toBe(true);
    await expect(adapter.removeBackground({
      assetId: "photo-001",
      dataUrl: "data:image/png;base64,fictional",
      filename: "fictional-photo.png"
    })).resolves.toEqual({
      assetId: "photo-001",
      outputDataUrl: "data:image/png;base64,fictional",
      adapter: "fixture",
      changed: false,
      warning: "Fixture adapter leaves the image unchanged."
    });
  });
});
