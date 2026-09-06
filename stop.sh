#!/usr/bin/env bash
# Encerra o servidor HTTP local do jogo Batalha Naval.
# Uso: ./stop.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT/.server.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "Nenhum servidor em execução (arquivo de PID ausente)."
  exit 0
fi

PID="$(cat "$PID_FILE")"

if kill -0 "$PID" 2>/dev/null; then
  # Segurança: só encerra se o processo for mesmo o http.server iniciado.
  CMD="$(ps -p "$PID" -o command= 2>/dev/null || true)"
  if [[ "$CMD" != *"http.server"* ]]; then
    echo "O PID $PID não parece ser o servidor http.server; nada foi encerrado." >&2
    rm -f "$PID_FILE"
    exit 1
  fi
  kill "$PID"
  # Aguarda o processo terminar.
  for _ in $(seq 1 20); do
    kill -0 "$PID" 2>/dev/null || break
    sleep 0.1
  done
  echo "Servidor encerrado (PID $PID)."
else
  echo "Servidor já não está em execução (PID $PID)."
fi

rm -f "$PID_FILE"
