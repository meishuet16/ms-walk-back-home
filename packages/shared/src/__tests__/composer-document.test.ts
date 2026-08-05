import { describe, expect, it } from "vitest";
import {
  addComposerElement,
  createEmptyComposerDocument,
  deleteComposerElement,
  duplicateComposerElement,
  moveComposerLayer,
  updateComposerElement
} from "../composer/composer-document";

describe("composer document operations", () => {
  it("adds text and photo elements, updates transforms, duplicates, orders, and deletes", () => {
    let document = createEmptyComposerDocument("fixture-entry-001");

    document = addComposerElement(document, {
      kind: "text",
      text: "A fictional note",
      x: 24,
      y: 32
    });
    document = addComposerElement(document, {
      kind: "photo",
      src: "fixture-photo://bakery-window",
      alt: "Fictional bakery window",
      x: 80,
      y: 96
    });

    const textId = document.elements[0]!.id;
    const photoId = document.elements[1]!.id;

    document = updateComposerElement(document, textId, { rotation: 12, width: 180 });
    document = duplicateComposerElement(document, photoId);
    document = moveComposerLayer(document, textId, "front");

    expect(document.elements).toHaveLength(3);
    expect(document.elements.at(-1)).toMatchObject({ id: textId, rotation: 12, width: 180 });

    document = deleteComposerElement(document, textId);
    expect(document.elements.map((element) => element.id)).not.toContain(textId);
  });
});
