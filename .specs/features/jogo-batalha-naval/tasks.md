# tasks.md — Tarefas detalhadas

Ordem estrita; cada tarefa termina com `node --test` verde (quando houver código)
e atualização de `TASKS.md`/`STATUS.md`.

---

Tarefa: T-001 Scaffold do projeto
Requisitos: NFR-006, NFR-007
Onde: `index.html`, `styles/main.css`, `src/**` (esqueletos), `test/` (vazio)
Depende de: nenhum
Reutiliza: nada
Feito quando: `index.html` abre via `python3 -m http.server` e carrega `main.js` como módulo
Testes: manual (abrir no navegador, sem erro de console)
Gate: servir localmente e inspecionar console

---

Tarefa: T-002 Modelo de dados (grid + navios + validação)
Requisitos: FR-001, FR-002, FR-003, FR-004
Onde: `src/domain/grid.js`, `src/domain/ships.js`, `test/grid.test.js`, `test/ships.test.js`
Depende de: T-001
Reutiliza: nada
Feito quando: `placeShip` valida tamanho/linha/borda/sobreposição; gerador aleatório produz frota válida
Testes: unit — casos de sucesso e de erro (sobreposição, borda, diagonal, tamanho errado)
Gate: `node --test`

---

Tarefa: T-003 Resolução de disparo, naufrágio e vitória
Requisitos: FR-005, FR-006, FR-007, FR-009
Onde: `src/domain/engine.js`, `test/engine.test.js`
Depende de: T-002
Reutiliza: `grid.js`
Feito quando: `receiveShot` retorna `miss|hit|sunk`; `checkVictory` true exatamente no 17º acerto
Testes: unit — miss, hit, sunk, disparo repetido, fora do grid, vitória no 17º
Gate: `node --test`

---

Tarefa: T-004 IA (busca + caça + transição)
Requisitos: FR-011, FR-012, FR-013, FR-014; AC-001, AC-003
Onde: `src/ai/ai.js`, `test/ai.test.js`
Depende de: T-003
Reutiliza: `engine.js` para simular resultados
Feito quando: `chooseTarget` respeita máscara; paridade na busca; pilha LIFO na caça; limpeza ao afundar
Testes: unit — 100% dos acertos levam a caça; nunca escolhe célula já atacada; nunca acessa grid do jogador
Gate: `node --test` + revisão de que `ai.js` não importa o grid do jogador

---

Tarefa: T-005 Máquina de estados (turnos, lock, reset)
Requisitos: FR-008, FR-010; AC-005
Onde: `src/state/game.js`, `test/game.test.js`
Depende de: T-004
Reutiliza: `engine.js`, `ai.js`
Feito quando: alternância humano→IA→humano; lock bloqueia disparo durante turno da IA; reset restaura tudo
Testes: unit — sequência de turnos, lock, reset limpa estado
Gate: `node --test`

---

Tarefa: T-006 Renderização dos tabuleiros + event delegation
Requisitos: FR-001, FR-015, FR-018; NFR-001, NFR-002
Onde: `src/ui/board.js`, `styles/main.css`
Depende de: T-005
Reutiliza: `game.js`
Feito quando: dois grids 10×10 (defesa à esquerda, ataque à direita); um listener por tabuleiro
Testes: manual — clique reflete na célula; inspeção de código (1 listener)
Gate: `node --test` (não regride) + teste manual

---

Tarefa: T-007 Posicionamento da frota (clique + rotação) + aleatório
Requisitos: FR-003, FR-004; NFR-009
Onde: `src/ui/setup.js`, `styles/main.css`
Depende de: T-006
Reutiliza: `ships.js`
Feito quando: posicionar navio por clique + rotação (tecla/tecla/botão); botão "Aleatório"
Testes: manual — posicionar os 5 navios, rotacionar, invalidar sobreposição, usar aleatório
Gate: `node --test` + teste manual

---

Tarefa: T-008 Feedback de disparo, log e painel de frota
Requisitos: FR-015, FR-016, FR-017
Onde: `src/ui/log.js`, `src/ui/board.js`, `styles/main.css`
Depende de: T-007
Reutiliza: `game.js`
Feito quando: células coloridas (água/acerto/miss); log narrativo; silhuetas escurecem
Testes: manual — disparar, ver cores, log e painel
Gate: `node --test` + teste manual

---

Tarefa: T-009 Responsividade, cross-browser e acessibilidade
Requisitos: NFR-003, NFR-004, NFR-009; AC-004
Onde: `styles/main.css`, `index.html`
Depende de: T-008
Reutiliza: nada
Feito quando: grid clicável em 360px–1920px; consistência Chromium/Gecko/WebKit; navegação por teclado básica
Testes: manual — viewports 360/768/1366/1920; 3 motores de navegador
Gate: teste manual registrado

---

Tarefa: T-010 Integração E2E + verificação dos critérios de aceite
Requisitos: AC-001, AC-002, AC-003, AC-004, AC-005
Onde: fluxo completo no navegador
Depende de: T-009
Reutiliza: todos
Feito quando: partida completa (setup→vitória→reset) funciona; AC-001..AC-005 verificados
Testes: E2E manual com roteiro; evidência registrada em `STATUS.md`/`HANDOFF.md`
Gate: `node --test` + roteiro E2E executado

---

## Entregáveis e aceite

- Arquivos: `index.html`, `styles/main.css`, `src/**`, `test/**`.
- Execução: `python3 -m http.server 8000` (sem build).
- Testes: `node --test` (nível `LOCAL`); UI/E2E manuais com roteiro.
- Critérios rastreados: AC-001 (T-004), AC-002 (T-003/T-010), AC-003 (T-004),
  AC-004 (T-009), AC-005 (T-005/T-010).
- Riscos residuais: validação cross-browser depende de ambiente manual.
- Responsável pela validação: agente de implementação.
