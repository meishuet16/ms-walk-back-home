(() => {
  const CORE_GAMES = new Set(["2048", "minesweeper", "memory-match", "lights-out"]);
  const GAME_NAMES = {"2048":"2048 / Number Merge", minesweeper:"Minesweeper", "memory-match":"Memory Match", "lights-out":"Lights Out", snake:"Snake", tetris:"Block Drop", "whack-muji":"Whack-a-Muji", "catch-stars":"Catch the Stars", "tic-tac-toe":"Tic-Tac-Toe"};
  let bypassLaunchGate = false;
  let homeSnapshot = "";
  let resultShownFor = "";

  function miniPanel() { return document.querySelector('.toolbox-panel.world-toolbox-tool[data-world-tool="mini-games"]'); }
  function rememberHome(panel) {
    const body = panel?.querySelector('.toolbox-tool-body');
    if (body instanceof HTMLElement && body.querySelector('.mini-games-home')) homeSnapshot = body.innerHTML;
  }
  function restoreHome(panel) {
    const body = panel?.querySelector('.toolbox-tool-body');
    if (!(body instanceof HTMLElement) || !homeSnapshot) return false;
    body.innerHTML = homeSnapshot;
    panel.classList.remove('mini-game-playing', 'mini-game-at-gate');
    resultShownFor = "";
    document.dispatchEvent(new CustomEvent('world-mini-games-home-restored'));
    return true;
  }

  function showLaunchGate(panel, id, isExtra) {
    const body = panel.querySelector('.toolbox-tool-body');
    if (!(body instanceof HTMLElement)) return;
    rememberHome(panel);
    const name = GAME_NAMES[id] || id;
    resultShownFor = "";
    body.innerHTML = `<section class="mini-game-launch-card" data-launch-game="${id}"><button type="button" class="mini-game-only-back" data-refine-games-home>← Games</button><div class="mini-game-launch-screen"><small>MUJI POCKET GAME</small><strong>${name}</strong><span>Ready when you are.</span><button type="button" class="mini-game-start-button" data-refine-start>Start</button></div></section>`;
    panel.classList.add('mini-game-playing', 'mini-game-at-gate');
    body.querySelector('[data-refine-start]')?.addEventListener('click', () => {
      if (!restoreHome(panel)) return;
      const selector = isExtra ? `[data-extra-mini-game="${CSS.escape(id)}"]` : `[data-action="mini-game-select"][data-game="${CSS.escape(id)}"]`;
      const liveSource = panel.querySelector(selector);
      if (!(liveSource instanceof HTMLButtonElement)) return;
      bypassLaunchGate = true;
      liveSource.click();
      queueMicrotask(() => {
        bypassLaunchGate = false;
        decorateActiveGame();
      });
    }, { once:true });
  }

  function activeGameId(screen) {
    if (!(screen instanceof HTMLElement)) return "";
    if (screen.dataset.extraGame) return screen.dataset.extraGame;
    if (screen.classList.contains('game-2048')) return '2048';
    if (screen.classList.contains('minesweeper-screen')) return 'minesweeper';
    if (screen.classList.contains('memory-match-screen')) return 'memory-match';
    if (screen.classList.contains('lights-out-screen')) return 'lights-out';
    return "";
  }

  function resultFor(screen) {
    if (!(screen instanceof HTMLElement)) return null;
    const id = activeGameId(screen);
    const text = screen.textContent || "";
    const statText = screen.querySelector('.extra-game-stats, .mini-game-stats')?.textContent?.replace(/\s+/g, ' ').trim() || "";

    if (id === '2048') {
      if (text.includes('You made 2048.')) return { title:'2048 reached', note:'The little number machine made it.', stats:statText };
      if (text.includes('No more moves.')) return { title:'Round over', note:'No more tiles can move.', stats:statText };
    }
    if (id === 'minesweeper') {
      if (text.includes('Field clear.')) return { title:'Field clear', note:'Every safe square is open.', stats:statText };
      if (text.includes('A mine was found.')) return { title:'Round over', note:'Muji heard a tiny click.', stats:statText };
    }
    if (id === 'memory-match' && text.includes('Every pair found.')) return { title:'All pairs found', note:'Everything found its partner.', stats:statText };
    if (id === 'lights-out' && text.includes('All lights are out.')) return { title:'Lights out', note:'The board is quiet again.', stats:statText };

    if ((id === 'snake' || id === 'tetris') && screen.querySelector('.extra-game-mount.game-finished')) {
      return { title:id === 'snake' ? 'Trail ended' : 'Stack finished', note:id === 'snake' ? 'The little trail bumped into something.' : 'The blocks reached the top.', stats:statText };
    }
    if (id === 'whack-muji' || id === 'catch-stars') {
      const time = Number(screen.querySelector('[data-time]')?.textContent || 1);
      if (time <= 0) return { title:id === 'whack-muji' ? 'Time!' : 'Night finished', note:id === 'whack-muji' ? 'Muji is hiding again.' : 'That was the last falling star.', stats:statText };
    }
    if (id === 'tic-tac-toe') {
      const note = screen.querySelector('.extra-game-note')?.textContent?.trim() || "";
      if (/you win|you won|muji wins|muji won|draw|tie|three in a row|three-in-a-row/i.test(note)) return { title:/you win|you won/i.test(note) ? 'You win' : /muji wins|muji won/i.test(note) ? 'Muji wins' : 'Draw', note, stats:statText };
    }
    return null;
  }

  function showResult(screen, result) {
    if (!(screen instanceof HTMLElement) || screen.querySelector('.mini-game-result-modal')) return;
    const id = activeGameId(screen);
    const token = `${id}:${result.title}:${result.stats}`;
    if (resultShownFor === token) return;
    resultShownFor = token;
    const modal = document.createElement('div');
    modal.className = 'mini-game-result-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', `${GAME_NAMES[id] || id} result`);
    modal.innerHTML = `<div class="mini-game-result-paper"><small>ROUND RESULT</small><strong>${result.title}</strong>${result.stats ? `<span>${result.stats}</span>` : ''}<p>${result.note}</p><div><button type="button" data-result-again>Play again</button><button type="button" data-refine-games-home>Games</button></div></div>`;
    screen.append(modal);
    modal.querySelector('[data-result-again]')?.addEventListener('click', () => {
      modal.remove();
      resultShownFor = "";
      const restart = screen.querySelector('[data-action="mini-2048-restart"], [data-action="mini-minesweeper-restart"], [data-action="mini-memory-restart"], [data-action="mini-lights-out-restart"], [data-extra-restart]');
      if (restart instanceof HTMLButtonElement) restart.click();
    }, { once:true });
  }

  function inspectResult() {
    const panel = miniPanel();
    const screen = panel?.querySelector('.mini-game-screen');
    if (!(screen instanceof HTMLElement)) return;
    const result = resultFor(screen);
    if (result) showResult(screen, result);
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
    if (screen instanceof HTMLElement && !screen.classList.contains('extra-mini-game-screen') && !screen.querySelector(':scope > .core-game-top')) {
      const top = document.createElement('div');
      top.className = 'core-game-top';
      top.innerHTML = '<button type="button" class="mini-game-only-back" data-refine-games-home>← Games</button>';
      screen.prepend(top);
    }
    inspectResult();
  }

  window.addEventListener('click', (event) => {
    if (bypassLaunchGate || !(event.target instanceof Element)) return;
    const extra = event.target.closest('.mini-games-home [data-extra-mini-game]');
    const core = event.target.closest('.mini-games-home [data-action="mini-game-select"][data-game]');
    const source = extra || core;
    if (!(source instanceof HTMLButtonElement)) return;
    const id = extra ? source.dataset.extraMiniGame : source.dataset.game;
    if (!id || (!extra && !CORE_GAMES.has(id))) return;
    const panel = source.closest('.toolbox-panel.world-toolbox-tool');
    if (!(panel instanceof HTMLElement)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showLaunchGate(panel, id, Boolean(extra));
  }, true);

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const homeButton = event.target.closest('[data-refine-games-home]');
    if (homeButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      restoreHome(miniPanel());
      return;
    }
    if (event.target.closest('[data-action^="mini-"], [data-extra-restart]')) resultShownFor = "";
  }, true);

  document.addEventListener('touchmove', (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('.snake-board, .catch-board, .tetris-board')) event.preventDefault();
  }, { passive:false, capture:true });

  // Never observe class attributes here: decorateActiveGame itself toggles classes.
  // Watching them creates a self-triggering MutationObserver loop and freezes the UI.
  const observer = new MutationObserver(() => queueMicrotask(decorateActiveGame));
  const start = () => {
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });
    decorateActiveGame();
    window.setInterval(inspectResult, 300);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
