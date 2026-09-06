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
 * Atualiza o estado visual de todas as células.
 * @param {HTMLElement} container container do tabuleiro
 * @param {import('../domain/grid.js').ShipGrid} grid
 * @param {'own'|'enemy'} mode
 *   - 'own': revela os navios do jogador.
 *   - 'enemy': mascara navios; revela apenas acertos/erros e naufrágios.
 */
export function renderBoard(container, grid, mode) {
  const sunkKeys = new Set();
  if (mode === 'enemy') {
    for (const ship of grid.ships.values()) {
      if (ship.sunk) {
        for (const { row, col } of ship.cells) sunkKeys.add(`${row}:${col}`);
      }
    }
  }

  for (const cellEl of container.querySelectorAll('.cell')) {
    const row = Number(cellEl.dataset.row);
    const col = Number(cellEl.dataset.col);
    const cell = grid.getCell(row, col);
    cellEl.classList.remove('cell--ship', 'cell--hit', 'cell--miss', 'cell--sunk');

    const classes = [];
    if (mode === 'own' && cell && cell.shipId && !cell.hit) classes.push('cell--ship');
    if (mode === 'enemy' && sunkKeys.has(`${row}:${col}`)) classes.push('cell--sunk');
    if (cell && cell.hit) {
      if (cell.shipId) {
        const ship = grid.ships.get(cell.shipId);
        classes.push(ship && ship.sunk ? 'cell--sunk' : 'cell--hit');
      } else {
        classes.push('cell--miss');
      }
    }
    if (classes.length) cellEl.classList.add(...classes);
  }
}
