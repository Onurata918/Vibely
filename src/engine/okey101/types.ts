/**
 * 101 Okey — saf model tipleri.
 *
 * docs/okey101/protocol.ts sozlesmesini birebir yansitir. Bu dosya ve bu
 * klasordeki her sey saftir: React Native, Expo, LiveKit, Supabase, veritabani,
 * ag, duvar saati ve rastgelelik importu yoktur. Zaman ve deste disaridan verilir.
 */

export type Color = 'RED' | 'BLUE' | 'BLACK' | 'YELLOW';
export type TileId = string;

/** Calisma zamani deger araligi 1..13. */
export type Face = { color: Color; value: number };

export type Tile =
  | { id: TileId; kind: 'NUMBER'; face: Face; copy: 1 | 2 }
  | { id: TileId; kind: 'FALSE_JOKER'; copy: 1 | 2 };

export type OpeningStatus = 'UNOPENED' | 'SERIES' | 'PAIRS';
export type MeldKind = 'RUN' | 'SET' | 'PAIR';

export type Assignment = { tileId: TileId; represents: Face };
export type MeldInput = { kind: MeldKind; tiles: TileId[]; assignments: Assignment[] };

export const COLORS: readonly Color[] = ['RED', 'BLUE', 'BLACK', 'YELLOW'];
export const MIN_VALUE = 1;
export const MAX_VALUE = 13;

/** R01: 4 renk x 13 sayi x 2 kopya + 2 sahte okey. */
export const TILES_PER_FACE = 2;
export const FALSE_JOKER_COUNT = 2;
export const NUMBER_TILE_COUNT = 104;
export const TOTAL_TILES = 106;

/** R03: baslayan 22, digerleri 21; gosterge 1; stok 20. */
export const SEAT_COUNT = 4;
export const STARTER_HAND_SIZE = 22;
export const HAND_SIZE = 21;
export const STOCK_SIZE = 20;

export type Seat = 0 | 1 | 2 | 3;

/** Motorun reddettigi her durum bu kodlarla konusur (protocol.ts ErrorCode). */
export type EngineErrorCode =
  | 'NOT_YOUR_TURN'
  | 'INVALID_PHASE'
  | 'TILE_NOT_OWNED'
  | 'DUPLICATE_TILE'
  | 'INVALID_MELD'
  | 'OPENING_TOO_LOW'
  | 'OPENING_MODE_LOCKED'
  | 'NOT_OPENED'
  | 'INVALID_DISCARD_PICKUP'
  | 'MUST_LEAVE_DISCARD'
  | 'STOCK_EMPTY'
  | 'ROUND_ENDED'
  | 'RULE_NOT_SPECIFIED';

/**
 * Motor ici tutarsizlik. Gecersiz kullanici komutu DEGILDIR — o EngineErrorCode
 * ile reddedilir. Bu, bozuk deste/sahiplik gibi asla olmamasi gereken durumdur.
 */
export class InvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantError';
  }
}
