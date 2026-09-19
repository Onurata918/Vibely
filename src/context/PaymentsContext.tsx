import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';

import { createInitialState, paymentsReducer } from '@/lib/payments/engine';
import type { PremiumPlanId } from '@/lib/payments/plans';
import type { PaymentsAction, PaymentsState } from '@/lib/payments/types';
import { store } from '@/lib/storage';

type PaymentsContextValue = {
  payments: PaymentsState;
  lastError: string | null;
  tickCallSeconds: (seconds: number) => void;
  buyJetonPackage: (packageId: string) => void;
  buyPremium: (planId: PremiumPlanId) => void;
  watchAdForJetons: () => void;
  watchAdForTimeExtension: () => void;
  spendJetonsForTime: () => void;
  spendJetonsForGame: (cost: number) => void;
  cancelPremium: () => void;
};

const PaymentsContext = createContext<PaymentsContextValue | null>(null);

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  const [payments, rawDispatch] = useReducer((s: PaymentsState, a: PaymentsAction) => paymentsReducer(s, a).state, undefined, () => createInitialState());
  const [lastError, setLastError] = useState<string | null>(null);
  const stateRef = useRef(payments);
  stateRef.current = payments;

  // Kayıtlı durumu yükle (uygulama ilk açıldığında) ve gün/ay sıfırlamalarını uygula.
  useEffect(() => {
    (async () => {
      const saved = await store.getPayments();
      if (saved) rawDispatch({ type: 'REPLACE_STATE', state: paymentsReducer(saved, { type: 'CHECK_RESETS', now: Date.now() }).state });
    })();
  }, []);

  // Kalıcı depolama: her değişiklikte kaydet.
  useEffect(() => {
    store.setPayments(payments);
  }, [payments]);

  // Uygulama açıkken periyodik olarak gün/ay sıfırlamalarını kontrol et.
  useEffect(() => {
    const id = setInterval(() => rawDispatch({ type: 'CHECK_RESETS', now: Date.now() }), 60_000);
    return () => clearInterval(id);
  }, []);

  const dispatchAndCheck = useCallback((action: PaymentsAction) => {
    const result = paymentsReducer(stateRef.current, action);
    setLastError(result.error ?? null);
    rawDispatch(action);
  }, []);

  const tickCallSeconds = useCallback((seconds: number) => dispatchAndCheck({ type: 'TICK_CALL_SECONDS', seconds, now: Date.now() }), [dispatchAndCheck]);
  const buyJetonPackage = useCallback((packageId: string) => dispatchAndCheck({ type: 'BUY_JETON_PACKAGE', packageId }), [dispatchAndCheck]);
  const buyPremium = useCallback((planId: PremiumPlanId) => dispatchAndCheck({ type: 'BUY_PREMIUM', planId, now: Date.now() }), [dispatchAndCheck]);
  const watchAdForJetons = useCallback(() => dispatchAndCheck({ type: 'WATCH_AD_FOR_JETONS', now: Date.now() }), [dispatchAndCheck]);
  const watchAdForTimeExtension = useCallback(() => dispatchAndCheck({ type: 'WATCH_AD_FOR_TIME_EXTENSION', now: Date.now() }), [dispatchAndCheck]);
  const spendJetonsForTime = useCallback(() => dispatchAndCheck({ type: 'SPEND_JETONS_FOR_TIME' }), [dispatchAndCheck]);
  const spendJetonsForGame = useCallback((cost: number) => dispatchAndCheck({ type: 'SPEND_JETONS_FOR_GAME', cost }), [dispatchAndCheck]);
  const cancelPremium = useCallback(() => dispatchAndCheck({ type: 'CANCEL_PREMIUM' }), [dispatchAndCheck]);

  return (
    <PaymentsContext.Provider
      value={{ payments, lastError, tickCallSeconds, buyJetonPackage, buyPremium, watchAdForJetons, watchAdForTimeExtension, spendJetonsForTime, spendJetonsForGame, cancelPremium }}
    >
      {children}
    </PaymentsContext.Provider>
  );
}

export function usePayments() {
  const ctx = useContext(PaymentsContext);
  if (!ctx) throw new Error('usePayments must be used within PaymentsProvider');
  return ctx;
}
