export type SceneManifestFile = {
  name: string;
  text: () => Promise<string>;
};

export async function readSceneManifestFile(file: SceneManifestFile): Promise<{ fileName: string; text: string }> {
  if (!/\.json$/i.test(file.name)) throw new Error("Manifest files must be JSON.");
  const text = await file.text();
  return { fileName: file.name, text };
}
