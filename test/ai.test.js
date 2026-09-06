import test from 'node:test';
import assert from 'node:assert/strict';
import { AI } from '../src/ai/ai.js';
import { ShipGrid, placeFleet } from '../src/domain/grid.js';
import { generateRandomFleet } from '../src/domain/ships.js';
import { isVictory } from '../src/domain/engine.js';

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('primeiro alvo obedece à paridade (busca) (FR-012)', () => {
  const ai = new AI({ rng: mulberry32(7) });
  const target = ai.chooseTarget();
  assert.ok(target);
  assert.equal((target.row + target.col) % 2, 0);
});

test('acerto confirmado leva ao Modo Caça em 100% dos casos (AC-001/FR-013)', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const ai = new AI({ rng: mulberry32(seed) });
    ai.registerResult({ row: 4, col: 4, result: 'hit' });
    assert.equal(ai.isHunting(), true, `semente ${seed} não entrou em caça`);
    const target = ai.chooseTarget();
    // Alvo adjacente ao acerto (N/S/L/O) e ainda não atacado.
    const delta = Math.abs(target.row - 4) + Math.abs(target.col - 4);
    assert.equal(delta, 1, `semente ${seed}: alvo não adjacente`);
  }
});

test('naufrágio confirmado limpa a pilha e retorna à Busca (FR-014)', () => {
  const ai = new AI({ rng: mulberry32(3) });
  ai.registerResult({ row: 4, col: 4, result: 'hit' });
  assert.equal(ai.isHunting(), true);
  ai.registerResult({ row: 4, col: 4, result: 'sunk' });
  assert.equal(ai.isHunting(), false);
  const target = ai.chooseTarget();
  assert.equal((target.row + target.col) % 2, 0);
});

test('IA nunca repete alvo e vence usando apenas a própria máscara (AC-003)', () => {
  const aiRng = mulberry32(11);
  const ai = new AI({ rng: aiRng });

  // Tabuleiro "oráculo": a IA NÃO o recebe; apenas resultados via registerResult.
  const board = new ShipGrid();
  const placements = generateRandomFleet({ rng: mulberry32(999) });
  assert.ok(placements);
  assert.deepEqual(placeFleet(board, placements), { ok: true });

  const fired = new Set();
  let shots = 0;
  while (!isVictory(board) && shots < 200) {
    const target = ai.chooseTarget();
    assert.ok(target, 'IA ficou sem alvo antes de vencer');
    const k = `${target.row}:${target.col}`;
    assert.ok(!fired.has(k), `alvo repetido: ${k}`);
    fired.add(k);
    const shot = board.receiveShot(target.row, target.col);
    assert.equal(shot.ok, true);
    ai.registerResult({ row: target.row, col: target.col, result: shot.result });
    shots += 1;
  }
  assert.ok(isVictory(board), 'IA não afundou a frota toda');
  assert.equal(ai.hits.size, 17, 'IA registrou acertos inconsistentes');
  // A IA só conhece aquilo que recebeu (máscara pública), nunca o tabuleiro.
  assert.equal(ai.hits.size + ai.misses.size, shots);
  assert.equal(board.ships.has('carrier'), true);
});
