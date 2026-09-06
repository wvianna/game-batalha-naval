// Renderização dos tabuleiros com CSS Grid e Event Delegation.
// O container pai recebe UM listener de clique (nunca um por célula).

import { GRID_SIZE } from '../domain/constants.js';
import { rowLabel } from './format.js';

/**
 * Monta a estrutura do tabuleiro (11×11 com rótulos de linha/coluna) e registra
 * o listener delegado. Chamar uma única vez por container.
 */
export function initBoard(container, onCellClick) {
  container.replaceChildren();
  container.classList.add('board');

  const frag = document.createDocumentFragment();

  const corner = document.createElement('span');
  corner.className = 'board-corner';
  frag.append(corner);

  for (let c = 1; c <= GRID_SIZE; c++) {
    const label = document.createElement('span');
    label.className = 'board-col-label';
    label.textContent = String(c);
    frag.append(label);
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    const rowLabelEl = document.createElement('span');
    rowLabelEl.className = 'board-row-label';
    rowLabelEl.textContent = rowLabel(r);
    frag.append(rowLabelEl);
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);
      cell.setAttribute('aria-label', `${rowLabel(r)}-${c + 1}`);
      frag.append(cell);
    }
  }

  container.append(frag);

  container.addEventListener('click', (event) => {
    const target = event.target.closest('.cell');
    if (!target) return;
    onCellClick(Number(target.dataset.row), Number(target.dataset.col), target);
  });
}

/**
 * Atualiza o estado visual de todas as células e desenha a arte das
 * embarcações.
 * @param {HTMLElement} container container do tabuleiro
 * @param {import('../domain/grid.js').ShipGrid} grid
 * @param {'own'|'enemy'} mode
 *   - 'own': desenha a frota do jogador (arte contínua sobre as células).
 *   - 'enemy': mascara navios; revela a arte apenas de navios afundados.
 */
export function renderBoard(container, grid, mode) {
  clearArtwork(container);
  const own = mode === 'own';

  // Arte das embarcações (frota própria sempre; inimiga apenas quando afunda).
  for (const ship of grid.ships.values()) {
    if (own || ship.sunk) addShipArt(container, ship, { dimmed: own && ship.sunk });
  }

  // Estado por célula.
  for (const cellEl of container.querySelectorAll('.cell')) {
    const row = Number(cellEl.dataset.row);
    const col = Number(cellEl.dataset.col);
    const cell = grid.getCell(row, col);
    cellEl.classList.remove('cell--ship', 'cell--hit', 'cell--miss', 'cell--sunk');
    if (!cell) continue;

    if (cell.hit && cell.shipId) {
      if (own) {
        // Dano na própria frota: marcador vermelho sobre a embarcação.
        addDamageMarker(container, cellEl);
      } else {
        // Ataque inimigo: só revela células atingidas (e afundados pela arte).
        const ship = grid.ships.get(cell.shipId);
        if (!ship.sunk) addDamageMarker(container, cellEl);
      }
      continue;
    }
    if (cell.hit) {
      cellEl.classList.add('cell--miss'); // água
    }
  }
}

// --------------------------------------------------------------- arte ----

function clearArtwork(container) {
  container.querySelectorAll('.ship-overlay, .damage-marker').forEach((el) => el.remove());
}

/** Coordenadas (px) de um elemento relativas à área de conteúdo do tabuleiro. */
function rectWithin(board, el) {
  const boardRect = board.getBoundingClientRect();
  const cs = getComputedStyle(board);
  const bl = parseFloat(cs.borderLeftWidth) || 0;
  const bt = parseFloat(cs.borderTopWidth) || 0;
  const r = el.getBoundingClientRect();
  return {
    left: r.left - boardRect.left - bl,
    top: r.top - boardRect.top - bt,
    width: r.width,
    height: r.height,
  };
}

function addDamageMarker(board, cellEl) {
  const r = rectWithin(board, cellEl);
  const size = Math.round(Math.min(r.width, r.height) * 0.78);
  const marker = document.createElement('span');
  marker.className = 'damage-marker';
  marker.style.width = `${size}px`;
  marker.style.height = `${size}px`;
  marker.style.left = `${Math.round(r.left + (r.width - size) / 2)}px`;
  marker.style.top = `${Math.round(r.top + (r.height - size) / 2)}px`;
  board.append(marker);
}

/**
 * Desenha uma embarcação como uma única imagem contínua ocupando suas células.
 * Navios verticais são rotacionados via transform.
 */
function addShipArt(board, ship, { dimmed = false } = {}) {
  if (ship.cells.length === 0) return;
  const cellByKey = new Map();
  board.querySelectorAll('.cell').forEach((el) => {
    cellByKey.set(`${el.dataset.row}:${el.dataset.col}`, el);
  });

  const horizontal = ship.cells.every((c) => c.row === ship.cells[0].row);
  const sorted = [...ship.cells].sort((a, b) => (horizontal ? a.col - b.col : a.row - b.row));
  const first = cellByKey.get(`${sorted[0].row}:${sorted[0].col}`);
  const last = cellByKey.get(`${sorted[sorted.length - 1].row}:${sorted[sorted.length - 1].col}`);
  if (!first || !last) return;

  const a = rectWithin(board, first);
  const z = rectWithin(board, last);
  const overlay = document.createElement('div');
  overlay.className = 'ship-overlay';

  const img = document.createElement('img');
  img.className = 'ship-art';
  img.src = `assets/ships/${ship.id}.svg`;
  img.alt = ship.name;
  img.draggable = false;

  if (horizontal) {
    overlay.style.left = `${a.left}px`;
    overlay.style.top = `${a.top}px`;
    overlay.style.width = `${z.left + z.width - a.left}px`;
    overlay.style.height = `${a.height}px`;
    img.classList.add('ship-art--h');
  } else {
    const width = a.width;
    const height = z.top + z.height - a.top;
    overlay.style.left = `${a.left}px`;
    overlay.style.top = `${a.top}px`;
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
    img.style.width = `${height}px`; // troca dimensões: arte gira 90°
    img.style.height = `${width}px`;
    img.classList.add('ship-art--v');
  }

  if (dimmed) overlay.classList.add('ship-overlay--dim');
  overlay.append(img);
  board.append(overlay);
}
