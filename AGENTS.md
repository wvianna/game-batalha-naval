# AGENTS.md — Regras permanentes do projeto

Leia este arquivo **antes** de modificar qualquer código. Regras violam estas
normas devem ser corrigidas antes da entrega.

## 1. Objetivo e escopo

Jogo web **Batalha Naval (Humano vs. IA)** em HTML5/CSS3/JS (ES6+) puro. A
especificação de requisitos está em `docs/descricao.txt`; a especificação
estruturada com IDs está em `SPECIFICATION.md` e `.specs/features/jogo-batalha-naval/spec.md`.

## 2. Tecnologias e versões

| Item | Decisão |
|---|---|
| Linguagem | JavaScript ES6+ (ES Modules) |
| Marcação/estilo | HTML5 semântico, CSS3 (CSS Grid, vw/vh, Media Queries) |
| Dependências de runtime | **Nenhuma** (vanilla) |
| Testes | `node --test` (Node.js ≥ 20; validado v22.23.2) |
| Licença | Apache License 2.0 |
| Documentação | Português (pt-BR) |

## 3. Arquitetura obrigatória

- **Separação rígida entre domínio e UI.** Toda a lógica do jogo vive em
  `src/domain/` e `src/ai/` e **não pode importar DOM**. A camada `src/ui/` é a
  única que toca `document`/eventos.
- **Módulos ES** (import/export), nunca variáveis globais nem um único arquivo.
- **Event Delegation**: listeners de clique ficam no container pai do tabuleiro
  (um listener por tabuleiro), nunca por célula.
- **Máquina de estados** em `src/state/game.js` controla turnos e bloqueia
  disparos do humano durante o turno da IA (lock de turno).
- **IA assíncrona via `setTimeout`** (≤ 800 ms), sem Web Worker.
- **IA sem acesso à matriz do jogador**: opera apenas sobre a máscara de
  hits/misses (histórico público).

## 4. Convenções de código

- Inglês para nomes de símbolos/comentários de código; português para docs.
- `camelCase` para funções/variáveis; `PascalCase` para classes/componentes.
- Funções puras para regra de negócio (fáceis de testar); efeitos colaterais
  confinados à camada de UI.
- Cada módulo exporta uma API mínima e explícita.
- Sem `var`; use `const`/`let`. Prefira funções pequenas e nomes descritivos.

## 5. Coordenadas e modelo

- Linhas A–J (índice 0–9), colunas 1–10 (índice 0–9). Internamente use índices
  inteiros `{row: 0..9, col: 0..9}`; a conversão para rótulo (ex.: `B-7`) é
  responsabilidade da camada de UI/formatting.
- Frota: 1×5, 1×4, 1×3, 1×3, 1×2 = 17 células.

## 6. Testes

- Toda regra de negócio e toda função da IA tem teste unitário em `test/`.
- Rodar `node --test` e obter sucesso antes de declarar uma tarefa concluída.
- Testes de UI são manuais/exploratórios (registrados no roteiro em `HANDOFF.md`).

## 7. Comandos

```bash
node --test                    # testes unitários
python3 -m http.server 8000    # servir o jogo localmente
```

## 8. Git

- Não fazer commit automaticamente. Commits atômicos por tarefa.
- Nunca commitar `node_modules/`, artefatos de build ou segredos.

## 9. Critérios para alterar estas regras

Alterações em `AGENTS.md` exigem registro em `STATUS.md` e, se relevantes, em
`.specs/project/constitution.md`, com justificativa explícita.
