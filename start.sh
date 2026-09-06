#!/usr/bin/env bash
# Inicia o servidor HTTP local do jogo Batalha Naval em segundo plano.
# Uso: ./start.sh   (porta personalizável com PORT=8080 ./start.sh)
set -euo pipefail

PORT="${PORT:-8000}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT/.server.pid"
URL="http://localhost:$PORT/index.html"

# Se já estiver rodando, apenas informa.
if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "O servidor já está em execução (PID $(cat "$PID_FILE")). Acesse $URL"
  exit 0
fi

# Remove PID órfão (processo morto, mas arquivo remanescente).
rm -f "$PID_FILE"

cd "$ROOT"
nohup python3 -m http.server "$PORT" >/dev/null 2>&1 &
echo $! > "$PID_FILE"

# Aguarda o servidor responder (até ~5 s).
for _ in $(seq 1 20); do
  if curl -sf -o /dev/null "$URL"; then
    echo "Servidor iniciado em http://localhost:$PORT (PID $(cat "$PID_FILE"))."
    exit 0
  fi
  sleep 0.25
done

echo "Erro: o servidor não respondeu em $URL." >&2
exit 1
