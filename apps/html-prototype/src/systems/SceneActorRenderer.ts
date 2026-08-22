import type { Point } from "./CollisionSystem.js";

export type SceneSpriteAsset = {
  path: string;
  source: { x: number; y: number; w: number; h: number };
  visibleBounds?: { x: number; y: number; w: number; h: number };
  feet: { x: number; y: number };
  materialScale?: number;
  mirrorForLeft?: boolean;
};

export type SceneSpriteImageMap = Map<string, CanvasImageSource>;

export type ActorFacing = "down" | "up" | "left" | "right";
export type SceneActorKind = "human" | "motor" | "compound-motor";
export type SceneActorExpression =
  | "neutral"
  | "nervous"
  | "happy"
  | "attentive"
  | "ride_nervous"
  | "ride"
  | "ride_happy"
  | "look_back_happy"
  | "hold_motor"
  | "follow"
  | "release"
  | "watch"
  | "phone"
  | "photo_smug"
  | "confused"
  | "holding_book"
  | "haircut_happy"
  | "sitting_reading";

export type SceneActor = {
  id: string;
  label?: string;
  x: number;
  y: number;
  facing: ActorFacing;
  expression?: SceneActorExpression;
  visible: boolean;
  kind: SceneActorKind;
  color?: string;
  sprite?: { assetId: string; frame: number };
  opacity?: number;
};

export function moveSceneActor(actor: SceneActor, x: number, y: number): SceneActor {
  return { ...actor, x, y };
}

export function drawSceneActor(ctx: CanvasRenderingContext2D, actor: SceneActor, cameraX: number, cameraY: number, scale: number, spriteAssets?: Record<string, SceneSpriteAsset>, images?: SceneSpriteImageMap): void {
  if (!actor.visible || actor.opacity === 0) return;
  const spriteAsset = actor.sprite ? spriteAssets?.[actor.sprite.assetId] : undefined;
  const image = spriteAsset && images ? images.get(spriteAsset.path) : undefined;
  if (actor.sprite && spriteAsset && image && isImageReady(image)) {
    drawSceneSpriteAsset(ctx, image, spriteAsset, { x: actor.x, y: actor.y }, cameraX, cameraY, scale, actor.facing, actor.opacity ?? 1);
    return;
  }
  ctx.save();
  ctx.globalAlpha = actor.opacity ?? 1;
  const x = (actor.x - cameraX) * scale;
  const y = (actor.y - cameraY) * scale;
  if (actor.kind === "motor" || actor.kind === "compound-motor") {
    drawMotor(ctx, x, y, scale, actor.kind === "compound-motor" ? actor.expression : undefined);
    ctx.restore();
    return;
  }
  drawHuman(ctx, x, y, scale, actor);
  ctx.restore();
}

export function drawSceneSpriteAsset(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  asset: SceneSpriteAsset,
  position: Point,
  cameraX: number,
  cameraY: number,
  scale: number,
  facing: ActorFacing = "right",
  opacity = 1,
  baseHeight = 154
): void {
  const destinationHeight = baseHeight * (asset.materialScale ?? 1) * scale;
  const destinationWidth = destinationHeight * asset.source.w / asset.source.h;
  const visible = asset.visibleBounds ?? { x: 0, y: 0, w: asset.source.w, h: asset.source.h };
  const visibleLeft = visible.x / asset.source.w * destinationWidth;
  const visibleTop = visible.y / asset.source.h * destinationHeight;
  const visibleWidth = visible.w / asset.source.w * destinationWidth;
  const visibleHeight = visible.h / asset.source.h * destinationHeight;
  const feetX = (position.x - cameraX) * scale;
  const feetY = (position.y - cameraY) * scale;
  const left = feetX - asset.feet.x * destinationWidth;
  const top = feetY - asset.feet.y * destinationHeight;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.imageSmoothingEnabled = false;
  if (asset.mirrorForLeft && facing === "left") {
    ctx.translate(left + destinationWidth, top);
    ctx.scale(-1, 1);
    ctx.drawImage(image, asset.source.x + visible.x, asset.source.y + visible.y, visible.w, visible.h, visibleLeft, visibleTop, visibleWidth, visibleHeight);
  } else {
    ctx.drawImage(image, asset.source.x + visible.x, asset.source.y + visible.y, visible.w, visible.h, left + visibleLeft, top + visibleTop, visibleWidth, visibleHeight);
  }
  ctx.restore();
}

