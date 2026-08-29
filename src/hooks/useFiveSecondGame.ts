import { useCallback, useReducer, useState } from 'react';

import { createInitialState, fiveSecondReducer } from '@/lib/fiveSecond/engine';
import type { FiveSecondAction, FiveSecondGameState, FiveSecondSettings, FiveSecondVoter } from '@/lib/fiveSecond/types';

// Saf `fiveSecondReducer`'i React state'ine baglayan ince hook — Who's Most /
// This or That / Color Clash / 101 Okey'deki hook'larla ayni desen. Oyun
// mantigi burada degil, tamamen `@/lib/fiveSecond/engine.ts` icinde yasar.
export function useFiveSecondGame() {
  const [state, rawDispatch] = useReducer((s: FiveSecondGameState, a: FiveSecondAction) => fiveSecondReducer(s, a).state, undefined, createInitialState);
  const [lastError, setLastError] = useState<string | null>(null);

  const startSession = useCallback((voters: FiveSecondVoter[], settings: FiveSecondSettings) => {
    setLastError(null);
    rawDispatch({ type: 'START_SESSION', settings, voters, now: Date.now() });
  }, []);

  const readyDone = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'READY_DONE', now: Date.now() });
  }, []);

  const answerTimeout = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'ANSWER_TIMEOUT' });
  }, []);

  const submitJudgement = useCallback(
    (voterId: string, success: boolean) => {
      const result = fiveSecondReducer(state, { type: 'SUBMIT_JUDGEMENT', voterId, success });
      setLastError(result.error ?? null);
      rawDispatch({ type: 'SUBMIT_JUDGEMENT', voterId, success });
    },
    [state]
  );

  const hostJudge = useCallback((success: boolean) => {
    setLastError(null);
    rawDispatch({ type: 'HOST_JUDGE', success });
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

  return { state, lastError, startSession, readyDone, answerTimeout, submitJudgement, hostJudge, nextRound, restart, removeVoter, backToSetup };
}

export type UseFiveSecondGame = ReturnType<typeof useFiveSecondGame>;
