import type { SceneLayout } from "./SceneLayouts.js";

export type ConstraintDefinition =
  | { id: string; type: "relative-x"; left: string; right: string }
  | { id: string; type: "relative-y"; above: string; below: string }
  | { id: string; type: "shared-baseline"; first: string; second: string; tolerancePx?: number };
export type ConstraintResult = { id: string; type: ConstraintDefinition["type"]; status: "pass" | "fail" | "warning"; message: string; actual?: number; expected?: number };

function point(layout: SceneLayout, id: string): { x: number; y: number } | null {
  return layout.anchors[id] ?? layout.echoAnchors[id] ?? null;
}
export function validateConstraints(layout: SceneLayout, definitions: readonly ConstraintDefinition[]): ConstraintResult[] {
  return definitions.map((definition) => {
    if (definition.type === "relative-x") {
      const left = point(layout, definition.left);
      const right = point(layout, definition.right);
      if (!left || !right) return { id: definition.id, type: definition.type, status: "warning", message: "Missing point reference for " + definition.id + "." };
      const pass = left.x < right.x;
      return { id: definition.id, type: definition.type, status: pass ? "pass" : "fail", message: pass ? definition.left + " is left of " + definition.right + "." : definition.left + " must be left of " + definition.right + ".", actual: right.x - left.x, expected: 0 };
    }
    if (definition.type === "relative-y") {
      const above = point(layout, definition.above);
      const below = point(layout, definition.below);
      if (!above || !below) return { id: definition.id, type: definition.type, status: "warning", message: "Missing point reference for " + definition.id + "." };
      const pass = above.y < below.y;
      return { id: definition.id, type: definition.type, status: pass ? "pass" : "fail", message: pass ? definition.above + " is above " + definition.below + "." : definition.above + " must be above " + definition.below + ".", actual: below.y - above.y, expected: 0 };
    }
    const first = point(layout, definition.first);
    const second = point(layout, definition.second);
    if (!first || !second) return { id: definition.id, type: definition.type, status: "warning", message: "Missing point reference for " + definition.id + "." };
    const actual = Math.abs(first.y - second.y);
    const tolerance = definition.tolerancePx ?? 4;
    const pass = actual <= tolerance;
    return { id: definition.id, type: definition.type, status: pass ? "pass" : "fail", message: pass ? definition.first + " and " + definition.second + " share a baseline." : "Baseline delta " + actual.toFixed(1) + "px exceeds " + tolerance + "px.", actual, expected: tolerance };
  });
}

