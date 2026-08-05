import { ComposerStage } from "./ComposerStage";
import { ComposerToolbar } from "./ComposerToolbar";
import { useComposerDocument } from "./useComposerDocument";

export function MemoryComposer() {
  const composer = useComposerDocument();

  return (
    <div className="panel composer-panel">
      <ComposerToolbar
        addPhoto={composer.addPhoto}
        addTextBlock={composer.addTextBlock}
        applyFixtureCutout={composer.applyFixtureCutout}
        deleteSelected={composer.deleteSelected}
        duplicateSelected={composer.duplicateSelected}
        generatePreview={composer.generatePreview}
        moveSelectedLayer={composer.moveSelectedLayer}
        selectedElement={composer.selectedElement}
        selectedId={composer.selectedId}
      />
      <ComposerStage
        document={composer.document}
        selectedId={composer.selectedId}
        setSelectedId={composer.setSelectedId}
        stageRef={composer.stageRef}
        updateElement={composer.updateElement}
      />
      {composer.previewDataUrl ? (
        <img alt="Flattened scrapbook preview" className="preview-image" src={composer.previewDataUrl} />
      ) : null}
    </div>
  );
}
