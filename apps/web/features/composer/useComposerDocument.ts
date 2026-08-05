import {
  addComposerElement,
  createEmptyComposerDocument,
  createFixtureBackgroundRemovalAdapter,
  deleteComposerElement,
  duplicateComposerElement,
  moveComposerLayer,
  updateComposerElement,
  type ComposerDocument,
  type ComposerElement
} from "@walk/shared";
import Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";

export function useComposerDocument(entryId = "fixture-entry-001") {
  const [document, setDocument] = useState<ComposerDocument>(() => createEmptyComposerDocument(entryId));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const selectedElement = useMemo(
    () => document.elements.find((element) => element.id === selectedId) ?? null,
    [document.elements, selectedId]
  );

  useEffect(() => {
    window.localStorage.setItem("walk.fixture.composer.document", JSON.stringify(document));
  }, [document]);

  function addTextBlock() {
    setDocument((current) =>
      addComposerElement(current, {
        kind: "text",
        text: "A fictional scrapbook note",
        x: 80,
        y: 80
      })
    );
  }

  async function addPhoto(file: File) {
    const dataUrl = await readFileAsDataUrl(file);
    setDocument((current) =>
      addComposerElement(current, {
        kind: "photo",
        src: dataUrl,
        alt: file.name,
        x: 140,
        y: 140
      })
    );
  }

  async function applyFixtureCutout() {
    if (!selectedElement || selectedElement.kind !== "photo" || !selectedElement.src) {
      return;
    }
    const adapter = createFixtureBackgroundRemovalAdapter();
    const result = await adapter.removeBackground({
      assetId: selectedElement.id,
      dataUrl: selectedElement.src,
      filename: selectedElement.alt ?? "fixture-photo.png"
    });
    setDocument((current) => updateComposerElement(current, selectedElement.id, { src: result.outputDataUrl }));
  }

  function generatePreview() {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    const dataUrl = stage.toDataURL({ pixelRatio: 1 });
    window.localStorage.setItem("walk.fixture.composer.preview", dataUrl);
    setPreviewDataUrl(dataUrl);
  }

  function updateElement(id: string, patch: Partial<Omit<ComposerElement, "id" | "kind">>) {
    setDocument((current) => updateComposerElement(current, id, patch));
  }

  return {
    addPhoto,
    addTextBlock,
    applyFixtureCutout,
    deleteSelected() {
      if (selectedId) {
        setDocument((current) => deleteComposerElement(current, selectedId));
        setSelectedId(null);
      }
    },
    document,
    duplicateSelected() {
      if (selectedId) {
        setDocument((current) => duplicateComposerElement(current, selectedId));
      }
    },
    generatePreview,
    moveSelectedLayer(direction: "back" | "front") {
      if (selectedId) {
        setDocument((current) => moveComposerLayer(current, selectedId, direction));
      }
    },
    previewDataUrl,
    selectedElement,
    selectedId,
    setSelectedId,
    stageRef,
    updateElement
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
