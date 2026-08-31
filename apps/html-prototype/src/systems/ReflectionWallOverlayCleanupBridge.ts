type ReflectionOverlayHost = {
  overlay: HTMLElement;
  handleClick: (event: Event) => void;
  syncGameplayChromeVisibility: () => void;
};

/**
 * Reflection owns a full-stage ambience class. Remove it as soon as the last
 * Reflection surface closes, then explicitly resync room/gameplay chrome so
 * Muji Room prompts and interaction affordances return immediately.
 */
export function installReflectionWallOverlayCleanupBridge(prototype: object): void {
  const appPrototype = prototype as ReflectionOverlayHost;
  const handleClick = appPrototype.handleClick;
  appPrototype.handleClick = function (event: Event): void {
    const wasReflection = this.overlay.classList.contains("reflection-wall-overlay");
    handleClick.call(this, event);
    const reflectionSurface = this.overlay.querySelector(".reflection-kept-wall, .reflection-kept-compose, .reflection-kept-detail");
    if (wasReflection && !reflectionSurface) {
      this.overlay.classList.remove("reflection-wall-overlay");
      this.syncGameplayChromeVisibility();
    }
  };
}
