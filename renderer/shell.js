(function () {
  const host = document.getElementById("board-host");
  const menu = document.getElementById("side-menu");
  const backdrop = document.getElementById("menu-backdrop");
  const toggle = document.getElementById("menu-toggle");
  const closeBtn = document.getElementById("menu-close");
  const fileLabel = document.getElementById("file-label");
  const btnLoad = document.getElementById("btn-load");
  const btnSave = document.getElementById("btn-save");
  const btnSaveAs = document.getElementById("btn-save-as");

  function setMenuOpen(open) {
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    backdrop.hidden = !open;
  }

  function currentBoardHtml() {
    const board = host.querySelector("main.emd");
    if (!board) return "";
    return board.outerHTML + "\n";
  }

  function mountBoard(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const board = doc.querySelector("main.emd");
    host.replaceChildren();
    if (board) {
      host.appendChild(document.importNode(board, true));
    } else {
      const fallback = document.createElement("p");
      fallback.style.padding = "2rem";
      fallback.textContent = "This .emd file has no <main class=\"emd\"> board.";
      host.appendChild(fallback);
    }
  }

  function setFileLabel(payload) {
    if (payload.path) {
      fileLabel.textContent = payload.path;
    } else if (payload.title) {
      fileLabel.textContent = `${payload.title} (example)`;
    } else {
      fileLabel.textContent = "No file";
    }
  }

  toggle.addEventListener("click", () => setMenuOpen(!menu.classList.contains("open")));
  closeBtn.addEventListener("click", () => setMenuOpen(false));
  backdrop.addEventListener("click", () => setMenuOpen(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });

  btnLoad.addEventListener("click", async () => {
    setMenuOpen(false);
    await window.emdApi.open();
  });

  btnSave.addEventListener("click", async () => {
    setMenuOpen(false);
    const result = await window.emdApi.save(currentBoardHtml());
    if (result.ok && result.path) fileLabel.textContent = result.path;
  });

  btnSaveAs.addEventListener("click", async () => {
    setMenuOpen(false);
    const result = await window.emdApi.saveAs(currentBoardHtml());
    if (result.ok && result.path) fileLabel.textContent = result.path;
  });

  window.emdApi.onLoaded((payload) => {
    mountBoard(payload.html);
    setFileLabel(payload);
  });
})();
