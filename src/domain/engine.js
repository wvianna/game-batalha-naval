// Motor do jogo: contagem de acertos, detecção de vitória e naufrágios.
// Módulo puro: opera sobre instâncias de ShipGrid.

import { TOTAL_CELLS } from './ships.js';

/** Conta células de navio já atingidas (acertos válidos). */
export function countHits(grid) {
  let n = 0;
  for (const cell of grid.cells) {
    if (cell.hit && cell.shipId !== null) n += 1;
  }
  return n;
}

/** Naufrágios confirmados. */
export function sunkShips(grid) {
  return [...grid.ships.values()].filter((ship) => ship.sunk);
}

/**
 * Vitória: todas as 17 células da frota adversária atingidas.
 * Com frota de 17 células, `>=` equivale a "exatamente no 17º acerto".
 */
export function isVictory(grid) {
  return countHits(grid) >= TOTAL_CELLS;
}
