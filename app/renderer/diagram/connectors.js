/**
 * Leftness tile connectors for EVT → RMO projections.
 *
 * One 30×30 SVG tile per grid cell — never two divs on the same cell.
 * Tiles come from diagram/arrows/. A hop cell is hop.svg (vertical shaft +
 * horizontal bridge); hline/vline never share that cell.
 *
 *   <main class="emd" data-joins="evt-a:rmo-x,…">
 */
(function () {
  const TILE = 30;
  const HALF = TILE / 2;

  const TILE_FILE = {
    hline: 'hline',
    vline: 'vline',
    turn_tr: 'turn-tr',
    turn_tl: 'turn-tl',
    turn_br: 'turn-br',
    turn_bl: 'turn-bl',
    arrow_up: 'arrow-up',
    hop: 'hop',
  };

  // When two paints hit the same cell, keep the richer tile.
  const RANK = {
    hline: 1,
    vline: 1,
    turn_tr: 2,
    turn_tl: 2,
    turn_br: 2,
    turn_bl: 2,
    arrow_up: 2,
    hop: 3,
  };

  const scriptEl = document.querySelector('script[src*="connectors.js"]');
  const arrowsBase = scriptEl
    ? scriptEl.src.replace(/[^/]+$/, 'arrows/')
    : new URL('../../diagram/arrows/', window.location.href).href;

  function sliceOf(el) {
    if (!el) return 0;
    if (el.dataset && el.dataset.slc) return parseInt(el.dataset.slc, 10);
    const host = el.closest('[data-slc]');
    return host ? parseInt(host.dataset.slc, 10) : 0;
  }

  function drawJoins(emd) {
    const sheet = emd.querySelector('.sheet') || emd;
    let layer = sheet.querySelector('#connector-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'connector-layer';
      sheet.prepend(layer);
    }
    layer.innerHTML = '';

    const joinsAttr = emd.getAttribute('data-joins') || '';
    const pairs = joinsAttr.split(',').map((s) => s.trim()).filter(Boolean);
    if (!pairs.length) return;

    const sheetRect = sheet.getBoundingClientRect();
    const scrollLeft = sheet.scrollLeft || 0;
    const scrollTop = sheet.scrollTop || 0;

    function coords(id) {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        id,
        el,
        slc: sliceOf(el),
        top: r.top - sheetRect.top + scrollTop,
        bottom: r.bottom - sheetRect.top + scrollTop,
        centerX: r.left - sheetRect.left + scrollLeft + r.width / 2,
      };
    }

    const pending = [];
    pairs.forEach((pair) => {
      const [fromId, toId] = pair.split(':').map((s) => s.trim());
      const from = coords(fromId);
      const to = coords(toId);
      if (!from || !to) return;
      pending.push({
        fromId,
        toId,
        from,
        to,
        fromIdx: from.slc,
        toIdx: to.slc,
        leftness: from.slc + to.slc,
        span: [Math.min(from.slc, to.slc), Math.max(from.slc, to.slc)],
      });
    });
    if (!pending.length) return;

    const byFrom = {};
    pending.forEach((c) => {
      (byFrom[c.fromId] || (byFrom[c.fromId] = [])).push(c);
    });
    Object.keys(byFrom).forEach((id) => {
      byFrom[id].sort((a, b) => a.leftness - b.leftness || a.toIdx - b.toIdx);
      byFrom[id].forEach((c, i) => {
        c.leaveCol = i + 1;
      });
    });

    const byTo = {};
    pending.forEach((c) => {
      (byTo[c.toId] || (byTo[c.toId] = [])).push(c);
    });
    Object.keys(byTo).forEach((id) => {
      byTo[id].sort((a, b) => a.leftness - b.leftness || a.fromIdx - b.fromIdx);
      const n = byTo[id].length;
      const mid = Math.floor((n - 1) / 2);
      byTo[id].forEach((c, i) => {
        c.arriveCol = i - mid; // integer tile offsets around the RMO center
      });
    });

    const ordered = pending.slice().sort((a, b) => a.leftness - b.leftness);
    const assigned = [];
    let lastUsed = 0;
    ordered.forEach((p) => {
      let trackId = -1;
      for (let i = lastUsed; i < assigned.length; i++) {
        const overlaps = assigned[i].some(
          (span) => !(p.span[1] < span[0] || p.span[0] > span[1])
        );
        if (!overlaps) {
          trackId = i;
          assigned[i].push(p.span);
          break;
        }
      }
      if (trackId === -1) {
        trackId = assigned.length;
        assigned.push([p.span]);
      }
      p.trackId = trackId;
      lastUsed = trackId;
    });

    const connectorCells = [...emd.querySelectorAll('.cell.connector')];
    let bandTop = 0;
    let originX = 0;
    if (connectorCells.length) {
      const need = (assigned.length + 1) * TILE;
      const cur = parseFloat(connectorCells[0].style.minHeight) || 0;
      if (Math.abs(cur - need) > 1) {
        connectorCells.forEach((cell) => {
          cell.style.minHeight = need + 'px';
        });
      }
      const cr = connectorCells[0].getBoundingClientRect();
      bandTop = cr.top - sheetRect.top + scrollTop;
      const sample = emd.querySelector('.cell.mba[data-slc] .com, .cell.mba[data-slc] .rmo');
      if (sample) {
        const cell = sample.closest('.cell');
        const r = cell.getBoundingClientRect();
        originX = r.left - sheetRect.left + scrollLeft + r.width / 2 - HALF;
      }
      // Mid band is owned by the tile grid (vline / hop) — clear CSS mid tiles
      // so they cannot sit under/over join tiles.
      connectorCells.forEach((cell) => {
        cell.querySelectorAll('.rail-band.mid .tile').forEach((t) => t.remove());
      });
    }

    const originY = bandTop;

    function colOf(x) {
      return Math.round((x - HALF - originX) / TILE);
    }
    function rowOf(y) {
      return Math.round((y - HALF - originY) / TILE);
    }
    function xOf(col) {
      return originX + col * TILE + HALF;
    }
    function yOf(row) {
      return originY + row * TILE + HALF;
    }

    // Write-slice COM→EVT column index on the tile grid.
    const writeCol = {};
    emd.querySelectorAll('.cell.mba[data-slc] .com').forEach((com) => {
      const cell = com.closest('.cell.mba');
      if (!cell) return;
      const r = cell.getBoundingClientRect();
      const cx = r.left - sheetRect.left + scrollLeft + r.width / 2;
      writeCol[sliceOf(com)] = colOf(cx);
    });

    // One occupant per grid cell.
    const grid = new Map();

    function paint(col, row, type, c) {
      const key = col + ',' + row;
      const prev = grid.get(key);
      if (!prev) {
        grid.set(key, { type, c });
        return;
      }
      // Crossing hline + vline becomes hop (hop.svg draws both segments).
      if (
        (prev.type === 'hline' && type === 'vline') ||
        (prev.type === 'vline' && type === 'hline') ||
        type === 'hop' ||
        prev.type === 'hop'
      ) {
        grid.set(key, { type: 'hop', c: type === 'hop' ? c : prev.c });
        return;
      }
      if ((RANK[type] || 0) > (RANK[prev.type] || 0)) {
        grid.set(key, { type, c });
      }
    }

    function paintV(col, rowA, rowB, c) {
      const lo = Math.min(rowA, rowB);
      const hi = Math.max(rowA, rowB);
      for (let r = lo + 1; r < hi; r++) paint(col, r, 'vline', c);
    }

    function paintH(colA, colB, row, c, hopCols) {
      const lo = Math.min(colA, colB);
      const hi = Math.max(colA, colB);
      const hops = hopCols || new Set();
      for (let col = lo + 1; col < hi; col++) {
        paint(col, row, hops.has(col) ? 'hop' : 'hline', c);
      }
    }

    // COM→EVT vertical through the connector band (tiles replace cleared CSS mid).
    const bandRows = assigned.length;
    Object.keys(writeCol).forEach((slc) => {
      const col = writeCol[slc];
      const stub = {
        fromId: 'com-slc-' + slc,
        toId: 'evt-slc-' + slc,
        trackId: -1,
      };
      for (let r = 0; r < bandRows; r++) paint(col, r, 'vline', stub);
    });

    pending.forEach((c) => {
      const leaveCol = colOf(c.from.centerX) + c.leaveCol;
      const arriveCol = colOf(c.to.centerX) + c.arriveCol;
      const trackRow = c.trackId;
      const fromRow = rowOf(c.from.top);
      const toRow = rowOf(c.to.bottom);

      paintV(leaveCol, fromRow, trackRow, c);
      paintV(arriveCol, trackRow, toRow, c);

      const hopCols = new Set();
      Object.keys(writeCol).forEach((slc) => {
        const n = parseInt(slc, 10);
        if (n > c.span[0] && n < c.span[1]) hopCols.add(writeCol[slc]);
      });
      paintH(leaveCol, arriveCol, trackRow, c, hopCols);

      // Corners at the elbows (overwrite hline/vline stubs at those cells).
      const left = Math.min(leaveCol, arriveCol);
      const right = Math.max(leaveCol, arriveCol);
      if (leaveCol <= arriveCol) {
        paint(left, trackRow, fromRow > trackRow ? 'turn_br' : 'turn_tr', c);
        paint(right, trackRow, toRow < trackRow ? 'turn_tl' : 'turn_bl', c);
      } else {
        paint(left, trackRow, toRow < trackRow ? 'turn_tr' : 'turn_br', c);
        paint(right, trackRow, fromRow > trackRow ? 'turn_tl' : 'turn_bl', c);
      }

      // Arrow into RMO: tile just below the card bottom.
      paint(arriveCol, toRow, 'arrow_up', c);
    });

    // Materialize — one div per occupied cell.
    grid.forEach((cell, key) => {
      const [col, row] = key.split(',').map(Number);
      const file = TILE_FILE[cell.type];
      if (!file) return;
      const div = document.createElement('div');
      div.className = 'join-tile';
      div.dataset.tile = cell.type;
      div.dataset.col = String(col);
      div.dataset.row = String(row);
      if (cell.c) {
        div.dataset.fromId = cell.c.fromId;
        div.dataset.toId = cell.c.toId;
        div.dataset.track = String(cell.c.trackId);
      }
      div.style.left = originX + col * TILE + 'px';
      div.style.top = originY + row * TILE + 'px';
      div.style.backgroundImage = `url("${arrowsBase}${file}.svg?v=hop2")`;
      div.style.backgroundSize = 'contain';
      div.style.backgroundRepeat = 'no-repeat';
      div.style.backgroundPosition = 'center';
      layer.appendChild(div);
    });
  }

  function boot() {
    document.querySelectorAll('main.emd[data-joins]').forEach((emd) => {
      let timer = 0;
      const run = () => {
        clearTimeout(timer);
        timer = setTimeout(() => drawJoins(emd), 40);
      };
      drawJoins(emd);
      window.addEventListener('resize', run);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
      const ro = new ResizeObserver(run);
      ro.observe(emd.querySelector('.board') || emd);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
