import { roomInteractions, type RoomInteraction } from "./MujiRoom.js";
import {
  CAPSULE_TEXT_LIMIT,
  addCapsuleThought,
  drawCapsuleThought,
  keptCapsules,
  loadCapsuleMachineState,
  machineCapsules,
  saveCapsuleMachineState,
  setCapsuleStatus,
  type CapsuleMachineState,
  type CapsuleThought
} from "./CapsuleMachine.js";

type RoomInteractionLike = { id: string };
type CapsuleHost = {
  activateRoomInteraction?: (interaction: RoomInteractionLike) => void;
};

type CapsuleScreen = "main" | "result" | "opened" | "kept";

const interaction = {
  id: "capsule" as never,
  label: "Capsule Machine",
  x: 684,
  y: 450,
  radius: 52
} satisfies RoomInteraction;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function ageCopy(value: string, now = new Date()): string {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(value).getTime()) / 86_400_000));
  if (days === 0) return "You left this here today.";
  if (days === 1) return "You left this here yesterday.";
  return `You left this here ${days} days ago.`;
}

function balls(): string {
  const tones = ["blue", "pink", "yellow", "sage", "lavender"];
  return Array.from({ length: 19 }, (_, index) => `<span class="capsule-ball capsule-ball--${tones[index % tones.length]}" aria-hidden="true"></span>`).join("");
}

function machineMarkup(extraClass = ""): string {
  return `
    <div class="muji-capsule-machine ${extraClass}" aria-hidden="true">
      <div class="muji-capsule-machine__glass">
        <div class="muji-capsule-machine__balls">${balls()}</div>
      </div>
      <div class="muji-capsule-machine__neck"></div>
      <div class="muji-capsule-machine__body">
        <div class="muji-capsule-machine__chute"><span></span></div>
        <div class="muji-capsule-machine__knob"><i></i></div>
      </div>
    </div>`;
}

function mainMarkup(state: CapsuleMachineState, notice = ""): string {
  const count = machineCapsules(state).length;
  const kept = keptCapsules(state).length;
  return `
    <div class="capsule-page capsule-page--main">
      <header class="capsule-header">
        <button class="capsule-icon-button" type="button" data-capsule-action="close" aria-label="Back to Muji Room">←</button>
        <div class="capsule-title-block">
          <span class="capsule-eyebrow">THINGS MUJI KEPT</span>
          <h1>Muji Capsule <em>✦</em></h1>
          <p>Write it down, turn the knob, meet it again.</p>
        </div>
        <button class="capsule-kept-button" type="button" data-capsule-action="kept" aria-label="Open kept capsules">
          <span class="capsule-kept-icon">◒</span>
          <span>Kept</span>
          ${kept ? `<b>${kept}</b>` : ""}
        </button>
      </header>

      <section class="capsule-compose" aria-label="Leave a thought">
        <div class="capsule-mascots" aria-hidden="true">
          <span>◡̈</span><span>•ᴗ•</span><span>˙ᵕ˙</span><span>ᵔᴥᵔ</span><span>⌒‿⌒</span>
        </div>
        <div class="capsule-input-row">
          <span class="capsule-spark">✦</span>
          <textarea maxlength="${CAPSULE_TEXT_LIMIT}" rows="1" data-capsule-input placeholder="What crossed your mind just now?"></textarea>
          <button type="button" data-capsule-action="add" aria-label="Put thought in a capsule">→</button>
        </div>
        <div class="capsule-compose-meta"><span data-capsule-count>0 / ${CAPSULE_TEXT_LIMIT}</span><small>Type a thought, then send it into the machine.</small></div>
      </section>

      <section class="capsule-machine-stage">
        ${notice ? `<div class="capsule-notice" role="status">${escapeHtml(notice)}</div>` : ""}
        ${machineMarkup()}
        <button class="capsule-turn-button" type="button" data-capsule-action="turn" ${count ? "" : "disabled"}>
          <span>↻</span>${count ? "Turn the knob · draw a thought" : "Leave a thought first"}
        </button>
      </section>

      <footer class="capsule-footer">
        <span>${count}</span> ${count === 1 ? "thought is" : "thoughts are"} waiting quietly inside.
      </footer>
    </div>`;
}

