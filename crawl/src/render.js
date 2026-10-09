// Static renderer for foam-green-crawl.
// Rebuilds or updates DOM elements strictly in response to user input.
// Zero continuous render loops, zero timers.

import { BOARD_WIDTH, BOARD_HEIGHT } from './board.js';
import { resolveText } from '../data/texts.js';

export function getInspectLayers(board, a, b, c) {
  // Support both (board, x, y) and legacy (board, player, x, y)
  let x = a;
  let y = b;
  if (typeof c === 'number') {
    x = b;
    y = c;
  }

  const layers = [];
  if (!board || !board.cells || !board.cells[y] || !board.cells[y][x]) return layers;
  const cell = board.cells[y][x];

  // 1. Item (if present)
  if (cell.item) {
    layers.push({ layer: 'item', ...cell.item });
  }

  // 2. Object (furniture / household item)
  if (cell.object) {
    layers.push({ layer: 'object', ...cell.object });
  }

  // 3. Overhead
  if (cell.overhead) {
    layers.push({ layer: 'overhead', ...cell.overhead });
  }

  // 4. Wall thing
  if (cell.wallThing) {
    layers.push({ layer: 'wall_thing', ...cell.wallThing });
  }

  // 5. Surface (floor finish or wall)
  if (cell.surface) {
    layers.push({ layer: 'surface', ...cell.surface });
  }

  return layers;
}

