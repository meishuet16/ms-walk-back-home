import type { ActorFacing, SceneActor, SceneActorKind } from "./SceneActorRenderer.js";
import type { DialoguePortrait } from "./PresentationRenderer.js";
import type { Point } from "./CollisionSystem.js";

export type CutsceneSprite = NonNullable<SceneActor["sprite"]>;
export type CutsceneAction =
  | { type: "wait"; duration: number }
  | { type: "spawn"; actor: string; kind: SceneActorKind; x: number; y: number; facing?: ActorFacing; expression?: SceneActor["expression"]; color?: string; label?: string; sprite?: CutsceneSprite; opacity?: number; visualScale?: number }
  | { type: "move"; actor: string; x: number; y: number; duration: number; expression?: SceneActor["expression"]; sprite?: CutsceneSprite; spriteCycle?: CutsceneSprite[]; spriteCycleDuration?: number; facing?: ActorFacing; movementDirection?: ActorFacing; arrivalFacing?: ActorFacing; visualScale?: number; startVisualScale?: number; dialogue?: CutsceneDialogue; dialogueAtProgress?: number }
  | { type: "moveGroup"; duration: number; moves: Array<{ actor: string; x: number; y: number; expression?: SceneActor["expression"]; sprite?: CutsceneSprite; spriteCycle?: CutsceneSprite[]; spriteCycleDuration?: number; facing?: ActorFacing; visualScale?: number; startVisualScale?: number }> }
  | { type: "face"; actor: string; direction: ActorFacing }
  | { type: "expression"; actor: string; value: SceneActor["expression"] }
  | { type: "sprite"; actor: string; sprite: CutsceneSprite; visualScale?: number }
  | { type: "spriteGroup"; states: Array<{ actor: string; sprite: CutsceneSprite; visualScale?: number }> }
  | { type: "prop"; id: string; assetId: string; owner?: string; position?: Point; visible: boolean }
  | { type: "effect"; id: string; kind: "water-vfx" | "dissolve"; actor?: string; target?: string; frame?: number; position?: Point; duration: number }
  | { type: "fade"; actors: string[]; duration: number }
  | { type: "dialogue"; speaker: string; text: string; portrait?: DialoguePortrait }
  | { type: "checkpoint"; id: string }
  | { type: "despawn"; actor: string };

export type CutsceneDialogue = { speaker: string; text: string; portrait?: DialoguePortrait };
export type CutsceneProp = { id: string; assetId: string; owner?: string; position?: Point; visible: boolean };
export type CutsceneEffect = { id: string; kind: "water-vfx" | "dissolve"; actor?: string; target?: string; frame?: number; position?: Point; progress: number };

export class CutsceneSystem {
  private index = 0;
  private elapsed = 0;
  private moveStart: { x: number; y: number } | null = null;
  private moveGroupStart: Map<string, { x: number; y: number }> | null = null;
  private moveDialogueShown = false;
  actors = new Map<string, SceneActor>();
  props = new Map<string, CutsceneProp>();
  effects = new Map<string, CutsceneEffect>();
  currentDialogue: CutsceneDialogue | null = null;
  currentCheckpoint: string | null = null;
  completed = false;

  constructor(private actions: CutsceneAction[]) {}

  update(dt: number): void {
    if (this.completed || this.currentDialogue || this.currentCheckpoint) return;
    const action = this.actions[this.index];
    if (!action) {
      this.completed = true;
      return;
    }
    if (action.type === "wait") return this.updateTimed(action.duration, dt);
    if (action.type === "move") return this.updateMove(action, dt);
    if (action.type === "moveGroup") return this.updateMoveGroup(action, dt);
    if (action.type === "effect") return this.updateEffect(action, dt);
    if (action.type === "fade") return this.updateFade(action, dt);
    this.applyInstant(action);
  }

  advanceDialogue(): void {
    if (!this.currentDialogue) return;
    this.currentDialogue = null;
    if (this.moveDialogueShown) return;
    this.nextAction();
  }

