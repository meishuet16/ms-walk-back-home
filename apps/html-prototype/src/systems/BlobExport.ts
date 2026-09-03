import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export type BlobExportResult = {
  native: boolean;
  filename: string;
};

export type BlobExportDependencies = {
  isNativeAndroid: () => boolean;
  saveOrShareNative: (blob: Blob, filename: string) => Promise<void>;
  downloadInBrowser: (blob: Blob, filename: string) => void;
};

export function nativeExportStatus(filename: string): string {
  return `Ready to save or share ${filename}`;
}

export async function exportBlob(blob: Blob, filename: string, dependencies: BlobExportDependencies = browserDependencies()): Promise<BlobExportResult> {
  if (dependencies.isNativeAndroid()) {
    await dependencies.saveOrShareNative(blob, filename);
    return { native: true, filename };
  }

  dependencies.downloadInBrowser(blob, filename);
  return { native: false, filename };
}

function browserDependencies(): BlobExportDependencies {
  return {
    isNativeAndroid: () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android",
    saveOrShareNative: saveOrShareNative,
    downloadInBrowser: downloadInBrowser
  };
}

async function saveOrShareNative(blob: Blob, filename: string): Promise<void> {
  const path = `walk-back-home-exports/${uniqueExportDirectory()}/${safeFilename(filename)}`;
  await Filesystem.writeFile({
    path,
    directory: Directory.Cache,
    data: await blobToBase64(blob),
    recursive: true
  });
  const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
  await Share.share({
    title: filename,
    url: uri,
    dialogTitle: "Save or share file"
  });
}

function downloadInBrowser(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function uniqueExportDirectory(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safeFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).pop() || "walk-back-home-export";
  return basename.replace(/[\u0000]/g, "_");
}
