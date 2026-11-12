/**
 * Corner tools in the sticky workflow lane: settings (gear) + board help (?).
 * Controls --focus-fade, --tile, and --scale (slice items / --col only); retile via `emd:retile`.
 */
(function () {
  const FADE_KEY = 'emd-focus-fade';
  const TILE_KEY = 'emd-tile';
  const SCALE_KEY = 'emd-scale';
  const FADE_DEFAULT = 0.2;
  const TILE_DEFAULT = 16;
  const TILE_MIN = 8;
  const TILE_MAX = 32;
  const SCALE_DEFAULT = 1;
  const SCALE_MIN = 0.2;
  const SCALE_MAX = 3;

  const GEAR_SVG =
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' +
    '<path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.59.22-1.14.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.22l2.39-.96c.49.41 1.04.72 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.54c.59-.22 1.14-.53 1.63-.94l2.39.96c.25.12.54.02.68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/>' +
    '</svg>';

  function readNum(key, fallback) {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === '') return fallback;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function applyFade(value) {
    const v = clamp(value, 0, 1);
    document.documentElement.style.setProperty('--focus-fade', String(v));
    localStorage.setItem(FADE_KEY, String(v));
    return v;
  }

  function applyTile(px, retile) {
    const v = Math.round(clamp(px, TILE_MIN, TILE_MAX));
    document.documentElement.style.setProperty('--tile', v + 'px');
    localStorage.setItem(TILE_KEY, String(v));
    if (retile) window.dispatchEvent(new Event('emd:retile'));
    return v;
  }

  function applyScale(value, retile) {
    const v = Math.round(clamp(value, SCALE_MIN, SCALE_MAX) * 100) / 100;
    document.documentElement.style.setProperty('--scale', String(v));
    localStorage.setItem(SCALE_KEY, String(v));
    if (retile) window.dispatchEvent(new Event('emd:retile'));
    return v;
  }

  function pct(fade) {
    return Math.round(fade * 100) + '%';
  }

  function scaleLabel(scale) {
    return Math.round(scale * 100) + '%';
  }

  function closePanels(root) {
    root.querySelectorAll('.emd-popover.is-open').forEach((el) => {
      el.classList.remove('is-open');
    });
    root.querySelectorAll('.emd-corner-btn[aria-expanded="true"]').forEach((btn) => {
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  function togglePanel(root, btn, panel) {
    const open = panel.classList.contains('is-open');
    closePanels(root);
    if (!open) {
      panel.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
  }

  function mount() {
    const corner = document.querySelector('.board > .lane:first-child');
    if (!corner || corner.querySelector('.emd-corner-tools')) return;

    const fade0 = applyFade(readNum(FADE_KEY, FADE_DEFAULT));
    const tile0 = applyTile(readNum(TILE_KEY, TILE_DEFAULT), false);
    const scale0 = applyScale(readNum(SCALE_KEY, SCALE_DEFAULT), false);

    corner.removeAttribute('aria-hidden');
    corner.classList.add('emd-corner');
    corner.innerHTML =
      '<div class="emd-corner-tools">' +
      '<button type="button" class="emd-corner-btn" id="emd-settings-btn" aria-expanded="false" aria-controls="emd-settings-pop" title="Settings">' +
      GEAR_SVG +
      '<span class="visually-hidden">Settings</span>' +
      '</button>' +
      '<button type="button" class="emd-corner-btn" id="emd-help-btn" aria-expanded="false" aria-controls="emd-help-pop" title="About this board">?</button>' +
      '</div>' +
      '<div class="emd-popover" id="emd-settings-pop" role="dialog" aria-label="Diagram settings">' +
      '<h2>Settings</h2>' +
      '<label class="emd-settings-field">' +
      '<span class="emd-settings-label">Scale items <output id="emd-scale-out">' +
      scaleLabel(scale0) +
      '</output></span>' +
      '<input id="emd-scale" type="range" min="' +
      Math.round(SCALE_MIN * 100) +
      '" max="' +
      Math.round(SCALE_MAX * 100) +
      '" step="5" value="' +
      Math.round(scale0 * 100) +
      '">' +
      '</label>' +
      '<label class="emd-settings-field">' +
      '<span class="emd-settings-label">Fade opacity <output id="emd-fade-out">' +
      pct(fade0) +
      '</output></span>' +
      '<input id="emd-fade" type="range" min="0" max="100" step="1" value="' +
      Math.round(fade0 * 100) +
      '">' +
      '</label>' +
      '<label class="emd-settings-field">' +
      '<span class="emd-settings-label">Connector tiles <output id="emd-tile-out">' +
      tile0 +
      'px</output></span>' +
      '<input id="emd-tile" type="range" min="' +
      TILE_MIN +
      '" max="' +
      TILE_MAX +
      '" step="1" value="' +
      tile0 +
      '">' +
      '</label>' +
      '</div>' +
      '<div class="emd-popover emd-help-pop" id="emd-help-pop" role="dialog" aria-label="About this board">' +
      '<h2>About this board</h2>' +
      '<ul>' +
      '<li><strong>Workflow</strong> (top blue arrow) is the story left to right. Each column is one slice (<strong>SLC</strong>).</li>' +
      '<li><strong>UBA</strong> — actors and their screens (<strong>SCR</strong>).</li>' +
      '<li><strong>MBA</strong> — commands (<strong>COM</strong>, blue) and read models (<strong>RMO</strong>, green).</li>' +
      '<li><strong>LBA</strong> — events (<strong>EVT</strong>, orange) the system recorded.</li>' +
      '<li>Arrows are the data flow: screen → command → event, then event → read model → screen.</li>' +
      '<li>Hover any card or connector to keep that path lit and fade the rest. Use the gear to tune scale, fade, and connector tile size.</li>' +
      '</ul>' +
      '</div>';

    const settingsBtn = corner.querySelector('#emd-settings-btn');
    const helpBtn = corner.querySelector('#emd-help-btn');
    const settingsPop = corner.querySelector('#emd-settings-pop');
    const helpPop = corner.querySelector('#emd-help-pop');
    const scaleInput = corner.querySelector('#emd-scale');
    const scaleOut = corner.querySelector('#emd-scale-out');
    const fadeInput = corner.querySelector('#emd-fade');
    const fadeOut = corner.querySelector('#emd-fade-out');
    const tileInput = corner.querySelector('#emd-tile');
    const tileOut = corner.querySelector('#emd-tile-out');

    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel(corner, settingsBtn, settingsPop);
    });
    helpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel(corner, helpBtn, helpPop);
    });

    let scaleTimer = 0;
    scaleInput.addEventListener('input', () => {
      const v = applyScale(parseInt(scaleInput.value, 10) / 100, false);
      scaleOut.textContent = scaleLabel(v);
      clearTimeout(scaleTimer);
      scaleTimer = setTimeout(() => window.dispatchEvent(new Event('emd:retile')), 60);
    });

    fadeInput.addEventListener('input', () => {
      fadeOut.textContent = pct(applyFade(parseInt(fadeInput.value, 10) / 100));
    });

    let tileTimer = 0;
    tileInput.addEventListener('input', () => {
      const v = applyTile(parseInt(tileInput.value, 10), false);
      tileOut.textContent = v + 'px';
      clearTimeout(tileTimer);
      tileTimer = setTimeout(() => window.dispatchEvent(new Event('emd:retile')), 60);
    });

    document.addEventListener('click', (e) => {
      if (!corner.contains(e.target)) closePanels(corner);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePanels(corner);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
