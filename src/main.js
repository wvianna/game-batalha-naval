// Bootstrap: liga a máquina de estados (Game) à camada de UI.

import { Game, GAME_STATES } from './state/game.js';
import { initBoard, renderBoard } from './ui/board.js';
import { initSetupUI } from './ui/setup.js';
import { renderMessage, renderLog, renderFleetStatus } from './ui/log.js';
import { formatCoord } from './ui/format.js';

const playerBoardEl = document.getElementById('player-board');
const enemyBoardEl = document.getElementById('enemy-board');
const messageEl = document.getElementById('message');
const logEl = document.getElementById('log');
const playerFleetEl = document.getElementById('player-fleet');
const enemyFleetEl = document.getElementById('enemy-fleet');
const resetBtn = document.getElementById('btn-reset');
const bannerEl = document.getElementById('turn-banner');

const game = new Game({ aiDelay: 700 });

const setupUI = initSetupUI({
  game,
  onChanged() {
    // re-utilizado quando a orientação muda para atualizar o aviso.
  },
});

// Clique no tabuleiro de ATAQUE (direita) dispara; no de DEFESA (esquerda),
// durante o setup, posiciona o navio atual.
initBoard(playerBoardEl, (row, col) => {
  const snap = game.snapshot();
  if (!snap.inSetup) return;
  const res = game.playerPlaceShipAt(row, col, setupUI.getOrientation());
  if (!res.ok && res.reason) flashCoordFeedback(playerBoardEl, row, col, res.reason);
});

initBoard(enemyBoardEl, (row, col) => {
  const snap = game.snapshot();
  if (!snap.canPlayerShoot) return;
  const res = game.playerFire(row, col);
  if (!res.ok && res.reason) flashCoordFeedback(enemyBoardEl, row, col, res.reason);
});

function flashCoordFeedback(boardEl, row, col, reason) {
  const cell = [...boardEl.querySelectorAll('.cell')].find(
    (c) => Number(c.dataset.row) === row && Number(c.dataset.col) === col
  );
  if (cell) {
    cell.classList.add('cell--invalid');
    setTimeout(() => cell.classList.remove('cell--invalid'), 450);
  }
  const msg = document.createElement('div');
  msg.className = 'toast';
  msg.textContent =
    reason === 'already-attacked'
      ? `Coordenada ${formatCoord(row, col)} já foi atacada.`
      : reason === 'out-of-bounds'
        ? 'Fora do tabuleiro.'
        : reason === 'overlap'
          ? 'Sobreposição com outro navio.'
          : reason === 'out-of-grid'
            ? 'Navio ultrapassaria a borda.'
            : 'Movimento inválido.';
  logEl.parentElement.appendChild(msg);
  setTimeout(() => msg.remove(), 2000);
}

function render(snap) {
  renderBoard(playerBoardEl, snap.playerGrid, 'own');
  renderBoard(enemyBoardEl, snap.enemyGrid, 'enemy');
  renderMessage(messageEl, snap);
  renderLog(logEl, snap.events);
  renderFleetStatus(playerFleetEl, 'Sua frota', snap.playerGrid);
  renderFleetStatus(enemyFleetEl, 'Frota inimiga', snap.enemyGrid);
  setupUI.refresh(snap);

  // Banner de turno.
  let bannerText;
  let tone = 'neutral';
  if (snap.state === GAME_STATES.SETUP) {
    bannerText = 'Preparação — posicione sua frota';
  } else if (snap.state === GAME_STATES.PLAYER_TURN) {
    bannerText = 'Sua vez';
    tone = 'player';
  } else if (snap.state === GAME_STATES.AI_TURN) {
    bannerText = 'IA pensando…';
    tone = 'ai';
  } else {
    bannerText = snap.winner === 'player' ? 'Vitória!' : 'Derrota';
    tone = snap.winner === 'player' ? 'win' : 'loss';
  }
  bannerEl.textContent = bannerText;
  bannerEl.className = `turn-banner turn-banner--${tone}`;

  resetBtn.hidden = snap.inSetup;
}

resetBtn.addEventListener('click', () => {
  game.reset();
  render(game.snapshot());
});

game.subscribe(render);
setupUI.mount();
setupUI.setOrientationChange(() => render(game.snapshot()));
render(game.snapshot());
