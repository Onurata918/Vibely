import { useCallback, useReducer, useState } from 'react';

import { createInitialState, exposeMeReducer } from '@/lib/exposeMe/engine';
import type { ExposeMeAction, ExposeMeGameState, ExposeMeSettings, ExposeMeVoter } from '@/lib/exposeMe/types';

// Saf `exposeMeReducer`'i React state'ine baglayan ince hook — diger
// efektlerdeki (Who's Most, This or That, 5 Second Challenge) hook'larla
// ayni desen. Oyun mantigi burada degil, tamamen `@/lib/exposeMe/engine.ts`
// icinde yasar.
export function useExposeMeGame() {
  const [state, rawDispatch] = useReducer((s: ExposeMeGameState, a: ExposeMeAction) => exposeMeReducer(s, a).state, undefined, createInitialState);
  const [lastError, setLastError] = useState<string | null>(null);

  const startSession = useCallback((voters: ExposeMeVoter[], settings: ExposeMeSettings) => {
    setLastError(null);
    rawDispatch({ type: 'START_SESSION', settings, voters });
  }, []);

  const markAnswered = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'MARK_ANSWERED' });
  }, []);

  const skipQuestion = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'SKIP_QUESTION' });
  }, []);

  const nextRound = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'NEXT_ROUND' });
  }, []);

  const restart = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'RESTART' });
  }, []);

  const removeVoter = useCallback((voterId: string) => {
    rawDispatch({ type: 'REMOVE_VOTER', voterId });
  }, []);

  const backToSetup = useCallback(() => {
    setLastError(null);
    rawDispatch({ type: 'BACK_TO_SETUP' });
  }, []);

  return { state, lastError, startSession, markAnswered, skipQuestion, nextRound, restart, removeVoter, backToSetup };
}

export type UseExposeMeGame = ReturnType<typeof useExposeMeGame>;
