import type { Choice, DialogueNode, Tendencies } from "../types.js";
import { applyChoice } from "./TendencySystem.js";

export class DialogueSystem {
  index = 0;
  lastResponse = "";
  choices: string[] = [];

  constructor(public nodes: DialogueNode[]) {}

  current(): DialogueNode | null {
    return this.nodes[this.index] ?? null;
  }

  choose(choice: Choice, tendencies: Tendencies): Tendencies {
    this.lastResponse = choice.response;
    this.choices.push(choice.id);
    this.index += 1;
    return applyChoice(tendencies, choice);
  }

  next(): void {
    this.index += 1;
  }

  complete(): boolean {
    return this.index >= this.nodes.length;
  }
}
