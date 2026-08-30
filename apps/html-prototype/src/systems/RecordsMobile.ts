export type RecordsMobileLayer = "none" | "global-menu" | "track-menu" | "track-editor";

export type RecordsMobileState = {
  crateOpen: boolean;
  layer: RecordsMobileLayer;
  organizeMode: boolean;
  actionTrackId?: string;
};

export type RecordsMobileAction =
  | { type: "open-crate" }
  | { type: "close-crate" }
  | { type: "open-global-menu" }
  | { type: "close-layer" }
  | { type: "open-track-menu"; trackId: string }
  | { type: "open-track-editor" }
  | { type: "open-track-editor-for"; trackId: string }
  | { type: "enter-organize" }
  | { type: "leave-organize" };

export function createRecordsMobileState(): RecordsMobileState {
  return { crateOpen: false, layer: "none", organizeMode: false };
}

export function transitionRecordsMobile(state: RecordsMobileState, action: RecordsMobileAction): RecordsMobileState {
  if (action.type === "open-crate") return { crateOpen: true, layer: "none", organizeMode: false };
  if (action.type === "close-crate") return createRecordsMobileState();
  if (action.type === "open-global-menu") return { crateOpen: false, layer: "global-menu", organizeMode: false };
  if (action.type === "close-layer") return { crateOpen: state.crateOpen, layer: "none", organizeMode: state.organizeMode };
  if (action.type === "open-track-menu") return { crateOpen: true, layer: "track-menu", organizeMode: false, actionTrackId: action.trackId };
  if (action.type === "open-track-editor") return state.actionTrackId ? { ...state, layer: "track-editor" } : state;
  if (action.type === "open-track-editor-for") return { crateOpen: state.crateOpen, layer: "track-editor", organizeMode: false, actionTrackId: action.trackId };
  if (action.type === "enter-organize") return { crateOpen: true, layer: "none", organizeMode: true };
  return { crateOpen: true, layer: "none", organizeMode: false };
}
