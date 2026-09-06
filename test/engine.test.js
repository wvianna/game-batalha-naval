import test from 'node:test';
import assert from 'node:assert/strict';
import { ShipGrid, placeFleet } from '../src/domain/grid.js';
import { generateRandomFleet } from '../src/domain/ships.js';
import { countHits, isVictory, sunkShips } from '../src/domain/engine.js';

function buildFullGrid() {
  const grid = new ShipGrid();
  const placements = generateRandomFleet();
  assert.ok(placements);
  assert.deepEqual(placeFleet(grid, placements), { ok: true });
  return grid;
}

test('countHits conta apenas acertos em navios', () => {
  const grid = buildFullGrid();
  assert.equal(countHits(grid), 0);
  const [ship] = [...grid.ships.values()];
  grid.receiveShot(ship.cells[0].row, ship.cells[0].col);
  assert.equal(countHits(grid), 1);

  // Disparo em célula garantidamente sem navio não incrementa a contagem.
  let empty = null;
  for (let r = 0; r < 10 && !empty; r++) {
    for (let c = 0; c < 10; c++) {
      if (!grid.cellOccupied(r, c)) {
        empty = { row: r, col: c };
        break;
      }
    }
  }
  assert.ok(empty, 'não encontrou célula vazia');
  grid.receiveShot(empty.row, empty.col);
  assert.equal(countHits(grid), 1);
});

test('vitória apenas exatamente no 17º acerto (FR-009 / AC-002)', () => {
  const grid = buildFullGrid();
  const shipCells = [];
  for (const ship of grid.ships.values()) shipCells.push(...ship.cells);

  for (let i = 0; i < shipCells.length; i++) {
    const { row, col } = shipCells[i];
    const shot = grid.receiveShot(row, col);
    assert.equal(shot.ok, true, `disparo ${i + 1} falhou`);
    assert.equal(isVictory(grid), i === shipCells.length - 1, `falhou no acerto ${i + 1}`);
  }
  assert.equal(shipCells.length, 17);
});

test('isVictory com 16 acertos não encerra (integridade do 17º)', () => {
  const grid = buildFullGrid();
  const shipCells = [];
  for (const ship of grid.ships.values()) shipCells.push(...ship.cells);
  for (let i = 0; i < 16; i++) grid.receiveShot(shipCells[i].row, shipCells[i].col);
  assert.equal(countHits(grid), 16);
  assert.equal(isVictory(grid), false);
});

test('sunkShips lista apenas naufragados', () => {
  const grid = buildFullGrid();
  assert.equal(sunkShips(grid).length, 0);
  const frigate = grid.ships.get('frigate');
  for (const { row, col } of frigate.cells) grid.receiveShot(row, col);
  const sunk = sunkShips(grid);
  assert.equal(sunk.length, 1);
  assert.equal(sunk[0].id, 'frigate');
});
