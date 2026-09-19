import type { PremiumPlanId } from './plans';

export const DAILY_LIMIT_SECONDS = 60 * 60; // 1 saat
export const MONTHLY_LIMIT_SECONDS = 8 * 60 * 60; // 8 saat
export const JETON_EXTEND_COST = 20;
// Oyun basina jeton ucreti: Okey / 101 Okey / Color Clash daha pahali, digerleri standart.
export const GAME_COST_HIGH = 20;
export const GAME_COST_LOW = 10;
export const JETON_EXTEND_SECONDS = 30 * 60; // 30 dk
export const AD_REWARD_JETONS = 2;
export const AD_EXTEND_SECONDS = 15 * 60; // 15 dk (paywall ekranındaki "reklam izle")
export const MAX_ADS_PER_DAY = 20;
export const PREMIUM_MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;

export type PaymentsState = {
  jetonBalance: number;
  isPremium: boolean;
  premiumPlanId: PremiumPlanId | null;
  premiumExpiresAt: number | null;

  dailyUsedSeconds: number;
  dailyBonusSeconds: number;
  dailyResetAt: number;

  monthlyUsedSeconds: number;
  monthlyBonusSeconds: number;
  monthlyResetAt: number;

  adsWatchedToday: number;
};

export type PaymentsAction =
  | { type: 'REPLACE_STATE'; state: PaymentsState }
  | { type: 'CHECK_RESETS'; now: number }
  | { type: 'TICK_CALL_SECONDS'; seconds: number; now: number }
  | { type: 'BUY_JETON_PACKAGE'; packageId: string }
  | { type: 'BUY_PREMIUM'; planId: PremiumPlanId; now: number }
  | { type: 'WATCH_AD_FOR_JETONS'; now: number }
  | { type: 'WATCH_AD_FOR_TIME_EXTENSION'; now: number }
  | { type: 'SPEND_JETONS_FOR_TIME' }
  | { type: 'SPEND_JETONS_FOR_GAME'; cost: number }
  | { type: 'CANCEL_PREMIUM' };

export type PaymentsActionError = 'unknown-package' | 'unknown-plan' | 'insufficient-jetons' | 'daily-ad-limit';

export type PaymentsActionResult = { state: PaymentsState; error?: PaymentsActionError };
