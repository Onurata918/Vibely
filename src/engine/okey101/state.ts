import { deal } from './deal';
import { type ResolvedTile } from './meld';
import { DEFAULT_OPENING_RULES, EMPTY_OPENING_HISTORY, type OpeningHistory, type OpeningRules } from './opening';
import { jokerFaceOf } from './tiles';
import {
  SEAT_COUNT,
  type Face,
  type MeldKind,
  type OpeningStatus,
  type Seat,
  type Tile,
  type TileId,
} from './types';

export type Phase = 'AWAIT_DRAW' | 'AWAIT_PLAY';
export type RoundStatus = 'ACTIVE' | 'ROUND_ENDED';
export type FinishKind = 'NORMAL' | 'JOKER' | 'CLEAN' | 'CLEAN_JOKER' | 'STOCK_EXHAUSTED';

/** Masadaki per: fiziksel taslar ve kilitli temsil yuzleri (R02, Q08). */
export type TableMeld = {
  id: string;
  kind: MeldKind;
  ownerSeat: Seat;
  tiles: ResolvedTile[];
};

export type SeatState = {
  seat: Seat;
  hand: Tile[];
  opening: OpeningStatus;
  /** R11: bu elde kesinlesmis hamle cezalari. */
  actionPenalties: number;
};

export type Rules = OpeningRules & {
  turnSeconds: number;
  playableDiscardPenalty: number;
  nonWinningJokerDiscardPenalty: number;
};

export const DEFAULT_RULES: Rules = {
  ...DEFAULT_OPENING_RULES,
  turnSeconds: 45,
  playableDiscardPenalty: 101,
  nonWinningJokerDiscardPenalty: 101,
};

/**
 * Sunucuya ozel tam durum. Istemciye asla oldugu gibi gonderilmez;
 * projeksiyon acik izin listesiyle yapilir (VIBELY_GAME_ARCHITECTURE).
 */
export type FullState = {
  version: number;
  round: number;
  status: RoundStatus;
  rules: Rules;

  indicator: Tile;
  /** R02: gostergeden turetilen gercek okey yuzu. */
  jokerFace: Face;

  stock: Tile[];
  /** R06: seat basina atilanlar; soldan alma yalnizca onceki seat'in tepesinden olur. */
  discards: Tile[][];

  seats: SeatState[];
  table: TableMeld[];

  currentSeat: Seat;
  phase: Phase;
  /** R13: bu turda cekilmis tas; timeout bunu atar. */
  drawnTileId: TileId | null;
  /** R06: bu tur soldan alinan ve planda kullanilmasi zorunlu tas. */
  pickedDiscardId: TileId | null;

  openingHistory: OpeningHistory;
  /**
   * R09 CLEAN: bu tur **baslamadan once** herhangi bir oyuncu acmis miydi?
   * Tur basinda donar, tur icinde degismez.
   */
  anyoneOpenedBeforeTurn: boolean;

  winnerSeat: Seat | null;
  finishKind: FinishKind | null;
  /** Artan per kimligi; deterministik olmasi replay icin sarttir. */
  nextMeldSeq: number;
};

export type CreateRoundInput = {
  deck: readonly Tile[];
  starterSeat: Seat;
  round?: number;
  rules?: Rules;
  openingHistory?: OpeningHistory;
};

export function createRound({ deck, starterSeat, round = 1, rules = DEFAULT_RULES, openingHistory = EMPTY_OPENING_HISTORY }: CreateRoundInput): FullState {
  const dealt = deal(deck, starterSeat);
  return {
    version: 0,
    round,
    status: 'ACTIVE',
    rules,
    indicator: dealt.indicator,
    jokerFace: jokerFaceOf(indicatorFace(dealt.indicator)),
    stock: dealt.stock,
    discards: Array.from({ length: SEAT_COUNT }, () => []),
    seats: dealt.hands.map((hand, seat) => ({ seat: seat as Seat, hand, opening: 'UNOPENED', actionPenalties: 0 })),
    table: [],
    currentSeat: starterSeat,
    // R03/R06: baslayan oyuncu 22 tasla gelir ve ilk tur cekmez.
    phase: 'AWAIT_PLAY',
    drawnTileId: null,
    pickedDiscardId: null,
    openingHistory,
    anyoneOpenedBeforeTurn: false,
    winnerSeat: null,
    finishKind: null,
    nextMeldSeq: 1,
  };
}

/** Gosterge her zaman normal tastir (T004); yuzu dogrudan okunur. */
export function indicatorFace(indicator: Tile): Face {
  if (indicator.kind !== 'NUMBER') throw new Error('indicator must be a NUMBER tile');
  return indicator.face;
}

export function seatOf(state: FullState, seat: Seat): SeatState {
  return state.seats[seat];
}

export function previousSeat(seat: Seat): Seat {
  return (((seat + SEAT_COUNT - 1) % SEAT_COUNT) as Seat);
}

export function nextSeat(seat: Seat): Seat {
  return (((seat + 1) % SEAT_COUNT) as Seat);
}

/** Her seat'in eli + stok + gosterge + masa + atilanlar = 106 (R01). */
export function allTileIds(state: FullState): TileId[] {
  return [
    ...state.seats.flatMap((s) => s.hand.map((t) => t.id)),
    ...state.stock.map((t) => t.id),
    state.indicator.id,
    ...state.table.flatMap((m) => m.tiles.map((t) => t.tile.id)),
    ...state.discards.flat().map((t) => t.id),
  ];
}

/** Motor icindeki tas arama: el, masa, stok, atilanlar ve gosterge. */
export function lookupTile(state: FullState): (id: TileId) => Tile | undefined {
  const index = new Map<TileId, Tile>();
  for (const s of state.seats) for (const t of s.hand) index.set(t.id, t);
  for (const t of state.stock) index.set(t.id, t);
  index.set(state.indicator.id, state.indicator);
  for (const m of state.table) for (const t of m.tiles) index.set(t.tile.id, t.tile);
  for (const pile of state.discards) for (const t of pile) index.set(t.id, t);
  return (id) => index.get(id);
}
