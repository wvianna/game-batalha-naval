# HANDOFF.md — Continuidade para o próximo agente

## Contexto

**Batalha Naval Web (Humano vs. IA)** implementado por completo em HTML5/CSS3/JS
puro. Planejamento e execução (T-001..T-010) concluídos.

## Estado atual

- Jogo jogável de ponta a ponta (setup → partida → vitória/derrota → reset).
- 26 testes unitários verdes (`node --test`).
- AC-001..AC-005 verificados (ver `STATUS.md`).

## O que foi implementado

- `src/domain/` — motor puro: `constants.js`, `ships.js`, `grid.js`, `engine.js`.
- `src/ai/ai.js` — IA com paridade (busca) + pilha LIFO (caça); só recebe a máscara.
- `src/state/game.js` — máquina de estados SETUP/PLAYER_TURN/AI_TURN/GAME_OVER + lock + reset.
- `src/ui/` — boards (CSS Grid + event delegation), setup (clique+rotação), log/silhuetas.
- `index.html`, `styles/main.css`, `src/main.js` e `test/*.test.js`.

## Como executar e testar

```bash
node --test                    # 26 testes
python3 -m http.server 8000    # abrir http://localhost:8000
```

## Decisões e cuidados mantidos

- Domínio/IA/estado não importam DOM; apenas `src/ui` acessa `document`.
- IA não recebe o tabuleiro do jogador — apenas resultados via `registerResult`.
- 1 listener por tabuleiro (event delegation); turno da IA bloqueia o jogador.
- IA assíncrona via `setTimeout` (700 ms).

## Pendências / próximos passos

- Smoke em **Gecko (Firefox)** e **WebKit (Safari)** (NFR-004) — feito só em Chromium.
- `git init` + commit inicial não realizados (sem commits automáticos).

## Critério de conclusão

- `node --test` verde e jogo jogável: **atendidos**.
- AC-001..AC-005 com evidência: **atendidos** (`STATUS.md`).
- Documentação atualizada: **atendido** (`README.md`, `STATUS.md`, `TASKS.md`).
