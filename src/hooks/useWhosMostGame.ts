import { useCallback, useReducer, useState } from 'react';

import { createInitialState, whosMostReducer } from '@/lib/whosMost/engine';
import type { WhosMostAction, WhosMostGameState, WhosMostSettings, WhosMostVoter } from '@/lib/whosMost/types';

// Saf `whosMostReducer`'i React state'ine baglayan ince hook — Color Clash /
// 101 Okey'deki `useColorClashGame`/`useOkey101Game` ile ayni desen. Oyun
// mantigi burada degil, tamamen `@/lib/whosMost/engine.ts` icinde yasar.
export function useWhosMostGame() {
  const [state, rawDispatch] = useReducer((s: WhosMostGameState, a: WhosMostAction) => whosMostReducer(s, a).state, undefined, createInitialState);
  const [lastError, setLastError] = useState<string | null>(null);

  const startSession = useCallback((voters: WhosMostVoter[], settings: WhosMostSettings) => {
    setLastError(null);
    rawDispatch({ type: 'START_SESSION', settings, voters, now: Date.now() });
  }, []);

  const submitVote = useCallback(
    (voterId: string, targetId: string) => {
      const result = whosMostReducer(state, { type: 'SUBMIT_VOTE', voterId, targetId });
      setLastError(result.error ?? null);
      rawDispatch({ type: 'SUBMIT_VOTE', voterId, targetId });
    },
    [state]
  );

  const timerExpired = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'TIMER_EXPIRED' });
  }, []);

  const nextQuestion = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'NEXT_QUESTION', now: Date.now() });
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

  return { state, lastError, startSession, submitVote, timerExpired, nextQuestion, restart, removeVoter, backToSetup };
}

export type UseWhosMostGame = ReturnType<typeof useWhosMostGame>;
