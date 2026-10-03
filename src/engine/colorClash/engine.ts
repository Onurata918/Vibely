import {
  assertConservation,
  seatAfter,
  topDiscard,
  type FullState,
  type RandomSource,
  type SeatState,
} from './state';
import { isWild, type Card, type CardId, type Color, type EngineErrorCode } from './types';

export type Action =
  | { type: 'PLAY_CARD'; cardId: CardId; chosenColor?: Color; calledClash: boolean }
  | { type: 'DRAW_CARD' }
  | { type: 'PLAY_DRAWN_CARD'; cardId: CardId; chosenColor?: Color; calledClash: boolean }
  | { type: 'PASS_AFTER_DRAW' }
  | { type: 'ACCEPT_DRAW_FOUR' }
  | { type: 'CHALLENGE_DRAW_FOUR' }
  | { type: 'CATCH_MISSED_CLASH'; targetSeat: number }
  | { type: 'CHOOSE_START_COLOR'; color: Color };

export type EngineResult = { ok: true; state: FullState } | { ok: false; error: EngineErrorCode; state: FullState };

const reject = (state: FullState, error: EngineErrorCode): EngineResult => ({ ok: false, error, state });

/**
 * GAME_RULES "Normal tur": ust kartin aktif rengi, sayisi veya sembolu.
 * Color Shift her zaman oynanabilir. Secilmis aktif renk, kartin basili wild
 * rengi diye bir sey olmadigi icin tek olcuttur (C033).
 */
export function isPlayable(card: Card, top: Card, activeColor: Color): boolean {
  if (isWild(card)) return true;
  if (card.color === activeColor) return true;
  if (card.kind === 'NUMBER' && top.kind === 'NUMBER') return card.value === top.value;
  if (card.kind !== 'NUMBER' && !isWild(top)) return card.kind === top.kind;
  return false;
}

/** Elde, verilen renkle eslesen bir kart var mi (Clash 4 yasallik kaniti). */
export function hasColorMatch(hand: readonly Card[], color: Color): boolean {
  return hand.some((c) => c.color === color);
}

/**
 * GAME_RULES: cekme destesi biterse ust atik yerinde kalir, digerleri sunucuda
 * karistirilarak yeni deste olur (C025). Karistiracak kart yoksa deste bos kalir
 * ve cagiran taraf PASS'a dusurur (C026).
 */
function refillDrawPile(state: FullState, random: RandomSource): FullState {
  if (state.drawPile.length > 0 || state.discardPile.length <= 1) return state;
  const top = state.discardPile[state.discardPile.length - 1];
  const recycled = random.shuffle(state.discardPile.slice(0, -1));
  return { ...state, drawPile: recycled, discardPile: [top] };
}

function drawCards(state: FullState, seat: number, count: number, random: RandomSource): { state: FullState; drawn: Card[] } {
  let draft = state;
  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    draft = refillDrawPile(draft, random);
    const next = draft.drawPile[0];
    if (!next) break; // C026: cekilecek kart kalmadi; kilitlenme yok.
    drawn.push(next);
    draft = { ...draft, drawPile: draft.drawPile.slice(1) };
  }
  if (drawn.length === 0) return { state: draft, drawn };
  const seats = draft.seats.map((s) => (s.seat === seat ? { ...s, hand: [...s.hand, ...drawn] } : s));
  return { state: { ...draft, seats }, drawn };
}

function withSeat(state: FullState, seat: number, patch: Partial<SeatState>): FullState {
  return { ...state, seats: state.seats.map((s) => (s.seat === seat ? { ...s, ...patch } : s)) };
}

export type Deps = { random: RandomSource };

export function applyAction(state: FullState, actorSeat: number, action: Action, deps: Deps): EngineResult {
  if (state.status !== 'ACTIVE' && state.status !== 'ROUND_END_PENDING') return reject(state, 'ROUND_ENDED');

  switch (action.type) {
    case 'CHOOSE_START_COLOR':
      return chooseStartColor(state, actorSeat, action.color);
    case 'PLAY_CARD':
      return playCard(state, actorSeat, action.cardId, action.chosenColor, action.calledClash, deps, false);
    case 'PLAY_DRAWN_CARD':
      return playCard(state, actorSeat, action.cardId, action.chosenColor, action.calledClash, deps, true);
    case 'DRAW_CARD':
      return drawCard(state, actorSeat, deps);
    case 'PASS_AFTER_DRAW':
      return passAfterDraw(state, actorSeat);
    default:
      // Clash 4 cevaplari ve yakalama Faz 4-5'te eklenir.
      return reject(state, 'INVALID_PHASE');
  }
}

function chooseStartColor(state: FullState, seat: number, color: Color): EngineResult {
  if (state.pendingStartColorSeat === null) return reject(state, 'INVALID_PHASE');
  if (state.pendingStartColorSeat !== seat) return reject(state, 'NOT_YOUR_TURN');
  return { ok: true, state: { ...state, version: state.version + 1, activeColor: color, pendingStartColorSeat: null } };
}

