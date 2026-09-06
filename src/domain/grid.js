// Grid 10×10: células, posicionamento de navios e recepção de disparos.
// Módulo puro: não acessa DOM.

import { GRID_SIZE } from './constants.js';
import { validateShipGeometry } from './ships.js';

export function cellKey(row, col) {
  return `${row}:${col}`;
}

export function inBounds(row, col, size = GRID_SIZE) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

export class ShipGrid {
  constructor(size = GRID_SIZE) {
    this.size = size;
    this.cells = Array.from({ length: size * size }, () => ({ shipId: null, hit: false }));
    this.ships = new Map();
  }

  _idx(row, col) {
    return row * this.size + col;
  }

  /** Cópia defensiva da célula (evita mutação externa). */
  getCell(row, col) {
    if (!inBounds(row, col, this.size)) return null;
    return { ...this.cells[this._idx(row, col)] };
  }

  isInBounds(row, col) {
    return inBounds(row, col, this.size);
  }

  cellOccupied(row, col) {
    return inBounds(row, col, this.size) && this.cells[this._idx(row, col)].shipId !== null;
  }

  cellAttacked(row, col) {
    return inBounds(row, col, this.size) && this.cells[this._idx(row, col)].hit;
  }

  /**
   * Posiciona um navio. Valida geometria e sobreposição.
   * @returns {{ok:boolean, reason?:string, ship?:object}}
   */
  placeShip(ship, cells) {
    const reason = validateShipGeometry(cells, ship.size, this.size);
    if (reason) return { ok: false, reason };
    for (const { row, col } of cells) {
      if (this.cellOccupied(row, col)) return { ok: false, reason: 'overlap' };
    }
    for (const { row, col } of cells) {
      this.cells[this._idx(row, col)].shipId = ship.id;
    }
    this.ships.set(ship.id, {
      ...ship,
      hits: 0,
      sunk: false,
      cells: cells.map((c) => ({ ...c })),
    });
    return { ok: true, ship: this.ships.get(ship.id) };
  }

  /**
   * Recebe um disparo em uma coordenada.
   * @returns {{ok:boolean, reason?:string, result?:string, ship?:object, row:number, col:number}}
   *          result: 'miss' | 'hit' | 'sunk'
   */
  receiveShot(row, col) {
    if (!inBounds(row, col, this.size)) return { ok: false, reason: 'out-of-bounds', row, col };
    const cell = this.cells[this._idx(row, col)];
    if (cell.hit) return { ok: false, reason: 'already-attacked', row, col };
    cell.hit = true;
    if (cell.shipId === null) return { ok: true, result: 'miss', row, col };
    const ship = this.ships.get(cell.shipId);
    ship.hits += 1;
    if (ship.hits >= ship.size) ship.sunk = true;
    return { ok: true, result: ship.sunk ? 'sunk' : 'hit', ship: { ...ship, sunk: ship.sunk }, row, col };
  }

  isSunk(shipId) {
    const ship = this.ships.get(shipId);
    return Boolean(ship && ship.sunk);
  }
}

/** Posiciona uma lista de `{ ship, cells }` em um grid (atômico). */
export function placeFleet(grid, placements) {
  for (const placement of placements) {
    const res = grid.placeShip(placement.ship, placement.cells);
    if (!res.ok) return res;
  }
  return { ok: true };
}