  resolveCheckpoint(): void {
    if (!this.currentCheckpoint) return;
    this.currentCheckpoint = null;
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
    const movementDirection = action.movementDirection ?? action.facing ?? actor.facing;
    const visualScale = action.visualScale === undefined
      ? actor.visualScale
      : (action.startVisualScale ?? actor.visualScale ?? action.visualScale) + (action.visualScale - (action.startVisualScale ?? actor.visualScale ?? action.visualScale)) * t;
    this.actors.set(action.actor, {
      ...actor,
      x: this.moveStart.x + (action.x - this.moveStart.x) * t,
      y: this.moveStart.y + (action.y - this.moveStart.y) * t,
      expression: action.expression ?? actor.expression,
      sprite: this.cycleSprite(action.sprite ?? actor.sprite, action.spriteCycle, action.spriteCycleDuration),
      facing: t >= 1 ? (action.arrivalFacing ?? action.facing ?? actor.facing) : movementDirection,
      visualScale
    });

    if (action.dialogue && !this.moveDialogueShown && t >= (action.dialogueAtProgress ?? 0.25)) {
      this.moveDialogueShown = true;
      this.currentDialogue = action.dialogue;
      return;
    }
    if (t >= 1) this.nextAction();
  }

  private updateMoveGroup(action: Extract<CutsceneAction, { type: "moveGroup" }>, dt: number): void {
    const activeMoves = action.moves.filter((move) => this.actors.has(move.actor));
    if (!activeMoves.length) return this.nextAction();
    this.moveGroupStart ??= new Map(activeMoves.map((move) => {
      const actor = this.actors.get(move.actor)!;
      return [move.actor, { x: actor.x, y: actor.y }];
    }));
    this.elapsed += dt;
    const t = Math.min(1, this.elapsed / Math.max(0.001, action.duration));
    for (const move of activeMoves) {
      const actor = this.actors.get(move.actor);
      const start = this.moveGroupStart.get(move.actor);
      if (!actor || !start) continue;
      const visualScale = move.visualScale === undefined
        ? actor.visualScale
        : (move.startVisualScale ?? actor.visualScale ?? move.visualScale) + (move.visualScale - (move.startVisualScale ?? actor.visualScale ?? move.visualScale)) * t;
      this.actors.set(move.actor, {
        ...actor,
        x: start.x + (move.x - start.x) * t,
        y: start.y + (move.y - start.y) * t,
        expression: move.expression ?? actor.expression,
        sprite: this.cycleSprite(move.sprite ?? actor.sprite, move.spriteCycle, move.spriteCycleDuration),
        facing: move.facing ?? actor.facing,
        visualScale
      });
    }

    if (t >= 1) this.nextAction();
  }

  private cycleSprite(fallback: CutsceneSprite | undefined, cycle: CutsceneSprite[] | undefined, frameDuration = 0.16): CutsceneSprite | undefined {
    if (!cycle?.length) return fallback;
    return cycle[Math.floor(this.elapsed / Math.max(0.01, frameDuration)) % cycle.length];
  }

  private applyInstant(action: Exclude<CutsceneAction, { type: "wait" | "move" | "moveGroup" }>): void {
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
        opacity: action.opacity ?? 1,
        visualScale: action.visualScale ?? 1
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
      if (actor) this.actors.set(action.actor, { ...actor, sprite: action.sprite, visualScale: action.visualScale ?? actor.visualScale });
      return this.nextAction();
    }
    if (action.type === "spriteGroup") {
      for (const state of action.states) {
        const actor = this.actors.get(state.actor);
        if (actor) this.actors.set(state.actor, { ...actor, sprite: state.sprite, visualScale: state.visualScale ?? actor.visualScale });
      }
      return this.nextAction();
    }
    if (action.type === "prop") {
      const prop: CutsceneProp = { id: action.id, assetId: action.assetId, visible: action.visible };
      if (action.owner !== undefined) prop.owner = action.owner;
      if (action.position) prop.position = action.position;
      this.props.set(action.id, prop);
      return this.nextAction();
    }
    if (action.type === "dialogue") {
      this.currentDialogue = { speaker: action.speaker, text: action.text, portrait: action.portrait };
      return;
    }
    if (action.type === "checkpoint") {
      this.currentCheckpoint = action.id;
      return;
    }
    if (action.type === "despawn") {
      this.actors.delete(action.actor);
      return this.nextAction();
    }
  }

  private updateEffect(action: Extract<CutsceneAction, { type: "effect" }>, dt: number): void {
    const current = this.effects.get(action.id) ?? { id: action.id, kind: action.kind, actor: action.actor, target: action.target, frame: action.frame, position: action.position, progress: 0 };
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
    this.moveGroupStart = null;
    this.moveDialogueShown = false;
  }
}
