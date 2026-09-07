(() => {
  const MENU_ID = "capsule-media-source-menu";

  const closeMenu = () => document.getElementById(MENU_ID)?.remove();

  const ensureStyle = () => {
    if (document.getElementById("capsule-media-source-style")) return;
    const style = document.createElement("style");
    style.id = "capsule-media-source-style";
    style.textContent = `
      #${MENU_ID} {
        position: fixed;
        z-index: 10020;
        display: grid;
        gap: 8px;
        width: min(230px, calc(100vw - 28px));
        padding: 10px;
        border: 1px solid rgba(76, 126, 158, .2);
        border-radius: 14px;
        background: rgba(248, 252, 252, .98);
        box-shadow: 0 16px 42px rgba(35, 63, 80, .2);
        backdrop-filter: blur(12px);
      }
      #${MENU_ID} button {
        width: 100%;
        min-height: 46px;
        padding: 9px 12px;
        border: 1px solid rgba(74, 129, 166, .18);
        border-radius: 10px;
        background: rgba(255, 255, 255, .94);
        color: #426985;
        text-align: left;
        font: 600 14px/1.25 system-ui, sans-serif;
      }
      #${MENU_ID} button:active { transform: translateY(1px); }
      #${MENU_ID} .capsule-media-source-icon {
        display: inline-block;
        width: 28px;
        font-size: 18px;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  };

  const capsuleShell = () => document.querySelector(".capsule-experience");
  const capsuleMediaInput = () => capsuleShell()?.querySelector("input[data-capsule-file]:not([data-capsule-capture-file])");

  const openGallery = () => {
    const input = capsuleMediaInput();
    if (!(input instanceof HTMLInputElement)) return;
    input.click();
  };

  const openCapture = (kind) => {
    const shell = capsuleShell();
    if (!(shell instanceof HTMLElement)) return;

    shell.querySelector("input[data-capsule-capture-file]")?.remove();
    const capture = document.createElement("input");
    capture.type = "file";
    capture.accept = kind === "video" ? "video/*" : "image/*";
    capture.setAttribute("capture", "environment");
    capture.setAttribute("data-capsule-file", "");
    capture.setAttribute("data-capsule-capture-file", kind);
    capture.hidden = true;
    capture.addEventListener("change", () => {
      window.setTimeout(() => capture.remove(), 0);
    }, { once: true });
    shell.appendChild(capture);
    capture.click();
  };

  const showMenu = (anchor) => {
    closeMenu();
    ensureStyle();
    const menu = document.createElement("div");
    menu.id = MENU_ID;
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Choose capsule media source");
    menu.innerHTML = `
      <button type="button" data-capsule-media-source="gallery" role="menuitem"><span class="capsule-media-source-icon">▧</span>Choose from Gallery</button>
      <button type="button" data-capsule-media-source="photo" role="menuitem"><span class="capsule-media-source-icon">📷</span>Take Photo</button>
      <button type="button" data-capsule-media-source="video" role="menuitem"><span class="capsule-media-source-icon">🎥</span>Record Video</button>
    `;
    document.body.appendChild(menu);

    const rect = anchor.getBoundingClientRect();
    const menuWidth = Math.min(230, window.innerWidth - 28);
    const left = Math.max(14, Math.min(window.innerWidth - menuWidth - 14, rect.left));
    const preferredTop = rect.top - 170;
    const top = preferredTop >= 14 ? preferredTop : Math.min(window.innerHeight - 184, rect.bottom + 8);
    menu.style.left = `${left}px`;
    menu.style.top = `${Math.max(14, top)}px`;
    menu.querySelector("button")?.focus({ preventScroll: true });
  };

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const source = target.closest("[data-capsule-media-source]");
    if (source) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const choice = source.getAttribute("data-capsule-media-source");
      closeMenu();
      if (choice === "photo") openCapture("image");
      else if (choice === "video") openCapture("video");
      else openGallery();
      return;
    }

    const picker = target.closest('.capsule-experience [data-capsule-action="pick-media"]');
    if (picker) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showMenu(picker);
      return;
    }

    if (!target.closest(`#${MENU_ID}`)) closeMenu();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
})();
