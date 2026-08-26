// Color Clash — saf, deterministik oyun motoru. React'ten, ag katmanindan
// ve UI'dan tamamen bagimsizdir. Davranis, Vibely'nin daha once calisan
// "Son Kart" (Uno-tarzi) implementasyonuyla ayni semantikte, sadece
// yapilandirilabilir kurallara (ClashRules) ve acik faz modeline tasindi.
import { dealCards, drawCards, recycleDiscardPile } from './deck';
import { computeCardEffect } from './effects';
import { computeRoundScore } from './scoring';
import { canPlayCard, canStack } from './validation';
import { currentPlayer, reverseDirection, stepPlayerIndex } from './turnMachine';
import { DEFAULT_CLASH_RULES, type ClashCard, type ClashColor, type ClashGameState, type ClashRules } from './types';

export type ClashAction =
  | { type: 'START_GAME'; players: { id: string; name: string; c1: string; c2: string; team?: 'A' | 'B' | null }[]; rules?: Partial<ClashRules> }
  | { type: 'START_NEXT_ROUND' }
  | { type: 'PLAY_CARD'; playerId: string; cardId: string }
  | { type: 'SELECT_COLOR'; playerId: string; color: ClashColor }
  | { type: 'DRAW_CARD'; playerId: string }
  | { type: 'END_TURN_AFTER_DRAW'; playerId: string }
  | { type: 'DECLARE_LAST_CARD'; playerId: string }
  | { type: 'SKIP_DECLARE'; playerId: string }
  | { type: 'CATCH_FORGOT_DECLARE'; catcherId: string; targetId: string }
  | { type: 'RESOLVE_CHALLENGE'; challengerId: string; challenge: boolean };

export type ClashResult = { state: ClashGameState; error?: string };

function withHand(state: ClashGameState, playerId: string, hand: ClashCard[]): ClashGameState {
  return { ...state, players: state.players.map((p) => (p.id === playerId ? { ...p, hand } : p)) };
}

function drawForPlayer(state: ClashGameState, playerId: string, count: number): ClashGameState {
  let drawPile = state.drawPile;
  let discardPile = state.discardPile;
  if (drawPile.length < count) {
    const { newDrawPile, keptTopDiscard } = recycleDiscardPile(discardPile);
    drawPile = [...drawPile, ...newDrawPile];
    discardPile = keptTopDiscard;
  }
  const { drawn, rest } = drawCards(drawPile, Math.min(count, drawPile.length));
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { ...state, drawPile: rest, discardPile };
  return withHand({ ...state, drawPile: rest, discardPile }, playerId, [...player.hand, ...drawn]);
}

export function createInitialState(): ClashGameState {
  return {
    phase: 'lobby',
    rules: DEFAULT_CLASH_RULES,
    players: [],
    currentPlayerIndex: 0,
    direction: 1,
    drawPile: [],
    discardPile: [],
    activeColor: null,
    pendingWildCardId: null,
    pendingDrawPenalty: 0,
    hasDrawnThisTurn: false,
    challenge: null,
    pendingDeclareId: null,
    catchableId: null,
    roundNumber: 0,
    winnerId: null,
    winningTeam: null,
    lastRoundHandCounts: null,
    lastRoundScore: null,
    lastMessage: null,
    version: 0,
  };
}

