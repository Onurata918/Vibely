/**
 * Color Clash — saf model tipleri.
 *
 * docs/color-clash/protocol.ts sozlesmesini birebir yansitir. Bu klasordeki
 * hicbir dosya React Native, Expo, LiveKit, Supabase, soket, veritabani, sistem
 * saati veya uretim rastgeleligini import etmez; deste ve zaman disaridan verilir.
 */

export type Color = 'CRIMSON' | 'AZURE' | 'LIME' | 'GOLD';
export type Kind = 'NUMBER' | 'BLOCK' | 'FLIP' | 'DRAW_TWO' | 'COLOR_SHIFT' | 'CLASH_FOUR';
export type CardId = string;

export type Card = { id: CardId; kind: Kind; color: Color | null; value: number | null };

export const COLORS: readonly Color[] = ['CRIMSON', 'AZURE', 'LIME', 'GOLD'];

/** Renk tasiyan ozel kartlar (her renkte ikiser). */
export const COLORED_ACTIONS: readonly Kind[] = ['BLOCK', 'FLIP', 'DRAW_TWO'];
/** Renksiz kartlar (dorder adet). */
export const WILD_KINDS: readonly Kind[] = ['COLOR_SHIFT', 'CLASH_FOUR'];

export const TOTAL_CARDS = 108;
export const STARTING_HAND_SIZE = 7;
export const WINNING_SCORE = 500;

/** GAME_RULES "El ve mac sonu": puan degerleri. */
export const ACTION_CARD_POINTS = 20;
export const WILD_CARD_POINTS = 50;

export type Direction = 1 | -1;

export type Phase = 'AWAIT_ACTION' | 'AFTER_DRAW' | 'AWAIT_DRAW_FOUR_RESPONSE';

export type RoundStatus = 'ACTIVE' | 'ROUND_END_PENDING' | 'ROUND_ENDED' | 'ABORTED_DISCONNECT' | 'MATCH_ENDED';

export type EngineErrorCode =
  | 'NOT_YOUR_TURN'
  | 'INVALID_PHASE'
  | 'CARD_NOT_OWNED'
  | 'CARD_NOT_PLAYABLE'
  | 'COLOR_REQUIRED'
  | 'ILLEGAL_CLASH_FOUR'
  | 'CHALLENGE_NOT_ALLOWED'
  | 'CATCH_WINDOW_CLOSED'
  | 'ROUND_ENDED';

/** Motor ici tutarsizlik; gecersiz kullanici komutu degildir. */
export class InvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantError';
  }
}

export function isWild(card: Card): boolean {
  return card.kind === 'COLOR_SHIFT' || card.kind === 'CLASH_FOUR';
}

/** GAME_RULES: Number yuz degeri, renkli ozel 20, wild 50. */
export function cardPoints(card: Card): number {
  if (card.kind === 'NUMBER') return card.value ?? 0;
  return isWild(card) ? WILD_CARD_POINTS : ACTION_CARD_POINTS;
}