function resultMarkup(thought: CapsuleThought): string {
  return `
    <div class="capsule-page capsule-page--result">
      <header class="capsule-simple-header">
        <button class="capsule-icon-button" type="button" data-capsule-action="main" aria-label="Back">←</button>
        <div><span>CAPSULE DRAW</span><h2>A capsule dropped.</h2></div>
      </header>
      <div class="capsule-result-stage">
        ${machineMarkup("is-drawn")}
        <div class="capsule-dropped" aria-hidden="true"><i></i></div>
        <p>Something from another day found its way back.</p>
        <button class="capsule-primary" type="button" data-capsule-action="open">Open it</button>
      </div>
      <span class="capsule-result-id">${escapeHtml(thought.id.slice(-6))}</span>
    </div>`;
}

function openedMarkup(thought: CapsuleThought): string {
  return `
    <div class="capsule-page capsule-page--opened">
      <header class="capsule-simple-header">
        <button class="capsule-icon-button" type="button" data-capsule-action="main" aria-label="Back">←</button>
        <div><span>FROM YOUR PAST SELF</span><h2>Your thought</h2></div>
      </header>
      <div class="capsule-opened-visual" aria-hidden="true"><span></span><i></i></div>
      <article class="capsule-note-card">
        <time>${escapeHtml(formatDate(thought.createdAt))}</time>
        <p>${escapeHtml(thought.text).replace(/\n/g, "<br>")}</p>
        <small>${escapeHtml(ageCopy(thought.createdAt))}</small>
      </article>
      <div class="capsule-open-actions">
        <button type="button" data-capsule-action="put-back"><span>↻</span><strong>Put back</strong><small>Let it surprise you again.</small></button>
        <button type="button" data-capsule-action="keep"><span>♡</span><strong>Keep</strong><small>Move it out of the draw pool.</small></button>
      </div>
    </div>`;
}

function keptMarkup(state: CapsuleMachineState): string {
  const items = keptCapsules(state);
  return `
    <div class="capsule-page capsule-page--kept">
      <header class="capsule-simple-header capsule-simple-header--kept">
        <button class="capsule-icon-button" type="button" data-capsule-action="main" aria-label="Back">←</button>
        <div><span>YOUR LITTLE DRAWER</span><h2>Kept capsules</h2></div>
      </header>
      <p class="capsule-kept-intro">Only the thoughts you chose to keep live here. The ones still in the machine stay hidden.</p>
      <div class="capsule-kept-list">
        ${items.length ? items.map((thought, index) => `
          <article class="capsule-kept-card">
            <span class="capsule-kept-orb capsule-kept-orb--${index % 5}"></span>
            <div><time>${escapeHtml(formatDate(thought.createdAt))}</time><p>${escapeHtml(thought.text).replace(/\n/g, "<br>")}</p></div>
            <button type="button" data-capsule-action="return" data-capsule-id="${escapeHtml(thought.id)}">Return</button>
          </article>`).join("") : `
          <div class="capsule-empty-kept">
            <div>◒</div><strong>Nothing kept yet.</strong><p>When a capsule comes back at the right time, you can keep it here.</p>
          </div>`}
      </div>
    </div>`;
}

