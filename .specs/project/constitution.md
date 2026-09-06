# Constituição do projeto — Batalha Naval Web

Princípios não negociáveis do projeto. Fonte de `AGENTS.md`.

## 1. Simplicidade e fidelidade ao domínio

- O jogo é **vanilla**: HTML5 + CSS3 + JavaScript ES6+. Nenhuma dependência de
  runtime pode ser adicionada sem decisão registrada e justificada.
- A lógica de jogo é o centro da aplicação; a UI é uma camada fina sobre ela.

## 2. Separação domínio ↔ UI

- Regras de negócio (`src/domain`, `src/ai`, `src/state`) são puras e não
  acessam o DOM. Testável sem navegador.
- Apenas `src/ui` manipula `document` e eventos.

## 3. Correção das regras

- 10×10; A–J × 1–10; frota 5/4/3/3/2 = 17 células.
- Sem sobreposição, sem extrapolamento, sem disparo repetido ou fora do grid.
- Vitória exatamente no 17º acerto.
- A IA não tem acesso à matriz do jogador (apenas máscara hits/misses).

## 4. Qualidade verificável

- Toda regra e toda função da IA tem teste unitário (`node --test`).
- Critérios de aceite AC-001..AC-005 devem ser verificados com evidência.

## 5. Concorrência

- UI single-threaded; o turno da IA bloqueia interação do jogador (lock).
- A IA dispara de forma assíncrona (`setTimeout` ≤ 800 ms).

## 6. Documentação

- Documentação desatualizada é defeito. `README.md`, `STATUS.md` e `TASKS.md`
  devem refletir o estado real ao final de cada tarefa.
