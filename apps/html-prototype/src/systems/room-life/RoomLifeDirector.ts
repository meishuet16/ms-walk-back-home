import type { Point } from "../CollisionSystem.js";
import { findRoomLifeEntry, resolveRoomLifeAnchors, roomLifeActivityFor, roomLifeRouteFromNode, roomLifeRouteIsSafe, type RoomLifeActivity, type RoomLifeDestinationId, type RoomLifeNodeId } from "./RoomRoutine.js";
import { selectMujiThought, type MujiThoughtContext } from "./MujiThoughts.js";
import type { SceneLayout } from "../SceneLayouts.js";

export type RoomLifeMode = "player" | "autonomous-idle" | "autonomous-walk" | "autonomous-activity" | "paused";
export type RoomLifeDecision = "do-nothing" | RoomLifeDestinationId;
export type RoomLifeContext = {
  weatherCondition: "clear" | "cloud" | "fog" | "rain" | "snow" | "storm" | null;
  musicPlaying: boolean;
  night: boolean;
  lampOn: boolean;
};
export type RoomLifeUpdate = {
  now: number;
  dt: number;
  position: Point;
  layout: SceneLayout;
  blocked: boolean;
  playerIntent: boolean;
} & RoomLifeContext;
export type RoomLifeFrame = {
  mode: RoomLifeMode;
  movement: Point;
  moving: boolean;
  facing?: RoomLifeFacing;
  destination: RoomLifeDestinationId | null;
  activity: RoomLifeActivity | null;
  thought: string | null;
};
type RoomLifeFacing = "down" | "left" | "right" | "up";

const IDLE_MIN_MS = 8_000;
const IDLE_MAX_MS = 18_000;
const ARRIVAL_DISTANCE = 10;
const STALL_LIMIT_MS = 1_500;
const GRAPH_ENTRY_RETRY_MIN_MS = 3_000;
const GRAPH_ENTRY_RETRY_MAX_MS = 7_000;
const MAX_IDLE_ADJUSTMENT = 18;

export function roomLifeDecisionWeights(context: RoomLifeContext, consecutiveIdleDecisions = 0): Record<RoomLifeDecision, number> {
  const weights: Record<RoomLifeDecision, number> = {
    "do-nothing": 48,
    "life-center": 22,
    "life-window": 13,
    "life-records": 11,
    "life-bedside": 6
  };
  if (context.weatherCondition === "rain" || context.weatherCondition === "storm") weights["life-window"] += 20;
  else if (context.weatherCondition === "cloud" || context.weatherCondition === "fog") weights["life-window"] += 5;
  if (context.musicPlaying) weights["life-records"] += 18;
  if (context.night && context.lampOn) weights["life-bedside"] += 14;
  const adjustment = Math.min(MAX_IDLE_ADJUSTMENT, Math.max(0, consecutiveIdleDecisions - 1) * 6);
  if (adjustment > 0) {
    weights["do-nothing"] -= adjustment;
    weights["life-center"] += Math.ceil(adjustment * 0.5);
    weights["life-window"] += Math.ceil(adjustment * 0.25);
    weights["life-records"] += Math.ceil(adjustment * 0.15);
    weights["life-bedside"] += Math.max(0, adjustment - Math.ceil(adjustment * 0.5) - Math.ceil(adjustment * 0.25) - Math.ceil(adjustment * 0.15));
  }
  return weights;
}

export function chooseRoomLifeDecision(context: RoomLifeContext, random: () => number = Math.random, consecutiveIdleDecisions = 0): RoomLifeDecision {
  const weights = roomLifeDecisionWeights(context, consecutiveIdleDecisions);
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const sampled = random();
  const value = Number.isFinite(sampled) ? Math.max(0, Math.min(0.999999, sampled)) * total : 0;
  let cursor = 0;
  for (const [decision, weight] of Object.entries(weights) as Array<[RoomLifeDecision, number]>) {
    cursor += weight;
    if (value < cursor) return decision;
  }
  return "do-nothing";
}

export class RoomLifeDirector {
  private mode: RoomLifeMode = "player";
  private lastPlayerIntentAt = 0;
  private nextDecisionAt = 0;
  private currentNode: RoomLifeNodeId | null = null;
  private destination: RoomLifeDestinationId | null = null;
  private route: RoomLifeNodeId[] = [];
  private routeIndex = 0;
  private activity: RoomLifeActivity | null = null;
  private activityFacing: RoomLifeFacing | null = null;
  private activityEndsAt = 0;
  private thought: string | null = null;
  private recentThoughts: string[] = [];
  private thoughtExpiresAt = 0;
  private nextThoughtAt = Number.POSITIVE_INFINITY;
  private graphEntryRetryAt = Number.POSITIVE_INFINITY;
  private consecutiveIdleDecisions = 0;
  private lastDistance = Number.POSITIVE_INFINITY;
  private stalledForMs = 0;

  constructor(private readonly options: { random?: () => number } = {}) {}

