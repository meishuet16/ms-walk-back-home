import type { ComposerDocument, ComposerElement } from "@walk/shared";
import Konva from "konva";
import { useEffect, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from "react-konva";

type ComposerStageProps = {
  document: ComposerDocument;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  updateElement: (id: string, patch: Partial<Omit<ComposerElement, "id" | "kind">>) => void;
};

export function ComposerStage({
  document,
  selectedId,
  setSelectedId,
  stageRef,
  updateElement
}: ComposerStageProps) {
  return (
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
