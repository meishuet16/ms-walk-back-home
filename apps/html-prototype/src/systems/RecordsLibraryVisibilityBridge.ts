type LibraryView = "all" | "personal" | "built-in" | "hidden";

type Track = { id: string; source: "built-in" | "user" };
type PlayerWithVisibility = {
  hiddenBuiltInRecordIds?: string[];
  libraryView?: LibraryView;
  selectedTrackId?: string;
  playing?: boolean;
  repeatOne?: boolean;
  shuffleEnabled?: boolean;
};
type AppLike = {
  personalPlayer?: PlayerWithVisibility;
  recordsPanelOpen?: boolean;
  room?: { vinylPlaying?: boolean };
  save?: { savePersonalPlayer?: (state: unknown) => void };
  overlay?: HTMLElement;
  showToast?: (message: string) => void;
  preserveRecordsScroll?: () => void;
  showRecords?: () => Promise<void>;
  allPersonalTracks?: () => Track[];
  visibleMusicTracks?: () => Track[];
  currentPersonalTrack?: () => Track | null;
  selectVinyl?: (id: string, announce?: boolean) => Promise<void>;
  playAdjacentPersonalTrack?: (direction: -1 | 1) => Promise<void>;
  handlePersonalTrackEnded?: () => Promise<void>;
  handleClick?: (event: Event) => void;
  autosave?: () => void;
};

// Developer-owned Records catalogue policy.
// Add built-in record IDs here when a bundled track must remain playable by the
// game (Chapter BGM / Final Dream / direct AudioManager use) but should never
// appear in the player's Records catalogue. This list is intentionally empty by
// default: visibility policy must be explicit, never inferred from audio assets.
export const developerHiddenRecordIds = new Set<string>([]);

export function isDeveloperHiddenRecord(trackId: string): boolean {
  return developerHiddenRecordIds.has(trackId);
}

