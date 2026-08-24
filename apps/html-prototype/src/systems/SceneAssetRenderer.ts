export type SceneSize = { w: number; h: number };
export type SceneOrientation = "landscape" | "portrait";
export type DrawRect = { x: number; y: number; w: number; h: number };
export type SceneTransform = { source: DrawRect | null; destination: DrawRect };

export function sceneViewportFor(orientation: SceneOrientation, sceneSize: SceneSize): SceneSize {
  return orientation === "portrait" ? { w: sceneSize.w, h: sceneSize.h } : { w: Math.min(960, sceneSize.w), h: Math.min(540, sceneSize.h) };
}

export function sceneTransformFor(orientation: SceneOrientation, sceneSize: SceneSize, canvasSize: SceneSize): SceneTransform {
  const viewport = sceneViewportFor(orientation, sceneSize);
  return {
    source: orientation === "portrait" ? { x: 0, y: 0, w: viewport.w, h: viewport.h } : null,
    destination: { x: 0, y: 0, w: canvasSize.w, h: canvasSize.h }
  };
}

export function drawSceneAsset(ctx: CanvasRenderingContext2D, image: CanvasImageSource, orientation: SceneOrientation, sceneSize: SceneSize, canvasSize: SceneSize): void {
  const transform = sceneTransformFor(orientation, sceneSize, canvasSize);
  if (transform.source) ctx.drawImage(image, transform.source.x, transform.source.y, transform.source.w, transform.source.h, transform.destination.x, transform.destination.y, transform.destination.w, transform.destination.h);
  else ctx.drawImage(image, transform.destination.x, transform.destination.y, transform.destination.w, transform.destination.h);
}
