/**
 * Module host for a board page.
 *
 * Discovers ../modules/<id>/module.json via the directory listing and
 * modules/index.json, lists each one in the settings popover, and loads
 * the script for every module that is switched on. A module calls
 * emdModules.register({ id, install, uninstall }) and hooks the generated
 * board itself. This file has no knowledge of any particular module.
 *
 * A module id is off when it is listed in localStorage emd-modules-off.
 * Anything discovered and not listed there is on.
 */
(function () {
  const modulesRoot = new URL("../modules/", document.currentScript.src);
  const OFF_KEY = "emd-modules-off";

  /** @type {Map<string, { id: string, name: string, description: string, main: string, base: URL }>} */
  const metas = new Map();
  /** @type {Map<string, { id: string, install: Function, uninstall?: Function }>} */
  const registered = new Map();
  /** @type {Set<string>} */
  const active = new Set();
  /** @type {Set<string>} */
  const loading = new Set();

  let scan = 0;

  function readOff() {
    try {
      const raw = JSON.parse(localStorage.getItem(OFF_KEY) || "[]");
      return new Set(Array.isArray(raw) ? raw.filter((id) => typeof id === "string") : []);
    } catch (_) {
      return new Set();
    }
  }

  function isEnabled(id) {
    return !readOff().has(id);
  }

  function setEnabled(id, on) {
    const off = readOff();
    if (on) off.delete(id);
    else off.add(id);
    try {
      localStorage.setItem(OFF_KEY, JSON.stringify([...off]));
    } catch (_) {}
  }

  function idsFromListing(html) {
    const ids = [];
    const re = /href="([A-Za-z0-9][^"/?#]*)\/"/g;
    let match;
    while ((match = re.exec(html))) {
      const id = match[1];
      if (id !== "." && id !== ".." && !ids.includes(id)) ids.push(id);
    }
    return ids;
  }

  async function discover() {
    /** @type {string[]} */
    const ids = [];
    function add(id) {
      if (id && !ids.includes(id)) ids.push(id);
    }

    const indexUrl = new URL("index.json", modulesRoot);
    const listing = await Promise.all([
      fetch(indexUrl, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
      fetch(modulesRoot, { cache: "no-store" })
        .then((res) => (res.ok ? res.text() : ""))
        .catch(() => ""),
    ]);

    const index = listing[0];
    const listed = Array.isArray(index) ? index : index && index.modules;
    if (Array.isArray(listed)) listed.forEach((id) => add(String(id)));
    if (listing[1].includes("<a ") || listing[1].includes("<A ")) {
      idsFromListing(listing[1]).forEach(add);
    }

    const found = [];
    for (const id of ids) {
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) continue;
      const base = new URL(encodeURIComponent(id) + "/", modulesRoot);
      let json = null;
      try {
        const res = await fetch(new URL("module.json", base), { cache: "no-store" });
        if (res.ok) json = await res.json();
      } catch (_) {
        json = null;
      }
      if (!json || typeof json !== "object") continue;
      const main = typeof json.main === "string" && json.main ? json.main : "module.js";
      if (!/^[A-Za-z0-9._-]+$/.test(main)) continue;
      found.push({
        id,
        name: typeof json.name === "string" && json.name ? json.name : id,
        description: typeof json.description === "string" ? json.description : "",
        main,
        base,
      });
    }
    return found;
  }

  function ensureFieldset(pop) {
    let fieldset = document.getElementById("emd-modules-fieldset");
    if (fieldset) return fieldset;
    fieldset = document.createElement("fieldset");
    fieldset.id = "emd-modules-fieldset";
    fieldset.className = "emd-settings-fieldset";
    const legend = document.createElement("legend");
    legend.textContent = "Modules";
    const list = document.createElement("div");
    list.id = "emd-modules-list";
    fieldset.append(legend, list);
    fieldset.addEventListener("change", (event) => {
      const input = event.target.closest("input[data-module-id]");
      if (!input) return;
      const id = input.dataset.moduleId;
      const meta = metas.get(id);
      if (!meta) return;
      setEnabled(id, input.checked);
      if (input.checked) loadAndInstall(meta);
      else deactivate(id);
    });
    pop.appendChild(fieldset);
    return fieldset;
  }

  function render(found) {
    const pop = document.getElementById("emd-settings-pop");
    if (!pop) return;
    ensureFieldset(pop);
    const list = document.getElementById("emd-modules-list");
    list.replaceChildren();
    metas.clear();
    if (!found.length) {
      const empty = document.createElement("p");
      empty.className = "emd-modules-empty";
      empty.textContent = "No modules in the modules directory.";
      list.appendChild(empty);
      return;
    }
    for (const meta of found) {
      metas.set(meta.id, meta);
      const label = document.createElement("label");
      label.className = "emd-settings-check";
      if (meta.description) label.title = meta.description;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.moduleId = meta.id;
      input.checked = isEnabled(meta.id);
      label.append(input, document.createTextNode(" " + meta.name));
      list.appendChild(label);
    }
  }

  function activate(mod) {
    if (active.has(mod.id)) return;
    const root = document.querySelector("main.emd");
    if (!root) return;
    mod.install({ root });
    active.add(mod.id);
  }

  function deactivate(id) {
    const mod = registered.get(id);
    if (mod && active.has(id) && typeof mod.uninstall === "function") {
      mod.uninstall();
    }
    active.delete(id);
  }

  function loadAndInstall(meta) {
    if (!isEnabled(meta.id)) return;
    const existing = registered.get(meta.id);
    if (existing) {
      activate(existing);
      return;
    }
    if (loading.has(meta.id)) return;
    loading.add(meta.id);
    const script = document.createElement("script");
    script.src = new URL(meta.main, meta.base).href;
    script.dataset.emdModule = meta.id;
    script.onload = () => {
      loading.delete(meta.id);
      const mod = registered.get(meta.id);
      if (mod && isEnabled(meta.id)) activate(mod);
    };
    script.onerror = () => {
      loading.delete(meta.id);
    };
    document.body.appendChild(script);
  }

  window.emdModules = {
    /**
     * @param {{ id: string, install: Function, uninstall?: Function }} mod
     */
    register(mod) {
      if (!mod || typeof mod.id !== "string" || typeof mod.install !== "function") return;
      registered.set(mod.id, mod);
      if (isEnabled(mod.id)) activate(mod);
    },
  };

  function whenSettings(done) {
    const pop = document.getElementById("emd-settings-pop");
    if (pop) {
      done(pop);
      return;
    }
    const observer = new MutationObserver(() => {
      const found = document.getElementById("emd-settings-pop");
      if (!found) return;
      observer.disconnect();
      done(found);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  async function refresh() {
    const token = ++scan;
    const found = await discover();
    if (token !== scan) return;
    render(found);
    for (const meta of found) {
      if (isEnabled(meta.id)) loadAndInstall(meta);
    }
  }

  const style = document.createElement("style");
  style.textContent =
    "#emd-modules-fieldset { margin-top: 0.85rem; }" +
    ".emd-modules-empty { margin: 0.35rem 0 0; font-size: 0.85rem; color: #444; }";
  document.head.appendChild(style);

  whenSettings(() => {
    refresh();
    const button = document.getElementById("emd-settings-btn");
    if (button) {
      button.addEventListener("click", () => {
        refresh();
      });
    }
  });
})();