function drawCard(state: FullState, seat: number, deps: Deps): EngineResult {
  if (state.currentSeat !== seat) return reject(state, 'NOT_YOUR_TURN');
  if (state.pendingStartColorSeat !== null) return reject(state, 'COLOR_REQUIRED');
  if (state.phase !== 'AWAIT_ACTION') return reject(state, 'INVALID_PHASE');

  const { state: afterDraw, drawn } = drawCards(state, seat, 1, deps.random);
  if (drawn.length === 0) {
    // C026: karistiracak kart da yoksa tur PASS olur, motor kilitlenmez.
    return { ok: true, state: advanceTurn({ ...afterDraw, version: state.version + 1 }, 1) };
  }

  return {
    ok: true,
    state: { ...afterDraw, version: state.version + 1, phase: 'AFTER_DRAW', drawnCardId: drawn[0].id },
  };
}

function passAfterDraw(state: FullState, seat: number): EngineResult {
  if (state.currentSeat !== seat) return reject(state, 'NOT_YOUR_TURN');
  if (state.phase !== 'AFTER_DRAW') return reject(state, 'INVALID_PHASE');
  return { ok: true, state: advanceTurn({ ...state, version: state.version + 1 }, 1) };
}

function playCard(
  state: FullState,
  seat: number,
  cardId: CardId,
  chosenColor: Color | undefined,
  calledClash: boolean,
  deps: Deps,
  fromDraw: boolean
): EngineResult {
  if (state.currentSeat !== seat) return reject(state, 'NOT_YOUR_TURN');
  if (state.pendingStartColorSeat !== null) return reject(state, 'COLOR_REQUIRED');

  const expectedPhase = fromDraw ? 'AFTER_DRAW' : 'AWAIT_ACTION';
  if (state.phase !== expectedPhase) return reject(state, 'INVALID_PHASE');
  // C021: cekimden sonra yalnizca cekilen kart oynanabilir.
  if (fromDraw && state.drawnCardId !== cardId) return reject(state, 'CARD_NOT_PLAYABLE');

  const hand = state.seats[seat].hand;
  const card = hand.find((c) => c.id === cardId);
  if (!card) return reject(state, 'CARD_NOT_OWNED');

  const top = topDiscard(state);
  if (!isPlayable(card, top, state.activeColor)) return reject(state, 'CARD_NOT_PLAYABLE');
  // C016/C038: wild kartlar renk secilmeden tamamlanmaz.
  if (isWild(card) && !chosenColor) return reject(state, 'COLOR_REQUIRED');

  const previousColor = state.activeColor;
  const remaining = hand.filter((c) => c.id !== cardId);

  let draft: FullState = {
    ...state,
    seats: state.seats.map((s) => (s.seat === seat ? { ...s, hand: remaining, calledClash: calledClash || s.calledClash } : s)),
    discardPile: [...state.discardPile, card],
    activeColor: isWild(card) ? (chosenColor as Color) : (card.color as Color),
    phase: 'AWAIT_ACTION',
    drawnCardId: null,
  };

  // GAME_RULES "Clash! cagrisi": iki karttan bire dususte cagri gerekir.
  // Son kart oynanirken cagri aranmaz (C055).
  if (remaining.length === 1 && !calledClash) {
    draft = { ...draft, missedClashTargetSeat: seat };
  } else if (remaining.length !== 1) {
    draft = { ...draft, missedClashTargetSeat: null, seats: draft.seats.map((s) => (s.seat === seat ? { ...s, calledClash: false } : s)) };
  }

  if (card.kind === 'CLASH_FOUR') {
    // Faz 4: kanit gizlice kaydedilir, sira itiraz penceresine gecer.
    const targetSeat = seatAfter(seat, draft.direction, draft.rules.playerCount);
    draft = {
      ...draft,
      clashFour: { playerSeat: seat, targetSeat, hadPreviousColorMatch: hasColorMatch(hand, previousColor) },
      phase: 'AWAIT_DRAW_FOUR_RESPONSE',
      currentSeat: targetSeat,
    };
    assertConservation(draft);
    return { ok: true, state: { ...draft, version: state.version + 1 } };
  }

  draft = applyCardEffect(draft, card, deps);
  assertConservation(draft);
  return { ok: true, state: { ...draft, version: state.version + 1 } };
}

/** GAME_RULES "Kart etkileri". Clash 4 ayri ele alinir. */
function applyCardEffect(state: FullState, card: Card, deps: Deps): FullState {
  const { playerCount, twoPlayerReverseActsAsSkip } = state.rules;

  switch (card.kind) {
    case 'BLOCK':
      // C027: siradaki seat atlanir.
      return advanceTurn(state, 2);

    case 'FLIP': {
      const direction = (state.direction * -1) as FullState['direction'];
      const flipped = { ...state, direction };
      // C029: iki oyuncuda Block gibi davranir, oynayan tekrar oynar.
      if (playerCount === 2 && twoPlayerReverseActsAsSkip) return flipped;
      // C028: yeni yondeki seat'e gecer.
      return advanceTurn(flipped, 1);
    }

    case 'DRAW_TWO': {
      // C030/C024: siradaki oyuncu tam iki kart ceker ve atlanir; yigma yok.
      const target = seatAfter(state.currentSeat, state.direction, playerCount);
      const { state: afterDraw } = drawCards(state, target, 2, deps.random);
      return advanceTurn(afterDraw, 2);
    }

    default:
      // NUMBER ve COLOR_SHIFT: sira bir ilerler.
      return advanceTurn(state, 1);
  }
}

export function advanceTurn(state: FullState, steps: number): FullState {
  let seat = state.currentSeat;
  for (let i = 0; i < steps; i++) seat = seatAfter(seat, state.direction, state.rules.playerCount);
  return { ...state, currentSeat: seat, phase: 'AWAIT_ACTION', drawnCardId: null };
}
