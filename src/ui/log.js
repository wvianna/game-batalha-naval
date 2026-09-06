// Painel de log narrativo, mensagens de status e silhuetas da frota.
// Traduz os eventos estruturados do Game em narrativa em pt-BR.

import { FLEET } from '../domain/ships.js';
import { formatCoord } from './format.js';

export function eventText(ev) {
  if (ev.text) return ev.text; // eventos informativos pré-formatados
  const coord = ev.row !== undefined ? formatCoord(ev.row, ev.col) : '';
  const byPlayer = ev.by === 'player';
  const agent = byPlayer ? 'Você' : 'A IA';
  switch (ev.result) {
    case 'miss':
      return `${agent} atirou em ${coord}: água. Nada atingido.`;
    case 'hit':
      return byPlayer
        ? `Impacto em ${coord}! ${ev.shipName ?? 'navio'} inimigo danificado.`
        : `A IA acertou ${coord}! Danos no seu navio.`;
    case 'sunk':
      return byPlayer
        ? `Radar confirma: ${ev.shipName ?? 'navio'} inimigo AFUNDADO em ${coord}!`
        : `A IA afundou o seu ${ev.shipName ?? 'navio'} em ${coord}!`;
    default:
      return '';
  }
}

export function renderMessage(el, snap) {
  if (snap.state === 'SETUP') {
    const ship = snap.nextShip;
    el.textContent = ship
      ? `Posicione o ${ship.name} (${ship.size} células).`
      : 'Frota pronta! Clique em "Iniciar batalha".';
    return;
  }
  if (snap.state === 'PLAYER_TURN') {
    el.textContent = '🟢 Sua vez de atacar o tabuleiro inimigo.';
    return;
  }
  if (snap.state === 'AI_TURN') {
    el.textContent = '🤖 IA está pensando…';
    return;
  }
  if (snap.state === 'GAME_OVER') {
    el.textContent =
      snap.winner === 'player' ? '🏆 Vitória! Você afundou toda a frota inimiga.' : '💀 Derrota. Sua frota foi destruída.';
  }
}

export function renderLog(listEl, events) {
  listEl.replaceChildren();
  // Ordem: mais recente no topo.
  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i];
    const li = document.createElement('li');
    li.className = `log-item log--${ev.tone || 'info'}`;
    li.textContent = eventText(ev);
    if (li.textContent) listEl.append(li);
  }
}

function buildChip(ship, grid) {
  const rec = grid.ships.get(ship.id);
  const sunk = Boolean(rec && rec.sunk);
  const hits = rec ? rec.hits : 0;

  const row = document.createElement('div');
  row.className = `ship-chip${sunk ? ' ship-chip--sunk' : ''}`;

  const thumb = document.createElement('img');
  thumb.className = 'ship-chip__img';
  thumb.src = `assets/ships/${ship.id}.svg`;
  thumb.alt = ship.name;
  thumb.draggable = false;
  thumb.title = `${ship.name} — ${hits}/${ship.size} células atingidas`;
  thumb.style.width = `${ship.size * 15}px`;

  const label = document.createElement('span');
  label.className = 'ship-chip__name';
  label.textContent = sunk ? `${ship.name} ✕` : ship.name;

  const hitsPips = document.createElement('span');
  hitsPips.className = 'ship-chip__pips';
  for (let i = 0; i < ship.size; i++) {
    const pip = document.createElement('span');
    pip.className = `pip${i < hits ? ' pip--hit' : ''}`;
    hitsPips.append(pip);
  }

  row.append(thumb, label, hitsPips);
  return row;
}

export function renderFleetStatus(el, title, grid) {
  el.replaceChildren();
  const heading = document.createElement('h4');
  heading.textContent = title;
  el.append(heading);
  for (const ship of FLEET) {
    el.append(buildChip(ship, grid));
  }
}
