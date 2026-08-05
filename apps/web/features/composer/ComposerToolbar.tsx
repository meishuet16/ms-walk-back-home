import type { ComposerElement } from "@walk/shared";

type ComposerToolbarProps = {
  selectedElement: ComposerElement | null;
  selectedId: string | null;
  addTextBlock: () => void;
  addPhoto: (file: File) => Promise<void>;
  duplicateSelected: () => void;
  moveSelectedLayer: (direction: "back" | "front") => void;
  deleteSelected: () => void;
  applyFixtureCutout: () => Promise<void>;
  generatePreview: () => void;
};

export function ComposerToolbar({
  addPhoto,
  addTextBlock,
  applyFixtureCutout,
  deleteSelected,
  duplicateSelected,
  generatePreview,
  moveSelectedLayer,
  selectedElement,
  selectedId
}: ComposerToolbarProps) {
  return (
    <div className="composer-toolbar">
      <h3>Memory Composer</h3>
      <button type="button" onClick={addTextBlock}>
        Text
      </button>
      <label className="file-button">
        Photo
        <input
          accept="image/*"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void addPhoto(file);
            }
          }}
        />
      </label>
      <button type="button" disabled={!selectedId} onClick={duplicateSelected}>
        Duplicate
      </button>
      <button type="button" disabled={!selectedId} onClick={() => moveSelectedLayer("front")}>
        Front
      </button>
      <button type="button" disabled={!selectedId} onClick={() => moveSelectedLayer("back")}>
        Back
      </button>
      <button type="button" disabled={!selectedId} onClick={deleteSelected}>
        Delete
      </button>
      <button type="button" disabled={selectedElement?.kind !== "photo"} onClick={() => void applyFixtureCutout()}>
        Cutout
      </button>
      <button type="button" onClick={generatePreview}>
        Preview
      </button>
    </div>
  );
}
