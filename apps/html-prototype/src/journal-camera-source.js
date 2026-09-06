(() => {
  const MENU_ID = "journal-image-source-menu";
  const CAMERA_INPUT_ID = "journal-camera-input";

  const ensureStyle = () => {
    if (document.getElementById("journal-image-source-style")) return;
    const style = document.createElement("style");
    style.id = "journal-image-source-style";
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
      #${MENU_ID} .journal-image-source-icon {
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

  const openGallery = () => {
    const input = journalMediaInput();
    if (!(input instanceof HTMLInputElement)) return;
    const previousAccept = input.accept;
    input.accept = "image/*";
    input.click();
    window.setTimeout(() => {
      if (input.isConnected) input.accept = previousAccept;
    }, 0);
  };

  const ensureCameraInput = () => {
    let input = document.getElementById(CAMERA_INPUT_ID);
    if (input instanceof HTMLInputElement) return input;
    input = document.createElement("input");
    input.id = CAMERA_INPUT_ID;
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute("capture", "environment");
    input.className = "sr-only";
    input.tabIndex = -1;
    document.body.appendChild(input);
    return input;
  };

  const forwardCapturedPhoto = (camera) => {
    const file = camera.files?.[0];
    const original = journalMediaInput();
    if (!file || !(original instanceof HTMLInputElement)) return;

    try {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      original.files = transfer.files;
      original.dispatchEvent(new Event("change", { bubbles: true }));
    } catch {
      // Some WebViews can reject assigning FileList. In that case temporarily
      // reuse the Journal input identity and bubble the camera change through
      // the same document-level change handler used by gallery selection.
      const originalId = original.id;
      original.id = `${originalId}-gallery`;
      camera.id = originalId;
      camera.dispatchEvent(new Event("change", { bubbles: true }));
      camera.id = CAMERA_INPUT_ID;
      original.id = originalId;
    }
  };

  const openCamera = () => {
    const original = journalMediaInput();
    const camera = ensureCameraInput();
    if (!(original instanceof HTMLInputElement)) return;

    camera.value = "";
    camera.onchange = () => forwardCapturedPhoto(camera);
    camera.click();
  };

  const showMenu = (anchor) => {
    closeMenu();
    ensureStyle();
    const menu = document.createElement("div");
    menu.id = MENU_ID;
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Choose photo source");
    menu.innerHTML = `
      <button type="button" data-journal-image-source="gallery" role="menuitem"><span class="journal-image-source-icon">▧</span>Choose from Gallery</button>
      <button type="button" data-journal-image-source="camera" role="menuitem"><span class="journal-image-source-icon">📷</span>Take Photo</button>
    `;
    document.body.appendChild(menu);

    const rect = anchor.getBoundingClientRect();
    const menuWidth = Math.min(230, window.innerWidth - 28);
    const left = Math.max(14, Math.min(window.innerWidth - menuWidth - 14, rect.left));
    const preferredTop = rect.top - 116;
    const top = preferredTop >= 14 ? preferredTop : Math.min(window.innerHeight - 116 - 14, rect.bottom + 8);
    menu.style.left = `${left}px`;
    menu.style.top = `${Math.max(14, top)}px`;
    menu.querySelector("button")?.focus({ preventScroll: true });
  };

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const sourceButton = target.closest("[data-journal-image-source]");
    if (sourceButton) {
      event.preventDefault();
      event.stopPropagation();
      const source = sourceButton.getAttribute("data-journal-image-source");
      closeMenu();
      if (source === "camera") openCamera();
      else openGallery();
      return;
    }

    const addPhotoButton = target.closest('.mobile-editor-toolbar [data-action="journal-add-inline-media"][aria-label="Add photo"]');
    if (addPhotoButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showMenu(addPhotoButton);
      return;
    }

    if (!target.closest(`#${MENU_ID}`)) closeMenu();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
})();
