(() => {
  const STORAGE_KEY = "walk-home-mini-games-extra-v1";
  const EXTRA_GAMES = [
    ["snake", "⌁", "Snake", "Guide the little trail and collect snacks."],
    ["tetris", "▤", "Block Drop", "Fit falling blocks into quiet rows."],
    ["whack-muji", "✦", "Whack-a-Muji", "Tap Muji when they pop out to say hello."],
    ["catch-stars", "☆", "Catch the Stars", "Muji pushes a tiny box under falling stars."],
    ["tic-tac-toe", "○×", "Tic-Tac-Toe", "A small three-in-a-row match with Muji."]
  ];

  let activeCleanup = null;
  let homeSnapshot = "";
  const loadScores = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; } catch { return {}; }
  };
  const saveBest = (key, value, mode = "max") => {
    const scores = loadScores();
    const old = Number(scores[key] || 0);
    scores[key] = mode === "min" && old ? Math.min(old, value) : Math.max(old, value);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(scores)); } catch {}
    return scores[key];
  };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const mujiImg = (className = "") => `<img class="extra-muji-sprite ${className}" src="assets/muji-sheet-v2/muji-01.png" alt="Muji">`;

  function enhanceHome(root) {
    const home = root.querySelector(".mini-games-home");
    const grid = home?.querySelector(".mini-games-grid");
    if (!(home instanceof HTMLElement) || !(grid instanceof HTMLElement) || grid.dataset.extraGames === "ready") return;
    grid.dataset.extraGames = "ready";
    EXTRA_GAMES.forEach(([id, icon, name, description]) => {
      const button = document.createElement("button");
      button.className = `mini-game-card extra-mini-game-card extra-${id}-card`;
      button.type = "button";
      button.dataset.extraMiniGame = id;
      button.innerHTML = `<span class="mini-game-card-icon" aria-hidden="true">${icon}</span><strong>${name}</strong><small>${description}</small>`;
      grid.append(button);
    });
    const intro = home.querySelector(".mini-games-intro");
    if (intro) intro.textContent = "Nine tiny cartridges for a quiet pause.";
  }

  function showGame(id, root) {
    if (activeCleanup) activeCleanup();
    activeCleanup = null;
    const body = root.querySelector(".toolbox-tool-body");
    if (!(body instanceof HTMLElement)) return;
    if (!homeSnapshot && body.querySelector(".mini-games-home")) homeSnapshot = body.innerHTML;
    body.innerHTML = `<div class="world-tool-workbench-label"><span>Pocket console</span><small>picked from the toolbox</small></div><section class="mini-game-screen extra-mini-game-screen" data-extra-game="${id}"><div class="extra-game-top"><button type="button" data-extra-game-home>← Games</button><strong>${escapeHtml(EXTRA_GAMES.find((game) => game[0] === id)?.[2] || id)}</strong></div><div class="extra-game-mount"></div></section>`;
    const mount = body.querySelector(".extra-game-mount");
    if (!(mount instanceof HTMLElement)) return;
    if (id === "snake") activeCleanup = mountSnake(mount);
    else if (id === "tetris") activeCleanup = mountTetris(mount);
    else if (id === "whack-muji") activeCleanup = mountWhack(mount);
    else if (id === "catch-stars") activeCleanup = mountCatch(mount);
    else activeCleanup = mountTicTacToe(mount);
  }

  function restoreHome(root) {
    if (activeCleanup) activeCleanup();
    activeCleanup = null;
    const body = root.querySelector(".toolbox-tool-body");
    if (!(body instanceof HTMLElement) || !homeSnapshot) return;
    body.innerHTML = homeSnapshot;
    queueMicrotask(() => enhanceHome(root));
  }

  function mountSnake(mount) {
    const scores = loadScores();
    mount.innerHTML = `<div class="extra-game-stats"><span>Snack <b data-score>0</b></span><span>Best <b>${scores.snake || 0}</b></span></div><div class="snake-board" tabindex="0" aria-label="Snake board"></div><p class="extra-game-note">Swipe or use the arrows. Don’t bump the edge.</p><div class="extra-dpad"><i></i><button data-dir="up">▲</button><i></i><button data-dir="left">◀</button><button data-dir="down">▼</button><button data-dir="right">▶</button></div><button class="extra-restart" data-extra-restart>New round</button>`;
    const board = mount.querySelector(".snake-board");
    const scoreEl = mount.querySelector("[data-score]");
    let snake, food, dir, timer, score;
    const cells = Array.from({length: 144}, (_, i) => { const el = document.createElement("i"); el.dataset.cell = String(i); board.append(el); return el; });
    const xy = (i) => [i % 12, Math.floor(i / 12)];
    const index = (x,y) => y * 12 + x;
    function reset() {
      snake = [77,76,75]; food = 42; dir = [1,0]; score = 0; scoreEl.textContent = "0"; clearInterval(timer); timer = setInterval(step, 150); draw(); board.focus({preventScroll:true});
    }
    function newFood() { const free = cells.map((_,i)=>i).filter(i=>!snake.includes(i)); food = free[Math.floor(Math.random()*free.length)] ?? 0; }
    function draw() { cells.forEach((el,i)=> { el.className = snake.includes(i) ? (i===snake[0] ? "snake-head" : "snake-body") : i===food ? "snake-food" : ""; }); }
    function step() {
      const [x,y] = xy(snake[0]); const nx=x+dir[0], ny=y+dir[1];
      if(nx<0||nx>=12||ny<0||ny>=12){ clearInterval(timer); mount.classList.add("game-finished"); return; }
      const head=index(nx,ny); if(snake.includes(head)){ clearInterval(timer); mount.classList.add("game-finished"); return; }
      snake.unshift(head); if(head===food){ score++; scoreEl.textContent=String(score); saveBest("snake",score); newFood(); } else snake.pop(); draw();
    }
    function setDir(name){ const next={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[name]; if(!next||next[0]===-dir[0]&&next[1]===-dir[1])return; dir=next; }
    const onKey=(e)=>{ const map={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right"}; if(map[e.key]){e.preventDefault();setDir(map[e.key]);}};
    mount.addEventListener("keydown",onKey); mount.addEventListener("click",e=>{ const b=e.target.closest("[data-dir]"); if(b)setDir(b.dataset.dir); if(e.target.closest("[data-extra-restart]")){mount.classList.remove("game-finished");reset();}});
    let sx=0,sy=0; board.addEventListener("touchstart",e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true}); board.addEventListener("touchend",e=>{const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))>24)setDir(Math.abs(dx)>Math.abs(dy)?dx>0?"right":"left":dy>0?"down":"up");},{passive:true});
    reset(); return ()=>clearInterval(timer);
  }

  function mountTetris(mount) {
    const scores=loadScores();
    mount.innerHTML=`<div class="extra-game-stats"><span>Lines <b data-lines>0</b></span><span>Best <b>${scores.tetris || 0}</b></span></div><div class="tetris-board" tabindex="0" aria-label="Block Drop board"></div><p class="extra-game-note">Fit the pieces into full rows.</p><div class="extra-dpad block-controls"><button data-tetris="left">◀</button><button data-tetris="rotate">↻</button><button data-tetris="right">▶</button><button data-tetris="down">▼</button></div><button class="extra-restart" data-extra-restart>New stack</button>`;
    const boardEl=mount.querySelector(".tetris-board"), lineEl=mount.querySelector("[data-lines]");
    const cells=Array.from({length:200},()=>{const i=document.createElement("i");boardEl.append(i);return i;});
    const SHAPES=[[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[3,0]],[[1,0],[0,1],[1,1],[2,1]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[1,0],[1,1],[2,1]]];
    let grid,piece,timer,lines;
    const spawn=()=>({shape:SHAPES[Math.floor(Math.random()*SHAPES.length)].map(p=>[...p]),x:3,y:0});
    const points=(p=piece)=>p.shape.map(([x,y])=>[x+p.x,y+p.y]);
    const valid=(p)=>points(p).every(([x,y])=>x>=0&&x<10&&y>=0&&y<20&&!grid[y][x]);
    function draw(){ cells.forEach((el,i)=>{const x=i%10,y=Math.floor(i/10);el.className=grid[y][x]?"filled":"";}); points().forEach(([x,y])=>{if(y>=0&&y<20)cells[y*10+x].className="active";}); }
    function move(dx,dy){const p={...piece,x:piece.x+dx,y:piece.y+dy};if(valid(p)){piece=p;draw();return true;}return false;}
    function rotate(){const s=piece.shape.map(([x,y])=>[-y,x]);const minX=Math.min(...s.map(p=>p[0])),minY=Math.min(...s.map(p=>p[1]));const p={...piece,shape:s.map(([x,y])=>[x-minX,y-minY])};if(valid(p)){piece=p;draw();}}
    function tick(){ if(move(0,1))return; points().forEach(([x,y])=>{if(y>=0)grid[y][x]=1;}); const before=grid.length;grid=grid.filter(row=>row.some(v=>!v));const cleared=before-grid.length;while(grid.length<20)grid.unshift(Array(10).fill(0));if(cleared){lines+=cleared;lineEl.textContent=String(lines);saveBest("tetris",lines);}piece=spawn();if(!valid(piece)){clearInterval(timer);mount.classList.add("game-finished");}draw(); }
    function reset(){grid=Array.from({length:20},()=>Array(10).fill(0));piece=spawn();lines=0;lineEl.textContent="0";mount.classList.remove("game-finished");clearInterval(timer);timer=setInterval(tick,540);draw();boardEl.focus({preventScroll:true});}
    const act=(a)=>a==="left"?move(-1,0):a==="right"?move(1,0):a==="down"?move(0,1):rotate();
    mount.addEventListener("click",e=>{const b=e.target.closest("[data-tetris]");if(b)act(b.dataset.tetris);if(e.target.closest("[data-extra-restart]"))reset();});
    mount.addEventListener("keydown",e=>{const map={ArrowLeft:"left",ArrowRight:"right",ArrowDown:"down",ArrowUp:"rotate"," ":"rotate"};if(map[e.key]){e.preventDefault();act(map[e.key]);}});
    reset(); return ()=>clearInterval(timer);
  }

  function mountWhack(mount) {
    const scores=loadScores();
    mount.innerHTML=`<div class="extra-game-stats"><span>Hi! <b data-score>0</b></span><span>Best <b>${scores.whack || 0}</b></span><span>Time <b data-time>30</b>s</span></div><div class="whack-board">${Array.from({length:9},(_,i)=>`<button class="muji-hole" data-hole="${i}" aria-label="Whack spot ${i+1}"><span>${mujiImg("whack-muji")}</span></button>`).join("")}</div><p class="extra-game-note">Muji keeps popping up. Tap gently.</p><button class="extra-restart" data-extra-restart>Play again</button>`;
    let score=0,time=30,active=-1,popTimer,countTimer;const scoreEl=mount.querySelector("[data-score]"),timeEl=mount.querySelector("[data-time]");
    function pop(){mount.querySelectorAll(".muji-hole").forEach(b=>b.classList.remove("up"));active=Math.floor(Math.random()*9);mount.querySelector(`[data-hole='${active}']`)?.classList.add("up");}
    function reset(){score=0;time=30;scoreEl.textContent="0";timeEl.textContent="30";clearInterval(popTimer);clearInterval(countTimer);popTimer=setInterval(pop,650);countTimer=setInterval(()=>{time--;timeEl.textContent=String(time);if(time<=0){clearInterval(popTimer);clearInterval(countTimer);mount.querySelectorAll(".muji-hole").forEach(b=>b.classList.remove("up"));saveBest("whack",score);}},1000);pop();}
    mount.addEventListener("click",e=>{const hole=e.target.closest(".muji-hole");if(hole&&hole.classList.contains("up")){score++;scoreEl.textContent=String(score);hole.classList.remove("up");active=-1;}if(e.target.closest("[data-extra-restart]"))reset();});reset();return()=>{clearInterval(popTimer);clearInterval(countTimer);};
  }

  function mountCatch(mount) {
    const scores=loadScores();
    mount.innerHTML=`<div class="extra-game-stats"><span>Stars <b data-score>0</b></span><span>Best <b>${scores.catch || 0}</b></span><span>Time <b data-time>30</b>s</span></div><div class="catch-board" tabindex="0"><div class="catch-muji">${mujiImg("catch-muji-img")}<span class="catch-box">□</span></div></div><p class="extra-game-note">Move Muji and the little box under each star.</p><div class="catch-controls"><button data-catch="left">◀</button><button data-catch="right">▶</button></div><button class="extra-restart" data-extra-restart>Catch again</button>`;
    const board=mount.querySelector(".catch-board"),hero=mount.querySelector(".catch-muji"),scoreEl=mount.querySelector("[data-score]"),timeEl=mount.querySelector("[data-time]");let x=50,score=0,time=30,stars=[],anim,countTimer,last=0;
    function spawn(){const s=document.createElement("i");s.className="falling-star";s.textContent="✦";const star={el:s,x:8+Math.random()*84,y:-5,speed:.045+Math.random()*.03};s.style.left=`${star.x}%`;board.append(s);stars.push(star);}
    function move(dx){x=Math.max(8,Math.min(92,x+dx));hero.style.left=`${x}%`;}
    function frame(ts){const dt=Math.min(40,ts-last||16);last=ts;if(Math.random()<dt/760)spawn();stars.forEach(st=>{st.y+=st.speed*dt;st.el.style.top=`${st.y}%`;if(st.y>80&&st.y<94&&Math.abs(st.x-x)<11){score++;scoreEl.textContent=String(score);saveBest("catch",score);st.y=110;} });stars.filter(st=>st.y>105).forEach(st=>st.el.remove());stars=stars.filter(st=>st.y<=105);anim=requestAnimationFrame(frame);}
    function reset(){stars.forEach(s=>s.el.remove());stars=[];x=50;score=0;time=30;scoreEl.textContent="0";timeEl.textContent="30";hero.style.left="50%";cancelAnimationFrame(anim);clearInterval(countTimer);last=0;anim=requestAnimationFrame(frame);countTimer=setInterval(()=>{time--;timeEl.textContent=String(time);if(time<=0){clearInterval(countTimer);cancelAnimationFrame(anim);saveBest("catch",score);}},1000);board.focus({preventScroll:true});}
    mount.addEventListener("click",e=>{const b=e.target.closest("[data-catch]");if(b)move(b.dataset.catch==="left"?-10:10);if(e.target.closest("[data-extra-restart]"))reset();});mount.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();move(e.key==="ArrowLeft"?-8:8);}});let sx=0;board.addEventListener("touchstart",e=>sx=e.touches[0].clientX,{passive:true});board.addEventListener("touchmove",e=>{const rect=board.getBoundingClientRect();x=Math.max(8,Math.min(92,(e.touches[0].clientX-rect.left)/rect.width*100));hero.style.left=`${x}%`;},{passive:true});reset();return()=>{cancelAnimationFrame(anim);clearInterval(countTimer);};
  }

  function mountTicTacToe(mount) {
    const scores=loadScores();
    mount.innerHTML=`<div class="extra-game-stats"><span>You <b>${scores.tttWins||0}</b></span><span>Muji <b>${scores.tttMuji||0}</b></span></div><div class="ttt-players"><span>YOU · ✦</span>${mujiImg("ttt-muji")}<span>MUJI · ○</span></div><div class="ttt-board">${Array.from({length:9},(_,i)=>`<button data-ttt="${i}" aria-label="Tic tac toe square ${i+1}"></button>`).join("")}</div><p class="extra-game-note" data-ttt-note>Your turn. Make a little line.</p><button class="extra-restart" data-extra-restart>New match</button>`;
    let board=Array(9).fill(""),over=false;const buttons=[...mount.querySelectorAll("[data-ttt]")],note=mount.querySelector("[data-ttt-note]");const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];const win=p=>lines.some(l=>l.every(i=>board[i]===p));
    function draw(){buttons.forEach((b,i)=>{b.textContent=board[i]==="X"?"✦":board[i]==="O"?"○":"";b.className=board[i]?`mark-${board[i]}`:"";});}
    function finish(){if(win("X")){note.textContent="You made the line. Muji looks impressed.";saveBest("tttWins",(loadScores().tttWins||0)+1);over=true;}else if(win("O")){note.textContent="Muji got this one. Tiny victory dance.";saveBest("tttMuji",(loadScores().tttMuji||0)+1);over=true;}else if(board.every(Boolean)){note.textContent="A draw. Very diplomatic.";over=true;}return over;}
    function mujiMove(){const free=board.map((v,i)=>v?null:i).filter(v=>v!==null);if(!free.length)return;let pick=free.find(i=>{const c=[...board];c[i]="O";return lines.some(l=>l.every(j=>c[j]==="O"));});if(pick===undefined)pick=free.find(i=>{const c=[...board];c[i]="X";return lines.some(l=>l.every(j=>c[j]==="X"));});if(pick===undefined&&free.includes(4))pick=4;if(pick===undefined)pick=free[Math.floor(Math.random()*free.length)];board[pick]="O";draw();finish();if(!over)note.textContent="Your turn.";}
    function reset(){board=Array(9).fill("");over=false;note.textContent="Your turn. Make a little line.";draw();}
    mount.addEventListener("click",e=>{const b=e.target.closest("[data-ttt]");if(b&&!over){const i=Number(b.dataset.ttt);if(!board[i]){board[i]="X";draw();if(!finish()){note.textContent="Muji is thinking…";setTimeout(()=>{if(mount.isConnected&&!over)mujiMove();},240);}}}if(e.target.closest("[data-extra-restart]"))reset();});return()=>{};
  }

  document.addEventListener("click", (event) => {
    const card = event.target instanceof Element ? event.target.closest("[data-extra-mini-game]") : null;
    if (card instanceof HTMLElement) {
      event.preventDefault(); event.stopPropagation();
      const root = card.closest(".toolbox-panel.world-toolbox-tool[data-world-tool='mini-games']");
      if (root instanceof HTMLElement) showGame(card.dataset.extraMiniGame, root);
      return;
    }
    const home = event.target instanceof Element ? event.target.closest("[data-extra-game-home]") : null;
    if (home) {
      event.preventDefault(); event.stopPropagation();
      const root = home.closest(".toolbox-panel.world-toolbox-tool[data-world-tool='mini-games']");
      if (root instanceof HTMLElement) restoreHome(root);
    }
  }, true);

  const observer = new MutationObserver(() => {
    document.querySelectorAll(".toolbox-panel.world-toolbox-tool[data-world-tool='mini-games']").forEach(enhanceHome);
    if (activeCleanup && !document.querySelector(".extra-mini-game-screen")) { activeCleanup(); activeCleanup = null; homeSnapshot = ""; }
  });
  const start = () => { document.querySelectorAll(".toolbox-panel.world-toolbox-tool[data-world-tool='mini-games']").forEach(enhanceHome); observer.observe(document.body,{childList:true,subtree:true}); };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