export function createRenderer(gridEl, inspectEl, statusEl, logEl) {
  let cellEls = [];

  function initGrid() {
    gridEl.innerHTML = '';
    cellEls = [];
    gridEl.style.gridTemplateColumns = `repeat(${BOARD_WIDTH}, var(--cell-size))`;
    gridEl.style.gridTemplateRows = `repeat(${BOARD_HEIGHT}, var(--cell-size))`;

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      const row = [];
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const el = document.createElement('div');
        el.className = 'cell';
        el.setAttribute('data-x', x);
        el.setAttribute('data-y', y);
        gridEl.appendChild(el);
        row.push(el);
      }
      cellEls.push(row);
    }
  }

  function syncCellElement(el, cell, isInspected, board) {
    const room = board.rooms.find(r => r.id === cell.roomId);

    // Hierarchy: highest of item, object, wallThing, surface
    if (cell.item) {
      el.textContent = cell.item.glyph;
      el.className = cell.solid ? 'cell cell-solid' : 'cell cell-walkable';
    } else if (cell.object) {
      el.textContent = cell.object.glyph;
      el.className = cell.solid ? 'cell cell-solid' : 'cell cell-walkable';
    } else if (cell.wallThing) {
      el.textContent = cell.wallThing.glyph;
      el.className = 'cell cell-solid';
    } else {
      el.textContent = cell.surface.glyph;
      el.className = cell.solid ? 'cell cell-solid' : 'cell cell-walkable';
    }

    el.dataset.s = cell.surface.id;
    if (cell.object) el.dataset.obj = cell.object.id; else delete el.dataset.obj;
    if (cell.item) el.dataset.item = cell.item.id; else delete el.dataset.item;
    if (cell.wallThing) el.dataset.wall = cell.wallThing.id; else delete el.dataset.wall;
    if (cell.overhead) el.dataset.overhead = cell.overhead.id; else delete el.dataset.overhead;

    if (room && room.lighting) {
      el.dataset.light = room.lighting;
    } else {
      delete el.dataset.light;
    }

    if (cell.overhead && (cell.overhead.id === 'tube_light' || cell.overhead.id === 'bulb')) {
      el.dataset.lit = 'true';
    } else {
      delete el.dataset.lit;
    }

    // Informative hover titles for doorways, perimeter passages, and stairs
    if (cell.surface.id === 'doorway' || (!cell.solid && (cell.y === 0 || cell.y === BOARD_HEIGHT - 1 || cell.x === 0 || cell.x === BOARD_WIDTH - 1))) {
      if (cell.y === 0) el.title = 'North passage (W)';
      else if (cell.y === BOARD_HEIGHT - 1) el.title = 'South passage (S)';
      else if (cell.x === 0) el.title = 'West passage (A)';
      else if (cell.x === BOARD_WIDTH - 1) el.title = 'East passage (D)';
      else el.title = 'Interior doorway';
    } else if (cell.surface.id === 'stair_up') {
      el.title = `Stair up to Level ${board.z + 1} (R)`;
    } else if (cell.surface.id === 'stair_down') {
      el.title = `Stair down to Level ${board.z - 1} (F)`;
    } else {
      el.removeAttribute('title');
    }

    if (isInspected) {
      el.classList.add('cell-inspected');
    } else {
      el.classList.remove('cell-inspected');
    }
  }

  function renderBoard(board, inspected = null, inspectLayerIdx = 0, specimenLog = []) {
    if (cellEls.length !== BOARD_HEIGHT || cellEls[0].length !== BOARD_WIDTH) {
      initGrid();
    }

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = board.cells[y][x];
        const el = cellEls[y][x];
        const isInspected = inspected && inspected.x === x && inspected.y === y;
        syncCellElement(el, cell, isInspected, board);
      }
    }

    // Status bar
    if (statusEl) {
      statusEl.textContent = `Board (${board.bx}, ${board.by}) · Level ${board.z} · Seed ${board.seed} · Rooms: ${board.rooms.length}`;
    }

    // Inspection panel
    renderInspect(board, inspected, inspectLayerIdx);
    if (logEl) {
      renderSpecimenLog(specimenLog);
    }
  }

  function setInspectedCell(oldInspected, newInspected) {
    if (oldInspected && cellEls[oldInspected.y] && cellEls[oldInspected.y][oldInspected.x]) {
      cellEls[oldInspected.y][oldInspected.x].classList.remove('cell-inspected');
    }
    if (newInspected && cellEls[newInspected.y] && cellEls[newInspected.y][newInspected.x]) {
      cellEls[newInspected.y][newInspected.x].classList.add('cell-inspected');
    }
  }

  function renderInspect(board, target, layerIdx = 0) {
    if (!inspectEl) return;
    if (!target) {
      const roomSummary = board.rooms.map(r => `${r.type} (${r.category}${r.lighting ? ` · ${r.lighting}` : ''})`).join(', ');
      inspectEl.innerHTML = `
        <div class="inspect-header">
          <span class="inspect-glyph cell" data-s="bare_cement">·</span>
          <span class="inspect-name">Board (${board.bx}, ${board.by})</span>
        </div>
        <div class="inspect-meta">
          <div><strong>Level:</strong> ${board.z} · Seed ${board.seed}</div>
          <div><strong>Spaces:</strong> ${roomSummary || 'open corridor'}</div>
          <div style="margin-top:0.4rem;font-size:0.78rem;color:var(--text-dim);">Click any cell to inspect its contents.<br/>Tap any perimeter door or stair to travel.</div>
        </div>
      `;
      return;
    }

    const layers = getInspectLayers(board, target.x, target.y);
    if (layers.length === 0) return;

    const activeIdx = (layerIdx % layers.length + layers.length) % layers.length;
    const item = layers[activeIdx];
    const cell = board.cells[target.y][target.x];
    const room = board.rooms.find(r => r.id === cell.roomId);

    let dataAttr = '';
    if (item.layer === 'item') {
      dataAttr = `data-item="${item.id}"`;
    } else if (item.layer === 'object') {
      dataAttr = `data-obj="${item.id}"`;
    } else if (item.layer === 'wall_thing') {
      dataAttr = `data-wall="${item.id}"`;
    } else if (item.layer === 'overhead') {
      dataAttr = `data-overhead="${item.id}"`;
    } else {
      dataAttr = `data-s="${cell.surface.id}"`;
    }

    const cut = board.cuts && board.cuts.find(c => c.x === target.x && c.y === target.y);

    let stairLead = '';
    if (cell.surface.id === 'stair_up') {
      stairLead = ` · ascends to Level ${board.z + 1} (tap or press R)`;
    } else if (cell.surface.id === 'stair_down') {
      stairLead = ` · descends to Level ${board.z - 1} (tap or press F)`;
    } else if (cell.surface.id === 'dark_doorway') {
      if (cut) {
        stairLead = ` · cuts to Board (${cut.targetBx}, ${cut.targetBy}) L${cut.targetZ} (tap or press Space)`;
      } else {
        stairLead = ` · dark doorway`;
      }
    } else if (cell.surface.id === 'doorway') {
      if (target.y === 0) stairLead = ` · North exit (tap or press W)`;
      else if (target.y === BOARD_HEIGHT - 1) stairLead = ` · South exit (tap or press S)`;
      else if (target.x === 0) stairLead = ` · West exit (tap or press A)`;
      else if (target.x === BOARD_WIDTH - 1) stairLead = ` · East exit (tap or press D)`;
      else stairLead = ` · interior doorway`;
    }

    const text = resolveText(item.id, {
      seed: board.seed,
      bx: board.bx,
      by: board.by,
      z: board.z,
      x: target.x,
      y: target.y,
      layer: item.layer,
      room,
    });

    let html = `
      <div class="inspect-header">
        <span class="inspect-glyph cell" ${dataAttr}>${item.glyph}</span>
        <span class="inspect-name">${item.name}</span>
        ${layers.length > 1 ? `<span class="layer-tag">layer ${activeIdx + 1}/${layers.length}</span>` : ''}
      </div>
      ${text ? `<div class="inspect-text">“${text}”</div>` : ''}
      ${cut ? `<div class="inspect-actions" style="margin-top:0.6rem;"><button id="cut-travel-btn" class="cut-travel-btn" data-target-bx="${cut.targetBx}" data-target-by="${cut.targetBy}" data-target-z="${cut.targetZ}">Step into shadow → (${cut.targetBx}, ${cut.targetBy}) L${cut.targetZ}</button></div>` : ''}
      <div class="inspect-meta">
        <div><strong>Position:</strong> (${target.x}, ${target.y}) on Board (${board.bx}, ${board.by}) · Level ${board.z}${stairLead}</div>
        <div><strong>Layer:</strong> ${item.layer} ${layers.length > 1 ? '(click cell again to cycle)' : ''}</div>
        <div><strong>Solid:</strong> ${item.solid ? 'yes' : 'no'}</div>
        <div><strong>Room:</strong> ${room ? `${room.type} (${room.category}${room.layout ? ` · ${room.layout}` : ''}${room.lighting ? ` · ${room.lighting}` : ''})` : 'perimeter / doorway'}</div>
        <div><strong>Tags:</strong> ${item.tags.join(', ')}</div>
      </div>
    `;

    inspectEl.innerHTML = html;
  }

  function renderSpecimenLog(specimenLog) {
    if (!logEl) return;
    if (specimenLog.length === 0) {
      logEl.innerHTML = '<div class="specimen-empty">None yet</div>';
      return;
    }

    let html = '';
    for (const entry of specimenLog) {
      let dataAttr = '';
      if (entry.layer === 'item') {
        dataAttr = `data-item="${entry.id}"`;
      } else if (entry.layer === 'object') {
        dataAttr = `data-obj="${entry.id}"`;
      } else if (entry.layer === 'wall_thing') {
        dataAttr = `data-wall="${entry.id}"`;
      } else if (entry.layer === 'overhead') {
        dataAttr = `data-overhead="${entry.id}"`;
      } else {
        dataAttr = `data-s="${entry.surfaceId || entry.id}"`;
      }

      const titleAttr = entry.text ? `title="${entry.text.replace(/"/g, '&quot;')}"` : '';

      html += `
        <div class="specimen-item" ${titleAttr}>
          <span class="specimen-glyph cell" ${dataAttr}>${entry.glyph}</span>
          <span class="specimen-name">${entry.name}</span>
          <span class="specimen-meta">${entry.boardPos}</span>
        </div>
      `;
    }
    logEl.innerHTML = html;
  }

  return {
    initGrid,
    renderBoard,
    setInspectedCell,
    renderInspect,
    renderSpecimenLog,
  };
}
