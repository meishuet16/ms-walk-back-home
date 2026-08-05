"use client";

import {
  addComposerElement,
  confirmImportDrafts,
  createEmptyComposerDocument,
  createFixtureBackgroundRemovalAdapter,
  deleteComposerElement,
  duplicateComposerElement,
  fictionalMultiEntryImport,
  mergeAdjacentDrafts,
  moveComposerLayer,
  parseDiaryImport,
  removeDraft,
  splitDraft,
  updateComposerElement,
  updateDraft,
  type ComposerDocument,
  type ComposerElement,
  type ImportDraftEntry
} from "@walk/shared";
import Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from "react-konva";

export function ImportComposerWorkspace() {
  const [rawImportText, setRawImportText] = useState(fictionalMultiEntryImport);
  const [drafts, setDrafts] = useState<ImportDraftEntry[]>(() => parseDiaryImport(fictionalMultiEntryImport).drafts);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [document, setDocument] = useState<ComposerDocument>(() => createEmptyComposerDocument("fixture-entry-001"));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const selectedElement = useMemo(
    () => document.elements.find((element) => element.id === selectedId) ?? null,
    [document.elements, selectedId]
  );

  useEffect(() => {
    window.localStorage.setItem("walk.fixture.import.raw", rawImportText);
  }, [rawImportText]);

  useEffect(() => {
    window.localStorage.setItem("walk.fixture.composer.document", JSON.stringify(document));
  }, [document]);

  function parseCurrentText() {
    setDrafts(parseDiaryImport(rawImportText).drafts);
  }

  async function importDiaryFile(file: File) {
    const text = await file.text();
    setRawImportText(text);
    setDrafts(parseDiaryImport(text).drafts);
  }

  function confirmImport() {
    const confirmed = confirmImportDrafts(drafts);
    window.localStorage.setItem("walk.fixture.import.confirmed", JSON.stringify(confirmed));
    setConfirmedCount(confirmed.length);
  }

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

  return (
    <section className="week-two" aria-labelledby="week-two-title">
      <div className="week-two-header">
        <div>
          <p>Week 2 fixture workspace</p>
          <h2 id="week-two-title">Import Review + Memory Composer</h2>
        </div>
        <span>Fixture mode · no paid APIs</span>
      </div>

      <div className="week-two-grid">
        <div className="panel import-panel">
          <h3>Diary Import</h3>
          <textarea
            aria-label="Paste multi-entry diary text"
            value={rawImportText}
            onChange={(event) => setRawImportText(event.target.value)}
          />
          <div className="control-row">
            <button type="button" onClick={parseCurrentText}>
              Parse Text
            </button>
            <label className="file-button">
              TXT / MD
              <input
                accept=".txt,.md,text/plain,text/markdown"
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void importDiaryFile(file);
                  }
                }}
              />
            </label>
          </div>
        </div>

        <div className="panel review-panel">
          <div className="review-heading">
            <h3>Import Review</h3>
            <button type="button" onClick={confirmImport}>
              Confirm Import
            </button>
          </div>
          {confirmedCount > 0 ? <p className="status-line">{confirmedCount} fictional entries saved to runtime storage.</p> : null}
          <div className="draft-list">
            {drafts.map((draft, index) => (
              <article className="draft-card" key={draft.id}>
                <div className="draft-fields">
                  <input
                    aria-label={`Date for ${draft.id}`}
                    value={draft.entryDate}
                    onChange={(event) =>
                      setDrafts((current) => updateDraft(current, draft.id, { entryDate: event.target.value }))
                    }
                    placeholder="YYYY-MM-DD"
                  />
                  <input
                    aria-label={`Title for ${draft.id}`}
                    value={draft.title}
                    onChange={(event) =>
                      setDrafts((current) => updateDraft(current, draft.id, { title: event.target.value }))
                    }
                  />
                </div>
                <p>{draft.body.slice(0, 180) || "No body yet."}</p>
                <div className="draft-meta">
                  <span>confidence {Math.round(draft.confidence * 100)}%</span>
                  {draft.warnings.map((warning) => (
                    <span key={warning}>{warning}</span>
                  ))}
                </div>
                <div className="control-row">
                  <button type="button" onClick={() => setDrafts((current) => mergeAdjacentDrafts(current, draft.id))}>
                    Merge Next
                  </button>
                  <button type="button" onClick={() => setDrafts((current) => splitDraft(current, draft.id, 1))}>
                    Split
                  </button>
                  <button type="button" onClick={() => setDrafts((current) => removeDraft(current, draft.id))}>
                    Remove
                  </button>
                </div>
                <small>Draft {index + 1}</small>
              </article>
            ))}
          </div>
        </div>

        <div className="panel composer-panel">
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
            <button type="button" disabled={!selectedId} onClick={() => selectedId && setDocument((current) => duplicateComposerElement(current, selectedId))}>
              Duplicate
            </button>
            <button type="button" disabled={!selectedId} onClick={() => selectedId && setDocument((current) => moveComposerLayer(current, selectedId, "front"))}>
              Front
            </button>
            <button type="button" disabled={!selectedId} onClick={() => selectedId && setDocument((current) => moveComposerLayer(current, selectedId, "back"))}>
              Back
            </button>
            <button type="button" disabled={!selectedId} onClick={() => selectedId && setDocument((current) => deleteComposerElement(current, selectedId))}>
              Delete
            </button>
            <button type="button" disabled={selectedElement?.kind !== "photo"} onClick={() => void applyFixtureCutout()}>
              Cutout
            </button>
            <button type="button" onClick={generatePreview}>
              Preview
            </button>
          </div>
          <div className="composer-stage">
            <Stage
              ref={stageRef}
              width={document.width}
              height={document.height}
              onMouseDown={(event) => {
                if (event.target === event.target.getStage()) {
                  setSelectedId(null);
                }
              }}
              onTouchStart={(event) => {
                if (event.target === event.target.getStage()) {
                  setSelectedId(null);
                }
              }}
            >
              <Layer>
                <Rect width={document.width} height={document.height} fill="#f4ebdd" />
                {document.elements.map((element) =>
                  element.kind === "text" ? (
                    <TextElement
                      element={element}
                      isSelected={element.id === selectedId}
                      key={element.id}
                      onSelect={() => setSelectedId(element.id)}
                      onUpdate={updateElement}
                    />
                  ) : (
                    <PhotoElement
                      element={element}
                      isSelected={element.id === selectedId}
                      key={element.id}
                      onSelect={() => setSelectedId(element.id)}
                      onUpdate={updateElement}
                    />
                  )
                )}
              </Layer>
            </Stage>
          </div>
          {previewDataUrl ? <img alt="Flattened scrapbook preview" className="preview-image" src={previewDataUrl} /> : null}
        </div>
      </div>
    </section>
  );
}

