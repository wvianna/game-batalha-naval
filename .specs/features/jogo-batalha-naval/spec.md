# spec.md — Jogo Batalha Naval Web (Humano vs. IA)

Feature única do projeto: o jogo completo. Especificação detalhada com
rastreabilidade requisito → teste → evidência.

## 1. Objetivo e fora de escopo

**Objetivo**: jogo Batalha Naval Humano vs. IA, em tecnologias web puras, com
lógica de jogo e IA priorizadas.

**Fora de escopo**: multiplayer entre humanos, persistência entre sessões,
placar/ranking, cronômetro de partida, sons, animações complexas.

## 2. Atores, estados e eventos

- **Atores**: Jogador humano; IA (oponente automatizado).
- **Estados** (máquina de estados): `SETUP`, `PLAYER_TURN`, `AI_TURN`, `GAME_OVER`.
- **Eventos**: `setup:shipPlaced`, `setup:randomFleet`, `shot:player`,
  `shot:ai`, `shot:resolved`, `game:victory`, `game:reset`.

## 3. Requisitos funcionais (FR)

| ID | Requisito | Teste | Evidência |
|---|---|---|---|
| FR-001 | Tabuleiro 10×10, coordenadas A–J × 1–10. | unit | `grid.test.js` |
| FR-002 | Frota 5/4/3/3/2 = 17 células. | unit | `ships.test.js` |
| FR-003 | Posicionamento manual clique+rotação, valida sobreposição/bordas. | unit + manual | `ships.test.js` + roteiro |
| FR-004 | Gerador aleatório com detecção de colisão. | unit | `ships.test.js` |
| FR-005 | Bloqueia disparo repetido/fora do grid (humano e IA). | unit | `engine.test.js`, `ai.test.js` |
| FR-006 | Disparo retorna Água/Acerto/Naufrágio. | unit | `engine.test.js` |
| FR-007 | Naufrágio detectado automaticamente. | unit | `engine.test.js` |
| FR-008 | Turnos sequenciais; humano inicia. | unit | `game.test.js` |
| FR-009 | Vitória exatamente no 17º acerto. | unit | `engine.test.js`, `game.test.js` |
| FR-010 | Reset sem refresh. | unit + manual | `game.test.js` + roteiro |
| FR-011 | IA usa apenas máscara hits/misses. | unit | `ai.test.js` |
| FR-012 | IA Busca por paridade `(x+y)%2==0`. | unit | `ai.test.js` |
| FR-013 | IA Caça stack LIFO (N,S,L,O). | unit | `ai.test.js` |
| FR-014 | IA Caça→Busca ao afundar. | unit | `ai.test.js` |
| FR-015 | Cores água=azul, acerto=vermelho, miss=cinza. | manual | roteiro |
| FR-016 | Log narrativo. | manual | roteiro |
| FR-017 | Silhuetas escurecem ao afundar. | manual | roteiro |
| FR-018 | Defesa à esquerda, ataque à direita. | manual | roteiro |

## 4. Requisitos não funcionais (NFR)

| ID | Requisito | Métrica | Verificação |
|---|---|---|---|
| NFR-001 | CSS Grid 10×10. | Grid nativo | inspeção de código |
| NFR-002 | Event delegation. | 1 listener/tabuleiro | inspeção de código |
| NFR-003 | Responsivo 360–1920px. | grid clicável | manual em viewports |
| NFR-004 | Chromium/Gecko/WebKit. | consistência | manual |
| NFR-005 | IA `setTimeout` ≤ 800 ms. | tempo de resposta | manual + medição |
| NFR-006 | Zero dependências. | sem `package.json` deps | inspeção |
| NFR-007 | ES Modules. | `import/export` | inspeção |
| NFR-008 | `node --test` verde. | suíte | CI local |
| NFR-009 | Acessibilidade básica. | semântica + teclado | manual |

## 5. Interface pública do motor (operações principais)

| Campo | `ShipGrid.placeShip(ship, cells)` |
|---|---|
| Entrada | navio (`{id,name,size}`) + lista de coordenadas `{row,col}` |
| Validações | tamanho da lista == `ship.size`; coordenadas em linha reta; dentro do grid; sem sobreposição |
| Saída | `{ ok: true }` ou `{ ok: false, reason }` |
| Efeito | marca células com `shipId` |

| Campo | `ShipGrid.receiveShot(coord)` |
|---|---|
| Entrada | `{row, col}` válida |
| Validações | coordenada dentro do grid; célula ainda não atacada |
| Saída | `{ result: 'miss' | 'hit' | 'sunk', ship?: Ship, coord }` |
| Efeito | marca `hit=true`; se `sunk`, retorna o navio afundado |

| Campo | `checkVictory(grid)` |
|---|---|
| Entrada | grid com hits acumulados |
| Saída | `true` quando 17 células de navios foram atingidas |

| Campo | `ai.chooseTarget(mask)` |
|---|---|
| Entrada | máscara pública (hits/misses/sunk) |
| Saída | coordenada `{row, col}` ainda não atacada |
| Regra | Caça (pilha) quando há acertos pendentes; senão Busca por paridade |

## 6. Critérios de aceite (AC)

- **AC-001** — DADO um acerto confirmado da IA, QUANDO o disparo é processado,
  ENTÃO a IA entra em Modo Caça em 100% dos casos.
- **AC-002** — DADO uma frota, QUANDO o 17º acerto é registrado, ENTÃO o jogo
  encerra e declara o vencedor imediatamente.
- **AC-003** — DADO o turno da IA, QUANDO ela escolhe um alvo, ENTÃO a escolha
  usa apenas o histórico de acertos/erros, sem acessar a matriz do jogador.
- **AC-004** — DADO resoluções de 360px a 1920px, QUANDO renderizado, ENTÃO o
  grid mantém proporções clicáveis.
- **AC-005** — DADO uma partida em andamento, QUANDO Reset é acionado, ENTÃO
  logs são limpos e matrizes de ambos reinicializadas sem recarregar o navegador.

## 7. Premissas, riscos e perguntas bloqueadoras

- **Premissas**: navegador moderno com suporte a ES Modules e CSS Grid.
- **Riscos**: diferenças de renderização cross-browser em telas pequenas;
  algoritmo de posicionamento aleatório pode gerar tentativas repetidas
  (mitigado por backtracking simples).
- **Perguntas bloqueadoras**: nenhuma (todas as decisões foram confirmadas).
