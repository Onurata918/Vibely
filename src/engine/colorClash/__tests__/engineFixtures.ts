import { applyAction, type Action, type Deps } from '../engine';
import { createRound, type FullState, type Rules, DEFAULT_RULES } from '../state';
import { type Card, type Color, type Phase } from '../types';
import { ALL_CARDS, deckWith, identityShuffle, num } from './fixtures';

export const deps: Deps = { random: identityShuffle };

/**
 * Belirli eller ve belirli bir ust kartla oyun kurar.
 *
 * Verilmeyen eller cakismayan kartlarla doldurulur. Acikca verilen el
 * `startingHandSize`'dan kisaysa, dagitimda fazla gelen kartlar destenin dibine
 * geri konur; boylece tek kartlik el kurulabilir ve 108 korunumu bozulmaz.
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
  const explicit: Card[] = Object.values(options.hands ?? {}).flat() as Card[];

  // Tek paylasilan "kullanildi" kumesi: hicbir kart iki yerde olamaz.
  const taken = new Set<string>([...explicit.map((c) => c.id), options.start.id, ...(options.drawPile ?? []).map((c) => c.id)]);
  const pool = ALL_CARDS.filter((c) => !taken.has(c.id));
  let cursor = 0;
  const nextFromPool = (count: number): Card[] => {
    const slice = pool.slice(cursor, cursor + count);
    cursor += count;
    for (const c of slice) taken.add(c.id);
    return slice;
  };

  const explicitHands: (Card[] | undefined)[] = [];
  const dealtHands: Card[][] = [];
  for (let seat = 0; seat < rules.playerCount; seat++) {
    const own = options.hands?.[seat];
    explicitHands.push(own);
    const base = own ?? [];
    dealtHands.push([...base, ...nextFromPool(rules.startingHandSize - base.length)]);
  }

  const deck = deckWith({ hands: dealtHands, start: options.start, rest: options.drawPile });
  let state = createRound({ deck, dealerSeat: rules.playerCount - 1, rules, random: identityShuffle });

  // Acikca kisa verilen elleri kirp; fazlalari destenin dibine geri koy.
  const returned: Card[] = [];
  state = {
    ...state,
    seats: state.seats.map((seat) => {
      const own = explicitHands[seat.seat];
      if (!own || own.length >= rules.startingHandSize) return seat;
      const keep = new Set(own.map((c) => c.id));
      returned.push(...seat.hand.filter((c) => !keep.has(c.id)));
      return { ...seat, hand: seat.hand.filter((c) => keep.has(c.id)) };
    }),
  };

  const forced = options.drawPile ?? [];
  const rest = [...state.drawPile.filter((c) => !forced.some((d) => d.id === c.id)), ...returned];

  return {
    ...state,
    currentSeat: options.currentSeat ?? state.currentSeat,
    phase: options.phase ?? state.phase,
    activeColor: options.activeColor ?? state.activeColor,
    drawPile: [...forced, ...rest],
    pendingStartColorSeat: null,
  };
}

export const play = (state: FullState, seat: number, action: Action) => applyAction(state, seat, action, deps);

export const handSize = (state: FullState, seat: number) => state.seats[seat].hand.length;
export { num };