  reset(now = 0): void {
    this.mode = "player";
    this.lastPlayerIntentAt = now;
    this.nextDecisionAt = now + this.idleDelay();
    this.consecutiveIdleDecisions = 0;
    this.clearAutonomousState();
  }

  onPlayerIntent(now: number): void {
    this.reset(now);
  }

  update(input: RoomLifeUpdate): RoomLifeFrame {
    if (input.playerIntent) this.onPlayerIntent(input.now);
    if (input.blocked) {
      this.mode = "paused";
      this.clearAutonomousState();
      return this.frame();
    }
    if (this.mode === "paused") {
      this.reset(input.now);
      return this.frame();
    }
    if (this.mode === "player") {
      if (input.now - this.lastPlayerIntentAt >= this.idleDelayFromLastIntent()) this.enterAutonomous(input);
      return this.advanceThought(input);
    }
    if (this.mode === "autonomous-walk") return this.updateWalk(input);
    if (this.mode === "autonomous-activity") return this.updateActivity(input);
    if (!this.currentNode && input.now >= this.graphEntryRetryAt) this.tryGraphEntry(input);
    if (input.now >= this.nextDecisionAt) this.makeDecision(input);
    return this.advanceThought(input);
  }

  private enterAutonomous(input: RoomLifeUpdate): void {
    this.mode = "autonomous-idle";
    this.nextDecisionAt = input.now + this.between(2_500, 6_000);
    this.graphEntryRetryAt = input.now;
    this.tryGraphEntry(input);
  }

  private tryGraphEntry(input: RoomLifeUpdate): void {
    this.currentNode = findRoomLifeEntry(input.position, input.layout);
    if (!this.currentNode) {
      this.recordIdleOutcome();
      this.graphEntryRetryAt = input.now + this.between(GRAPH_ENTRY_RETRY_MIN_MS, GRAPH_ENTRY_RETRY_MAX_MS);
      this.nextDecisionAt = Number.POSITIVE_INFINITY;
      this.nextThoughtAt = input.now + this.between(4_000, 7_000);
      return;
    }
    this.graphEntryRetryAt = Number.POSITIVE_INFINITY;
    this.consecutiveIdleDecisions = 0;
    const activity = roomLifeActivityFor(this.currentNode);
    if (activity && isDestination(this.currentNode)) {
      const anchors = resolveRoomLifeAnchors(input.layout);
      this.beginActivity(this.currentNode, input.now, anchors ? facingBetween(input.position, anchors[this.currentNode]) : null);
    }
    else this.nextThoughtAt = input.now + this.between(1_200, 3_000);
  }

  private makeDecision(input: RoomLifeUpdate): void {
    if (!this.currentNode) return;
    const decision = chooseRoomLifeDecision(input, this.options.random ?? Math.random, this.consecutiveIdleDecisions);
    this.nextDecisionAt = input.now + this.between(7_000, 16_000);
    if (decision === "do-nothing") {
      this.recordIdleOutcome();
      this.nextThoughtAt = input.now + this.between(1_500, 4_000);
      return;
    }
    const route = roomLifeRouteFromNode(this.currentNode, decision);
    if (!route || !roomLifeRouteIsSafe(route, input.layout)) {
      this.recordIdleOutcome();
      this.nextThoughtAt = input.now + this.between(1_500, 4_000);
      return;
    }
    this.destination = decision;
    if (route.length <= 1) return this.beginActivity(decision, input.now);
    this.route = route;
    this.routeIndex = 1;
    this.mode = "autonomous-walk";
    this.consecutiveIdleDecisions = 0;
    this.activity = null;
    this.lastDistance = Number.POSITIVE_INFINITY;
    this.stalledForMs = 0;
    this.nextThoughtAt = input.now + this.between(1_000, 2_500);
  }

  private updateWalk(input: RoomLifeUpdate): RoomLifeFrame {
    const anchors = resolveRoomLifeAnchors(input.layout);
    const targetId = this.route[this.routeIndex];
    if (!anchors || !targetId) return this.cancelRoute(input);
    const target = anchors[targetId];
    const distance = Math.hypot(target.x - input.position.x, target.y - input.position.y);
    if (distance <= ARRIVAL_DISTANCE) {
      this.currentNode = targetId;
      this.routeIndex += 1;
      this.lastDistance = Number.POSITIVE_INFINITY;
      this.stalledForMs = 0;
      if (this.routeIndex >= this.route.length) {
        if (this.destination) {
          const previousId = this.route[this.routeIndex - 2];
          this.beginActivity(this.destination, input.now, previousId && anchors[previousId] ? facingBetween(anchors[previousId], target) : null);
        }
        else return this.cancelRoute(input);
      }
      return this.advanceThought(input);
    }
    if (distance >= this.lastDistance - 0.01) this.stalledForMs += input.dt * 1000;
    else this.stalledForMs = 0;
    this.lastDistance = distance;
    if (this.stalledForMs >= STALL_LIMIT_MS) return this.cancelRoute(input);
    return { ...this.advanceThought(input), movement: { x: (target.x - input.position.x) / distance, y: (target.y - input.position.y) / distance }, moving: true };
  }

