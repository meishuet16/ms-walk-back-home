type ReflectionOverlayHost = {
  overlay: HTMLElement;
  handleClick: (event: Event) => void;
};

/**
 * The base app keeps overlay classes when the generic Close action empties the
 * overlay. Reflection Wall owns a full-screen ambience class, so clear it as
 * soon as the rendered surface is no longer one of the Reflection views.
 */
export function installReflectionWallOverlayCleanupBridge(prototype: object): void {
  const appPrototype = prototype as ReflectionOverlayHost;
  const handleClick = appPrototype.handleClick;
  appPrototype.handleClick = function (event: Event): void {
    handleClick.call(this, event);
    const reflectionSurface = this.overlay.querySelector(".reflection-kept-wall, .reflection-kept-compose, .reflection-kept-detail");
    if (!reflectionSurface) this.overlay.classList.remove("reflection-wall-overlay");
  };
}
