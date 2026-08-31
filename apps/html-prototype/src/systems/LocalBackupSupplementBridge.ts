import type { BackupBlobEntry } from "./BackupManager.js";
import { CAPSULE_STORAGE_KEY, loadCapsuleMachineState } from "./CapsuleMachine.js";
import { CapsuleMediaStore } from "./CapsuleMediaStore.js";
import { REFLECTION_WALL_BACKGROUND_KEY } from "./ReflectionWallVisualPolishBridge.js";

type BackupHost = {
  backupBlobEntries?: () => Promise<BackupBlobEntry[]>;
};

type BackupReadableStorage = Pick<Storage, "getItem">;

type CapsuleReadableStore = {
  get(key: string): Promise<Blob | null>;
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to encode backup blob"));
    reader.readAsDataURL(blob);
  });
}

export async function collectLocalBackupSupplementEntries(
  storage: BackupReadableStorage,
  capsuleStore: CapsuleReadableStore,
  encodeBlob: (blob: Blob) => Promise<string> = blobToDataUrl
): Promise<BackupBlobEntry[]> {
  const state = loadCapsuleMachineState(storage as Pick<Storage, "getItem">);
  const referencedMediaIds = [...new Set(
    state.thoughts.flatMap((thought) => thought.attachments?.map((attachment) => attachment.id) ?? [])
  )];

  const mediaEntries = await Promise.all(referencedMediaIds.map(async (key) => {
    const blob = await capsuleStore.get(key);
    if (!blob) return null;
    return {
      key,
      kind: "capsule-media" as const,
      type: blob.type || "application/octet-stream",
      dataUrl: await encodeBlob(blob)
    };
  }));

  const capsuleStateBlob = new Blob([JSON.stringify(state)], { type: "application/json" });
  const reflectionBackground = storage.getItem(REFLECTION_WALL_BACKGROUND_KEY) ?? "";
  const reflectionBackgroundBlob = new Blob([reflectionBackground], { type: "text/plain;charset=utf-8" });

  return [
    {
      key: CAPSULE_STORAGE_KEY,
      kind: "capsule-state",
      type: capsuleStateBlob.type,
      dataUrl: await encodeBlob(capsuleStateBlob)
    },
    ...mediaEntries.filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    {
      key: REFLECTION_WALL_BACKGROUND_KEY,
      kind: "reflection-wall-background",
      type: reflectionBackgroundBlob.type,
      dataUrl: await encodeBlob(reflectionBackgroundBlob)
    }
  ];
}

export function installLocalBackupSupplementBridge(prototype: object): void {
  const host = prototype as BackupHost & { __localBackupSupplementBridgeInstalled?: boolean };
  if (host.__localBackupSupplementBridgeInstalled) return;
  host.__localBackupSupplementBridgeInstalled = true;

  const originalBackupBlobEntries = host.backupBlobEntries;
  if (!originalBackupBlobEntries) return;

  host.backupBlobEntries = async function (): Promise<BackupBlobEntry[]> {
    const existing = await originalBackupBlobEntries.call(this);
    const supplements = await collectLocalBackupSupplementEntries(localStorage, new CapsuleMediaStore());
    const supplementKinds = new Set(["capsule-state", "capsule-media", "reflection-wall-background"]);
    return [
      ...existing.filter((entry) => !supplementKinds.has(entry.kind ?? "")),
      ...supplements
    ];
  };
}
