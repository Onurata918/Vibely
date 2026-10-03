import { buildDeck } from '../deck';
import { createRound, type FullState, type TableMeld } from '../state';
import { type ResolvedTile } from '../meld';
import { effectiveFace } from '../tiles';
import { type MeldKind, type Seat, type Tile, type TileId } from '../types';
import { id, ids, INDICATOR_Y12 } from './fixtures';

const DECK = buildDeck();
const BY_ID = new Map(DECK.map((t) => [t.id, t]));

export function tile(short: string): Tile {
  const t = BY_ID.get(id(short));
  if (!t) throw new Error(`fixture tile ${short} not found`);
  return t;
}

/**
 * Testler icin kontrollu bir masa kurar: gosterge Y12 (gercek okey Y13),
 * istenen eller tam olarak verilir, geri kalan taslar stoga gider.
 * Deste gercek dagitimdan gecirilmedigi icin 106 korunumu elle saglanir.
 */
export function buildState(options: {
  hands: Partial<Record<Seat, string[]>>;
  currentSeat?: Seat;
  phase?: 'AWAIT_DRAW' | 'AWAIT_PLAY';
  opening?: Partial<Record<Seat, 'UNOPENED' | 'SERIES' | 'PAIRS'>>;
  discards?: Partial<Record<Seat, string[]>>;
  table?: { kind: MeldKind; ownerSeat: Seat; tiles: string[] }[];
  stock?: string[];
  anyoneOpenedBeforeTurn?: boolean;
}): FullState {
  const indicatorId = id('Y12');
  const base = createRound({ deck: orderedDeck(indicatorId), starterSeat: 0 });

  const used = new Set<TileId>([indicatorId]);
  const take = (shorts: string[]): Tile[] =>
    shorts.map((s) => {
      const t = tile(s);
      if (used.has(t.id)) throw new Error(`fixture reuses tile ${s}`);
      used.add(t.id);
      return t;
    });

  const seats = base.seats.map((seat) => ({
    ...seat,
    hand: take(options.hands[seat.seat] ?? []),
    opening: options.opening?.[seat.seat] ?? ('UNOPENED' as const),
    actionPenalties: 0,
  }));

  const table: TableMeld[] = (options.table ?? []).map((m, i) => ({
    id: `m${i + 1}`,
    kind: m.kind,
    ownerSeat: m.ownerSeat,
    tiles: take(m.tiles).map<ResolvedTile>((t) => ({ tile: t, represents: effectiveFace(t, INDICATOR_Y12), wild: false })),
  }));

  const discards = base.discards.map((_, seat) => take(options.discards?.[seat as Seat] ?? []));
  // Acik verilen stok yalnizca **cekme sirasini** belirler; kalan butun taslar
  // arkasina eklenir, boylece 106 korunumu her zaman saglanir.
  const leading = options.stock ? take(options.stock) : [];
  const stock = [...leading, ...DECK.filter((t) => !used.has(t.id))];

  return {
    ...base,
    seats,
    table,
    discards,
    stock,
    nextMeldSeq: table.length + 1,
    currentSeat: options.currentSeat ?? 0,
    phase: options.phase ?? 'AWAIT_PLAY',
    anyoneOpenedBeforeTurn: options.anyoneOpenedBeforeTurn ?? seats.some((s) => s.opening !== 'UNOPENED'),
  };
}

/** createRound'un gosterge secimini belirli kilmak icin desteyi yeniden sirala. */
function orderedDeck(indicatorId: TileId): Tile[] {
  const rest = DECK.filter((t) => t.id !== indicatorId);
  const indicator = BY_ID.get(indicatorId)!;
  // Ilk 85 tas eller, 86. tas gosterge olur.
  return [...rest.slice(0, 85), indicator, ...rest.slice(85)];
}

/** Masadaki perin kimligini bulmak icin kisayol. */
export function meldIdOf(state: FullState, index = 0): string {
  return state.table[index].id;
}

export const handIds = (state: FullState, seat: Seat): TileId[] => state.seats[seat].hand.map((t) => t.id);
export { ids };
