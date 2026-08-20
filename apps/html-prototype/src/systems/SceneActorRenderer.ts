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

export function drawSceneActor(ctx: CanvasRenderingContext2D, actor: SceneActor, cameraX: number, cameraY: number, scale: number): void {
  if (!actor.visible || actor.opacity === 0) return;
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
