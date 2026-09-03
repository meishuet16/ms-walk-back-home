import { App } from "@capacitor/app";
import { Capacitor, SystemBars } from "@capacitor/core";

export type NativeSystemBars = Pick<typeof SystemBars, "hide" | "show">;

export type NativeFullscreenShell = {
  classList: Pick<DOMTokenList, "add" | "remove" | "contains">;
};

export type NativeBackHandler = {
  handleNativeBackButton: () => boolean;
};

export function isCapacitorAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function setNativeFullscreen(
  shell: NativeFullscreenShell,
  enabled: boolean,
  systemBars: NativeSystemBars = SystemBars,
): Promise<void> {
  if (enabled) {
    await systemBars.hide();
    shell.classList.add("native-fullscreen");
    return;
  }

  await systemBars.show();
  shell.classList.remove("native-fullscreen");
}

export function handleNativeBackButton(
  app: NativeBackHandler,
  canGoBack: boolean,
  historyBack: () => void,
  exitApp: () => void,
): void {
  if (app.handleNativeBackButton()) return;
  if (canGoBack) {
    historyBack();
    return;
  }
  exitApp();
}

export function initializeCapacitorBridge(app: NativeBackHandler, shell: NativeFullscreenShell): void {
  if (!isCapacitorAndroid()) return;

  void App.addListener("backButton", ({ canGoBack }) => {
    handleNativeBackButton(app, canGoBack, () => window.history.back(), () => { void App.exitApp(); });
  });

  void App.addListener("appStateChange", ({ isActive }) => {
    if (!isActive || !shell.classList.contains("native-fullscreen")) return;
    void setNativeFullscreen(shell, true).catch(() => undefined);
  });
}
