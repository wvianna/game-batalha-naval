// Definições da frota, geometria de posicionamento e gerador aleatório.
// Módulo puro: não acessa DOM nem conhece a classe ShipGrid.

import { GRID_SIZE, HORIZONTAL, VERTICAL } from './constants.js';

/** Frota oficial: 1×5, 1×4, 1×3, 1×3, 1×2 = 17 células. */
export const FLEET = Object.freeze([
  { id: 'carrier',    name: 'Porta-aviões', size: 5 },
  { id: 'battleship', name: 'Encouraçado',  size: 4 },
  { id: 'destroyer',  name: 'Destróier',    size: 3 },
  { id: 'submarine',  name: 'Submarino',    size: 3 },
  { id: 'frigate',    name: 'Fragata',      size: 2 },
]);

export const TOTAL_CELLS = FLEET.reduce((acc, ship) => acc + ship.size, 0);

/**
 * Gera a lista de coordenadas de um navio a partir da célula inicial.
 * @param {number} row linha inicial (0..9)
 * @param {number} col coluna inicial (0..9)
 * @param {number} size tamanho do navio
 * @param {string} orientation 'h' (horizontal) ou 'v' (vertical)
 * @returns {{row:number,col:number}[]}
 */
export function computeShipCells(row, col, size, orientation) {
  const cells = [];
  for (let i = 0; i < size; i++) {
    cells.push(orientation === VERTICAL ? { row: row + i, col } : { row, col: col + i });
  }
  return cells;
}

/**
 * Valida a geometria de um posicionamento (sem considerar ocupação):
 * quantidade, dentro do grid, em linha reta e contíguo.
 * @returns {string|null} motivo do erro ou null se válido.
 */
export function validateShipGeometry(cells, expectedSize, size = GRID_SIZE) {
  if (!Number.isInteger(expectedSize) || cells.length !== expectedSize) return 'wrong-size';
  if (cells.some(({ row, col }) => row < 0 || row >= size || col < 0 || col >= size)) {
    return 'out-of-bounds';
  }
  const firstRow = cells[0].row;
  const firstCol = cells[0].col;
  const horizontal = cells.every((c) => c.row === firstRow);
  const vertical = cells.every((c) => c.col === firstCol);
  if (!horizontal && !vertical) return 'not-straight';
  const axis = horizontal ? cells.map((c) => c.col) : cells.map((c) => c.row);
  const sorted = [...axis].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== 1) return 'not-contiguous';
  }
  return null;
}

/** Próximo navio da frota ainda não posicionado em `grid`, ou null. */
export function nextShipToPlace(grid, fleet = FLEET) {
  for (const ship of fleet) {
    if (!grid.ships.has(ship.id)) return ship;
  }
  return null;
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Gera um posicionamento aleatório válido para toda a frota (sem sobreposição,
 * dentro do grid). Retorna a lista de `{ ship, cells }` ou null se falhar.
 */
export function generateRandomFleet({
  size = GRID_SIZE,
  rng = Math.random,
  fleet = FLEET,
  maxAttempts = 200,
} = {}) {
  const occupied = new Set();
  const placements = [];
  for (const ship of fleet) {
    let placed = false;
    for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
      const orientation = rng() < 0.5 ? HORIZONTAL : VERTICAL;
      const dr = orientation === VERTICAL ? ship.size - 1 : 0;
      const dc = orientation === HORIZONTAL ? ship.size - 1 : 0;
      const row = Math.floor(rng() * (size - dr));
      const col = Math.floor(rng() * (size - dc));
      const cells = computeShipCells(row, col, ship.size, orientation);
      if (cells.every(({ row: r, col: c }) => !occupied.has(`${r}:${c}`))) {
        for (const { row: r, col: c } of cells) occupied.add(`${r}:${c}`);
        placements.push({ ship: { ...ship }, cells });
        placed = true;
      }
    }
    if (!placed) return null;
  }
  return placements;
}
