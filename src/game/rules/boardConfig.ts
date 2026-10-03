// Raster measurements reproduced by scripts/measure-board-grid.py.
// These are boundary samples, not number-glyph positions. The artwork is nonuniform.
export const IMAGE_WIDTH = 1170;
export const IMAGE_HEIGHT = 1560;
export const COLUMN_EDGES_PX = [62, 174, 268, 355, 450, 591, 733, 829, 914, 997, 1107] as const;
export const ROW_EDGES_PX = [219, 300, 427, 558, 648, 773, 917, 1013, 1131, 1252, 1353] as const;
export const COLUMN_EDGES = COLUMN_EDGES_PX.map(x => x / IMAGE_WIDTH);
export const ROW_EDGES = ROW_EDGES_PX.map(y => y / IMAGE_HEIGHT);
export const BOARD_GRID_BOUNDS = {
  left: COLUMN_EDGES[0] * 100,
  top: ROW_EDGES[0] * 100,
  right: COLUMN_EDGES[10] * 100,
  bottom: ROW_EDGES[10] * 100,
};
export const BOARD = {
  left: BOARD_GRID_BOUNDS.left,
  top: BOARD_GRID_BOUNDS.top,
  width: BOARD_GRID_BOUNDS.right - BOARD_GRID_BOUNDS.left,
  height: BOARD_GRID_BOUNDS.bottom - BOARD_GRID_BOUNDS.top,
};
export const ladders: Record<number, number> = { 8: 34, 17: 36, 22: 58, 46: 85, 50: 70, 79: 98 };
// Card IDs match the dragon silhouette printed in each native artwork cell.
export const dragonEncounters: Record<number, number> = {
  4: 1, 15: 0, 30: 2, 37: 3, 41: 1, 52: 0, 61: 3,
  72: 1, 56: 0, 78: 2, 86: 0, 93: 2, 99: 3,
};
export const dragonSpaces = [4, 15, 30, 37, 41, 52, 56, 61, 72, 78, 86, 93, 99] as const;
export const heroSpaces: Record<number, Hero> = { 9: 'thor', 23: 'thor', 54: 'frexia', 71: 'loki', 80: 'frexia', 84: 'loki' };
export type Hero = 'loki' | 'thor' | 'frexia';
export type DragonCard = { id: number; name: string; penalty: number; image: string };
export const dragonDeck: DragonCard[] = [
  { id: 0, name: 'Spiral Dragon', penalty: 35, image: '/assets/derived/dragon-spiral.webp' },
  { id: 1, name: 'Serpent Dragon', penalty: 17, image: '/assets/derived/dragon-serpent.webp' },
  { id: 2, name: 'Winged Dragon', penalty: 26, image: '/assets/derived/dragon-wing.webp' },
  { id: 3, name: 'Golden Beast', penalty: 20, image: '/assets/derived/dragon-beast.webp' },
];
export const HERO_IMAGE: Record<Hero, string> = { loki: '/assets/derived/loki.webp', thor: '/assets/derived/thor.webp', frexia: '/assets/derived/frexia.webp' };
export type BoardCell = { row: number; col: number };
export function squareToIndex(square: number) {
  if (!Number.isInteger(square) || square < 1 || square > 100) throw new RangeError(`Invalid board square: ${square}`);
  return square - 1;
}
export function indexToSquare(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= 100) throw new RangeError(`Invalid board index: ${index}`);
  return index + 1;
}
export function getBoardCell(square: number): BoardCell {
  const index = squareToIndex(square);
  const row = Math.floor(index / 10);
  const col = row % 2 === 0 ? index % 10 : 9 - index % 10;
  return { row, col };
}
export function getSquareAtBoardCell({ row, col }: BoardCell) {
  if (!Number.isInteger(row) || row < 0 || row >= 10 || !Number.isInteger(col) || col < 0 || col >= 10) {
    throw new RangeError(`Invalid board cell: ${row},${col}`);
  }
  const index = row * 10 + (row % 2 === 0 ? col : 9 - col);
  return indexToSquare(index);
}
export function getCellCenter(square: number) {
  const { row, col } = getBoardCell(square);
  const visualRow = 9 - row;
  const artworkX = (COLUMN_EDGES_PX[col] + COLUMN_EDGES_PX[col + 1]) / 2;
  const artworkY = (ROW_EDGES_PX[visualRow] + ROW_EDGES_PX[visualRow + 1]) / 2;
  return {
    square, logicalRow: row, visualRow, visualColumn: col,
    artworkX, artworkY,
    normalizedX: artworkX / IMAGE_WIDTH,
    normalizedY: artworkY / IMAGE_HEIGHT,
    x: artworkX / IMAGE_WIDTH * 100,
    y: artworkY / IMAGE_HEIGHT * 100,
  };
}

export type SquareEffect =
 | { kind: 'ladder'; destination: number }
 | { kind: 'dragon'; cardId: number }
 | { kind: 'hero'; hero: Hero }
 | { kind: 'finish' }
 | { kind: 'none' };

// One artwork-backed lookup for movement detection and landing resolution.
export function getSquareEffect(square: number): SquareEffect {
 squareToIndex(square);
 if(square === 100) return {kind:'finish'};
 if(ladders[square] !== undefined) return {kind:'ladder',destination:ladders[square]};
 if(dragonEncounters[square] !== undefined) return {kind:'dragon',cardId:dragonEncounters[square]};
 if(heroSpaces[square] !== undefined) return {kind:'hero',hero:heroSpaces[square]};
 return {kind:'none'};
}
