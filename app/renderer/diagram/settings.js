/**
 * Corner tools in the sticky workflow lane: settings (gear) + board help (?).
 * Controls --focus-fade, --tile, and --scale (slice items / --col only); retile via `emd:retile`.
 */
(function () {
  const FADE_KEY = 'emd-focus-fade';
  const TILE_KEY = 'emd-tile';
  const SCALE_KEY = 'emd-scale';
  const HOVER_CONNECTORS_KEY = 'emd-hover-connectors';
  const HOVER_VALUES_KEY = 'emd-hover-values';
  const HOVER_CARDS_KEY = 'emd-hover-cards';
  const HOVER_DELAY_KEY = 'emd-hover-delay';
  const FADE_DEFAULT = 0.2;
  const TILE_DEFAULT = 16;
  const TILE_MIN = 8;
  const TILE_MAX = 32;
  const SCALE_DEFAULT = 1;
  const SCALE_MIN = 0.2;
  const SCALE_MAX = 3;
  const HOVER_DELAY_DEFAULT = 0.2;
  const HOVER_DELAY_MIN = 0;
  const HOVER_DELAY_MAX = 5;

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

  function readBool(key, fallback) {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === '') return fallback;
    if (raw === '0' || raw === 'false') return false;
    if (raw === '1' || raw === 'true') return true;
    return fallback;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function applyHoverPref(key, datasetKey, on) {
    const v = !!on;
    localStorage.setItem(key, v ? '1' : '0');
    document.documentElement.dataset[datasetKey] = v ? '1' : '0';
    window.dispatchEvent(new Event('emd:hover-prefs'));
    return v;
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

  /** Seconds before hover highlight paints; 0 = immediate. */
  function applyHoverDelay(seconds) {
    const v = Math.round(clamp(seconds, HOVER_DELAY_MIN, HOVER_DELAY_MAX) * 10) / 10;
    const ms = Math.round(v * 1000);
    document.documentElement.dataset.emdHoverDelayMs = String(ms);
    localStorage.setItem(HOVER_DELAY_KEY, String(v));
    return v;
  }

  function pct(fade) {
    return Math.round(fade * 100) + '%';
  }

  function delayLabel(seconds) {
    if (seconds <= 0) return 'off';
    return seconds.toFixed(1).replace(/\.0$/, '') + 's';
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
    // Drop abandoned scroll-lerp experiment (fought trackpad momentum).
    try {
      localStorage.removeItem('emd-scroll-lerp');
    } catch (_) {}

    const corner = document.querySelector('.board > .lane:first-child');
    if (!corner || corner.querySelector('.emd-corner-tools')) return;

    const fade0 = applyFade(readNum(FADE_KEY, FADE_DEFAULT));
    const tile0 = applyTile(readNum(TILE_KEY, TILE_DEFAULT), false);
    const scale0 = applyScale(readNum(SCALE_KEY, SCALE_DEFAULT), false);
    const hoverConnectors0 = applyHoverPref(
      HOVER_CONNECTORS_KEY,
      'emdHoverConnectors',
      readBool(HOVER_CONNECTORS_KEY, true)
    );
    const hoverValues0 = applyHoverPref(
      HOVER_VALUES_KEY,
      'emdHoverValues',
      readBool(HOVER_VALUES_KEY, true)
    );
    const hoverCards0 = applyHoverPref(
      HOVER_CARDS_KEY,
      'emdHoverCards',
      readBool(HOVER_CARDS_KEY, true)
    );
    const hoverDelay0 = applyHoverDelay(
      readNum(HOVER_DELAY_KEY, HOVER_DELAY_DEFAULT)
    );

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
      '<fieldset class="emd-settings-fieldset">' +
      '<legend>Highlight on hover</legend>' +
      '<label class="emd-settings-check"><input id="emd-hover-connectors" type="checkbox"' +
      (hoverConnectors0 ? ' checked' : '') +
      '> Connectors</label>' +
      '<label class="emd-settings-check"><input id="emd-hover-values" type="checkbox"' +
      (hoverValues0 ? ' checked' : '') +
      '> Values</label>' +
      '<label class="emd-settings-check"><input id="emd-hover-cards" type="checkbox"' +
      (hoverCards0 ? ' checked' : '') +
      '> Cards</label>' +
      '<label class="emd-settings-field">' +
      '<span class="emd-settings-label">Hover delay <output id="emd-hover-delay-out">' +
      delayLabel(hoverDelay0) +
      '</output></span>' +
      '<input id="emd-hover-delay" type="range" min="0" max="5" step="0.1" value="' +
      hoverDelay0 +
      '">' +
      '</label>' +
      '</fieldset>' +
      '</div>' +
      '<div class="emd-popover emd-help-pop" id="emd-help-pop" role="dialog" aria-label="About this board">' +
      '<h2>About this board</h2>' +
      '<ul>' +
      '<li><strong>Workflow</strong> (top blue arrow) is the story left to right. Each column is one slice (<strong>SLC</strong>): a command step, a read-model step, or navigation only (<strong>NAV</strong> — screen with no command or read model).</li>' +
      '<li><strong>UBA</strong> — actors and their screens (<strong>SCR</strong>) or automations (<strong>PRO</strong>).</li>' +
      '<li><strong>MBA</strong> — commands (<strong>COM</strong>, blue) and read models (<strong>RMO</strong>, green). Empty in a NAV slice.</li>' +
      '<li><strong>LBA</strong> — events (<strong>EVT</strong>, orange) the system recorded, or an error (<strong>ERR</strong>, red) when a command failed instead. Empty in RMO and NAV slices.</li>' +
      '<li><strong>GWT</strong> (bottom row) — optional given-when-then examples for that slice, as vertical timelines (no Given/When/Then labels). For a <strong>COM</strong>: events above the command are the Given, the command is the When, the event or error under it is the Then; another command of the same type on the same timeline builds on that history. For an <strong>RMO</strong>: read model, then event, then read model, … ending with the read model — so you see how the projection changes as each event arrives (including lookup entries when the read model joins by id). Every read-model snapshot already shows the full shape (table headers or property names); empty means no rows yet, not a bare title.</li>' +
      '<li>Arrows are the data flow <strong>only left → right in story time</strong>: screen → command → event (or error), event → a <strong>later</strong> read model → screen, and a read model → a <strong>later</strong> screen when that view first loads (connector band above commands/read models). A column only knows itself and columns to its left — never join a later event back into an earlier read model. Several events into the same read model stay on consecutive connector rows (bundled, not merged). Later screens that show the same values again do so by session or query convention — no second arrow. A <strong>MAP</strong> on an arrow names inputs → outputs when data changes shape.</li>' +
      '<li><strong>SCR highlights</strong> — on a command slice, value fields the command takes are light blue, and the button that issues the command is light blue too; on a read-model slice, value fields the read model fills are light green. Highlight values (and the COM action button) only — not property-name labels, table headers, or an empty read-model area. Screens show what people see — UX captions or self-evident values (names, invoice numbers, …), not schema names or technical join keys (those stay as client-side hidden data for later commands). Shared read-model views appear in every actor swim lane that uses them. A command issued from a read-model view keeps that same screen layout, paints the pressed action button, and omits green read-model highlights when the values already came from the earlier screen in that actor timeline. An SPA keeps one screen layout and paints those live fields in each slice.</li>' +
      '<li>Hover a <strong>card</strong>, <strong>connector piece</strong> (arrow tile or shaft — not empty slice space), or <strong>property value</strong> to keep that path lit and fade the rest. A property value isolates <strong>that example value</strong> through its sources and destinations — same name and same value (one row in a collection does not light the others); MAP renames still follow; a later screen that shows the same value from session or query state is linked too. Matching connectors stay lit, everything else fades. <strong>Click</strong> the hovered value, card, or MAP to <strong>lock</strong> the highlight while you scroll; release only with <strong>Unlock highlight</strong> (top right) or <strong>Escape</strong>. Click a connector to scroll clipped ends into view — connectors never lock a highlight. Use the gear to tune scale, fade, connector tile size, hover delay (0–5s; 0 is immediate), and which hover highlights are on (connectors, values, cards — all on by default).</li>' +
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
    const hoverConnectorsInput = corner.querySelector('#emd-hover-connectors');
    const hoverValuesInput = corner.querySelector('#emd-hover-values');
    const hoverCardsInput = corner.querySelector('#emd-hover-cards');
    const hoverDelayInput = corner.querySelector('#emd-hover-delay');
    const hoverDelayOut = corner.querySelector('#emd-hover-delay-out');

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

    hoverConnectorsInput.addEventListener('change', () => {
      applyHoverPref(
        HOVER_CONNECTORS_KEY,
        'emdHoverConnectors',
        hoverConnectorsInput.checked
      );
    });
    hoverValuesInput.addEventListener('change', () => {
      applyHoverPref(HOVER_VALUES_KEY, 'emdHoverValues', hoverValuesInput.checked);
    });
    hoverCardsInput.addEventListener('change', () => {
      applyHoverPref(HOVER_CARDS_KEY, 'emdHoverCards', hoverCardsInput.checked);
    });
    hoverDelayInput.addEventListener('input', () => {
      hoverDelayOut.textContent = delayLabel(
        applyHoverDelay(parseFloat(hoverDelayInput.value))
      );
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