function dealNewRound(
  state: ClashGameState,
  players: { id: string; name: string; c1: string; c2: string; score: number; team: 'A' | 'B' | null }[],
  rules: ClashRules
): ClashGameState {
  const deal = dealCards(
    players.map((p) => p.id),
    rules.startingHandSize
  );
  const startCard = deal.startingDiscard;
  const effect = computeCardEffect(startCard);

  let base: ClashGameState = {
    ...state,
    rules,
    players: players.map((p) => ({ ...p, hand: deal.hands[p.id] ?? [], connected: true, declaredLastCard: false })),
    currentPlayerIndex: 0,
    direction: 1,
    drawPile: deal.drawPile,
    discardPile: [startCard],
    activeColor: startCard.color ?? null,
    pendingWildCardId: null,
    pendingDrawPenalty: 0,
    hasDrawnThisTurn: false,
    challenge: null,
    pendingDeclareId: null,
    catchableId: null,
    winnerId: null,
    winningTeam: null,
    lastRoundHandCounts: null,
    lastRoundScore: null,
    phase: 'awaitingPlay',
    roundNumber: state.roundNumber + 1,
    version: state.version + 1,
    lastMessage: null,
  };

  // Acilis kartinin etkisi: dagitici (index 0) "oynamis" kabul edilir,
  // etki ilk gercek oyuncudan itibaren uygulanir. Belirsiz birakmiyoruz.
  if (effect.skipCount > 0) {
    base = { ...base, currentPlayerIndex: stepPlayerIndex(base, 1 + effect.skipCount) };
  } else if (effect.flipsDirection) {
    if (base.players.length === 2) {
      base = { ...base, direction: 1, currentPlayerIndex: 0 }; // 2 kisilik oyunda Reverse = Skip: dagitici tekrar baslar
    } else {
      const direction = reverseDirection(1);
      base = { ...base, direction, currentPlayerIndex: stepPlayerIndex({ ...base, direction }, 1) };
    }
  } else if (effect.drawPenalty > 0) {
    const victimIdx = stepPlayerIndex(base, 1);
    const victim = base.players[victimIdx];
    const withPenalty = victim ? drawForPlayer(base, victim.id, effect.drawPenalty) : base;
    base = { ...withPenalty, currentPlayerIndex: stepPlayerIndex(withPenalty, 2) };
  } else {
    base = { ...base, currentPlayerIndex: stepPlayerIndex(base, 1) };
  }

  return base;
}

function finishRound(state: ClashGameState, winnerId: string): ClashGameState {
  const hands = Object.fromEntries(state.players.map((p) => [p.id, p.hand]));
  const roundScore = computeRoundScore(state.players, hands, winnerId);
  const handCounts = Object.fromEntries(state.players.map((p) => [p.id, p.hand.length]));
  return {
    ...state,
    players: state.players.map((p) => (p.id === winnerId ? { ...p, score: p.score + roundScore } : p)),
    phase: 'roundFinished',
    winnerId,
    lastRoundScore: roundScore,
    lastRoundHandCounts: handCounts,
    pendingDeclareId: null,
    catchableId: null,
    pendingWildCardId: null,
    challenge: null,
  };
}

/** Kart etkisini uygular (renk zaten belliyse) ve sirayi ilerletir. */
function applyEffectAndAdvance(state: ClashGameState, card: ClashCard): ClashGameState {
  const effect = computeCardEffect(card);
  const count = state.players.length;
  let direction = state.direction;
  let nextIndex: number;
  let message: string | null = null;
  const playerName = currentPlayer(state)?.name ?? '';

  if (effect.skipCount > 0) {
    nextIndex = stepPlayerIndex(state, 1 + effect.skipCount);
    message = `${playerName} pas geçti`;
  } else if (effect.flipsDirection) {
    if (count === 2) {
      nextIndex = state.currentPlayerIndex; // 2 kisilik oyunda Reverse = Skip: ayni oyuncu devam eder
    } else {
      direction = reverseDirection(direction);
      nextIndex = stepPlayerIndex({ ...state, direction }, 1);
    }
    message = 'Yön değişti';
  } else if (effect.drawPenalty > 0 && !state.rules.stacking) {
    const victimIdx = stepPlayerIndex(state, 1);
    const victim = state.players[victimIdx];
    const s = victim ? drawForPlayer(state, victim.id, effect.drawPenalty) : state;
    nextIndex = stepPlayerIndex({ ...s, direction }, 2);
    return { ...s, direction, currentPlayerIndex: nextIndex, phase: 'awaitingPlay', hasDrawnThisTurn: false, lastMessage: victim ? `${victim.name} +${effect.drawPenalty} çekti` : null };
  } else if (effect.drawPenalty > 0 && state.rules.stacking) {
    nextIndex = stepPlayerIndex(state, 1);
    const totalPenalty = state.pendingDrawPenalty + effect.drawPenalty;
    return {
      ...state,
      direction,
      currentPlayerIndex: nextIndex,
      phase: 'awaitingPlay',
      pendingDrawPenalty: totalPenalty,
      hasDrawnThisTurn: false,
      lastMessage: `+${totalPenalty} birikti`,
    };
  } else {
    nextIndex = stepPlayerIndex(state, 1);
  }

  return { ...state, direction, currentPlayerIndex: nextIndex, phase: 'awaitingPlay', hasDrawnThisTurn: false, lastMessage: message };
}

