(() => {
  const CORE_GAMES = new Set(["2048", "minesweeper", "memory-match", "lights-out"]);
  const GAME_NAMES = {"2048":"2048 / Number Merge", minesweeper:"Minesweeper", "memory-match":"Memory Match", "lights-out":"Lights Out", snake:"Snake", tetris:"Block Drop", "whack-muji":"Whack-a-Muji", "catch-stars":"Catch the Stars", "tic-tac-toe":"Tic-Tac-Toe"};
  let bypassLaunchGate = false;
  let homeSnapshot = "";

  function miniPanel() { return document.querySelector('.toolbox-panel.world-toolbox-tool[data-world-tool="mini-games"]'); }
  function rememberHome(panel) {
    const body = panel?.querySelector('.toolbox-tool-body');
    if (body instanceof HTMLElement && body.querySelector('.mini-games-home')) homeSnapshot = body.innerHTML;
  }
  function showLaunchGate(panel, source, id) {
    const body = panel.querySelector('.toolbox-tool-body');
    if (!(body instanceof HTMLElement)) return;
    rememberHome(panel);
    const name = GAME_NAMES[id] || id;
    body.innerHTML = `<section class="mini-game-launch-card" data-launch-game="${id}"><button type="button" class="mini-game-only-back" data-refine-games-home>← Games</button><div class="mini-game-launch-screen"><small>MUJI POCKET GAME</small><strong>${name}</strong><span>Ready when you are.</span><button type="button" class="mini-game-start-button" data-refine-start>Start</button></div></section>`;
    panel.classList.add('mini-game-playing', 'mini-game-at-gate');
    const start = body.querySelector('[data-refine-start]');
    start?.addEventListener('click', () => {
      bypassLaunchGate = true;
      panel.classList.remove('mini-game-at-gate');
      source.click();
      queueMicrotask(() => { bypassLaunchGate = false; decorateActiveGame(); });
    }, { once:true });
  }
  function restoreHome(panel) {
    const body = panel?.querySelector('.toolbox-tool-body');
    if (!(body instanceof HTMLElement) || !homeSnapshot) return;
    body.innerHTML = homeSnapshot;
    panel.classList.remove('mini-game-playing', 'mini-game-at-gate');
    queueMicrotask(() => document.dispatchEvent(new CustomEvent('world-mini-games-home-restored')));
  }
  function decorateActiveGame() {
    const panel = miniPanel();
    if (!(panel instanceof HTMLElement)) return;
    const body = panel.querySelector('.toolbox-tool-body');
    if (!(body instanceof HTMLElement)) return;
    const screen = body.querySelector('.mini-game-screen');
    const home = body.querySelector('.mini-games-home');
    panel.classList.toggle('mini-game-playing', Boolean(screen) || Boolean(body.querySelector('.mini-game-launch-card')));
    if (home) panel.classList.remove('mini-game-playing', 'mini-game-at-gate');
    if (!(screen instanceof HTMLElement) || screen.classList.contains('extra-mini-game-screen')) return;
    if (!screen.querySelector(':scope > .core-game-top')) {
      const top = document.createElement('div');
      top.className = 'core-game-top';
      top.innerHTML = '<button type="button" class="mini-game-only-back" data-refine-games-home>← Games</button>';
      screen.prepend(top);
    }
  }

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const homeButton = event.target.closest('[data-refine-games-home]');
    if (homeButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      restoreHome(miniPanel());
      return;
    }
    if (bypassLaunchGate) return;
    const extra = event.target.closest('.mini-games-home [data-extra-mini-game]');
    const core = event.target.closest('.mini-games-home [data-action="mini-game-select"][data-game]');
    const source = extra || core;
    if (!(source instanceof HTMLButtonElement)) return;
    const id = extra ? source.dataset.extraMiniGame : source.dataset.game;
    if (!id || (!extra && !CORE_GAMES.has(id))) return;
    const panel = source.closest('.toolbox-panel.world-toolbox-tool');
    if (!(panel instanceof HTMLElement)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    showLaunchGate(panel, source, id);
  }, true);

  // Game surfaces own their gestures. Swiping Snake/Catch/Block Drop must never
  // pan or scroll the surrounding page/toolbox.
  document.addEventListener('touchmove', (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('.snake-board, .catch-board, .tetris-board')) event.preventDefault();
  }, { passive:false, capture:true });

  const observer = new MutationObserver(() => queueMicrotask(decorateActiveGame));
  const start = () => { observer.observe(document.body, {childList:true, subtree:true}); decorateActiveGame(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
