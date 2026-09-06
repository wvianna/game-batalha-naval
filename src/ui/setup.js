// Fase de posicionamento da frota: clique + rotação e botão aleatório.
// Estado local de orientação e ligação dos controles do painel de setup.

import { HORIZONTAL, VERTICAL } from '../domain/constants.js';
import { FLEET } from '../domain/ships.js';

export function initSetupUI({ game, onChanged }) {
  let orientation = HORIZONTAL;
  let hintEl;
  let rotateBtn;
  let randomBtn;
  let startBtn;
  let clearBtn;
  let panel;
  let onOrientationChange = null;

  function setHint(text) {
    if (hintEl) hintEl.textContent = text;
  }

  function refreshControls(snap) {
    if (!panel) return;
    if (!snap.inSetup) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const ship = snap.nextShip;
    if (ship) {
      const idx = FLEET.findIndex((s) => s.id === ship.id);
      setHint(
        `(${idx + 1}/${FLEET.length}) Clique na célula inicial do ${ship.name} (${ship.size} células). ` +
          `Orientação: ${orientation === HORIZONTAL ? 'horizontal' : 'vertical'}.`
      );
    } else {
      setHint('Frota completa! Ajuste ou inicie a batalha.');
    }
    if (startBtn) startBtn.disabled = !snap.setupComplete;
  }

  function getOrientation() {
    return orientation;
  }

  function toggleOrientation() {
    orientation = orientation === HORIZONTAL ? VERTICAL : HORIZONTAL;
    refreshControls(game.snapshot());
    if (onOrientationChange) onOrientationChange(orientation);
  }

  return {
    mount() {
      panel = document.getElementById('setup-panel');
      hintEl = document.getElementById('setup-hint');
      rotateBtn = document.getElementById('btn-rotate');
      randomBtn = document.getElementById('btn-random');
      startBtn = document.getElementById('btn-start');
      clearBtn = document.getElementById('btn-clear');

      rotateBtn?.addEventListener('click', () => {
        toggleOrientation();
        onChanged && onChanged();
      });
      randomBtn?.addEventListener('click', () => {
        game.randomizePlayerFleet();
      });
      startBtn?.addEventListener('click', () => {
        const res = game.startGame();
        if (!res.ok && res.reason) setHint(`Não foi possível iniciar: ${res.reason}`);
      });
      clearBtn?.addEventListener('click', () => {
        game.clearPlayerFleet();
      });
    },
    refresh(snap) {
      refreshControls(snap);
    },
    getOrientation,
    setOrientationChange(fn) {
      onOrientationChange = fn;
    },
  };
}