function TextElement({
  element,
  isSelected,
  onSelect,
  onUpdate
}: {
  element: ComposerElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, patch: Partial<Omit<ComposerElement, "id" | "kind">>) => void;
}) {
  const textRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && textRef.current && transformerRef.current) {
      transformerRef.current.nodes([textRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Text
        ref={textRef}
        draggable
        fill="#223047"
        fontFamily="Georgia, serif"
        fontSize={22}
        height={element.height}
        id={element.id}
        opacity={element.opacity}
        rotation={element.rotation}
        text={element.text}
        width={element.width}
        x={element.x}
        y={element.y}
        onClick={onSelect}
        onDragEnd={(event) => onUpdate(element.id, { x: event.target.x(), y: event.target.y() })}
        onTap={onSelect}
        onTransformEnd={() => {
          const node = textRef.current;
          if (!node) {
            return;
          }
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onUpdate(element.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(80, node.width() * scaleX),
            height: Math.max(40, node.height() * scaleY),
            rotation: node.rotation()
          });
        }}
      />
      {isSelected ? <Transformer ref={transformerRef} rotateEnabled /> : null}
    </>
  );
}

function PhotoElement({
  element,
  isSelected,
  onSelect,
  onUpdate
}: {
  element: ComposerElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, patch: Partial<Omit<ComposerElement, "id" | "kind">>) => void;
}) {
  const image = useImage(element.src);
  const imageRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && imageRef.current && transformerRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        ref={imageRef}
        draggable
        height={element.height}
        image={image ?? undefined}
        opacity={element.opacity}
        rotation={element.rotation}
        width={element.width}
        x={element.x}
        y={element.y}
        onClick={onSelect}
        onDragEnd={(event) => onUpdate(element.id, { x: event.target.x(), y: event.target.y() })}
        onTap={onSelect}
        onTransformEnd={() => {
          const node = imageRef.current;
          if (!node) {
            return;
          }
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onUpdate(element.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(60, node.width() * scaleX),
            height: Math.max(60, node.height() * scaleY),
            rotation: node.rotation()
          });
        }}
      />
      {isSelected ? <Transformer ref={transformerRef} rotateEnabled /> : null}
    </>
  );
}

function useImage(src?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const nextImage = new window.Image();
    nextImage.onload = () => setImage(nextImage);
    nextImage.src = src;
  }, [src]);

  return image;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
