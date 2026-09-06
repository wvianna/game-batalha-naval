// Máquina de estados da partida: SETUP → PLAYER_TURN ↔ AI_TURN → GAME_OVER.
// Controla turnos, bloqueia disparos do humano durante o turno da IA (lock) e
// expõe um reset completo. Módulo puro: não importa DOM.

import { ShipGrid, placeFleet } from '../domain/grid.js';
import { FLEET, computeShipCells, nextShipToPlace, generateRandomFleet } from '../domain/ships.js';
import { isVictory } from '../domain/engine.js';
import { AI } from '../ai/ai.js';
import { HORIZONTAL } from '../domain/constants.js';

export const GAME_STATES = Object.freeze({
  SETUP: 'SETUP',
  PLAYER_TURN: 'PLAYER_TURN',
  AI_TURN: 'AI_TURN',
  GAME_OVER: 'GAME_OVER',
});

const MAX_FLEET_ATTEMPTS = 400;

export class Game {
  /**
   * @param {{aiDelay?:number, schedule?:function, aiRng?:function}} options
   *  - aiDelay: latência simulada da IA em ms (padrão 600, <= 800).
   *  - schedule: injetável para testes síncronos (padrão setTimeout).
   *  - aiRng: gerador determinístico para a IA (testes).
   */
  constructor({ aiDelay = 600, schedule, aiRng } = {}) {
    this.aiDelay = aiDelay;
    this._schedule = schedule ?? ((fn) => setTimeout(fn, this.aiDelay));
    this._aiRng = aiRng;
    this._listeners = [];
    this._gen = 0;
    this.reset();
  }

  /** Reinicia a partida inteira sem recarregar a página (FR-010/AC-005). */
  reset() {
    this._gen += 1;
    this.playerGrid = new ShipGrid();
    this.enemyGrid = new ShipGrid();
    this.ai = new AI({ rng: this._aiRng });
    this.state = GAME_STATES.SETUP;
    this.winner = null;
    this.setupComplete = false;
    this.events = [];
    this._notify();
  }

  // ---------------------------------------------------------------- SETUP --

  /**
   * Posiciona o próximo navio da frota a partir da célula inicial.
   * @param {number} row
   * @param {number} col
   * @param {'h'|'v'} orientation
   */
  playerPlaceShipAt(row, col, orientation = HORIZONTAL) {
    if (this.state !== GAME_STATES.SETUP) return { ok: false, reason: 'not-in-setup' };
    const ship = nextShipToPlace(this.playerGrid, FLEET);
    if (!ship) return { ok: false, reason: 'fleet-complete' };
    const cells = computeShipCells(row, col, ship.size, orientation);
    const res = this.playerGrid.placeShip(ship, cells);
    if (!res.ok) return res;
    this.setupComplete = nextShipToPlace(this.playerGrid, FLEET) === null;
    this._notify();
    return { ok: true, ship: ship.id, placed: this.playerGrid.ships.size };
  }

  clearPlayerFleet() {
    if (this.state !== GAME_STATES.SETUP) return { ok: false, reason: 'not-in-setup' };
    this.playerGrid = new ShipGrid();
    this.setupComplete = false;
    this._notify();
    return { ok: true };
  }

  randomizePlayerFleet() {
    if (this.state !== GAME_STATES.SETUP) return { ok: false, reason: 'not-in-setup' };
    const rng = this._aiRng ?? Math.random;
    for (let i = 0; i < MAX_FLEET_ATTEMPTS; i++) {
      const placements = generateRandomFleet({ rng });
      if (!placements) continue;
      const grid = new ShipGrid();
      if (placeFleet(grid, placements).ok) {
        this.playerGrid = grid;
        this.setupComplete = true;
        this._notify();
        return { ok: true };
      }
    }
    return { ok: false, reason: 'random-failed' };
  }

  _placeAiFleet() {
    const rng = this._aiRng ?? Math.random;
    for (let i = 0; i < MAX_FLEET_ATTEMPTS; i++) {
      const placements = generateRandomFleet({ rng });
      if (!placements) continue;
      const grid = new ShipGrid();
      if (placeFleet(grid, placements).ok) {
        this.enemyGrid = grid;
        return true;
      }
    }
    return false;
  }

