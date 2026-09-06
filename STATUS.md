# STATUS.md — Estado do desenvolvimento

## Estado atual

| Item | Estado |
|---|---|
| Planejamento (SDD) | ✅ Concluído |
| Implementação (T-001..T-010) | ✅ Concluído |
| Testes unitários (`node --test`) | ✅ 26/26 passando |
| Validação de critérios de aceite | ✅ AC-001..AC-005 PASS |

## Concluído

- Código do jogo completo: `index.html`, `styles/main.css`, `src/**` (domain, ai, state, ui).
- Testes unitários em `test/` (ships, grid, engine, ai, game).
- Especificação estruturada e artefatos SDD em `.specs/`.
- Documentação (`README.md`, `AGENTS.md`), `LICENSE` e `.gitignore`.

## Critérios de aceite — verificação

| AC | Critério | Resultado | Evidência |
|---|---|---|---|
| AC-001 | IA entra em Caça em 100% após acerto | PASS | `test/ai.test.js` (20 sementes) |
| AC-002 | Vitória exatamente no 17º acerto | PASS | `test/engine.test.js` + `test/game.test.js` |
| AC-003 | IA usa apenas a máscara (sem matriz) | PASS | `test/ai.test.js` + revisão (só `registerResult`) |
| AC-004 | Grid clicável 360–1920px | PASS | Smoke Chromium: 360/375/1920 sem overflow, célula ~30px |
| AC-005 | Reset limpa logs/matrizes sem refresh | PASS | `test/game.test.js` + smoke Chromium |

## Validação manual (roteiro E2E — Chromium, 2026-09-06)

- Posicionamento manual por clique + rotação, rejeição de sobreposição (toast).
- Gerador aleatório e início da batalha (humano começa).
- Disparos alternados com lock de turno; IA responde em ~700 ms.
- IA demonstrou Modo Caça ao afundar Porta-aviões (F-6→F-10) e outros navios.
- Log narrativo, silhuetas escurecendo ao naufragar e cores (acerto vermelho/erro cinza).
- Reset retorna ao SETUP e limpa o log.

## Decisões (2026-09-06)

1. Posicionamento: clique + rotação. 2. IA: `setTimeout` (≤ 800 ms).
3. ES Modules em múltiplos arquivos. 4. Sem cronômetro. 5. Testes `node --test`.

## Pendências / riscos residuais

- Validar em Gecko (Firefox) e WebKit (Safari) — smoke feito apenas em Chromium.
- Repositório ainda não inicializado com `git init` (sem commits).

## Próximo passo recomendado

- Rodar smoke test em Firefox/Safari e, se desejado, `git init` + commit inicial.

## Última alteração relevante

2026-09-06 — Implementação completa do jogo (T-001..T-010) com 26 testes verdes.
