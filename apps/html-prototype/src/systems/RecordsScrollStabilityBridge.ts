type RecordsScrollHost = {
  overlay: HTMLElement;
  recordsPanelOpen: boolean;
  showRecords: () => Promise<void>;
};

/**
 * Keep a mobile Record Crate browsing position stable across player re-renders.
 * The core Records renderer already preserves its own scroll values; this bridge
 * additionally snapshots the live crate/panel positions immediately before a
 * render so selecting another song cannot snap an open crate back to its top.
 */
export function installRecordsScrollStabilityBridge(prototype: object): void {
  const appPrototype = prototype as RecordsScrollHost;
  const showRecords = appPrototype.showRecords;

  appPrototype.showRecords = async function (): Promise<void> {
    const panel = this.overlay.querySelector<HTMLElement>(".records-panel");
    const crate = this.overlay.querySelector<HTMLElement>(".records-song-sheet.open");
    const panelScrollTop = panel?.scrollTop;
    const crateScrollTop = crate?.scrollTop;

    await showRecords.call(this);

    if (!this.recordsPanelOpen) return;
    requestAnimationFrame(() => {
      const nextPanel = this.overlay.querySelector<HTMLElement>(".records-panel");
      const nextCrate = this.overlay.querySelector<HTMLElement>(".records-song-sheet.open");
      if (nextPanel && panelScrollTop !== undefined) nextPanel.scrollTop = panelScrollTop;
      if (nextCrate && crateScrollTop !== undefined) nextCrate.scrollTop = crateScrollTop;
    });
  };
}
