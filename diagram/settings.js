/**
 * Board chrome: floating Settings/? chip + SWL `.lane-label` chips; sizes
 * `--lane`, `--lane-label-clearance`, `--lane-label-top`. Settings control
 * --focus-fade, --tile, --scale (slice items / --col only); retile via `emd:retile`.
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
  const TILE_MIN = 4;
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

  /** Wrap SWL plain text / LBA head labels into floating `.lane-label` chips. */
  function mountLaneLabels() {
    document.querySelectorAll('.board > .lane.open').forEach((lane) => {
      if (lane.classList.contains('emd-corner')) return;
      if (lane.querySelector(':scope > .lane-label')) return;
      const head = lane.querySelector(':scope > .lba-head-label');
      if (head) {
        head.classList.add('lane-label');
        return;
      }
      const text = [...lane.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      if (!text) return;
      [...lane.childNodes].forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) n.remove();
      });
      const label = document.createElement('div');
      label.className = 'lane-label';
      label.textContent = text;
      lane.appendChild(label);
    });
  }

  /**
   * Size lane CSS vars: `--lane` = Settings/? chip; `--lane-label-clearance` =
   * how far SWL chips overhang into slice 1; `--lane-label-top` under the WFL.
   */
  function sizeLaneColumn() {
    const root = document.documentElement;
    const board = document.querySelector('.board');
    if (!board) return;
    const boardLeft = board.getBoundingClientRect().left;
    const corner = document.querySelector('.board > .lane:first-child');
    const tools = corner && corner.querySelector('.emd-corner-tools');

    // Sticky SWL chips must sit below the workflow row.
    let labelTop = 0;
    const wfl = board.querySelector(':scope > .wfl');
    if (wfl) labelTop = Math.max(labelTop, wfl.getBoundingClientRect().height);
    if (corner) labelTop = Math.max(labelTop, corner.getBoundingClientRect().height);
    const topPx = Math.max(56, Math.ceil(labelTop + 4));
    const topNext = topPx + 'px';
    if (root.style.getPropertyValue('--lane-label-top') !== topNext) {
      root.style.setProperty('--lane-label-top', topNext);
    }

    const minPx = 68; /* ~ gear + ? */
    let lanePx = minPx;
    if (tools) {
      const toolsRight = tools.getBoundingClientRect().right - boardLeft;
      // Corner cell padding is already in the tools box; small air past the ?.
      lanePx = Math.max(minPx, Math.ceil(toolsRight + 6));
    }
    const laneNext = lanePx + 'px';

    let labelRight = 0;
    document.querySelectorAll('.board > .lane.open > .lane-label').forEach((el) => {
      labelRight = Math.max(labelRight, el.getBoundingClientRect().right - boardLeft);
    });
    const clearPx =
      labelRight > 0 ? Math.max(0, Math.ceil(labelRight - lanePx + 8)) : 0;
    const clearNext = clearPx + 'px';

    let changed = false;
    if (root.style.getPropertyValue('--lane') !== laneNext) {
      root.style.setProperty('--lane', laneNext);
      changed = true;
    }
    if (root.style.getPropertyValue('--lane-label-clearance') !== clearNext) {
      root.style.setProperty('--lane-label-clearance', clearNext);
      changed = true;
    }
    if (changed) window.dispatchEvent(new Event('emd:retile'));
  }

  function mount() {
    // Drop abandoned scroll-lerp experiment (fought trackpad momentum).
    try {
      localStorage.removeItem('emd-scroll-lerp');
    } catch (_) {}

    mountLaneLabels();

    const corner = document.querySelector('.board > .lane:first-child');
    if (!corner || corner.querySelector('.emd-corner-tools')) {
      sizeLaneColumn();
      return;
    }

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
      '<li><strong>GWT</strong> (bottom row) — optional given-when-then examples for that slice, as vertical timelines (no Given/When/Then labels). For a <strong>COM</strong>: events above the command are the Given, the command is the When, the event or error under it is the Then; another command of the same type on the same timeline builds on that history. For an <strong>RMO</strong>: read model, then event, then read model, … ending with the read model — so you see how the projection changes as each event arrives (including lookup entries when the read model joins by id). Every read-model snapshot already shows the full shape (table headers or property names); empty means no rows yet, not a bare title. Each MBA <strong>RMO</strong> column carries its <strong>EMD GWT</strong> for the history replayer (full story once; when the same title appears again later, that column’s GWT starts from the prior footprint and lists only the new feeding events — do not re-join earlier events or both cards will show duplicates in the history replayer).</li>' +
      '<li>Arrows are the data flow <strong>only left → right in story time</strong>: screen → command → event (or error), event → a <strong>later</strong> read model → screen, and a read model → a <strong>later</strong> screen when that view first loads (connector band above commands/read models). A column only knows itself and columns to its left — never join a later event back into an earlier read model. Several events into the same read model stay on consecutive connector rows (bundled, not merged). Later screens that show the same values again do so by session or query convention — no second arrow. A <strong>MAP</strong> on an arrow names inputs → outputs when data changes shape.</li>' +
      '<li><strong>SCR highlights</strong> — COM-bound values (and the action button / checked radios that feed the COM) are light blue; RMO-bound values are light green. Radios use the same sketch stroke as other controls. Paint values only — not labels or headers. Shared views appear in every actor swim lane that uses them. An SPA keeps one layout and only the live fields change per slice.</li>' +
      '<li><strong>Lane chrome</strong> — swim-lane names and Settings/? are floating chips on a narrow sticky stub (not a wide solid panel). Slice 1 is padded so cards clear longer names.</li>' +
      '<li><strong>Hover</strong> a card, connector piece (tile/shaft — not empty gap), or property value to keep that path lit. A value isolates that example (same name and value) across COM / EVT / RMO / SCR, including carried-forward screen fields; MAP renames still follow. On a COM slice, lighting the COM→EVT write also lights the SCR↔COM upper shaft in that column (the screen is part of the write path even when the locked value is a later MAP rename that never sat on the form).</li>' +
      '<li><strong>Lock</strong> — click the hovered value, card, or MAP. The top-right padlock bar names what is locked; ‹ › centers other instances without changing the label. Release with the padlock, click elsewhere, or Escape. Connectors never lock (click only scrolls clipped ends into view).</li>' +
      '<li><strong>RMO replayer</strong> — hover an MBA RMO for a replay control; click opens a floating EVT tape pinned beside that card (prefer left; flip + reverse the pin when there is no room). The strip scales with <strong>Scale items</strong>. Wheel or drag free-scrolls the tape with momentum under a fixed pin (no per-EVT snap, no hover highlight on tape cards); the RMO updates when the next step reaches the pin. Click a step or Arrow Up/Down to seek. Start + subscribed feeds only; same-title EMD GWTs chain to the final footprint. Replay again, click outside, or Escape closes.</li>' +
      '<li><strong>Settings (gear)</strong> — scale (cards + RMO history strip), fade, connector tile size, hover delay (0–5s), and which hover highlights are on (connectors, values, cards — all on by default).</li>' +
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

    sizeLaneColumn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
