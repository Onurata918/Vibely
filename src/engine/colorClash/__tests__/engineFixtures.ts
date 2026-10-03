import { applyAction, type Action, type Deps } from '../engine';
import { createRound, type FullState, type Rules, DEFAULT_RULES } from '../state';
import { type Card, type Color, type Phase } from '../types';
import { ALL_CARDS, deckWith, identityShuffle, num } from './fixtures';

export const deps: Deps = { random: identityShuffle };

/** Her oyuncuya cakismayan dolgu eli verir. */
function fillerHands(playerCount: number, used: Card[]): Card[][] {
  const taken = new Set(used.map((c) => c.id));
  const pool = ALL_CARDS.filter((c) => !taken.has(c.id) && c.kind === 'NUMBER');
  const hands: Card[][] = [];
  let cursor = 0;
  for (let seat = 0; seat < playerCount; seat++) {
    hands.push(pool.slice(cursor, cursor + 7));
    cursor += 7;
  }
  return hands;
}

/**
 * Belirli eller ve belirli bir ust kartla oyun kurar.
 * Verilmeyen eller cakismayan sayi kartlariyla doldurulur.
 */
export function gameWith(options: {
  hands?: Partial<Record<number, Card[]>>;
  start: Card;
  rules?: Partial<Rules>;
  currentSeat?: number;
  phase?: Phase;
  activeColor?: Color;
  drawPile?: Card[];
}): FullState {
  const rules: Rules = { ...DEFAULT_RULES, ...options.rules };
  const explicit = Object.values(options.hands ?? {}).flat() as Card[];
  // Zorlanan cekme destesi kartlari dolgu ellerine de dagitilmamali; yoksa
  // ayni kart iki bolgede olur ve korunum bozulur.
  const filler = fillerHands(rules.playerCount, [...explicit, options.start, ...(options.drawPile ?? [])]);

  const hands: Card[][] = [];
  for (let seat = 0; seat < rules.playerCount; seat++) {
    hands.push(options.hands?.[seat] ?? filler[seat]);
  }

  // createRound her seat'e tam `startingHandSize` kart dagitir. Testlerde daha
  // kucuk el kurmak icin fazla dagitilan kartlar destenin dibine geri konur;
  // boylece 108 korunumu bozulmaz.
  const padded = hands.map((hand, seat) => {
    const explicitHand = options.hands?.[seat];
    if (!explicitHand || explicitHand.length >= rules.startingHandSize) return hand;
    const explicit: Card[] = Object.values(options.hands ?? {}).flat() as Card[];
    const taken = new Set([...explicit.map((c) => c.id), options.start.id]);
    const pad = ALL_CARDS.filter((c) => !taken.has(c.id)).slice(0, rules.startingHandSize - explicitHand.length);
    for (const c of pad) taken.add(c.id);
    return [...explicitHand, ...pad];
  });

  const deck = deckWith({ hands: padded, start: options.start });
  let base = createRound({ deck, dealerSeat: rules.playerCount - 1, rules, random: identityShuffle });

  const returned: Card[] = [];
  base = {
    ...base,
    seats: base.seats.map((seat) => {
      const explicitHand = options.hands?.[seat.seat];
      if (!explicitHand || explicitHand.length >= rules.startingHandSize) return seat;
      const keep = new Set(explicitHand.map((c) => c.id));
      returned.push(...seat.hand.filter((c) => !keep.has(c.id)));
      return { ...seat, hand: seat.hand.filter((c) => keep.has(c.id)) };
    }),
  };
  base = { ...base, drawPile: [...base.drawPile, ...returned] };

  return {
    ...base,
    currentSeat: options.currentSeat ?? base.currentSeat,
    phase: options.phase ?? base.phase,
    activeColor: options.activeColor ?? base.activeColor,
    drawPile: options.drawPile ? [...options.drawPile, ...base.drawPile.filter((c) => !options.drawPile!.some((d) => d.id === c.id))] : base.drawPile,
    pendingStartColorSeat: null,
  };
}

export const play = (state: FullState, seat: number, action: Action) => applyAction(state, seat, action, deps);

export const handSize = (state: FullState, seat: number) => state.seats[seat].hand.length;
export { num };
