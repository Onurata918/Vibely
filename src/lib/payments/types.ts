import type { PremiumPlanId } from './plans';

// Ucretsiz kullanici: gunde 1 saat, haftada 5 saat.
export const DAILY_LIMIT_SECONDS = 60 * 60; // 1 saat
export const WEEKLY_LIMIT_SECONDS = 5 * 60 * 60; // 5 saat
// Premium'da sure siniri yok. Ileride adil kullanim tavani getirmek istersek
// burasi sonlu bir sayiya cekilir; motorun geri kalani ayni kalir.
export const PREMIUM_WEEKLY_LIMIT_SECONDS = Number.POSITIVE_INFINITY;

// Sure uzatma secenekleri (paywall'da iki kademe gosterilir).
export const JETON_EXTEND_SMALL_COST = 10;
export const JETON_EXTEND_SMALL_SECONDS = 15 * 60; // 15 dk
export const JETON_EXTEND_COST = 20;
export const JETON_EXTEND_SECONDS = 30 * 60; // 30 dk

// Oyun basina jeton ucreti: Okey / 101 Okey / Color Clash daha pahali, digerleri standart.
export const GAME_COST_HIGH = 20;
export const GAME_COST_LOW = 10;

export const AD_REWARD_JETONS = 2;
// Gunluk reklam siniri yok. Kotuye kullanima karsi sonradan sonlu bir sayiya cekilebilir.
export const MAX_ADS_PER_DAY = Number.POSITIVE_INFINITY;

// Davet linkiyle gelen arkadas uygulamaya giris yapinca davet edene verilir.
export const INVITE_REWARD_JETONS = 50;

export const PREMIUM_MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;

export type PaymentsState = {
  jetonBalance: number;
  isPremium: boolean;
  premiumPlanId: PremiumPlanId | null;
  premiumExpiresAt: number | null;

  dailyUsedSeconds: number;
  dailyBonusSeconds: number;
  dailyResetAt: number;

  weeklyUsedSeconds: number;
  weeklyBonusSeconds: number;
  weeklyResetAt: number;

  adsWatchedToday: number;
  /** Davet linkiyle katilip odul kazandirmis arkadas sayisi. */
  invitesRewarded: number;
};

export type PaymentsAction =
  | { type: 'REPLACE_STATE'; state: PaymentsState }
  | { type: 'CHECK_RESETS'; now: number }
  | { type: 'TICK_CALL_SECONDS'; seconds: number; now: number }
  | { type: 'BUY_JETON_PACKAGE'; packageId: string }
  | { type: 'BUY_PREMIUM'; planId: PremiumPlanId; now: number }
  | { type: 'WATCH_AD_FOR_JETONS'; now: number }
  | { type: 'SPEND_JETONS_FOR_TIME'; cost: number; seconds: number }
  | { type: 'SPEND_JETONS_FOR_GAME'; cost: number }
  | { type: 'CLAIM_INVITE_REWARD' }
  | { type: 'CANCEL_PREMIUM' };

export type PaymentsActionError = 'unknown-package' | 'unknown-plan' | 'insufficient-jetons' | 'daily-ad-limit';

export type PaymentsActionResult = { state: PaymentsState; error?: PaymentsActionError };
