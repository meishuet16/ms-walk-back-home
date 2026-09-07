(() => {
  const MENU_ID = "journal-media-source-menu";
  const CAPTURE_INPUT_ID = "journal-capture-input";

  const ensureStyle = () => {
    if (document.getElementById("journal-media-source-style")) return;
    const style = document.createElement("style");
    style.id = "journal-media-source-style";
    style.textContent = `
      #${MENU_ID} {
        position: fixed;
        z-index: 9800;
        display: grid;
        gap: 8px;
        width: min(230px, calc(100vw - 28px));
        padding: 10px;
        border: 1px solid rgba(116, 82, 48, .22);
        border-radius: 14px;
        background: rgba(255, 250, 238, .98);
        box-shadow: 0 16px 42px rgba(42, 31, 20, .22);
        backdrop-filter: blur(12px);
      }
      #${MENU_ID} button {
        width: 100%;
        min-height: 46px;
        padding: 9px 12px;
        border: 1px solid rgba(116, 82, 48, .16);
        border-radius: 10px;
        background: rgba(247, 237, 215, .9);
        color: #4a3422;
        box-shadow: none;
        text-align: left;
        font: 600 14px/1.25 Georgia, "Times New Roman", serif;
      }
      #${MENU_ID} button:active {
        transform: translateY(1px);
        background: #efdfbd;
      }
      #${MENU_ID} .journal-media-source-icon {
        display: inline-block;
        width: 28px;
        font-size: 18px;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  };

  const closeMenu = () => document.getElementById(MENU_ID)?.remove();
  const journalMediaInput = () => document.querySelector("#diary-mobile-media-input");

  const galleryAccept = (kind) => kind === "video"
    ? "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
    : "image/*";

  const openGallery = (kind) => {
    const input = journalMediaInput();
    if (!(input instanceof HTMLInputElement)) return;
    const previousAccept = input.accept;
    input.accept = galleryAccept(kind);
    input.click();
    window.setTimeout(() => {
      if (input.isConnected) input.accept = previousAccept;
    }, 0);
  };

  const ensureCaptureInput = (kind) => {
    const original = journalMediaInput();
    if (!(original instanceof HTMLInputElement)) return null;

    document.getElementById(CAPTURE_INPUT_ID)?.remove();
    const input = document.createElement("input");
    input.id = CAPTURE_INPUT_ID;
    input.type = "file";
    input.accept = kind === "video" ? "video/*" : "image/*";
    input.setAttribute("capture", "environment");
    input.className = "sr-only";
    input.tabIndex = -1;
    original.parentElement?.appendChild(input);
    return input;
  };

  const forwardCapturedMedia = (capture) => {
    const file = capture.files?.[0];
    const original = journalMediaInput();
    if (!file || !(original instanceof HTMLInputElement)) return;

    try {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      original.files = transfer.files;
      original.dispatchEvent(new Event("change", { bubbles: true }));
    } catch {
      // Keep the capture input inside the Journal DOM so this fallback still
      // bubbles through the app root's existing Journal change listener.
      const originalId = original.id;
      original.id = `${originalId}-gallery`;
      capture.id = originalId;
      capture.dispatchEvent(new Event("change", { bubbles: true }));
      capture.id = CAPTURE_INPUT_ID;
      original.id = originalId;
    }
  };

  const openCapture = (kind) => {
    const capture = ensureCaptureInput(kind);
    if (!(capture instanceof HTMLInputElement)) return;

    capture.value = "";
    capture.onchange = () => {
      forwardCapturedMedia(capture);
      window.setTimeout(() => capture.remove(), 0);
    };
    capture.click();
  };

  const showMenu = (anchor, kind) => {
    closeMenu();
    ensureStyle();
    const menu = document.createElement("div");
    menu.id = MENU_ID;
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", kind === "video" ? "Choose video source" : "Choose photo source");
    menu.innerHTML = kind === "video"
      ? `
        <button type="button" data-journal-media-source="gallery" data-journal-media-kind="video" role="menuitem"><span class="journal-media-source-icon">▧</span>Choose from Gallery</button>
        <button type="button" data-journal-media-source="capture" data-journal-media-kind="video" role="menuitem"><span class="journal-media-source-icon">🎥</span>Record Video</button>
      `
      : `
        <button type="button" data-journal-media-source="gallery" data-journal-media-kind="image" role="menuitem"><span class="journal-media-source-icon">▧</span>Choose from Gallery</button>
        <button type="button" data-journal-media-source="capture" data-journal-media-kind="image" role="menuitem"><span class="journal-media-source-icon">📷</span>Take Photo</button>
      `;
    document.body.appendChild(menu);

    const rect = anchor.getBoundingClientRect();
    const menuWidth = Math.min(230, window.innerWidth - 28);
    const left = Math.max(14, Math.min(window.innerWidth - menuWidth - 14, rect.left));
    const preferredTop = rect.top - 116;
    const top = preferredTop >= 14 ? preferredTop : Math.min(window.innerHeight - 130, rect.bottom + 8);
    menu.style.left = `${left}px`;
    menu.style.top = `${Math.max(14, top)}px`;
    menu.querySelector("button")?.focus({ preventScroll: true });
  };

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const sourceButton = target.closest("[data-journal-media-source]");
    if (sourceButton) {
      event.preventDefault();
      event.stopPropagation();
      const source = sourceButton.getAttribute("data-journal-media-source");
      const kind = sourceButton.getAttribute("data-journal-media-kind") === "video" ? "video" : "image";
      closeMenu();
      if (source === "capture") openCapture(kind);
      else openGallery(kind);
      return;
    }

    const addPhotoButton = target.closest('.mobile-editor-toolbar [data-action="journal-add-inline-media"][aria-label="Add photo"]');
    if (addPhotoButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showMenu(addPhotoButton, "image");
      return;
    }

    const addVideoButton = target.closest('.mobile-editor-toolbar [data-action="journal-add-inline-media"][aria-label="Add video"]');
    if (addVideoButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showMenu(addVideoButton, "video");
      return;
    }

    if (!target.closest(`#${MENU_ID}`)) closeMenu();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
})();
