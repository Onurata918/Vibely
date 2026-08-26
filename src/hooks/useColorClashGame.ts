import { useCallback, useReducer, useState } from 'react';

import { colorClashReducer, createInitialState, type ClashAction } from '@/lib/colorClash/reducer';
import type { ClashColor, ClashGameState, ClashRules } from '@/lib/colorClash/types';

// Saf `colorClashReducer`'i React state'ine baglayan ince hook — 101 Okey'de
// kurulan `useOkey101Game` ile ayni desen. Oyun mantigi burada degil,
// tamamen `@/lib/colorClash/reducer.ts` icinde yasar.
export function useColorClashGame() {
  const [state, rawDispatch] = useReducer((s: ClashGameState, a: ClashAction) => colorClashReducer(s, a).state, undefined, createInitialState);
  const [lastError, setLastError] = useState<string | null>(null);

  const dispatchAndCheck = useCallback((getState: () => ClashGameState, action: ClashAction) => {
    const result = colorClashReducer(getState(), action);
    setLastError(result.error ?? null);
    rawDispatch(action);
  }, []);

  const startGame = useCallback(
    (players: { id: string; name: string; c1: string; c2: string; team?: 'A' | 'B' | null }[], rules?: Partial<ClashRules>) => {
      rawDispatch({ type: 'START_GAME', players, rules });
    },
    []
  );

  const startNextRound = useCallback(() => rawDispatch({ type: 'START_NEXT_ROUND' }), []);
  const playCard = useCallback((playerId: string, cardId: string) => dispatchAndCheck(() => state, { type: 'PLAY_CARD', playerId, cardId }), [dispatchAndCheck, state]);
  const selectColor = useCallback((playerId: string, color: ClashColor) => dispatchAndCheck(() => state, { type: 'SELECT_COLOR', playerId, color }), [dispatchAndCheck, state]);
  const drawCard = useCallback((playerId: string) => dispatchAndCheck(() => state, { type: 'DRAW_CARD', playerId }), [dispatchAndCheck, state]);
  const endTurnAfterDraw = useCallback((playerId: string) => dispatchAndCheck(() => state, { type: 'END_TURN_AFTER_DRAW', playerId }), [dispatchAndCheck, state]);
  const declareLastCard = useCallback((playerId: string) => dispatchAndCheck(() => state, { type: 'DECLARE_LAST_CARD', playerId }), [dispatchAndCheck, state]);
  const skipDeclare = useCallback((playerId: string) => dispatchAndCheck(() => state, { type: 'SKIP_DECLARE', playerId }), [dispatchAndCheck, state]);
  const catchForgotDeclare = useCallback(
    (catcherId: string, targetId: string) => dispatchAndCheck(() => state, { type: 'CATCH_FORGOT_DECLARE', catcherId, targetId }),
    [dispatchAndCheck, state]
  );
  const resolveChallenge = useCallback(
    (challengerId: string, challenge: boolean) => dispatchAndCheck(() => state, { type: 'RESOLVE_CHALLENGE', challengerId, challenge }),
    [dispatchAndCheck, state]
  );

  return {
    state,
    lastError,
    startGame,
    startNextRound,
    playCard,
    selectColor,
    drawCard,
    endTurnAfterDraw,
    declareLastCard,
    skipDeclare,
    catchForgotDeclare,
    resolveChallenge,
  };
}

export type UseColorClashGame = ReturnType<typeof useColorClashGame>;
