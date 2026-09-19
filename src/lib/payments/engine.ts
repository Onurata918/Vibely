import { JETON_PACKAGES, PREMIUM_PLANS } from './plans';
import {
  AD_EXTEND_SECONDS,
  AD_REWARD_JETONS,
  DAILY_LIMIT_SECONDS,
  JETON_EXTEND_COST,
  JETON_EXTEND_SECONDS,
  MAX_ADS_PER_DAY,
  MONTHLY_LIMIT_SECONDS,
  PREMIUM_MS_PER_MONTH,
  type PaymentsAction,
  type PaymentsActionResult,
  type PaymentsState,
} from './types';

export function nextMidnight(now: number): number {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

export function nextMonthStart(now: number): number {
  const d = new Date(now);
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
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
    monthlyUsedSeconds: 0,
    monthlyBonusSeconds: 0,
    monthlyResetAt: nextMonthStart(now),
    adsWatchedToday: 0,
  };
}

function applyResets(state: PaymentsState, now: number): PaymentsState {
  let next = state;
  if (now >= next.dailyResetAt) {
    next = { ...next, dailyUsedSeconds: 0, dailyBonusSeconds: 0, dailyResetAt: nextMidnight(now), adsWatchedToday: 0 };
  }
  if (now >= next.monthlyResetAt) {
    next = { ...next, monthlyUsedSeconds: 0, monthlyBonusSeconds: 0, monthlyResetAt: nextMonthStart(now) };
  }
  // Premium süresi dolduysa otomatik olarak normal kullanıcıya döner.
  if (next.isPremium && next.premiumExpiresAt !== null && now >= next.premiumExpiresAt) {
    next = { ...next, isPremium: false, premiumPlanId: null, premiumExpiresAt: null };
  }
  return next;
}

export function dailyLimit(state: PaymentsState): number {
  return DAILY_LIMIT_SECONDS + state.dailyBonusSeconds;
}

export function monthlyLimit(state: PaymentsState): number {
  return MONTHLY_LIMIT_SECONDS + state.monthlyBonusSeconds;
}

export function isCallBlocked(state: PaymentsState): boolean {
  if (state.isPremium) return false;
  return state.dailyUsedSeconds >= dailyLimit(state) || state.monthlyUsedSeconds >= monthlyLimit(state);
}

export function remainingDailySeconds(state: PaymentsState): number {
  return Math.max(0, dailyLimit(state) - state.dailyUsedSeconds);
}

export function remainingMonthlySeconds(state: PaymentsState): number {
  return Math.max(0, monthlyLimit(state) - state.monthlyUsedSeconds);
}

export function paymentsReducer(state: PaymentsState, action: PaymentsAction): PaymentsActionResult {
  switch (action.type) {
    case 'REPLACE_STATE':
      return { state: action.state };

    case 'CHECK_RESETS':
      return { state: applyResets(state, action.now) };

    case 'TICK_CALL_SECONDS': {
      const resetState = applyResets(state, action.now);
      if (resetState.isPremium) return { state: resetState };
      return {
        state: {
          ...resetState,
          dailyUsedSeconds: resetState.dailyUsedSeconds + action.seconds,
          monthlyUsedSeconds: resetState.monthlyUsedSeconds + action.seconds,
        },
      };
    }

    case 'BUY_JETON_PACKAGE': {
      const pkg = JETON_PACKAGES.find((p) => p.id === action.packageId);
      if (!pkg) return { state, error: 'unknown-package' };
      // Gerçek entegrasyonda burada RevenueCat/StoreKit/Play Billing satın alma sonucu beklenir — şimdilik mock, anında başarılı.
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

    case 'WATCH_AD_FOR_TIME_EXTENSION': {
      const resetState = applyResets(state, action.now);
      if (resetState.adsWatchedToday >= MAX_ADS_PER_DAY) return { state: resetState, error: 'daily-ad-limit' };
      return {
        state: {
          ...resetState,
          dailyBonusSeconds: resetState.dailyBonusSeconds + AD_EXTEND_SECONDS,
          monthlyBonusSeconds: resetState.monthlyBonusSeconds + AD_EXTEND_SECONDS,
          adsWatchedToday: resetState.adsWatchedToday + 1,
        },
      };
    }

    case 'SPEND_JETONS_FOR_TIME': {
      if (state.jetonBalance < JETON_EXTEND_COST) return { state, error: 'insufficient-jetons' };
      return {
        state: {
          ...state,
          jetonBalance: state.jetonBalance - JETON_EXTEND_COST,
          dailyBonusSeconds: state.dailyBonusSeconds + JETON_EXTEND_SECONDS,
          monthlyBonusSeconds: state.monthlyBonusSeconds + JETON_EXTEND_SECONDS,
        },
      };
    }

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
