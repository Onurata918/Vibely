import { assertValidDeck } from './deck';
import {
  InvariantError,
  STARTING_HAND_SIZE,
  TOTAL_CARDS,
  WINNING_SCORE,
  type Card,
  type CardId,
  type Color,
  type Direction,
  type Phase,
  type RoundStatus,
} from './types';

export type SeatState = {
  seat: number;
  hand: Card[];
  score: number;
  /** GAME_RULES "Clash! cagrisi": iki karttan bire dususte cagri yapildi mi. */
  calledClash: boolean;
  connected: boolean;
};

export type Rules = {
  playerCount: number;
  startingHandSize: number;
  winningScore: number;
  missedClashPenalty: number;
  twoPlayerReverseActsAsSkip: boolean;
  turnSeconds: number;
};

export const DEFAULT_RULES: Rules = {
  playerCount: 4,
  startingHandSize: STARTING_HAND_SIZE,
  winningScore: WINNING_SCORE,
  missedClashPenalty: 2,
  twoPlayerReverseActsAsSkip: true,
  turnSeconds: 30,
};

/**
 * Clash 4 itiraz kaniti. **Sunucuya ozeldir**; hicbir public/private
 * projeksiyona, loga veya telemetriye girmez (VIBELY_ARCHITECTURE).
 */
export type ClashFourPending = {
  playerSeat: number;
  targetSeat: number;
  /** Kart oynanmadan onceki elde, onceki aktif renkle eslesen kart var miydi. */
  hadPreviousColorMatch: boolean;
};

export type FullState = {
  version: number;
  round: number;
  status: RoundStatus;
  rules: Rules;

  seats: SeatState[];
  dealerSeat: number;
  currentSeat: number;
  direction: Direction;
  activeColor: Color;

  drawPile: Card[];
  /** Son eleman ust karttir. */
  discardPile: Card[];

  phase: Phase;
  /** Bu turda cekilen kart; yalnizca o oynanabilir (C021). */
  drawnCardId: CardId | null;
  /** Baslangic Color Shift'inde renk secimi bekleyen seat. */
  pendingStartColorSeat: number | null;

  clashFour: ClashFourPending | null;
  /** Cagri yapmadan bire dusen seat; yakalama penceresi aciktir. */
  missedClashTargetSeat: number | null;

  winnerSeat: number | null;
};

export type RandomSource = {
  /** Sunucu tarafindan saglanir; motor kendi rastgeleligini uretmez. */
  shuffle: (cards: readonly Card[]) => Card[];
};

export function seatAfter(seat: number, direction: Direction, playerCount: number): number {
  return (seat + direction + playerCount) % playerCount;
}

export function topDiscard(state: FullState): Card {
  const top = state.discardPile[state.discardPile.length - 1];
  if (!top) throw new InvariantError('discard pile is empty');
  return top;
}

/** Her kart tam bir bolgede bulunur ve birlesim her zaman 108'dir (C006). */
export function allCardIds(state: FullState): CardId[] {
  return [...state.seats.flatMap((s) => s.hand.map((c) => c.id)), ...state.drawPile.map((c) => c.id), ...state.discardPile.map((c) => c.id)];
}

export function assertConservation(state: FullState): void {
  const ids = allCardIds(state);
  if (ids.length !== TOTAL_CARDS) throw new InvariantError(`conservation broken: ${ids.length} cards, expected ${TOTAL_CARDS}`);
  if (new Set(ids).size !== TOTAL_CARDS) throw new InvariantError('conservation broken: duplicate cardId across regions');
}

export type CreateRoundInput = {
  deck: readonly Card[];
  dealerSeat: number;
  round?: number;
  rules?: Rules;
  scores?: number[];
  random: RandomSource;
};

/**
 * GAME_RULES "Deste ve dagitim" + baslangic karti etkileri.
 * Deste disaridan karistirilmis gelir; motor sirayi oldugu gibi kullanir.
 */
export function createRound({ deck, dealerSeat, round = 1, rules = DEFAULT_RULES, scores, random }: CreateRoundInput): FullState {
  assertValidDeck(deck);
  if (rules.playerCount < 2) throw new InvariantError('at least two players are required');

  const seats: SeatState[] = [];
  let cursor = 0;
  for (let seat = 0; seat < rules.playerCount; seat++) {
    seats.push({
      seat,
      hand: deck.slice(cursor, cursor + rules.startingHandSize),
      score: scores?.[seat] ?? 0,
      calledClash: false,
      connected: true,
    });
    cursor += rules.startingHandSize;
  }

  let drawPile = deck.slice(cursor);

  // C007: ilk Clash 4 desteye karistirilir ve yeni kart acilir.
  let start = drawPile[0];
  while (start && start.kind === 'CLASH_FOUR') {
    drawPile = random.shuffle(drawPile);
    start = drawPile[0];
  }
  if (!start) throw new InvariantError('deck exhausted before a starting card could be flipped');
  drawPile = drawPile.slice(1);

  const firstSeat = seatAfter(dealerSeat, 1, rules.playerCount);

  const base: FullState = {
    version: 0,
    round,
    status: 'ACTIVE',
    rules,
    seats,
    dealerSeat,
    currentSeat: firstSeat,
    direction: 1,
    activeColor: start.color ?? 'CRIMSON',
    drawPile,
    discardPile: [start],
    phase: 'AWAIT_ACTION',
    drawnCardId: null,
    pendingStartColorSeat: null,
    clashFour: null,
    missedClashTargetSeat: null,
    winnerSeat: null,
  };

  const opened = applyStartCard(base, start);
  assertConservation(opened);
  return opened;
}

/** C008-C011: baslangic kartinin ilk oyuncuya etkisi. */
function applyStartCard(state: FullState, start: Card): FullState {
  const { playerCount } = state.rules;

  switch (start.kind) {
    case 'BLOCK':
      // C008: ilk oyuncu atlanir.
      return { ...state, currentSeat: seatAfter(state.currentSeat, state.direction, playerCount) };

    case 'FLIP': {
      // C010: yon ters doner ve yeni yondeki ilk oyuncu baslar.
      const direction: Direction = -1;
      if (playerCount === 2 && state.rules.twoPlayerReverseActsAsSkip) {
        return { ...state, direction, currentSeat: seatAfter(state.currentSeat, direction, playerCount) };
      }
      return { ...state, direction, currentSeat: seatAfter(state.dealerSeat, direction, playerCount) };
    }

    case 'DRAW_TWO': {
      // C009: ilk oyuncu iki ceker ve atlanir.
      const drawn = state.drawPile.slice(0, 2);
      const seats = state.seats.map((s) => (s.seat === state.currentSeat ? { ...s, hand: [...s.hand, ...drawn] } : s));
      return {
        ...state,
        seats,
        drawPile: state.drawPile.slice(2),
        currentSeat: seatAfter(state.currentSeat, state.direction, playerCount),
      };
    }

    case 'COLOR_SHIFT':
      // C011: ilk oyuncudan renk secimi beklenir.
      return { ...state, pendingStartColorSeat: state.currentSeat };

    default:
      return state;
  }
}

export function isMatchOver(state: FullState): boolean {
  return state.seats.some((s) => s.score >= state.rules.winningScore);
}
