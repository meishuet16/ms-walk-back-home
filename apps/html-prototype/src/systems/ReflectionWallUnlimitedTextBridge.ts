type ReflectionUnlimitedTextHost = {
  overlay: HTMLElement;
  showReflectionComposer: (noteId?: string) => void;
};

/**
 * Reflection notes are intentionally unbounded user writing.
 *
 * The legacy composer carried a 500-character HTML maxlength even after the
 * persistence layer stopped truncating text. Remove any presentation-level
 * maxlength after the composer renders so the paper preview can stay visually
 * bounded without destroying or blocking the underlying note text.
 */
export function installReflectionWallUnlimitedTextBridge(prototype: object): void {
  const appPrototype = prototype as ReflectionUnlimitedTextHost;
  const showReflectionComposer = appPrototype.showReflectionComposer;

  appPrototype.showReflectionComposer = function (noteId = ""): void {
    showReflectionComposer.call(this, noteId);
    const textarea = this.overlay.querySelector<HTMLTextAreaElement>("#reflection-note-text");
    if (textarea) textarea.removeAttribute("maxlength");
  };
}
