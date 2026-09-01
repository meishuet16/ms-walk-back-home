type LibraryView = "all" | "personal" | "built-in" | "hidden";

type Track = { id: string; source: "built-in" | "user" };
type PlayerWithVisibility = { hiddenBuiltInRecordIds?: string[]; libraryView?: LibraryView; selectedTrackId?: string; playing?: boolean; repeatOne?: boolean; shuffleEnabled?: boolean };
type AppLike = { personalPlayer?: PlayerWithVisibility; recordsPanelOpen?: boolean; save?: { savePersonalPlayer?: (state: unknown) => void }; overlay?: HTMLElement; showToast?: (message: string) => void; showRecords?: () => Promise<void>; allPersonalTracks?: () => Track[]; visibleMusicTracks?: () => Track[]; selectVinyl?: (id: string, announce?: boolean) => Promise<void>; playAdjacentPersonalTrack?: (direction: -1 | 1) => Promise<void>; handlePersonalTrackEnded?: () => Promise<void>; handleClick?: (event: Event) => void; autosave?: () => void };

// Developer-hidden is Records-only policy. It never controls chapter playback.
// 小半 intentionally stays OUT of this set so it remains a normal Record.
export const developerHiddenRecordIds = new Set<string>([
  "audio-music", // 我好想你 / 再见太难 / 瞬 currently share this generated ID
  "audio-track-255294", // 可惜不是你
  "audio-live", // 带我走
  "audio-xia-hu-those-bygone-years-na", // 那些年
  "audio-dear-d", // 亲爱的告诉你
  "audio-lyric-video-time-machine-mj-apanay-ft-aren", // Time Machine
  "audio-bell" // 雨是甜的
]);
export function isDeveloperHiddenRecord(trackId: string): boolean { return developerHiddenRecordIds.has(trackId); }
export function normalizedHiddenBuiltInIds(player?: PlayerWithVisibility): string[] { return [...new Set((player?.hiddenBuiltInRecordIds ?? []).filter((id): id is string => typeof id === "string" && Boolean(id)))]; }
export function libraryView(player?: PlayerWithVisibility): LibraryView { const view = player?.libraryView; return view === "personal" || view === "built-in" || view === "hidden" ? view : "all"; }
export function developerVisibleTracks<T extends Track>(tracks: T[]): T[] { return tracks.filter((track) => track.source !== "built-in" || !isDeveloperHiddenRecord(track.id)); }
export function recordCountForDisplay<T extends Track>(tracks: T[], player?: PlayerWithVisibility): number { const hidden = new Set(normalizedHiddenBuiltInIds(player)); return developerVisibleTracks(tracks).filter((track) => track.source !== "built-in" || !hidden.has(track.id)).length; }
export function fallbackPersonalTrackId<T extends Track>(tracks: T[], player?: PlayerWithVisibility): string | undefined { return personalPlaybackCandidates(tracks, player)[0]?.id; }
export function filterTracksForLibraryView<T extends Track>(tracks: T[], player?: PlayerWithVisibility): T[] {
  const visibleTracks = developerVisibleTracks(tracks);
  const hidden = new Set(normalizedHiddenBuiltInIds(player));
  const view = libraryView(player);
  if (view === "hidden") return visibleTracks.filter((track) => track.source === "built-in" && hidden.has(track.id));
  return visibleTracks.filter((track) => {
    if (track.source === "built-in" && hidden.has(track.id)) return false;
    if (view === "personal") return track.source === "user";
    if (view === "built-in") return track.source === "built-in";
    return true;
  });
}
export function personalPlaybackCandidates<T extends Track>(tracks: T[], player?: PlayerWithVisibility): T[] {
  const hidden = new Set(normalizedHiddenBuiltInIds(player));
  return developerVisibleTracks(tracks).filter((track) => track.source !== "built-in" || !hidden.has(track.id));
}
export function hideBuiltInRecord(player: PlayerWithVisibility, trackId: string): PlayerWithVisibility {
  if (isDeveloperHiddenRecord(trackId)) return player;
  return { ...player, hiddenBuiltInRecordIds: [...new Set([...normalizedHiddenBuiltInIds(player), trackId])] };
}
export function restoreBuiltInRecord(player: PlayerWithVisibility, trackId: string): PlayerWithVisibility {
  if (isDeveloperHiddenRecord(trackId)) return player;
  return { ...player, hiddenBuiltInRecordIds: normalizedHiddenBuiltInIds(player).filter((id) => id !== trackId) };
}
function persistVisibility(app: AppLike): void {
  if (!app.personalPlayer) return;
  app.save?.savePersonalPlayer?.(app.personalPlayer);
  app.autosave?.();
}
function labelFor(view: LibraryView, hiddenCount: number): string {
  if (view === "personal") return "My Music";
  if (view === "built-in") return "Built-in";
  if (view === "hidden") return `Hidden${hiddenCount ? ` (${hiddenCount})` : ""}`;
  return "All";
}
function replaceRecordCountCopy(overlay: HTMLElement, count: number): void {
  const replace = (value: string): string => value
    .replace(/\bBrowse\s+\d+\s+records\b/gi, `Browse ${count} records`)
    .replace(/\b\d+\s+records\b/gi, `${count} records`);
  const walker = document.createTreeWalker(overlay, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent || parent.closest(".records-library-filter-menu")) continue;
    const next = replace(node.data);
    if (next !== node.data) node.data = next;
  }
}
async function repairDeveloperHiddenSelection(app: AppLike): Promise<boolean> {
  const player = app.personalPlayer;
  const selectedId = player?.selectedTrackId;
  if (!player || !selectedId || !isDeveloperHiddenRecord(selectedId)) return false;
  const fallbackId = fallbackPersonalTrackId(app.allPersonalTracks?.() ?? [], player);
  if (!fallbackId || fallbackId === selectedId) return false;
  await app.selectVinyl?.(fallbackId, false);
  return true;
}
function injectVisibilityControls(app: AppLike): void {
  const overlay = app.overlay;
  const player = app.personalPlayer;
  if (!overlay || !player || !app.recordsPanelOpen) return;
  const allTracks = app.allPersonalTracks?.() ?? [];
  replaceRecordCountCopy(overlay, recordCountForDisplay(allTracks, player));
  const view = libraryView(player);
  const hiddenCount = normalizedHiddenBuiltInIds(player).filter((id) => !isDeveloperHiddenRecord(id)).length;
  const filter = `<details class="records-library-filter"><summary aria-label="Filter record library">${labelFor(view, hiddenCount)}<span aria-hidden="true">⌄</span></summary><div class="records-library-filter-menu">${(["all", "personal", "built-in", "hidden"] as LibraryView[]).map((id) => `<button data-action="records-library-view" data-view="${id}" class="${view === id ? "selected" : ""}">${labelFor(id, hiddenCount)}</button>`).join("")}</div></details>`;
  overlay.querySelectorAll(".records-library, .records-song-tools").forEach((host) => {
    if (!host.querySelector(".records-library-filter")) host.insertAdjacentHTML("afterbegin", filter);
  });
  overlay.querySelectorAll<HTMLElement>("details").forEach((details) => {
    const summary = details.querySelector("summary");
    if (summary?.textContent?.trim().startsWith("Sort:")) details.classList.add("records-sort-menu-anchor");
  });
  const hidden = new Set(normalizedHiddenBuiltInIds(player));
  overlay.querySelectorAll<HTMLElement>("[data-track], [data-record]").forEach((node) => {
    const trackId = node.dataset.track ?? node.dataset.record ?? "";
    if (!trackId || isDeveloperHiddenRecord(trackId)) return;
    const track = allTracks.find((item) => item.id === trackId);
    if (track?.source !== "built-in") return;
    const menu = node.closest(".record-list-row")?.querySelector(".records-song-menu") ?? node.closest(".records-track-action-sheet")?.querySelector(".records-track-actions");
    if (!menu || menu.querySelector(`[data-visibility-track="${CSS.escape(trackId)}"]`)) return;
    const isHidden = hidden.has(trackId);
    const safeId = trackId.replace(/&/g, "&amp;").replace(/\"/g, "&quot;");
    menu.insertAdjacentHTML("beforeend", `<button data-action="${isHidden ? "restore-built-in-record" : "hide-built-in-record"}" data-track="${safeId}" data-visibility-track="${safeId}">${isHidden ? "Restore to Records" : "Hide from Records"}</button>`);
  });
}

async function withPlaybackCandidates(app: AppLike, run: () => Promise<void>): Promise<void> {
  if (!app.visibleMusicTracks) return run();
  const hadOwnVisible = Object.prototype.hasOwnProperty.call(app, "visibleMusicTracks");
  const previousVisible = app.visibleMusicTracks;
  app.visibleMusicTracks = () => personalPlaybackCandidates(app.allPersonalTracks?.() ?? [], app.personalPlayer);
  try {
    await run();
  } finally {
    if (hadOwnVisible) app.visibleMusicTracks = previousVisible;
    else delete app.visibleMusicTracks;
  }
}

export function installRecordsLibraryVisibilityBridge(prototype: AppLike): void {
  const originalVisible = prototype.visibleMusicTracks;
  if (originalVisible) prototype.visibleMusicTracks = function(this: AppLike): Track[] {
    return filterTracksForLibraryView(originalVisible.call(this), this.personalPlayer);
  };

  const originalShow = prototype.showRecords;
  if (originalShow) prototype.showRecords = async function(this: AppLike): Promise<void> {
    if (await repairDeveloperHiddenSelection(this)) return;
    await originalShow.call(this);
    injectVisibilityControls(this);
  };

  const originalClick = prototype.handleClick;
  if (originalClick) prototype.handleClick = function(this: AppLike, event: Event): void {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-action]");
    const action = target?.dataset.action;
    if (action === "records-library-view") {
      if (!this.personalPlayer) return;
      const requested = target?.dataset.view as LibraryView | undefined;
      this.personalPlayer.libraryView = requested === "personal" || requested === "built-in" || requested === "hidden" ? requested : "all";
      persistVisibility(this);
      void this.showRecords?.();
      return;
    }
    if (action === "hide-built-in-record" || action === "restore-built-in-record") {
      if (!this.personalPlayer) return;
      const trackId = target?.dataset.track ?? "";
      const track = this.allPersonalTracks?.().find((item) => item.id === trackId);
      if (!trackId || track?.source !== "built-in" || isDeveloperHiddenRecord(trackId)) return;
      this.personalPlayer = action === "hide-built-in-record"
        ? hideBuiltInRecord(this.personalPlayer, trackId)
        : restoreBuiltInRecord(this.personalPlayer, trackId);
      persistVisibility(this);
      this.showToast?.(action === "hide-built-in-record" ? "Record hidden from your library" : "Record restored to your library");
      void this.showRecords?.();
      return;
    }
    originalClick.call(this, event);
  };

  // Keep the app's existing player lifecycle (scene guards, UI refresh, repeat/shuffle,
  // autosave, scroll stability) and only substitute the candidate list. This avoids
  // Records filtering accidentally taking ownership of chapter/forest audio behavior.
  const originalAdjacent = prototype.playAdjacentPersonalTrack;
  if (originalAdjacent) prototype.playAdjacentPersonalTrack = async function(this: AppLike, direction: -1 | 1): Promise<void> {
    await withPlaybackCandidates(this, () => originalAdjacent.call(this, direction));
  };

  const originalEnded = prototype.handlePersonalTrackEnded;
  if (originalEnded) prototype.handlePersonalTrackEnded = async function(this: AppLike): Promise<void> {
    await withPlaybackCandidates(this, () => originalEnded.call(this));
  };
}
