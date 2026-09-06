import test from 'node:test';
import assert from 'node:assert/strict';
import { ShipGrid, placeFleet, inBounds, cellKey } from '../src/domain/grid.js';
import { FLEET, computeShipCells, generateRandomFleet } from '../src/domain/ships.js';

test('placeShip valida borda, sobreposição e geometria (FR-003)', () => {
  const grid = new ShipGrid();
  const carrier = FLEET[0];

  // Sucesso
  assert.deepEqual(grid.placeShip(carrier, computeShipCells(0, 0, 5, 'h')), { ok: true, ship: grid.ships.get('carrier') });
  assert.equal(grid.cellOccupied(0, 4), true);
  assert.equal(grid.cellOccupied(1, 0), false);

  // Sobreposição
  const res = grid.placeShip(FLEET[1], computeShipCells(0, 2, 4, 'h'));
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'overlap');

  // Extrapolação de borda
  const out = grid.placeShip(FLEET[1], computeShipCells(0, 8, 4, 'h'));
  assert.equal(out.ok, false);
  assert.equal(out.reason, 'out-of-bounds');
});

test('placeFleet posiciona uma frota completa', () => {
  const grid = new ShipGrid();
  const placements = generateRandomFleet();
  assert.ok(placements);
  assert.deepEqual(placeFleet(grid, placements), { ok: true });
  assert.equal(grid.ships.size, 5);
});

test('receiveShot: miss, hit e sunk (FR-006/FR-007)', () => {
  const grid = new ShipGrid();
  const frigate = FLEET[4]; // size 2
  grid.placeShip(frigate, computeShipCells(0, 0, 2, 'h'));

  const miss = grid.receiveShot(5, 5);
  assert.equal(miss.result, 'miss');
  assert.equal(miss.ok, true);

  const hit = grid.receiveShot(0, 0);
  assert.equal(hit.result, 'hit');
  assert.equal(hit.ok, true);
  assert.equal(grid.isSunk('frigate'), false);

  const sunk = grid.receiveShot(0, 1);
  assert.equal(sunk.result, 'sunk');
  assert.equal(sunk.ok, true);
  assert.equal(sunk.ship.name, 'Fragata');
  assert.equal(grid.isSunk('frigate'), true);
});

test('receiveShot bloqueia disparo repetido e fora do grid (FR-005)', () => {
  const grid = new ShipGrid();
  grid.placeShip(FLEET[4], computeShipCells(0, 0, 2, 'h'));
  grid.receiveShot(0, 0);
  assert.equal(grid.receiveShot(0, 0).reason, 'already-attacked');
  assert.equal(grid.receiveShot(-1, 0).reason, 'out-of-bounds');
  assert.equal(grid.receiveShot(10, 10).reason, 'out-of-bounds');
});

test('helpers inBounds e cellKey', () => {
  assert.equal(inBounds(0, 0), true);
  assert.equal(inBounds(9, 9), true);
  assert.equal(inBounds(10, 0), false);
  assert.equal(cellKey(3, 7), '3:7');
});
