import { useCallback, useReducer, useState } from 'react';

import { createInitialState, thisOrThatReducer } from '@/lib/thisOrThat/engine';
import type { ThisOrThatAction, ThisOrThatChoice, ThisOrThatGameState, ThisOrThatSettings, ThisOrThatVoter } from '@/lib/thisOrThat/types';

// Saf `thisOrThatReducer`'i React state'ine baglayan ince hook — Who's Most /
// Color Clash / 101 Okey'deki hook'larla ayni desen. Oyun mantigi burada
// degil, tamamen `@/lib/thisOrThat/engine.ts` icinde yasar.
export function useThisOrThatGame() {
  const [state, rawDispatch] = useReducer((s: ThisOrThatGameState, a: ThisOrThatAction) => thisOrThatReducer(s, a).state, undefined, createInitialState);
  const [lastError, setLastError] = useState<string | null>(null);

  const startSession = useCallback((voters: ThisOrThatVoter[], settings: ThisOrThatSettings) => {
    setLastError(null);
    rawDispatch({ type: 'START_SESSION', settings, voters, now: Date.now() });
  }, []);

  const selectChoice = useCallback(
    (voterId: string, choice: ThisOrThatChoice) => {
      const result = thisOrThatReducer(state, { type: 'SELECT_CHOICE', voterId, choice });
      setLastError(result.error ?? null);
      rawDispatch({ type: 'SELECT_CHOICE', voterId, choice });
    },
    [state]
  );

  const confirmVote = useCallback(
    (voterId: string) => {
      const result = thisOrThatReducer(state, { type: 'CONFIRM_VOTE', voterId });
      setLastError(result.error ?? null);
      rawDispatch({ type: 'CONFIRM_VOTE', voterId });
    },
    [state]
  );

  const timerExpired = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'TIMER_EXPIRED' });
  }, []);

  const nextRound = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'NEXT_ROUND', now: Date.now() });
  }, []);

  const restart = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'RESTART', now: Date.now() });
  }, []);

  const removeVoter = useCallback((voterId: string) => {
    rawDispatch({ type: 'REMOVE_VOTER', voterId });
  }, []);

  const backToSetup = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'BACK_TO_SETUP' });
  }, []);

  return { state, lastError, startSession, selectChoice, confirmVote, timerExpired, nextRound, restart, removeVoter, backToSetup };
}

export type UseThisOrThatGame = ReturnType<typeof useThisOrThatGame>;