/** Declare adimindan sonra (ya da hic gerekmiyorsa dogrudan) kartin asil etkisine devam eder. */
function continueAfterCardPlayed(state: ClashGameState, card: ClashCard): ClashResult {
  if (card.kind === 'wild' || card.kind === 'drawFour') {
    return { state: { ...state, phase: 'choosingColor' } };
  }
  return { state: applyEffectAndAdvance({ ...state, activeColor: card.color ?? state.activeColor }, card) };
}

export function colorClashReducer(state: ClashGameState, action: ClashAction): ClashResult {
  switch (action.type) {
    case 'START_GAME': {
      if (action.players.length < 2) return { state, error: 'En az 2 oyuncu gerekli' };
      const rules: ClashRules = { ...DEFAULT_CLASH_RULES, ...action.rules };
      const players = action.players.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2, score: 0, team: p.team ?? null }));
      const initial = createInitialState();
      return { state: dealNewRound({ ...initial, roundNumber: 0 }, players, rules) };
    }

    case 'START_NEXT_ROUND': {
      if (state.phase !== 'roundFinished' && state.phase !== 'matchFinished') return { state, error: 'Round henüz bitmedi' };
      const players = state.players.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2, score: p.score, team: p.team }));
      return { state: dealNewRound(state, players, state.rules) };
    }

    case 'PLAY_CARD': {
      const p = currentPlayer(state);
      if (!p || p.id !== action.playerId || state.phase !== 'awaitingPlay') return { state, error: 'Sıra sende değil' };
      const card = p.hand.find((c) => c.id === action.cardId);
      const top = state.discardPile[state.discardPile.length - 1];
      if (!card || !top) return { state, error: 'Bu kart elinde değil' };

      if (state.pendingDrawPenalty > 0) {
        if (!canStack(card, top)) return { state, error: 'Önce cezayı çekmelisin ya da uyumlu bir kart oynamalısın' };
      } else if (!canPlayCard(card, top, state.activeColor)) {
        return { state, error: 'Bu kart şu an oynanamaz' };
      }

      const newHand = p.hand.filter((c) => c.id !== card.id);
      let next = withHand({ ...state, discardPile: [...state.discardPile, card] }, p.id, newHand);

      if (newHand.length === 0) {
        if (card.kind !== 'wild' && card.kind !== 'drawFour') next = { ...next, activeColor: card.color ?? next.activeColor };
        return { state: finishRound(next, p.id) };
      }

      if (newHand.length === 1 && state.rules.lastCardCallRequired) {
        // Renk secimi / etki, declare adimindan SONRA devam eder — bkz. DECLARE_LAST_CARD/SKIP_DECLARE.
        return { state: { ...next, pendingDeclareId: p.id, pendingWildCardId: card.kind === 'wild' || card.kind === 'drawFour' ? card.id : null } };
      }

      return continueAfterCardPlayed(next, card);
    }

    case 'SELECT_COLOR': {
      const p = currentPlayer(state);
      if (!p || p.id !== action.playerId || state.phase !== 'choosingColor') return { state, error: 'Şu an renk seçemezsin' };
      const card = state.discardPile[state.discardPile.length - 1];
      if (!card) return { state, error: 'Geçersiz durum' };
      const colorBeforeCard = state.activeColor; // PLAY_CARD'dan bu yana degismedi (bkz. continueAfterCardPlayed)
      const chosenCard = { ...card, color: action.color };
      const next: ClashGameState = { ...state, activeColor: action.color, discardPile: [...state.discardPile.slice(0, -1), chosenCard], pendingWildCardId: null };

      if (card.kind === 'drawFour' && state.rules.drawFourChallenge) {
        const victimIdx = stepPlayerIndex(state, 1);
        const victim = state.players[victimIdx];
        return {
          state: {
            ...next,
            phase: 'awaitingChallenge',
            challenge: victim ? { challengerId: victim.id, accusedId: p.id, card: chosenCard, colorBeforeCard: colorBeforeCard ?? action.color } : null,
          },
        };
      }

      return { state: applyEffectAndAdvance({ ...next, challenge: null }, chosenCard) };
    }

    case 'DECLARE_LAST_CARD':
    case 'SKIP_DECLARE': {
      if (state.pendingDeclareId !== action.playerId) return { state, error: 'Bildirecek bir şey yok' };
      const card = state.discardPile[state.discardPile.length - 1];
      const next: ClashGameState = {
        ...state,
        pendingDeclareId: null,
        players: state.players.map((pl) => (pl.id === action.playerId ? { ...pl, declaredLastCard: action.type === 'DECLARE_LAST_CARD' } : pl)),
      };
      if (!card) return { state: next };
      return continueAfterCardPlayed(next, card);
    }

    case 'CATCH_FORGOT_DECLARE': {
      const target = state.players.find((pl) => pl.id === action.targetId);
      if (!target) return { state, error: 'Oyuncu bulunamadı' };
      if (target.hand.length !== 1 || target.declaredLastCard) return { state, error: 'Bu oyuncu yakalanamaz' };
      const next = drawForPlayer(state, target.id, state.rules.lastCardPenalty);
      return {
        state: {
          ...next,
          players: next.players.map((pl) => (pl.id === target.id ? { ...pl, declaredLastCard: true } : pl)),
          lastMessage: `${target.name} yakalandı! +${state.rules.lastCardPenalty}`,
        },
      };
    }

    case 'RESOLVE_CHALLENGE': {
      if (!state.challenge || state.challenge.challengerId !== action.challengerId) return { state, error: 'Bekleyen itiraz yok' };
      const { accusedId, colorBeforeCard } = state.challenge;
      const accused = state.players.find((pl) => pl.id === accusedId);
      const victimIdx = stepPlayerIndex(state, 1);
      const victim = state.players[victimIdx];

      if (!action.challenge) {
        const s = victim ? drawForPlayer(state, victim.id, 4) : state;
        const nextIndex = stepPlayerIndex(s, 2);
        return { state: { ...s, currentPlayerIndex: nextIndex, phase: 'awaitingPlay', challenge: null, lastMessage: victim ? `${victim.name} +4 çekti` : null } };
      }

      const hadAlternative = accused ? accused.hand.some((c) => c.kind !== 'wild' && c.kind !== 'drawFour' && c.color === colorBeforeCard) : false;
      if (hadAlternative) {
        const s = accused ? drawForPlayer(state, accused.id, 4) : state;
        return { state: { ...s, currentPlayerIndex: victimIdx, phase: 'awaitingPlay', challenge: null, lastMessage: `İtiraz haklı! ${accused?.name ?? ''} +4 çekti` } };
      }
      const s = victim ? drawForPlayer(state, victim.id, 6) : state;
      const nextIndex = stepPlayerIndex(s, 2);
      return { state: { ...s, currentPlayerIndex: nextIndex, phase: 'awaitingPlay', challenge: null, lastMessage: `İtiraz haksız! ${victim?.name ?? ''} +6 çekti` } };
    }

    case 'DRAW_CARD': {
      const p = currentPlayer(state);
      if (!p || p.id !== action.playerId || state.phase !== 'awaitingPlay') return { state, error: 'Şu an çekemezsin' };

      if (state.pendingDrawPenalty > 0) {
        const penalty = state.pendingDrawPenalty;
        const s = drawForPlayer(state, p.id, penalty);
        const nextIndex = stepPlayerIndex(s, 1);
        return { state: { ...s, pendingDrawPenalty: 0, currentPlayerIndex: nextIndex, phase: 'awaitingPlay', hasDrawnThisTurn: false, lastMessage: `${p.name} +${penalty} çekti` } };
      }

      if (state.hasDrawnThisTurn) return { state, error: 'Bu tur zaten çektin' };
      const s = drawForPlayer(state, p.id, 1);
      const drawnCard = s.players.find((pl) => pl.id === p.id)?.hand.slice(-1)[0] ?? null;
      const top = s.discardPile[s.discardPile.length - 1];

      if (state.rules.forcePlay && drawnCard && top && canPlayCard(drawnCard, top, s.activeColor)) {
        return colorClashReducer({ ...s, hasDrawnThisTurn: true }, { type: 'PLAY_CARD', playerId: p.id, cardId: drawnCard.id });
      }

      return { state: { ...s, hasDrawnThisTurn: true } };
    }

    case 'END_TURN_AFTER_DRAW': {
      const p = currentPlayer(state);
      if (!p || p.id !== action.playerId || !state.hasDrawnThisTurn) return { state, error: 'Önce çekmen gerekiyor' };
      const nextIndex = stepPlayerIndex(state, 1);
      return { state: { ...state, currentPlayerIndex: nextIndex, hasDrawnThisTurn: false, phase: 'awaitingPlay', lastMessage: null } };
    }

    default:
      return { state };
  }
}
