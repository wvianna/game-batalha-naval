# CODEBASE.md — Stack, arquitetura, convenções e testes

Projeto pequeno: documentação consolidada em um único arquivo (anti-bloat).

## Stack

- **Linguagem**: JavaScript ES6+ (ES Modules), sem TypeScript, sem build.
- **Marcação**: HTML5 semântico.
- **Estilo**: CSS3 — CSS Grid, unidades `vw`/`vh`, Media Queries, custom properties.
- **Runtime**: navegadores Chromium/Gecko/WebKit. Sem Node no runtime.
- **Testes**: `node --test` (Node.js v22.23.2), módulos JS puros.
- **Dependências**: nenhuma (runtime e dev).

## Arquitetura

```text
index.html
styles/main.css
src/
├── domain/          # puro: constants.js, grid.js, ships.js, engine.js
├── ai/              # puro: ai.js
├── state/           # puro: game.js (máquina de estados)
├── ui/              # DOM: board.js, format.js, setup.js, log.js
└── main.js          # bootstrap (liga ui ↔ state)
test/*.test.js       # ships, grid, engine, ai, game
```

Regra de dependência: `ui` → `state` → `ai`/`domain`. Nada em `domain`/`ai`/`state`
importa `ui` ou acessa `document`. `main.js` compõe tudo.

## Modelo de dados (conceitual)

- Coordenada: `{ row: 0..9, col: 0..9 }`; rótulo de exibição `A-1`…`J-10` é
  responsabilidade da UI (`formatCoord`).
- Célula: `{ shipId: string | null, hit: boolean }`.
- Navio: `{ id, name, size, cells: Coord[], hits: number }` — afundado quando
  `hits === size`.
- Grid: `ShipGrid` com `placeShip(ship, cells)` e `receiveShot(coord)`.
- Máscara da IA: `{ hits: Set<string>, misses: Set<string>, sunkShipIds: Set<string> }`.

## Convenções

- `camelCase` funções/variáveis; `PascalCase` classes.
- Funções puras para regras; efeitos colaterais só na UI.
- Um listener por tabuleiro (event delegation).
- Coordenadas internas sempre `{row, col}` com índices 0–9.

## Testes

- Runner: `node --test`.
- Cobertura mínima obrigatória: `ships.js` (validação de posicionamento),
  `engine.js` (resolução de disparo, naufrágio, vitória), `ai.js` (busca, caça,
  transição), `game.js` (turnos, lock, reset).
- Testes de UI: manuais/exploratórios, roteiro registrado em `HANDOFF.md`.

## Integrações

- Nenhuma integração externa (sem rede, sem persistência, sem backend).
- Única "integração": o navegador executando os módulos via `<script type="module">`.
