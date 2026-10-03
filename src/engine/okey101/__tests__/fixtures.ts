import { buildDeck, falseJokerId, numberTileId } from '../deck';
import { jokerFaceOf } from '../tiles';
import { type Color, type Face, type MeldInput, type Tile, type TileId } from '../types';

const DECK = buildDeck();
const BY_ID = new Map(DECK.map((t) => [t.id, t]));

export const lookup = (id: TileId): Tile | undefined => BY_ID.get(id);

const CODE: Record<string, Color> = { R: 'RED', B: 'BLUE', K: 'BLACK', Y: 'YELLOW' };

/**
 * `R4`, `R4#2`, `FJ`, `FJ#2` gibi kisa yazimdan tileId uretir.
 * Kopya belirtilmezse #1 kullanilir.
 */
export function id(short: string): TileId {
  const [base, copyText] = short.split('#');
  const copy = (copyText ? Number(copyText) : 1) as 1 | 2;
  if (base === 'FJ') return falseJokerId(copy);
  const color = CODE[base[0]];
  if (!color) throw new Error(`unknown colour code in "${short}"`);
  return numberTileId(color, Number(base.slice(1)), copy);
}

export const ids = (...shorts: string[]): TileId[] => shorts.map(id);

export function face(short: string): Face {
  const color = CODE[short[0]];
  if (!color) throw new Error(`unknown colour code in "${short}"`);
  return { color, value: Number(short.slice(1)) };
}

/** Gosterge Y12 iken gercek okey Y13'tur (OKEY101_TESTS.md varsayilani). */
export const INDICATOR_Y12: Face = face('Y12');
export const JOKER_FACE = jokerFaceOf(INDICATOR_Y12);

/** Gercek jokerin fiziksel kopyalari; J1 ve J2 olarak anilir. */
export const J1 = numberTileId(JOKER_FACE.color, JOKER_FACE.value, 1);
export const J2 = numberTileId(JOKER_FACE.color, JOKER_FACE.value, 2);

export function run(tiles: TileId[], assignments: MeldInput['assignments'] = []): MeldInput {
  return { kind: 'RUN', tiles, assignments };
}
export function set(tiles: TileId[], assignments: MeldInput['assignments'] = []): MeldInput {
  return { kind: 'SET', tiles, assignments };
}
export function pair(tiles: TileId[], assignments: MeldInput['assignments'] = []): MeldInput {
  return { kind: 'PAIR', tiles, assignments };
}
export function assign(tileId: TileId, short: string) {
  return { tileId, represents: face(short) };
}
