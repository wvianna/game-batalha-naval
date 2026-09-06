import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLEET,
  TOTAL_CELLS,
  computeShipCells,
  validateShipGeometry,
  generateRandomFleet,
  nextShipToPlace,
} from '../src/domain/ships.js';
import { ShipGrid } from '../src/domain/grid.js';

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('FLEET possui 5 navios somando 17 células (FR-002)', () => {
  assert.equal(FLEET.length, 5);
  assert.equal(TOTAL_CELLS, 17);
  const ids = new Set(FLEET.map((s) => s.id));
  assert.equal(ids.size, 5);
});

test('computeShipCells gera células horizontais e verticais', () => {
  assert.deepEqual(computeShipCells(2, 3, 4, 'h'), [
    { row: 2, col: 3 },
    { row: 2, col: 4 },
    { row: 2, col: 5 },
    { row: 2, col: 6 },
  ]);
  assert.deepEqual(computeShipCells(2, 3, 3, 'v'), [
    { row: 2, col: 3 },
    { row: 3, col: 3 },
    { row: 4, col: 3 },
  ]);
});

test('validateShipGeometry: casos válidos e inválidos (FR-003)', () => {
  assert.equal(validateShipGeometry(computeShipCells(0, 0, 5, 'h'), 5), null);
  assert.equal(validateShipGeometry(computeShipCells(5, 9, 5, 'h'), 5), 'out-of-bounds'); // col 10..14
  assert.equal(validateShipGeometry([{ row: 9, col: 9 }], 1), null);
  assert.equal(validateShipGeometry([{ row: 0, col: 0 }, { row: 1, col: 1 }], 2), 'not-straight'); // diagonal
  assert.equal(
    validateShipGeometry(
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 3 },
      ],
      3
    ),
    'not-contiguous'
  );
  assert.equal(validateShipGeometry(computeShipCells(0, 0, 5, 'h'), 4), 'wrong-size');
});

test('generateRandomFleet produz frota válida sem sobreposição (FR-004)', () => {
  const rng = mulberry32(42);
  const placements = generateRandomFleet({ rng });
  assert.ok(placements);
  assert.equal(placements.length, 5);
  const grid = new ShipGrid();
  const keys = new Set();
  for (const p of placements) {
    assert.ok(grid.placeShip(p.ship, p.cells).ok);
    for (const { row, col } of p.cells) keys.add(`${row}:${col}`);
  }
  assert.equal(keys.size, 17);
  // determinístico com a mesma semente
  const rng2 = mulberry32(42);
  assert.deepEqual(generateRandomFleet({ rng: rng2 }), placements);
});

test('nextShipToPlace retorna o primeiro navio não posicionado', () => {
  const grid = new ShipGrid();
  assert.equal(nextShipToPlace(grid).id, FLEET[0].id);
  grid.placeShip(FLEET[0], computeShipCells(0, 0, FLEET[0].size, 'h'));
  assert.equal(nextShipToPlace(grid).id, FLEET[1].id);
});
