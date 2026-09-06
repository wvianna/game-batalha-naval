import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, GAME_STATES } from '../src/state/game.js';
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

// schedule síncrono: o turno da IA completa imediatamente após o disparo.
const syncSchedule = () => (fn) => fn();
// schedule em fila: permite testar o lock do turno da IA.
function queueSchedule() {
  const q = [];
  return { schedule: (fn) => q.push(fn), q };
}

// Posiciona os 5 navios em linhas separadas (coluna 0, horizontal).
function placePlayerFleet(game) {
  const starts = [
    { row: 0, ship: 'carrier' },
    { row: 2, ship: 'battleship' },
    { row: 4, ship: 'destroyer' },
    { row: 6, ship: 'submarine' },
    { row: 8, ship: 'frigate' },
  ];
  for (const { row } of starts) {
    const res = game.playerPlaceShipAt(row, 0, 'h');
    assert.equal(res.ok, true, `falha ao posicionar em ${row}`);
  }
}

test('estado inicial é SETUP e setup completo apenas com a frota inteira', () => {
  const game = new Game({ schedule: syncSchedule(), aiRng: mulberry32(1) });
  assert.equal(game.state, GAME_STATES.SETUP);
  assert.equal(game.snapshot().inSetup, true);
  assert.equal(game.snapshot().setupComplete, false);

  placePlayerFleet(game);
  assert.equal(game.snapshot().setupComplete, true);
  const dup = game.playerPlaceShipAt(1, 0, 'h');
  assert.equal(dup.ok, false);
  assert.equal(dup.reason, 'fleet-complete');
});

test('sobreposição é rejeitada durante o setup (FR-003)', () => {
  const game = new Game({ schedule: syncSchedule(), aiRng: mulberry32(2) });
  game.playerPlaceShipAt(0, 0, 'h'); // porta-aviões
  const res = game.playerPlaceShipAt(0, 2, 'h'); // encouraçado sobreposto
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'overlap');
});

test('disparo é bloqueado fora do turno do jogador (lock) (FR-008/FR-005)', () => {
  const game = new Game({ schedule: syncSchedule(), aiRng: mulberry32(3) });
  // Antes de iniciar (SETUP): bloqueado.
  assert.equal(game.playerFire(0, 0).reason, 'not-player-turn');

  placePlayerFleet(game);
  assert.equal(game.startGame().ok, true);
  assert.equal(game.state, GAME_STATES.PLAYER_TURN);

  const res = game.playerFire(0, 0);
  assert.equal(res.ok, true);
  assert.equal(game.state, GAME_STATES.PLAYER_TURN); // turno da IA já ocorreu (sync)
  assert.equal(game.playerFire(0, 0).reason, 'already-attacked');
});

test('lock: sem disparo humano durante AI_TURN (FR-008)', () => {
  const q = queueSchedule();
  const game = new Game({ schedule: q.schedule, aiRng: mulberry32(4) });
  placePlayerFleet(game);
  game.startGame();
  assert.equal(game.playerFire(0, 0).ok, true);
  assert.equal(game.state, GAME_STATES.AI_TURN);
  assert.equal(game.snapshot().canPlayerShoot, false);
  assert.equal(game.playerFire(1, 1).reason, 'not-player-turn');
  // Executa o turno da IA agendado → volta para o jogador.
  for (const fn of q.q.splice(0)) fn();
  assert.equal(game.state, GAME_STATES.PLAYER_TURN);
});

test('reset reinicia tudo sem recarregar (FR-010 / AC-005)', () => {
  const q = queueSchedule();
  const game = new Game({ schedule: q.schedule, aiRng: mulberry32(5) });
  placePlayerFleet(game);
  game.startGame();
  game.playerFire(0, 0); // agenda turno da IA

  game.reset();
  assert.equal(game.state, GAME_STATES.SETUP);
  assert.equal(game.events.length, 0);
  assert.equal(game.snapshot().setupComplete, false);
  assert.equal(game.winner, null);

  // Turno da IA obsoleto não dispara após o reset.
  for (const fn of q.q.splice(0)) fn();
  assert.equal(game.state, GAME_STATES.SETUP);
  assert.equal(game.enemyGrid.ships.size, 0);
});

test('vitória do jogador é declarada no 17º acerto (AC-002)', () => {
  const game = new Game({ schedule: syncSchedule(), aiRng: mulberry32(6) });
  placePlayerFleet(game);
  assert.equal(game.startGame().ok, true);
  assert.equal(game.state, GAME_STATES.PLAYER_TURN);

  // Cenário branco: 16 células inimigas já atingidas; resta 1.
  const shipCells = [];
  for (const ship of game.enemyGrid.ships.values()) shipCells.push(...ship.cells);
  assert.equal(shipCells.length, 17);
  for (let i = 0; i < 16; i++) {
    game.enemyGrid.receiveShot(shipCells[i].row, shipCells[i].col);
  }
  assert.equal(isVictory(game.enemyGrid), false);

  const last = shipCells[16];
  const res = game.playerFire(last.row, last.col);
  assert.equal(res.ok, true);
  assert.equal(game.state, GAME_STATES.GAME_OVER);
  assert.equal(game.winner, 'player');
  assert.equal(game.snapshot().gameOver, true);
});

test('startGame falha sem frota posicionada (setup incompleto)', () => {
  const game = new Game({ schedule: syncSchedule(), aiRng: mulberry32(7) });
  assert.equal(game.startGame().reason, 'fleet-incomplete');
});

test('posicionamento aleatório + início da partida funcionam', () => {
  const game = new Game({ schedule: syncSchedule(), aiRng: mulberry32(8) });
  assert.equal(game.randomizePlayerFleet().ok, true);
  assert.equal(game.snapshot().setupComplete, true);
  assert.equal(game.startGame().ok, true);
  assert.equal(game.state, GAME_STATES.PLAYER_TURN);
  assert.equal(game.enemyGrid.ships.size, 5);
});
