import type { ActorFacing, SceneActor, SceneActorKind } from "./SceneActorRenderer.js";

export type CutsceneAction =
  | { type: "wait"; duration: number }
  | { type: "spawn"; actor: string; kind: SceneActorKind; x: number; y: number; facing?: ActorFacing; expression?: SceneActor["expression"]; color?: string; label?: string }
  | { type: "move"; actor: string; x: number; y: number; duration: number; expression?: SceneActor["expression"] }
  | { type: "face"; actor: string; direction: ActorFacing }
  | { type: "expression"; actor: string; value: SceneActor["expression"] }
  | { type: "dialogue"; speaker: string; text: string }
  | { type: "despawn"; actor: string };

export type CutsceneDialogue = {
  speaker: string;
  text: string;
};

export class CutsceneSystem {
  private index = 0;
  private elapsed = 0;
  private moveStart: { x: number; y: number } | null = null;
  actors = new Map<string, SceneActor>();
  currentDialogue: CutsceneDialogue | null = null;
  completed = false;

  constructor(private actions: CutsceneAction[]) {}

  update(dt: number): void {
    if (this.completed || this.currentDialogue) return;
    const action = this.actions[this.index];
    if (!action) {
      this.completed = true;
      return;
    }
    if (action.type === "wait") return this.updateTimed(action.duration, dt);
    if (action.type === "move") return this.updateMove(action, dt);
    this.applyInstant(action);
  }

  advanceDialogue(): void {
    if (!this.currentDialogue) return;
    this.currentDialogue = null;
    this.nextAction();
  }

  private updateTimed(duration: number, dt: number): void {
    this.elapsed += dt;
    if (this.elapsed >= duration) this.nextAction();
  }

  private updateMove(action: Extract<CutsceneAction, { type: "move" }>, dt: number): void {
    const actor = this.actors.get(action.actor);
    if (!actor) return this.nextAction();
    this.moveStart ??= { x: actor.x, y: actor.y };
    this.elapsed += dt;
    const t = Math.min(1, this.elapsed / Math.max(0.001, action.duration));
    this.actors.set(action.actor, {
      ...actor,
      x: this.moveStart.x + (action.x - this.moveStart.x) * t,
      y: this.moveStart.y + (action.y - this.moveStart.y) * t,
      expression: action.expression ?? actor.expression
    });
    if (t >= 1) this.nextAction();
  }

  private applyInstant(action: Exclude<CutsceneAction, { type: "wait" | "move" }>): void {
    if (action.type === "spawn") {
      this.actors.set(action.actor, {
        id: action.actor,
        label: action.label,
        x: action.x,
        y: action.y,
        facing: action.facing ?? "right",
        expression: action.expression,
        visible: true,
        kind: action.kind,
        color: action.color
      });
      return this.nextAction();
    }
    if (action.type === "face") {
      const actor = this.actors.get(action.actor);
      if (actor) this.actors.set(action.actor, { ...actor, facing: action.direction });
      return this.nextAction();
    }
    if (action.type === "expression") {
      const actor = this.actors.get(action.actor);
      if (actor) this.actors.set(action.actor, { ...actor, expression: action.value });
      return this.nextAction();
    }
    if (action.type === "dialogue") {
      this.currentDialogue = { speaker: action.speaker, text: action.text };
      return;
    }
    if (action.type === "despawn") {
      this.actors.delete(action.actor);
      return this.nextAction();
    }
  }

  private nextAction(): void {
    this.index += 1;
    this.elapsed = 0;
    this.moveStart = null;
  }
}
