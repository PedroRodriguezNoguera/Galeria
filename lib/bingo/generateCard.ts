/**
 * Genera un cartón de bingo (90 bolas) tradicional: 3 filas x 9 columnas,
 * 15 números (5 por fila), cada columna con los números de su decena
 * (1-9, 10-19, ..., 80-90) en orden ascendente de arriba a abajo.
 *
 * El reparto de columnas por fila se balancea con un greedy (siempre se
 * asignan las marcas de una columna a las filas que menos números llevan
 * hasta ahora): como el total (15) es múltiplo exacto de 3, esto siempre
 * converge a 5-5-5. El bucle de reintento es solo un cinturón de seguridad.
 */
export type BingoCardGrid = (number | null)[][];

const ROWS = 3;
const COLS = 9;
const NUMBERS_PER_ROW = 5;
const TOTAL_NUMBERS = ROWS * NUMBERS_PER_ROW;

function columnRange(col: number): [number, number] {
  if (col === 0) return [1, 9];
  if (col === COLS - 1) return [80, 90];
  return [col * 10, col * 10 + 9];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildColumnCounts(): number[] {
  const counts = new Array(COLS).fill(1);
  let remaining = TOTAL_NUMBERS - COLS;
  while (remaining > 0) {
    const col = Math.floor(Math.random() * COLS);
    if (counts[col] < 3) {
      counts[col]++;
      remaining--;
    }
  }
  return counts;
}

// Los cartones reales nunca amontonan los números: siempre hay huecos
// repartidos entre ellos, nunca 4+ números tocándose seguidos en una fila.
function hasClusteredRun(filledCells: boolean[]): boolean {
  let run = 0;
  for (const isFilled of filledCells) {
    run = isFilled ? run + 1 : 0;
    if (run > 3) return true;
  }
  return false;
}

function assignRowsPerColumn(columnCounts: number[]): boolean[][] | null {
  const filled = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  const rowCounts = [0, 0, 0];

  for (const col of shuffle([...Array(COLS).keys()])) {
    const need = columnCounts[col];
    const rowsByLoad = [0, 1, 2]
      .map((r) => ({ r, load: rowCounts[r], tie: Math.random() }))
      .sort((a, b) => a.load - b.load || a.tie - b.tie)
      .map(({ r }) => r);

    for (let k = 0; k < need; k++) {
      const row = rowsByLoad[k];
      filled[row][col] = true;
      rowCounts[row]++;
    }
  }

  if (rowCounts.some((c) => c !== NUMBERS_PER_ROW)) return null;
  return filled;
}

export function generateBingoCard(): BingoCardGrid {
  for (let attempt = 0; attempt < 200; attempt++) {
    const columnCounts = buildColumnCounts();
    const filled = assignRowsPerColumn(columnCounts);
    if (!filled) continue;
    if (filled.some(hasClusteredRun)) continue;

    const grid: BingoCardGrid = Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
    for (let col = 0; col < COLS; col++) {
      const rowsWithNumber = [0, 1, 2].filter((r) => filled[r][col]);
      if (rowsWithNumber.length === 0) continue;

      const [min, max] = columnRange(col);
      const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      const picked = shuffle(pool)
        .slice(0, rowsWithNumber.length)
        .sort((a, b) => a - b);

      rowsWithNumber.forEach((row, i) => {
        grid[row][col] = picked[i];
      });
    }
    return grid;
  }
  // Con TOTAL_NUMBERS múltiplo exacto de ROWS esto no debería alcanzarse
  // nunca, pero una papeleta es mejor que un 500 si algún día cambian estas
  // constantes sin ajustar el balanceo.
  throw new Error("No se pudo generar la papeleta de bingo.");
}
