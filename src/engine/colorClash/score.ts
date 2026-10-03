import { seatAfter, type FullState, type RandomSource } from './state';
import { createRound } from './state';
import { cardPoints, InvariantError, type Card } from './types';

export type SeatScore = { seat: number; handPoints: number; cardCount: number };

export type RoundScore = {
  winnerSeat: number;
  /** Kazananin bu elde aldigi puan: diger ellerin toplami. */
  awarded: number;
  perSeat: SeatScore[];
  /** Puanlar eklendikten sonraki toplamlar. */
  totals: number[];
  matchWinnerSeat: number | null;
};

export function handPoints(hand: readonly Card[]): number {
  return hand.reduce((total, card) => total + cardPoints(card), 0);
}

/**
 * GAME_RULES "El ve mac sonu": kazanan, diger ellerde kalan kartlarin toplam
 * degerini alir. Yalnizca el kazanani puan alir (C061: kazanan yoksa yazilmaz).
 */
export function scoreRound(state: FullState): RoundScore {
  if (state.status !== 'ROUND_ENDED' || state.winnerSeat === null) {
    throw new InvariantError('scoreRound requires a finished round with a winner');
  }

  const perSeat = state.seats.map((seat) => ({ seat: seat.seat, handPoints: handPoints(seat.hand), cardCount: seat.hand.length }));
  const awarded = perSeat.filter((s) => s.seat !== state.winnerSeat).reduce((n, s) => n + s.handPoints, 0);

  const totals = state.seats.map((seat) => seat.score + (seat.seat === state.winnerSeat ? awarded : 0));
  const matchWinnerSeat = totals.findIndex((total) => total >= state.rules.winningScore);

  return {
    winnerSeat: state.winnerSeat,
    awarded,
    perSeat,
    totals,
    matchWinnerSeat: matchWinnerSeat === -1 ? null : matchWinnerSeat,
  };
}

/** Puanlari state'e isler ve mac bittiyse durumu MATCH_ENDED yapar. */
export function applyRoundScore(state: FullState, score: RoundScore): FullState {
  return {
    ...state,
    seats: state.seats.map((seat) => ({ ...seat, score: score.totals[seat.seat] })),
    status: score.matchWinnerSeat === null ? 'ROUND_ENDED' : 'MATCH_ENDED',
  };
}

/**
 * GAME_RULES: yeni elin dealer seat'i bir ilerler (C062).
 * Skorlar tasinir; deste yeniden disaridan verilir.
 */
export function startNextRound(state: FullState, deck: readonly Card[], random: RandomSource): FullState {
  if (state.status === 'MATCH_ENDED') throw new InvariantError('match is already over');
  return createRound({
    deck,
    dealerSeat: seatAfter(state.dealerSeat, 1, state.rules.playerCount),
    round: state.round + 1,
    rules: state.rules,
    scores: state.seats.map((s) => s.score),
    random,
  });
}
