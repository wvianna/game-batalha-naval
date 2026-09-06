// Conversão de coordenadas internas {row 0..9, col 0..9} para rótulos A–J / 1–10.
// Responsabilidade exclusiva da camada de UI/formatting.

export function rowLabel(row) {
  return String.fromCharCode(65 + row); // 0 -> A, 9 -> J
}

export function colLabel(col) {
  return String(col + 1);
}

export function formatCoord(row, col) {
  return `${rowLabel(row)}-${colLabel(col)}`;
}
