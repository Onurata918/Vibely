export type Color = 'CRIMSON' | 'AZURE' | 'LIME' | 'GOLD';
export type Kind = 'NUMBER' | 'BLOCK' | 'FLIP' | 'DRAW_TWO' | 'COLOR_SHIFT' | 'CLASH_FOUR';
export type Card = { id: string; kind: Kind; color: Color | null; value: number | null };

export type Action =
  | { type: 'PLAY_CARD'; cardId: string; chosenColor?: Color; calledClash: boolean }
  | { type: 'DRAW_CARD' }
  | { type: 'PLAY_DRAWN_CARD'; cardId: string; chosenColor?: Color; calledClash: boolean }
  | { type: 'PASS_AFTER_DRAW' }
  | { type: 'ACCEPT_DRAW_FOUR' }
  | { type: 'CHALLENGE_DRAW_FOUR' }
  | { type: 'CATCH_MISSED_CLASH'; targetSeat: number };

export type Command = {
  gameId: string;
  requestId: string;
  expectedVersion: number;
  action: Action;
};

export type PublicState = {
  gameId: string;
  version: number;
  rulesHash: string;
  status: 'LOBBY' | 'ACTIVE' | 'ROUND_END_PENDING' | 'ROUND_ENDED' | 'ABORTED_DISCONNECT' | 'MATCH_ENDED';
  seats: { seat: number; userId: string; cardCount: number; score: number; connected: boolean }[];
  currentSeat: number;
  direction: 1 | -1;
  activeColor: Color;
  topDiscard: Card;
  drawPileCount: number;
  phase: 'AWAIT_ACTION' | 'AFTER_DRAW' | 'AWAIT_DRAW_FOUR_RESPONSE';
  deadlineUtc: string;
  missedClashTargetSeat: number | null;
};

export type PrivateState = {
  seat: number;
  hand: Card[];
  drawnCardId: string | null;
  sessionEpoch: number;
};

export type ErrorCode =
  | 'UNAUTHORIZED' | 'NOT_YOUR_TURN' | 'STALE_VERSION' | 'REQUEST_ID_REUSE'
  | 'INVALID_PHASE' | 'CARD_NOT_OWNED' | 'CARD_NOT_PLAYABLE' | 'COLOR_REQUIRED'
  | 'ILLEGAL_CLASH_FOUR' | 'CHALLENGE_NOT_ALLOWED' | 'CATCH_WINDOW_CLOSED'
  | 'SESSION_REPLACED' | 'ROUND_ENDED';
