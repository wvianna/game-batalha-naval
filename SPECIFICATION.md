# SPECIFICATION.md — Especificação do Batalha Naval Web (Humano vs. IA)

Especificação independente de implementação, derivada de `docs/descricao.txt`.
A versão detalhada com rastreabilidade completa está em
`.specs/features/jogo-batalha-naval/spec.md`.

## 1. Visão geral

Adaptação web do clássico Batalha Naval, **Humano vs. CPU**, em tecnologias web
puras, priorizando a lógica de jogo e a inteligência do oponente. A IA simula
estratégia humana sem trapacear: interage apenas com uma máscara de estado
(hits/misses), nunca com o posicionamento privado do jogador.

## 2. Modelo de domínio

- **Tabuleiro**: matriz 10×10 (100 células por jogador).
- **Coordenadas**: linhas A–J, colunas 1–10 (internamente índices 0–9).
- **Frota** (17 acertos para vitória): Porta-aviões (5), Encouraçado (4),
  Destróier (3), Submarino (3), Fragata (2).
- **Orientação**: horizontal ou vertical; proibida sobreposição e extrapolamento.
- **Turnos**: sequenciais; humano inicia; alternância após disparo validado.

## 3. Requisitos funcionais

| ID | Requisito |
|---|---|
| FR-001 | Renderizar tabuleiro 10×10 com coordenadas A–J × 1–10. |
| FR-002 | Frota fixa de 5 embarcações totalizando 17 células. |
| FR-003 | Posicionamento manual por clique + rotação, validando sobreposição e bordas. |
| FR-004 | Gerador de posicionamento aleatório com detecção de colisão. |
| FR-005 | Bloquear disparos em coordenadas já atacadas ou fora do grid (humano e IA). |
| FR-006 | Processar disparo e retornar resultado: Água / Acerto / Naufrágio. |
| FR-007 | Detectar naufrágio automaticamente ao atingir todas as células de um navio. |
| FR-008 | Turnos sequenciais; humano inicia; alternância após disparo válido. |
| FR-009 | Declarar vitória exatamente após o 17º acerto na frota adversária. |
| FR-010 | Reset Game reinicializa matrizes e logs sem recarregar a página. |
| FR-011 | IA decide apenas com base no histórico de acertos/erros (sem matriz do jogador). |
| FR-012 | IA Modo Busca: paridade de tabuleiro de xadrez `(x + y) % 2 == 0`. |
| FR-013 | IA Modo Caça: pilha LIFO das 4 adjacências (N, S, L, O) após acerto. |
| FR-014 | IA retorna ao Modo Busca (limpando a pilha) ao confirmar naufrágio. |
| FR-015 | Feedback visual: água (azul), acerto (vermelho), miss (cinza). |
| FR-016 | Painel de log narrativo dos eventos. |
| FR-017 | Painel lateral com silhuetas das embarcações que escurecem ao afundar. |
| FR-018 | Layout: tabuleiro de defesa à esquerda, tabuleiro de ataque à direita. |

## 4. Requisitos não funcionais

| ID | Requisito | Métrica/condição |
|---|---|---|
| NFR-001 | Renderização com CSS Grid. | Grid 10×10 nativo. |
| NFR-002 | Event Delegation no container pai. | 1 listener por tabuleiro. |
| NFR-003 | Responsivo de 360px a 1920px. | Unidades vw/vh + media queries. |
| NFR-004 | Compatível Chromium, Gecko e WebKit. | Comportamento consistente. |
| NFR-005 | IA assíncrona. | `setTimeout`, resposta ≤ 800 ms. |
| NFR-006 | Zero dependências de runtime. | HTML5/CSS3/JS ES6+ puros. |
| NFR-007 | ES Modules. | `import`/`export`, sem globais. |
| NFR-008 | Testes unitários. | `node --test` verde. |
| NFR-009 | Acessibilidade básica. | Semântica HTML + navegação por teclado no posicionamento e disparo. |

## 5. Critérios de aceite (resumo)

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

## 6. Premissas e decisões

- Posicionamento por **clique + rotação** (decisão confirmada).
- IA assíncrona via **`setTimeout`** (decisão confirmada).
- **Sem cronômetro** de partida (decisão confirmada).
- Código em **ES Modules** (decisão confirmada).
- Autor do copyright: "William" (ajustável em `LICENSE`).
