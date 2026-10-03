import { topDiscard, type FullState } from './state';
import { type Card, type CardId, type Color, type Direction, type Phase, type RoundStatus } from './types';

/**
 * VIBELY_ARCHITECTURE: public projeksiyon **acik alan listesidir**. Tam state
 * asla spread edilmez. Rakip elleri, cekme destesi sirasi ve Clash 4 kaniti
 * hicbir projeksiyona, loga veya telemetriye girmez.
 */
export type PublicSeat = { seat: number; cardCount: number; score: number; connected: boolean };

export type PublicState = {
  version: number;
  round: number;
  status: RoundStatus;
  seats: PublicSeat[];
  currentSeat: number;
  direction: Direction;
  activeColor: Color;
  topDiscard: Card;
  drawPileCount: number;
  phase: Phase;
  missedClashTargetSeat: number | null;
  winnerSeat: number | null;
};

export type PrivateState = {
  seat: number;
  hand: Card[];
  drawnCardId: CardId | null;
};

export function toPublicState(state: FullState): PublicState {
  return {
    version: state.version,
    round: state.round,
    status: state.status,
    seats: state.seats.map((s) => ({ seat: s.seat, cardCount: s.hand.length, score: s.score, connected: s.connected })),
    currentSeat: state.currentSeat,
    direction: state.direction,
    activeColor: state.activeColor,
    topDiscard: topDiscard(state),
    drawPileCount: state.drawPile.length,
    phase: state.phase,
    missedClashTargetSeat: state.missedClashTargetSeat,
    winnerSeat: state.winnerSeat,
  };
}

export function toPrivateState(state: FullState, seat: number): PrivateState {
  const own = state.seats[seat];
  return {
    seat,
    hand: own.hand,
    // Cekilen kart yalnizca ceken oyuncuya gorunur.
    drawnCardId: state.currentSeat === seat ? state.drawnCardId : null,
  };
}

/** Itiraz sonucunda yalnizca boolean sonuc yayinlanir; el aciklanmaz. */
export type ClashFourOutcome = { playerSeat: number; targetSeat: number; challenged: boolean; playWasLegal: boolean };