export function normalizedHiddenBuiltInIds(player?: PlayerWithVisibility): string[] {
  return [...new Set((player?.hiddenBuiltInRecordIds ?? []).filter((id): id is string => typeof id === "string" && Boolean(id)))];
}
export function libraryView(player?: PlayerWithVisibility): LibraryView {
  const view = player?.libraryView;
  return view === "personal" || view === "built-in" || view === "hidden" ? view : "all";
}
export function filterTracksForLibraryView<T extends Track>(tracks: T[], player?: PlayerWithVisibility): T[] {
  const developerVisibleTracks = tracks.filter((track) => track.source !== "built-in" || !isDeveloperHiddenRecord(track.id));
  const hidden = new Set(normalizedHiddenBuiltInIds(player));
  const view = libraryView(player);
  if (view === "hidden") return developerVisibleTracks.filter((track) => track.source === "built-in" && hidden.has(track.id));
  return developerVisibleTracks.filter((track) => {
    if (track.source === "built-in" && hidden.has(track.id)) return false;
    if (view === "personal") return track.source === "user";
    if (view === "built-in") return track.source === "built-in";
    return true;
  });
}
export function personalPlaybackCandidates<T extends Track>(tracks: T[], player?: PlayerWithVisibility): T[] {
  const hidden = new Set(normalizedHiddenBuiltInIds(player));
  return tracks.filter((track) => track.source !== "built-in" || (!hidden.has(track.id) && !isDeveloperHiddenRecord(track.id)));
}
export function hideBuiltInRecord(player: PlayerWithVisibility, trackId: string): PlayerWithVisibility {
  if (isDeveloperHiddenRecord(trackId)) return player;
  return { ...player, hiddenBuiltInRecordIds: [...new Set([...normalizedHiddenBuiltInIds(player), trackId])] };
}
export function restoreBuiltInRecord(player: PlayerWithVisibility, trackId: string): PlayerWithVisibility {
  if (isDeveloperHiddenRecord(trackId)) return player;
  return { ...player, hiddenBuiltInRecordIds: normalizedHiddenBuiltInIds(player).filter((id) => id !== trackId) };
}
function nextTrackId(ids: string[], currentId: string | undefined, direction: -1 | 1, shuffle: boolean): string | undefined {
  if (!ids.length) return undefined;
  const currentIndex = ids.indexOf(currentId ?? "");
  if (direction > 0 && shuffle && ids.length > 1) {
    const candidates = ids.filter((id) => id !== currentId);
    return candidates[Math.floor(Math.random() * candidates.length)] ?? candidates[0];
  }
  if (currentIndex < 0) return direction > 0 ? ids[0] : ids[ids.length - 1];
  return ids[(currentIndex + direction + ids.length) % ids.length];
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
function injectVisibilityControls(app: AppLike): void {
  const overlay = app.overlay;
  const player = app.personalPlayer;
  if (!overlay || !player || !app.recordsPanelOpen) return;
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
    const track = app.allPersonalTracks?.().find((item) => item.id === trackId);
    if (track?.source !== "built-in") return;
    const menu = node.closest(".record-list-row")?.querySelector(".records-song-menu") ?? node.closest(".records-track-action-sheet")?.querySelector(".records-track-actions");
    if (!menu || menu.querySelector(`[data-visibility-track="${CSS.escape(trackId)}"]`)) return;
    const isHidden = hidden.has(trackId);
    const safeId = trackId.replace(/&/g, "&amp;").replace(/\"/g, "&quot;");
    menu.insertAdjacentHTML("beforeend", `<button data-action="${isHidden ? "restore-built-in-record" : "hide-built-in-record"}" data-track="${safeId}" data-visibility-track="${safeId}">${isHidden ? "Restore to Records" : "Hide from Records"}</button>`);
  });
}
export function installRecordsLibraryVisibilityBridge(prototype: AppLike): void {
  const originalVisible = prototype.visibleMusicTracks;
  if (originalVisible) prototype.visibleMusicTracks = function(this: AppLike): Track[] { return filterTracksForLibraryView(originalVisible.call(this), this.personalPlayer); };
  const originalShow = prototype.showRecords;
  if (originalShow) prototype.showRecords = async function(this: AppLike): Promise<void> { await originalShow.call(this); injectVisibilityControls(this); };
  const originalClick = prototype.handleClick;
  if (originalClick) prototype.handleClick = function(this: AppLike, event: Event): void {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-action]");
    const action = target?.dataset.action;
    if (action === "records-library-view") {
      if (!this.personalPlayer) return;
      const requested = target?.dataset.view as LibraryView | undefined;
      this.personalPlayer.libraryView = requested === "personal" || requested === "built-in" || requested === "hidden" ? requested : "all";
      persistVisibility(this); void this.showRecords?.(); return;
    }
    if (action === "hide-built-in-record" || action === "restore-built-in-record") {
      if (!this.personalPlayer) return;
      const trackId = target?.dataset.track ?? "";
      const track = this.allPersonalTracks?.().find((item) => item.id === trackId);
      if (!trackId || track?.source !== "built-in" || isDeveloperHiddenRecord(trackId)) return;
      this.personalPlayer = action === "hide-built-in-record" ? hideBuiltInRecord(this.personalPlayer, trackId) : restoreBuiltInRecord(this.personalPlayer, trackId);
      persistVisibility(this);
      this.showToast?.(action === "hide-built-in-record" ? "Record hidden from your library" : "Record restored to your library");
      void this.showRecords?.(); return;
    }
    originalClick.call(this, event);
  };
  prototype.playAdjacentPersonalTrack = async function(this: AppLike, direction: -1 | 1): Promise<void> {
    this.preserveRecordsScroll?.();
    const tracks = personalPlaybackCandidates(this.allPersonalTracks?.() ?? [], this.personalPlayer);
    const nextId = nextTrackId(tracks.map((track) => track.id), this.currentPersonalTrack?.()?.id, direction, Boolean(this.personalPlayer?.shuffleEnabled));
    if (nextId) await this.selectVinyl?.(nextId);
  };
  prototype.handlePersonalTrackEnded = async function(this: AppLike): Promise<void> {
    const player = this.personalPlayer;
    if (!player?.playing) return;
    const tracks = personalPlaybackCandidates(this.allPersonalTracks?.() ?? [], player);
    const selectedIsAvailable = Boolean(player.selectedTrackId && tracks.some((track) => track.id === player.selectedTrackId));
    if (player.repeatOne && player.selectedTrackId && selectedIsAvailable) { await this.selectVinyl?.(player.selectedTrackId, false); return; }
    const nextId = nextTrackId(tracks.map((track) => track.id), player.selectedTrackId, 1, Boolean(player.shuffleEnabled));
    if (!nextId) { player.playing = false; if (this.room) this.room.vinylPlaying = false; persistVisibility(this); return; }
    await this.selectVinyl?.(nextId, false);
  };
}
