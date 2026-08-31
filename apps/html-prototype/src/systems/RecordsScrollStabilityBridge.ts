type RecordsScrollHost = {
  overlay: HTMLElement;
  recordsPanelOpen: boolean;
  showRecords: () => Promise<void>;
};

/**
 * Keep the mobile Record Crate browsing position stable across player re-renders.
 * The scrollable element is the crate list itself, not the fixed sheet shell.
 */
export function installRecordsScrollStabilityBridge(prototype: object): void {
  const appPrototype = prototype as RecordsScrollHost;
  const showRecords = appPrototype.showRecords;

  appPrototype.showRecords = async function (): Promise<void> {
    const panel = this.overlay.querySelector<HTMLElement>(".records-panel");
    const list = this.overlay.querySelector<HTMLElement>(".records-mobile-crate-list");
    const panelScrollTop = panel?.scrollTop;
    const listScrollTop = list?.scrollTop;

    await showRecords.call(this);

    if (!this.recordsPanelOpen) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const nextPanel = this.overlay.querySelector<HTMLElement>(".records-panel");
        const nextList = this.overlay.querySelector<HTMLElement>(".records-mobile-crate-list");
        if (nextPanel && panelScrollTop !== undefined) nextPanel.scrollTop = panelScrollTop;
        if (nextList && listScrollTop !== undefined) nextList.scrollTop = listScrollTop;
      });
    });
  };
}
