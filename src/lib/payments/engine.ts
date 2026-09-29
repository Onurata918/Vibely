import { JETON_PACKAGES, PREMIUM_PLANS } from './plans';
import {
  AD_REWARD_JETONS,
  DAILY_LIMIT_SECONDS,
  INVITE_REWARD_JETONS,
  MAX_ADS_PER_DAY,
  PREMIUM_MS_PER_MONTH,
  PREMIUM_WEEKLY_LIMIT_SECONDS,
  WEEKLY_LIMIT_SECONDS,
  type PaymentsAction,
  type PaymentsActionResult,
  type PaymentsState,
} from './types';

export function nextMidnight(now: number): number {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

/** Hafta pazartesi 00:00'da baslar. */
export function nextWeekStart(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + daysUntilMonday);
  return d.getTime();
}

export function createInitialState(now: number = Date.now()): PaymentsState {
  return {
    jetonBalance: 0,
    isPremium: false,
    premiumPlanId: null,
    premiumExpiresAt: null,
    dailyUsedSeconds: 0,
    dailyBonusSeconds: 0,
    dailyResetAt: nextMidnight(now),
    weeklyUsedSeconds: 0,
    weeklyBonusSeconds: 0,
    weeklyResetAt: nextWeekStart(now),
    adsWatchedToday: 0,
    invitesRewarded: 0,
  };
}

/**
 * Diskten okunan durumu guvene alir: eski surumlerden kalan (aylik limitli) kayitlarda
 * eksik alanlar olabilir, onlari varsayilanla doldururuz.
 */
export function normalizeState(saved: Partial<PaymentsState> | null | undefined, now: number = Date.now()): PaymentsState {
  const base = createInitialState(now);
  if (!saved) return base;
  const merged = { ...base, ...saved } as PaymentsState;
  for (const key of ['jetonBalance', 'dailyUsedSeconds', 'dailyBonusSeconds', 'weeklyUsedSeconds', 'weeklyBonusSeconds', 'adsWatchedToday', 'invitesRewarded'] as const) {
    if (!Number.isFinite(merged[key])) merged[key] = base[key];
  }
  if (!Number.isFinite(merged.dailyResetAt)) merged.dailyResetAt = base.dailyResetAt;
  if (!Number.isFinite(merged.weeklyResetAt)) merged.weeklyResetAt = base.weeklyResetAt;
  return merged;
}

function applyResets(state: PaymentsState, now: number): PaymentsState {
  let next = state;
  if (now >= next.dailyResetAt) {
    next = { ...next, dailyUsedSeconds: 0, dailyBonusSeconds: 0, dailyResetAt: nextMidnight(now), adsWatchedToday: 0 };
  }
  if (now >= next.weeklyResetAt) {
    next = { ...next, weeklyUsedSeconds: 0, weeklyBonusSeconds: 0, weeklyResetAt: nextWeekStart(now) };
  }
  // Premium suresi dolduysa otomatik olarak normal kullaniciya doner.
  if (next.isPremium && next.premiumExpiresAt !== null && now >= next.premiumExpiresAt) {
    next = { ...next, isPremium: false, premiumPlanId: null, premiumExpiresAt: null };
  }
  return next;
}

/** Premium'da gunluk sinir yoktur; sadece haftalik tavan gecerlidir. */
export function dailyLimit(state: PaymentsState): number {
  if (state.isPremium) return Number.POSITIVE_INFINITY;
  return DAILY_LIMIT_SECONDS + state.dailyBonusSeconds;
}

export function weeklyLimit(state: PaymentsState): number {
  const base = state.isPremium ? PREMIUM_WEEKLY_LIMIT_SECONDS : WEEKLY_LIMIT_SECONDS;
  return base + state.weeklyBonusSeconds;
}

export function isCallBlocked(state: PaymentsState): boolean {
  return state.dailyUsedSeconds >= dailyLimit(state) || state.weeklyUsedSeconds >= weeklyLimit(state);
}

export function remainingDailySeconds(state: PaymentsState): number {
  return Math.max(0, dailyLimit(state) - state.dailyUsedSeconds);
}

export function remainingWeeklySeconds(state: PaymentsState): number {
  return Math.max(0, weeklyLimit(state) - state.weeklyUsedSeconds);
}

export function paymentsReducer(state: PaymentsState, action: PaymentsAction): PaymentsActionResult {
  switch (action.type) {
    case 'REPLACE_STATE':
      return { state: action.state };

    case 'CHECK_RESETS':
      return { state: applyResets(state, action.now) };

    case 'TICK_CALL_SECONDS': {
      const resetState = applyResets(state, action.now);
      return {
        state: {
          ...resetState,
          dailyUsedSeconds: resetState.dailyUsedSeconds + action.seconds,
          weeklyUsedSeconds: resetState.weeklyUsedSeconds + action.seconds,
        },
      };
    }

    case 'BUY_JETON_PACKAGE': {
      const pkg = JETON_PACKAGES.find((p) => p.id === action.packageId);
      if (!pkg) return { state, error: 'unknown-package' };
      // Gercek entegrasyonda burada RevenueCat/StoreKit/Play Billing satin alma sonucu beklenir — simdilik mock, aninda basarili.
      return { state: { ...state, jetonBalance: state.jetonBalance + pkg.jetons } };
    }

    case 'BUY_PREMIUM': {
      const plan = PREMIUM_PLANS.find((p) => p.id === action.planId);
      if (!plan) return { state, error: 'unknown-plan' };
      const expiresAt = action.now + plan.months * PREMIUM_MS_PER_MONTH;
      return { state: { ...state, isPremium: true, premiumPlanId: plan.id, premiumExpiresAt: expiresAt } };
    }

    case 'WATCH_AD_FOR_JETONS': {
      const resetState = applyResets(state, action.now);
      if (resetState.adsWatchedToday >= MAX_ADS_PER_DAY) return { state: resetState, error: 'daily-ad-limit' };
      return { state: { ...resetState, jetonBalance: resetState.jetonBalance + AD_REWARD_JETONS, adsWatchedToday: resetState.adsWatchedToday + 1 } };
    }

    case 'SPEND_JETONS_FOR_TIME': {
      if (state.jetonBalance < action.cost) return { state, error: 'insufficient-jetons' };
      return {
        state: {
          ...state,
          jetonBalance: state.jetonBalance - action.cost,
          dailyBonusSeconds: state.dailyBonusSeconds + action.seconds,
          weeklyBonusSeconds: state.weeklyBonusSeconds + action.seconds,
        },
      };
    }

    case 'CLAIM_INVITE_REWARD':
      // Gercek surumde bu, davet linkiyle kaydolan arkadas dogrulandiktan sonra sunucudan tetiklenir.
      return { state: { ...state, jetonBalance: state.jetonBalance + INVITE_REWARD_JETONS, invitesRewarded: state.invitesRewarded + 1 } };

    case 'SPEND_JETONS_FOR_GAME': {
      // Premium kullanicilar oyunlari ucretsiz oynar.
      if (state.isPremium) return { state };
      if (state.jetonBalance < action.cost) return { state, error: 'insufficient-jetons' };
      return { state: { ...state, jetonBalance: state.jetonBalance - action.cost } };
    }

    case 'CANCEL_PREMIUM':
      return { state: { ...state, isPremium: false, premiumPlanId: null, premiumExpiresAt: null } };

    default:
      return { state };
  }
}
