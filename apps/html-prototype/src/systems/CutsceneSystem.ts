import type { ActorFacing, SceneActor, SceneActorKind } from "./SceneActorRenderer.js";

export type CutsceneAction =
  | { type: "wait"; duration: number }
  | { type: "spawn"; actor: string; kind: SceneActorKind; x: number; y: number; facing?: ActorFacing; expression?: SceneActor["expression"]; color?: string; label?: string; sprite?: SceneActor["sprite"]; opacity?: number }
  | { type: "move"; actor: string; x: number; y: number; duration: number; expression?: SceneActor["expression"]; sprite?: SceneActor["sprite"] }
  | { type: "face"; actor: string; direction: ActorFacing }
  | { type: "expression"; actor: string; value: SceneActor["expression"] }
  | { type: "sprite"; actor: string; sprite: NonNullable<SceneActor["sprite"]> }
  | { type: "prop"; id: string; assetId: string; owner?: string; visible: boolean }
  | { type: "effect"; id: string; kind: "water-vfx" | "dissolve"; actor?: string; target?: string; frame?: number; duration: number }
  | { type: "fade"; actors: string[]; duration: number }
  | { type: "dialogue"; speaker: string; text: string; portrait?: string }
  | { type: "despawn"; actor: string };

export type CutsceneDialogue = {
  speaker: string;
  text: string;
  portrait?: string;
};

export type CutsceneProp = {
  id: string;
  assetId: string;
  owner?: string;
  visible: boolean;
};

export type CutsceneEffect = {
  id: string;
  kind: "water-vfx" | "dissolve";
  actor?: string;
  target?: string;
  frame?: number;
  progress: number;
};

export class CutsceneSystem {
  private index = 0;
  private elapsed = 0;
  private moveStart: { x: number; y: number } | null = null;
  actors = new Map<string, SceneActor>();
  props = new Map<string, CutsceneProp>();
  effects = new Map<string, CutsceneEffect>();
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
    if (action.type === "effect") return this.updateEffect(action, dt);
    if (action.type === "fade") return this.updateFade(action, dt);
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
      expression: action.expression ?? actor.expression,
      sprite: action.sprite ?? actor.sprite
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
        color: action.color,
        sprite: action.sprite,
        opacity: action.opacity ?? 1
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
    if (action.type === "sprite") {
      const actor = this.actors.get(action.actor);
      if (actor) this.actors.set(action.actor, { ...actor, sprite: action.sprite });
      return this.nextAction();
    }
    if (action.type === "prop") {
      this.props.set(action.id, { id: action.id, assetId: action.assetId, owner: action.owner, visible: action.visible });
      return this.nextAction();
    }
    if (action.type === "dialogue") {
      this.currentDialogue = { speaker: action.speaker, text: action.text, portrait: action.portrait };
      return;
    }
    if (action.type === "despawn") {
      this.actors.delete(action.actor);
      return this.nextAction();
    }
  }

  private updateEffect(action: Extract<CutsceneAction, { type: "effect" }>, dt: number): void {
    const current = this.effects.get(action.id) ?? { id: action.id, kind: action.kind, actor: action.actor, target: action.target, frame: action.frame, progress: 0 };
    this.elapsed += dt;
    const progress = Math.min(1, this.elapsed / Math.max(0.001, action.duration));
    this.effects.set(action.id, { ...current, progress });
    if (progress >= 1) {
      this.effects.delete(action.id);
      this.nextAction();
    }
  }

  private updateFade(action: Extract<CutsceneAction, { type: "fade" }>, dt: number): void {
    this.elapsed += dt;
    const progress = Math.min(1, this.elapsed / Math.max(0.001, action.duration));
    for (const actorId of action.actors) {
      const actor = this.actors.get(actorId);
      if (actor) this.actors.set(actorId, { ...actor, opacity: 1 - progress });
    }
    if (progress >= 1) this.nextAction();
  }

  private nextAction(): void {
    this.index += 1;
    this.elapsed = 0;
    this.moveStart = null;
  }
}
