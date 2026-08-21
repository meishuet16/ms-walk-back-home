import { applyChoice } from "./TendencySystem.js";
export class DialogueSystem {
    nodes;
    index = 0;
    lastResponse = "";
    choices = [];
    constructor(nodes) {
        this.nodes = nodes;
    }
    current() {
        return this.nodes[this.index] ?? null;
    }
    choose(choice, tendencies) {
        this.lastResponse = choice.response;
        this.choices.push(choice.id);
        this.index += 1;
        return applyChoice(tendencies, choice);
    }
    next() {
        this.index += 1;
    }
    complete() {
        return this.index >= this.nodes.length;
    }
}
