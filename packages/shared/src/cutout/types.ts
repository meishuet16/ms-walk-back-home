export type BackgroundRemovalInput = {
  assetId: string;
  dataUrl: string;
  filename: string;
};

export type BackgroundRemovalResult = {
  assetId: string;
  outputDataUrl: string;
  adapter: "fixture";
  changed: boolean;
  warning?: string;
};

export type BackgroundRemovalAdapter = {
  isAvailable: () => Promise<boolean>;
  removeBackground: (input: BackgroundRemovalInput) => Promise<BackgroundRemovalResult>;
};
