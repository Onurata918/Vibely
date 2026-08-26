import { useCallback, useReducer, useState } from 'react';

import { createInitialState, okey101Reducer, type Okey101Action } from '@/lib/okey101/gameReducer';
import type { Okey101GameState, Okey101Rules } from '@/lib/okey101/types';

// Saf `okey101Reducer`'i React state'ine baglayan ince hook. Oyun mantigi
// burada degil, tamamen `@/lib/okey101/gameReducer.ts` icinde yasar — bu
// hook sadece dispatch + son hata mesajini UI'a tasir.
export function useOkey101Game() {
  const [state, rawDispatch] = useReducer((s: Okey101GameState, a: Okey101Action) => okey101Reducer(s, a).state, undefined, createInitialState);
  const [lastError, setLastError] = useState<string | null>(null);

  const dispatch = useCallback((action: Okey101Action) => {
    // Reducer'in dondurdugu hatayi yakalamak icin ayrica calistiriyoruz;
    // useReducer'in kendisi sadece state'i alir.
    rawDispatch(action);
  }, []);

  const dispatchAndCheck = useCallback(
    (getState: () => Okey101GameState, action: Okey101Action) => {
      const result = okey101Reducer(getState(), action);
      setLastError(result.error ?? null);
      rawDispatch(action);
    },
    []
  );

  const startGame = useCallback(
    (players: { id: string; name: string; c1: string; c2: string }[], rules?: Partial<Okey101Rules>) => {
      dispatch({ type: 'START_GAME', players, rules });
    },
    [dispatch]
  );

  const startNextRound = useCallback(() => dispatch({ type: 'START_NEXT_ROUND' }), [dispatch]);
  const drawFromPile = useCallback((playerId: string) => dispatchAndCheck(() => state, { type: 'DRAW_FROM_PILE', playerId }), [dispatchAndCheck, state]);
  const drawFromDiscard = useCallback((playerId: string) => dispatchAndCheck(() => state, { type: 'DRAW_FROM_DISCARD', playerId }), [dispatchAndCheck, state]);
  const toggleSelect = useCallback((playerId: string, tileId: string) => dispatch({ type: 'TOGGLE_SELECT', playerId, tileId }), [dispatch]);
  const clearSelection = useCallback((playerId: string) => dispatch({ type: 'CLEAR_SELECTION', playerId }), [dispatch]);
  const formMeld = useCallback((playerId: string) => dispatchAndCheck(() => state, { type: 'FORM_MELD_FROM_SELECTION', playerId }), [dispatchAndCheck, state]);
  const cancelPending = useCallback((playerId: string) => dispatch({ type: 'CANCEL_PENDING_MELDS', playerId }), [dispatch]);
  const commitOpening = useCallback((playerId: string) => dispatchAndCheck(() => state, { type: 'COMMIT_OPENING', playerId }), [dispatchAndCheck, state]);
  const addToMeld = useCallback((playerId: string, meldId: string) => dispatchAndCheck(() => state, { type: 'ADD_SELECTED_TO_TABLE_MELD', playerId, meldId }), [dispatchAndCheck, state]);
  const discardTile = useCallback((playerId: string, tileId: string) => dispatchAndCheck(() => state, { type: 'DISCARD_TILE', playerId, tileId }), [dispatchAndCheck, state]);
  const sortRack = useCallback((playerId: string, by: 'number' | 'color') => dispatch({ type: 'SORT_RACK', playerId, by }), [dispatch]);
  const reorderRack = useCallback((playerId: string, fromIndex: number, toIndex: number) => dispatch({ type: 'REORDER_RACK', playerId, fromIndex, toIndex }), [dispatch]);

  return {
    state,
    lastError,
    startGame,
    startNextRound,
    drawFromPile,
    drawFromDiscard,
    toggleSelect,
    clearSelection,
    formMeld,
    cancelPending,
    commitOpening,
    addToMeld,
    discardTile,
    sortRack,
    reorderRack,
  };
}

export type UseOkey101Game = ReturnType<typeof useOkey101Game>;
