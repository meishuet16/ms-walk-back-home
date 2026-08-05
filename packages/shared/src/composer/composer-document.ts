export type ComposerElementKind = "text" | "photo";

export type ComposerElement = {
  id: string;
  kind: ComposerElementKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  text?: string;
  src?: string;
  alt?: string;
};

export type ComposerDocument = {
  version: "1.0";
  entryId: string;
  width: number;
  height: number;
  elements: ComposerElement[];
};

type NewComposerElement =
  | { kind: "text"; text: string; x: number; y: number; width?: number; height?: number }
  | { kind: "photo"; src: string; alt: string; x: number; y: number; width?: number; height?: number };

export function createEmptyComposerDocument(entryId: string): ComposerDocument {
  return {
    version: "1.0",
    entryId,
    width: 900,
    height: 620,
    elements: []
  };
}

export function addComposerElement(document: ComposerDocument, element: NewComposerElement): ComposerDocument {
  const id = `composer-element-${String(document.elements.length + 1).padStart(3, "0")}`;
  const base = {
    id,
    x: element.x,
    y: element.y,
    width: element.width ?? (element.kind === "text" ? 220 : 240),
    height: element.height ?? (element.kind === "text" ? 90 : 180),
    rotation: 0,
    opacity: 1
  };

  const nextElement: ComposerElement =
    element.kind === "text"
      ? { ...base, kind: "text", text: element.text }
      : { ...base, kind: "photo", src: element.src, alt: element.alt };

  return { ...document, elements: [...document.elements, nextElement] };
}

export function updateComposerElement(
  document: ComposerDocument,
  id: string,
  patch: Partial<Omit<ComposerElement, "id" | "kind">>
): ComposerDocument {
  return {
    ...document,
    elements: document.elements.map((element) => (element.id === id ? { ...element, ...patch } : { ...element }))
  };
}

export function duplicateComposerElement(document: ComposerDocument, id: string): ComposerDocument {
  const element = document.elements.find((item) => item.id === id);
  if (!element) {
    return { ...document, elements: document.elements.map((item) => ({ ...item })) };
  }

  const duplicate = {
    ...element,
    id: `${element.id}-copy-${document.elements.length + 1}`,
    x: element.x + 24,
    y: element.y + 24
  };

  return { ...document, elements: [...document.elements.map((item) => ({ ...item })), duplicate] };
}

export function deleteComposerElement(document: ComposerDocument, id: string): ComposerDocument {
  return { ...document, elements: document.elements.filter((element) => element.id !== id).map((item) => ({ ...item })) };
}

export function moveComposerLayer(document: ComposerDocument, id: string, direction: "back" | "front"): ComposerDocument {
  const element = document.elements.find((item) => item.id === id);
  if (!element) {
    return { ...document, elements: document.elements.map((item) => ({ ...item })) };
  }
  const others = document.elements.filter((item) => item.id !== id).map((item) => ({ ...item }));
  return {
    ...document,
    elements: direction === "front" ? [...others, { ...element }] : [{ ...element }, ...others]
  };
}