  private updateActivity(input: RoomLifeUpdate): RoomLifeFrame {
    if (input.now >= this.activityEndsAt) {
      this.mode = "autonomous-idle";
      this.activity = null;
      this.nextDecisionAt = input.now + this.between(2_500, 6_000);
      this.nextThoughtAt = input.now + this.between(1_000, 3_000);
    }
    return this.advanceThought(input);
  }

  private beginActivity(destination: RoomLifeDestinationId, now: number, facing: RoomLifeFacing | null = null): void {
    this.destination = destination;
    this.currentNode = destination;
    this.activity = roomLifeActivityFor(destination);
    this.consecutiveIdleDecisions = 0;
    this.activityFacing = facing ?? defaultFacingForActivity(this.activity);
    this.activityEndsAt = now + this.between(4_000, 11_000);
    this.mode = "autonomous-activity";
    this.route = [];
    this.routeIndex = 0;
    this.nextThoughtAt = now + this.between(1_000, 2_500);
  }

  private cancelRoute(input: RoomLifeUpdate): RoomLifeFrame {
    this.mode = "autonomous-idle";
    this.route = [];
    this.routeIndex = 0;
    this.activity = null;
    this.destination = null;
    this.recordIdleOutcome();
    this.nextDecisionAt = input.now + this.between(3_000, 6_000);
    this.nextThoughtAt = input.now + this.between(1_000, 3_000);
    this.stalledForMs = 0;
    return this.advanceThought(input);
  }

  private advanceThought(input: RoomLifeUpdate): RoomLifeFrame {
    if (this.thought && input.now >= this.thoughtExpiresAt) {
      this.thought = null;
      this.nextThoughtAt = input.now + this.between(4_000, 9_000);
    }
    if (!this.thought && this.mode !== "player" && this.mode !== "paused" && input.now >= this.nextThoughtAt) {
      const selected = selectMujiThought(this.thoughtContext(input), this.options.random ?? Math.random, this.recentThoughts);
      if (selected) {
        this.thought = selected;
        this.recentThoughts = [selected, ...this.recentThoughts].slice(0, 3);
        this.thoughtExpiresAt = input.now + this.between(2_000, 4_000);
        this.nextThoughtAt = Number.POSITIVE_INFINITY;
      } else {
        this.nextThoughtAt = input.now + this.between(4_000, 9_000);
      }
    }
    return this.frame();
  }

  private thoughtContext(input: RoomLifeUpdate): MujiThoughtContext {
    if (this.mode === "autonomous-walk") return "wander";
    if (this.activity === "window-watch") return input.weatherCondition === "rain" || input.weatherCondition === "storm" ? "rain" : "window";
    if (this.activity === "records-listen" && input.musicPlaying) return "records";
    if (this.activity === "bedside-idle") return "bedside";
    return "ambient";
  }

  private frame(): RoomLifeFrame {
    return { mode: this.mode, movement: { x: 0, y: 0 }, moving: false, facing: this.mode === "autonomous-activity" ? this.activityFacing ?? undefined : undefined, destination: this.destination, activity: this.activity, thought: this.mode === "player" || this.mode === "paused" ? null : this.thought };
  }

  private clearAutonomousState(): void {
    this.currentNode = null;
    this.destination = null;
    this.route = [];
    this.routeIndex = 0;
    this.activity = null;
    this.activityFacing = null;
    this.activityEndsAt = 0;
    this.thought = null;
    this.thoughtExpiresAt = 0;
    this.nextThoughtAt = Number.POSITIVE_INFINITY;
    this.graphEntryRetryAt = Number.POSITIVE_INFINITY;
    this.lastDistance = Number.POSITIVE_INFINITY;
    this.stalledForMs = 0;
  }

  private recordIdleOutcome(): void {
    this.consecutiveIdleDecisions = Math.min(5, this.consecutiveIdleDecisions + 1);
  }

  private idleDelayFromLastIntent(): number {
    return Math.max(IDLE_MIN_MS, this.nextDecisionAt - this.lastPlayerIntentAt);
  }

  private idleDelay(): number {
    return this.between(IDLE_MIN_MS, IDLE_MAX_MS);
  }

  private between(min: number, max: number): number {
    const value = this.options.random?.() ?? Math.random();
    const normalized = Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0;
    return min + (max - min) * normalized;
  }
}

function isDestination(node: RoomLifeNodeId): node is RoomLifeDestinationId {
  return roomLifeActivityFor(node) !== null;
}

function facingBetween(from: Point, to: Point): RoomLifeFacing | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.hypot(dx, dy) < 0.01) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
}

function defaultFacingForActivity(activity: RoomLifeActivity | null): RoomLifeFacing {
  if (activity === "window-watch") return "up";
  if (activity === "records-listen") return "right";
  if (activity === "bedside-idle") return "left";
  return "down";
}
