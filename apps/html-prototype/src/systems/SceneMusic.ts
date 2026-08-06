export type MusicScene = "forest" | "bakery";

export const globalMusic = {
  label: "Bakery loop",
  src: "assets/audio/bakery.mp3",
  root: 196,
  fifth: 293.66,
  pulse: 0.34
};

export const sceneMusic = {
  forest: {
    ...globalMusic,
    label: "Bakery loop"
  },
  bakery: {
    ...globalMusic
  }
} satisfies Record<MusicScene, { label: string; src: string; root: number; fifth: number; pulse: number }>;

export function sceneMusicDataUri(scene: MusicScene): string {
  const music = sceneMusic[scene];
  const sampleRate = 8000;
  const seconds = 4;
  const sampleCount = sampleRate * seconds;
  const dataSize = sampleCount * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  write(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    const swell = 0.55 + Math.sin(t * Math.PI * 2 * music.pulse) * 0.25;
    const sample =
      Math.sin(t * Math.PI * 2 * music.root) * 0.42 +
      Math.sin(t * Math.PI * 2 * music.fifth) * 0.24 +
      Math.sin(t * Math.PI * 2 * music.root * 2.01) * 0.12;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample * swell)) * 26000, true);
  }
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}