function isImageReady(image: CanvasImageSource): boolean {
  if (typeof HTMLImageElement !== "undefined" && image instanceof HTMLImageElement) return image.complete && image.naturalWidth > 0;
  return true;
}

function drawHuman(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, actor: SceneActor): void {
  const color = actor.color ?? "#39536a";
  const lean = actor.expression === "attentive" ? -2 * scale : actor.expression === "nervous" ? 2 * scale : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(31, 24, 18, .24)";
  ctx.beginPath();
  ctx.ellipse(0, 5 * scale, 13 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(lean, 0);
  ctx.fillStyle = color;
  ctx.fillRect(-8 * scale, -29 * scale, 16 * scale, 20 * scale);
  ctx.fillStyle = "#486077";
  ctx.fillRect(-8 * scale, -10 * scale, 7 * scale, 15 * scale);
  ctx.fillRect(1 * scale, -10 * scale, 7 * scale, 15 * scale);
  ctx.fillStyle = "#ead6bb";
  ctx.fillRect(-6 * scale, -43 * scale, 12 * scale, 12 * scale);
  ctx.fillStyle = "#2a211a";
  ctx.fillRect(-7 * scale, -45 * scale, 14 * scale, 4 * scale);
  ctx.fillRect(-8 * scale, -41 * scale, 3 * scale, 12 * scale);
  ctx.fillRect(5 * scale, -41 * scale, 3 * scale, 12 * scale);
  ctx.fillRect(-8 * scale, -30 * scale, 3 * scale, 16 * scale);
  ctx.fillRect(5 * scale, -30 * scale, 3 * scale, 16 * scale);
  ctx.fillStyle = "#2a211a";
  ctx.fillRect(-7 * scale, 3 * scale, 6 * scale, 3 * scale);
  ctx.fillRect(2 * scale, 3 * scale, 6 * scale, 3 * scale);
  ctx.fillStyle = actor.expression === "happy" ? "#3f2a1c" : actor.expression === "nervous" ? "#70412f" : "#33251c";
  ctx.fillRect(-3 * scale, -37 * scale, 2 * scale, 2 * scale);
  ctx.fillRect(3 * scale, -37 * scale, 2 * scale, 2 * scale);
  if (actor.expression === "happy") {
    ctx.strokeStyle = "#3f2a1c";
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.arc(1 * scale, -33 * scale, 4 * scale, 0, Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMotor(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, expression?: SceneActor["expression"]): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(31, 24, 18, .25)";
  ctx.beginPath();
  ctx.ellipse(0, 6 * scale, 26 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#171717";
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.arc(-18 * scale, 0, 8 * scale, 0, Math.PI * 2);
  ctx.arc(18 * scale, 0, 8 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#4f5f68";
  ctx.fillRect(-16 * scale, -15 * scale, 28 * scale, 11 * scale);
  ctx.fillStyle = "#6e2f2d";
  ctx.fillRect(4 * scale, -24 * scale, 20 * scale, 9 * scale);
  ctx.strokeStyle = "#2b2520";
  ctx.beginPath();
  ctx.moveTo(18 * scale, -16 * scale);
  ctx.lineTo(32 * scale, -24 * scale);
  ctx.stroke();
  drawHuman(ctx, 0, -12 * scale, scale, {
    id: "et-rider",
    x: 0,
    y: 0,
    facing: "right",
    expression: expression ?? "nervous",
    visible: true,
    kind: "human",
    color: "#f4eee6"
  });
  ctx.restore();
}
