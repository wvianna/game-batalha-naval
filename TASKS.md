# TASKS.md — Tarefas do projeto

Lista de tarefas do projeto. Detalhamento completo (dependências, testes, gates)
em `.specs/features/jogo-batalha-naval/tasks.md`.

Legenda: `[ ]` pendente · `[-]` em andamento · `[x]` concluída · `[!]` bloqueada

## Fase 1 — Fundação

- [x] T-001 Scaffold: `index.html`, `styles/`, estrutura de módulos, servir localmente.

## Fase 2 — Motor (domínio puro)

- [x] T-002 Modelo de dados: grid, navios, validação de posicionamento (puro) + testes.
- [x] T-003 Resolução de disparo: acerto/erro/naufrágio + detecção de vitória (puro) + testes.

## Fase 3 — Inteligência Artificial

- [x] T-004 IA: Modo Busca (paridade) + Modo Caça (pilha) + transição (puro) + testes.

## Fase 4 — Controle de estado

- [x] T-005 Máquina de estados: turnos, lock de turno, reset + testes.

## Fase 5 — Interface

- [x] T-006 Renderização dos tabuleiros (CSS Grid) + event delegation.
- [x] T-007 Posicionamento da frota (clique + rotação) + gerador aleatório.
- [x] T-008 Feedback de disparo, painel de log e painel de status da frota.

## Fase 6 — Qualidade e validação

- [x] T-009 Responsividade (360–1920px), cross-browser e acessibilidade básica.
- [x] T-010 Integração ponta a ponta + verificação dos critérios de aceite AC-001..AC-005.

## Entregáveis e aceite

- Código: `index.html`, `styles/main.css`, `src/**`, `test/**`.
- Build/execução: não há build; servir `python3 -m http.server 8000`.
- Testes: `node --test` (nível `LOCAL`).
- Critérios de aceite rastreados: AC-001 (T-004), AC-002 (T-003/T-010),
  AC-003 (T-004), AC-004 (T-009), AC-005 (T-005/T-010).
- Responsável pela validação: agente de implementação, com registro em `STATUS.md` e `HANDOFF.md`.