  /** Encerra o setup e inicia a batalha. Humano sempre começa (FR-008). */
  startGame() {
    if (this.state !== GAME_STATES.SETUP) return { ok: false, reason: 'not-in-setup' };
    if (!this.setupComplete) return { ok: false, reason: 'fleet-incomplete' };
    if (!this._placeAiFleet()) return { ok: false, reason: 'ai-fleet-failed' };
    this._gen += 1;
    this.state = GAME_STATES.PLAYER_TURN;
    this.winner = null;
    this.events.push({ tone: 'info', text: '⚔ Batalha iniciada. Sua vez de atacar.' });
    this._notify();
    return { ok: true };
  }

  // -------------------------------------------------------------- disparos --

  /** Disparo do humano no tabuleiro inimigo (bloqueado fora de PLAYER_TURN). */
  playerFire(row, col) {
    if (this.state !== GAME_STATES.PLAYER_TURN) return { ok: false, reason: 'not-player-turn' };
    const shot = this.enemyGrid.receiveShot(row, col);
    if (!shot.ok) return shot;
    this.events.push(this._shotEvent('player', shot));
    if (isVictory(this.enemyGrid)) {
      this.state = GAME_STATES.GAME_OVER;
      this.winner = 'player';
      this.events.push({ tone: 'win' });
      this._notify();
      return { ok: true, shot, gameOver: true };
    }
    this.state = GAME_STATES.AI_TURN;
    this._notify();
    this._scheduleAiTurn();
    return { ok: true, shot };
  }

  _scheduleAiTurn() {
    const gen = this._gen;
    this._schedule(() => {
      if (gen !== this._gen || this.state !== GAME_STATES.AI_TURN) return;
      this._aiFire();
    });
  }

  _aiFire() {
    if (this.state !== GAME_STATES.AI_TURN) return;
    const target = this.ai.chooseTarget();
    if (!target) {
      // Não há célula livre: vitória da IA por esgotamento.
      this.state = GAME_STATES.GAME_OVER;
      this.winner = 'ai';
      this.events.push({ tone: 'loss' });
      this._notify();
      return;
    }
    const shot = this.playerGrid.receiveShot(target.row, target.col);
    if (!shot.ok) {
      // Guarda extra de consistência (não deve ocorrer).
      this.state = GAME_STATES.PLAYER_TURN;
      this._notify();
      return;
    }
    this.ai.registerResult({ row: target.row, col: target.col, result: shot.result });
    this.events.push(this._shotEvent('ai', shot));
    if (isVictory(this.playerGrid)) {
      this.state = GAME_STATES.GAME_OVER;
      this.winner = 'ai';
      this.events.push({ tone: 'loss' });
    } else {
      this.state = GAME_STATES.PLAYER_TURN;
    }
    this._notify();
  }

  _shotEvent(by, shot) {
    return {
      by,
      row: shot.row,
      col: shot.col,
      result: shot.result,
      shipName: shot.ship ? shot.ship.name : null,
      tone: shot.result === 'miss' ? 'miss' : shot.result === 'sunk' ? 'sunk' : 'hit',
    };
  }

  // ------------------------------------------------------------ snapshot ---

  snapshot() {
    return {
      state: this.state,
      winner: this.winner,
      playerGrid: this.playerGrid,
      enemyGrid: this.enemyGrid,
      events: this.events,
      setupComplete: this.setupComplete,
      canPlayerShoot: this.state === GAME_STATES.PLAYER_TURN,
      inSetup: this.state === GAME_STATES.SETUP,
      gameOver: this.state === GAME_STATES.GAME_OVER,
      nextShip: this.state === GAME_STATES.SETUP ? nextShipToPlace(this.playerGrid, FLEET) : null,
    };
  }

  subscribe(listener) {
    this._listeners.push(listener);
    listener(this.snapshot());
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }

  _notify() {
    const snap = this.snapshot();
    for (const listener of this._listeners) listener(snap);
  }
}