function openCapsuleMachine(): void {
  document.querySelector(".capsule-experience")?.remove();
  let state = loadCapsuleMachineState(localStorage);
  let screen: CapsuleScreen = "main";
  let activeThought: CapsuleThought | null = null;
  let timer = 0;

  const shell = document.createElement("section");
  shell.className = "capsule-experience";
  shell.setAttribute("role", "dialog");
  shell.setAttribute("aria-modal", "true");
  shell.setAttribute("aria-label", "Muji Capsule Machine");
  document.body.append(shell);
  document.documentElement.classList.add("capsule-experience-open");

  const persist = (): void => saveCapsuleMachineState(localStorage, state);
  const render = (notice = ""): void => {
    shell.dataset.screen = screen;
    shell.innerHTML = screen === "main"
      ? mainMarkup(state, notice)
      : screen === "result" && activeThought
        ? resultMarkup(activeThought)
        : screen === "opened" && activeThought
          ? openedMarkup(activeThought)
          : keptMarkup(state);
    const input = shell.querySelector<HTMLTextAreaElement>("[data-capsule-input]");
    if (input) requestAnimationFrame(() => input.focus({ preventScroll: true }));
  };

  const close = (): void => {
    window.clearTimeout(timer);
    shell.remove();
    document.documentElement.classList.remove("capsule-experience-open");
    window.removeEventListener("keydown", onKeydown);
  };

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") close();
  };
  window.addEventListener("keydown", onKeydown);

  shell.addEventListener("input", (event) => {
    const target = event.target as HTMLTextAreaElement;
    if (!target.matches("[data-capsule-input]")) return;
    const counter = shell.querySelector<HTMLElement>("[data-capsule-count]");
    if (counter) counter.textContent = `${target.value.length} / ${CAPSULE_TEXT_LIMIT}`;
    target.style.height = "auto";
    target.style.height = `${Math.min(92, target.scrollHeight)}px`;
  });

  shell.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-capsule-action]");
    const action = target?.dataset.capsuleAction;
    if (!action) return;
    if (action === "close") return close();
    if (action === "main") {
      screen = "main";
      activeThought = null;
      render();
      return;
    }
    if (action === "kept") {
      screen = "kept";
      render();
      return;
    }
    if (action === "add") {
      const input = shell.querySelector<HTMLTextAreaElement>("[data-capsule-input]");
      const text = input?.value ?? "";
      const next = addCapsuleThought(state, text);
      if (next === state) {
        input?.focus();
        return;
      }
      state = next;
      persist();
      render("Your thought slipped into a capsule.");
      return;
    }
    if (action === "turn") {
      const result = drawCapsuleThought(state);
      if (!result) return;
      state = result.state;
      activeThought = result.thought;
      persist();
      shell.classList.add("is-turning");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      timer = window.setTimeout(() => {
        shell.classList.remove("is-turning");
        screen = "result";
        render();
      }, reduced ? 80 : 720);
      return;
    }
    if (action === "open" && activeThought) {
      screen = "opened";
      render();
      return;
    }
    if (action === "put-back" && activeThought) {
      state = setCapsuleStatus(state, activeThought.id, "machine");
      persist();
      screen = "main";
      activeThought = null;
      render("Put back. Maybe it will find you another day.");
      return;
    }
    if (action === "keep" && activeThought) {
      state = setCapsuleStatus(state, activeThought.id, "kept");
      persist();
      screen = "kept";
      activeThought = null;
      render();
      return;
    }
    if (action === "return") {
      const id = target.dataset.capsuleId;
      if (!id) return;
      state = setCapsuleStatus(state, id, "machine");
      persist();
      render();
    }
  });

  render();
}

export function installCapsuleMachineBridge(prototype: CapsuleHost): void {
  if (!roomInteractions.some((item) => String(item.id) === "capsule")) roomInteractions.push(interaction);
  const marker = prototype as CapsuleHost & { __capsuleMachineInstalled?: boolean };
  if (marker.__capsuleMachineInstalled) return;
  marker.__capsuleMachineInstalled = true;
  const original = prototype.activateRoomInteraction;
  if (!original) return;
  prototype.activateRoomInteraction = function (interactionItem: RoomInteractionLike): void {
    if (interactionItem.id === "capsule") {
      openCapsuleMachine();
      return;
    }
    original.call(this, interactionItem);
  };
}
