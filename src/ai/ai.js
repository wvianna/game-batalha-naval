// Inteligência Artificial do oponente.
//
// A IA NÃO recebe o tabuleiro do jogador: opera apenas sobre uma máscara
// pública (histórico de acertos/erros) alimentada via registerResult().
//
// Modos:
//  - Busca (paridade): dispara primeiro nas coordenadas onde (row+col) % 2 === 0,
//    o que garante encontrar qualquer navio (>= 2 células) com metade dos tiros.
//  - Caça (stack-based): após um acerto, empilha as adjacências (N/S/L/O) em uma
//    pilha LIFO e dispara nelas até o navio afundar.
//  - Ao confirmar naufrágio, a pilha de caça é esvaziada e a IA volta à Busca.

import { GRID_SIZE } from '../domain/constants.js';

const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const key = (row, col) => `${row}:${col}`;

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseKey(k) {
  const [row, col] = k.split(':').map(Number);
  return { row, col };
}

export class AI {
  constructor({ size = GRID_SIZE, rng = Math.random } = {}) {
    this.size = size;
    this.hits = new Set();
    this.misses = new Set();
    this.huntStack = [];
    this._pushed = new Set();
    this._parity = [];
    this._nonParity = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        ((r + c) % 2 === 0 ? this._parity : this._nonParity).push(key(r, c));
      }
    }
    // Ordem de busca: paridade embaralhada primeiro, depois as demais.
    this._order = shuffle(this._parity, rng).concat(shuffle(this._nonParity, rng));
    this._searchIdx = 0;
  }

  _attacked(k) {
    return this.hits.has(k) || this.misses.has(k);
  }

  /** True quando a IA está em Modo Caça (pilha não vazia). */
  isHunting() {
    return this.huntStack.length > 0;
  }

  /**
   * Alimenta a máscara com o resultado de um disparo da IA.
   * @param {{row:number, col:number, result:'miss'|'hit'|'sunk'}} shot
   */
  registerResult({ row, col, result }) {
    const k = key(row, col);
    if (result === 'miss') {
      this.misses.add(k);
      this._pushed.delete(k);
      return;
    }
    this.hits.add(k);
    if (result === 'sunk') {
      // Naufrágio confirmado: limpa a pilha de caça e volta à Busca.
      this.huntStack.length = 0;
      this._pushed.clear();
      return;
    }
    // hit: empilha adjacências ainda não atacadas.
    for (const [dr, dc] of DIRS) {
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= this.size || c < 0 || c >= this.size) continue;
      const nk = key(r, c);
      if (this._attacked(nk) || this._pushed.has(nk)) continue;
      this.huntStack.push(nk);
      this._pushed.add(nk);
    }
  }

  /**
   * Escolhe o próximo alvo: topo da pilha de caça (se houver) ou próxima
   * coordenada válida da Busca por paridade.
   * @returns {{row:number, col:number} | null} null quando não há célula livre.
   */
  chooseTarget() {
    while (this.huntStack.length) {
      const k = this.huntStack.pop();
      this._pushed.delete(k);
      if (!this._attacked(k)) return parseKey(k);
    }
    while (this._searchIdx < this._order.length) {
      const k = this._order[this._searchIdx++];
      if (!this._attacked(k)) return parseKey(k);
    }
    // Fallback de completude: varre todas as células livres.
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this._attacked(key(r, c))) return { row: r, col: c };
      }
    }
    return null;
  }
}
