import { indicatorFace, type FullState, type FinishKind } from './state';
import { handValueOf, isRealJoker } from './tiles';
import { type Seat } from './types';

/** R10: her skor bilesenleriyle aciklanabilir olmalidir. */
export type ScoreBreakdown = {
  handBase: number;
  finishMultiplier: number;
  heldJoker: number;
  actionPenalties: number;
  total: number;
};

export type ScoreRules = {
  unopenedPenalty: number;
  heldJokerPenaltyEach: number;
  heldJokerPenaltyForUnopened: boolean;
  normalWinnerScore: number;
  jokerWinnerScore: number;
  cleanWinnerScore: number;
  cleanJokerWinnerScore: number;
};

export const DEFAULT_SCORE_RULES: ScoreRules = {
  unopenedPenalty: 202,
  heldJokerPenaltyEach: 101,
  heldJokerPenaltyForUnopened: false,
  normalWinnerScore: -101,
  jokerWinnerScore: -202,
  cleanWinnerScore: -202,
  cleanJokerWinnerScore: -404,
};

function winnerBase(finish: FinishKind, rules: ScoreRules): number {
  switch (finish) {
    case 'JOKER':
      return rules.jokerWinnerScore;
    case 'CLEAN':
      return rules.cleanWinnerScore;
    case 'CLEAN_JOKER':
      return rules.cleanJokerWinnerScore;
    default:
      return rules.normalWinnerScore;
  }
}

/** R10: bitis carpani joker ve elden bitislerin carpimidir. */
export function finishMultiplierOf(finish: FinishKind): number {
  const joker = finish === 'JOKER' || finish === 'CLEAN_JOKER' ? 2 : 1;
  const clean = finish === 'CLEAN' || finish === 'CLEAN_JOKER' ? 2 : 1;
  return joker * clean;
}

/**
 * R10: el bitince dort oyuncunun da puani hesaplanir.
 * STOCK_EXHAUSTED'ta kazanan yoktur ve carpan 1'dir.
 */
export function scoreRound(state: FullState, rules: ScoreRules = DEFAULT_SCORE_RULES): { seat: Seat; breakdown: ScoreBreakdown }[] {
  if (state.status !== 'ROUND_ENDED' || state.finishKind === null) {
    throw new Error('scoreRound requires a finished round');
  }

  const finish = state.finishKind;
  const indicator = indicatorFace(state.indicator);
  const multiplier = finish === 'STOCK_EXHAUSTED' ? 1 : finishMultiplierOf(finish);

  return state.seats.map((seat) => {
    const actionPenalties = seat.actionPenalties;

    if (state.winnerSeat === seat.seat) {
      const handBase = winnerBase(finish, rules);
      // Kazananin daha once kesinlesmis hamle cezalari bu degere eklenir (T134).
      return { seat: seat.seat, breakdown: { handBase, finishMultiplier: 1, heldJoker: 0, actionPenalties, total: handBase + actionPenalties } };
    }

    const unopened = seat.opening === 'UNOPENED';
    const realJokers = seat.hand.filter((t) => isRealJoker(t, indicator)).length;

    // R10: gercek okey normal yuz toplamina katilmaz, ayri 101 bilesenidir.
    const faceSum = seat.hand.filter((t) => !isRealJoker(t, indicator)).reduce((n, t) => n + handValueOf(t, indicator), 0);

    const handBase = unopened ? rules.unopenedPenalty : faceSum * (seat.opening === 'PAIRS' ? 2 : 1);
    const heldJoker = unopened && !rules.heldJokerPenaltyForUnopened ? 0 : rules.heldJokerPenaltyEach * realJokers;

    // R10/Q13: joker cezasi ve hamle cezalari carpana girmez, sonradan eklenir.
    const total = handBase * multiplier + heldJoker + actionPenalties;
    return { seat: seat.seat, breakdown: { handBase, finishMultiplier: multiplier, heldJoker, actionPenalties, total } };
  });
}
