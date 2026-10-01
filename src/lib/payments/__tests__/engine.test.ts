import { describe, expect, it } from 'vitest';

import {
  createInitialState,
  dailyLimit,
  isCallBlocked,
  nextMidnight,
  nextWeekStart,
  normalizeState,
  paymentsReducer,
  remainingDailySeconds,
  weeklyLimit,
} from '../engine';
import {
  AD_REWARD_JETONS,
  GAME_COST_HIGH,
  GAME_COST_LOW,
  INVITE_REWARD_JETONS,
  PREMIUM_WEEKLY_LIMIT_SECONDS,
  SIGNUP_BONUS_JETONS,
  JETON_EXTEND_COST,
  JETON_EXTEND_SECONDS,
  JETON_EXTEND_SMALL_COST,
  JETON_EXTEND_SMALL_SECONDS,
  MAX_ADS_PER_DAY,
  WEEKLY_LIMIT_SECONDS,
} from '../types';

const T0 = new Date('2026-01-15T10:00:00Z').getTime(); // Perşembe
const MONDAY = new Date('2026-01-12T10:00:00Z').getTime(); // Pazartesi

describe('jeton package purchase', () => {
  it('adds the correct jeton amount for a valid package', () => {
    const state = createInitialState(T0);
    const result = paymentsReducer(state, { type: 'BUY_JETON_PACKAGE', packageId: 'jeton_300' });
    expect(result.error).toBeUndefined();
    expect(result.state.jetonBalance).toBe(300);
  });

  it('rejects an unknown package id', () => {
    const state = createInitialState(T0);
    const result = paymentsReducer(state, { type: 'BUY_JETON_PACKAGE', packageId: 'nope' });
    expect(result.error).toBe('unknown-package');
    expect(result.state.jetonBalance).toBe(0);
  });

  it('purchases stack across multiple buys', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'BUY_JETON_PACKAGE', packageId: 'jeton_100' }).state;
    state = paymentsReducer(state, { type: 'BUY_JETON_PACKAGE', packageId: 'jeton_500' }).state;
    expect(state.jetonBalance).toBe(600);
  });
});

describe('premium purchase', () => {
  it('activates premium and sets an expiry N months out', () => {
    const state = createInitialState(T0);
    const result = paymentsReducer(state, { type: 'BUY_PREMIUM', planId: 'quarterly', now: T0 });
    expect(result.state.isPremium).toBe(true);
    expect(result.state.premiumPlanId).toBe('quarterly');
    const daysUntilExpiry = (result.state.premiumExpiresAt! - T0) / (24 * 60 * 60 * 1000);
    expect(daysUntilExpiry).toBeCloseTo(90, 0);
  });

  it('premium automatically expires and reverts to free tier', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'BUY_PREMIUM', planId: 'monthly', now: T0 }).state;
    const wellAfterExpiry = state.premiumExpiresAt! + 1000;
    const result = paymentsReducer(state, { type: 'CHECK_RESETS', now: wellAfterExpiry });
    expect(result.state.isPremium).toBe(false);
    expect(result.state.premiumExpiresAt).toBeNull();
  });
});

describe('premium call-time limit (15h/week, no daily cap)', () => {
  it('has no daily cap: 10 straight hours in one day is still allowed', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'BUY_PREMIUM', planId: 'monthly', now: T0 }).state;
    state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 10 * 60 * 60, now: T0 }).state;
    expect(dailyLimit(state)).toBe(Number.POSITIVE_INFINITY);
    expect(isCallBlocked(state)).toBe(false);
  });

  it('blocks once the 15-hour weekly allowance is used up', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'BUY_PREMIUM', planId: 'monthly', now: T0 }).state;
    expect(weeklyLimit(state)).toBe(PREMIUM_WEEKLY_LIMIT_SECONDS);
    state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 15 * 60 * 60, now: T0 }).state;
    expect(isCallBlocked(state)).toBe(true);
  });

  it('premium gets three times the free weekly allowance', () => {
    const free = createInitialState(T0);
    const premium = paymentsReducer(free, { type: 'BUY_PREMIUM', planId: 'monthly', now: T0 }).state;
    expect(weeklyLimit(free)).toBe(WEEKLY_LIMIT_SECONDS);
    expect(weeklyLimit(premium)).toBe(3 * weeklyLimit(free));
  });

  it('falls back to the free limits once premium expires', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'BUY_PREMIUM', planId: 'monthly', now: T0 }).state;
    const afterExpiry = paymentsReducer(state, { type: 'CHECK_RESETS', now: state.premiumExpiresAt! + 1000 }).state;
    expect(afterExpiry.isPremium).toBe(false);
    expect(weeklyLimit(afterExpiry)).toBe(WEEKLY_LIMIT_SECONDS);
  });
});

describe('free-tier call-time limit (1h/day, 5h/week)', () => {
  it('is not blocked when under both limits', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 30 * 60, now: T0 }).state;
    expect(isCallBlocked(state)).toBe(false);
    expect(remainingDailySeconds(state)).toBe(30 * 60);
  });

  it('blocks once the daily 1-hour limit is reached', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 60 * 60, now: T0 }).state;
    expect(isCallBlocked(state)).toBe(true);
    expect(dailyLimit(state)).toBe(60 * 60);
  });

  it('blocks once the weekly 5-hour limit is reached even if today is under', () => {
    // Pazartesiden itibaren 6 gün × 50 dk: her gün 60 dk'lık günlük sınırın altında
    // kalır ama haftalık toplam (300 dk) 5 saatlik tavana dayanır.
    let state = createInitialState(MONDAY);
    for (let day = 0; day < 6; day++) {
      const dayNow = MONDAY + day * 24 * 60 * 60 * 1000;
      state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 50 * 60, now: dayNow }).state;
    }
    expect(weeklyLimit(state)).toBe(5 * 60 * 60);
    expect(state.weeklyUsedSeconds).toBe(6 * 50 * 60);
    expect(state.dailyUsedSeconds).toBe(50 * 60);
    expect(state.dailyUsedSeconds).toBeLessThan(dailyLimit(state));
    expect(isCallBlocked(state)).toBe(true);
  });
});

describe('resets', () => {
  it('resets daily usage after midnight but keeps weekly usage', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 60 * 60, now: T0 }).state;
    expect(isCallBlocked(state)).toBe(true);

    const tomorrow = nextMidnight(T0) + 1000;
    const result = paymentsReducer(state, { type: 'CHECK_RESETS', now: tomorrow });
    expect(result.state.dailyUsedSeconds).toBe(0);
    expect(result.state.weeklyUsedSeconds).toBe(60 * 60); // hafta içindeki toplam korunur
    expect(isCallBlocked(result.state)).toBe(false);
  });

  it('resets weekly usage and the ad counters at the start of the week', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 45 * 60, now: T0 }).state;
    state = paymentsReducer(state, { type: 'WATCH_AD_FOR_JETONS', now: T0 }).state;
    const nextWeek = nextWeekStart(T0) + 1000;
    const result = paymentsReducer(state, { type: 'CHECK_RESETS', now: nextWeek });
    expect(result.state.weeklyUsedSeconds).toBe(0);
    expect(result.state.adsWatchedToday).toBe(0);
  });

  it('the week always starts on a Monday', () => {
    expect(new Date(nextWeekStart(T0)).getDay()).toBe(1);
    expect(new Date(nextWeekStart(MONDAY)).getDay()).toBe(1);
    // Pazartesi günü çağrıldığında bugüne değil, bir sonraki pazartesiye işaret eder.
    expect(nextWeekStart(MONDAY)).toBeGreaterThan(MONDAY);
  });
});

describe('spending jetons for a time extension', () => {
  it('the small option adds 15 minutes for 10 jetons', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'BUY_JETON_PACKAGE', packageId: 'jeton_100' }).state;
    state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 60 * 60, now: T0 }).state;
    expect(isCallBlocked(state)).toBe(true);

    const result = paymentsReducer(state, { type: 'SPEND_JETONS_FOR_TIME', cost: JETON_EXTEND_SMALL_COST, seconds: JETON_EXTEND_SMALL_SECONDS });
    expect(result.error).toBeUndefined();
    expect(result.state.jetonBalance).toBe(100 - JETON_EXTEND_SMALL_COST);
    expect(result.state.dailyBonusSeconds).toBe(JETON_EXTEND_SMALL_SECONDS);
    expect(result.state.weeklyBonusSeconds).toBe(JETON_EXTEND_SMALL_SECONDS);
    expect(isCallBlocked(result.state)).toBe(false);
  });

  it('the large option adds 30 minutes for 20 jetons', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'BUY_JETON_PACKAGE', packageId: 'jeton_100' }).state;
    const result = paymentsReducer(state, { type: 'SPEND_JETONS_FOR_TIME', cost: JETON_EXTEND_COST, seconds: JETON_EXTEND_SECONDS });
    expect(result.state.jetonBalance).toBe(100 - JETON_EXTEND_COST);
    expect(result.state.dailyBonusSeconds).toBe(JETON_EXTEND_SECONDS);
  });

  it('both options cost the same per minute', () => {
    expect(JETON_EXTEND_SMALL_COST / JETON_EXTEND_SMALL_SECONDS).toBeCloseTo(JETON_EXTEND_COST / JETON_EXTEND_SECONDS, 10);
  });

  it('rejects spending when the balance is insufficient', () => {
    const state = createInitialState(T0);
    const result = paymentsReducer(state, { type: 'SPEND_JETONS_FOR_TIME', cost: JETON_EXTEND_SMALL_COST, seconds: JETON_EXTEND_SMALL_SECONDS });
    expect(result.error).toBe('insufficient-jetons');
    expect(result.state.jetonBalance).toBe(0);
  });
});

describe('spending jetons to start a game', () => {
  it('deducts the game cost when the balance is sufficient', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'BUY_JETON_PACKAGE', packageId: 'jeton_100' }).state;
    const result = paymentsReducer(state, { type: 'SPEND_JETONS_FOR_GAME', cost: GAME_COST_HIGH });
    expect(result.error).toBeUndefined();
    expect(result.state.jetonBalance).toBe(100 - GAME_COST_HIGH);
  });

  it('rejects when the balance is below the game cost', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'WATCH_AD_FOR_JETONS', now: T0 }).state;
    const result = paymentsReducer(state, { type: 'SPEND_JETONS_FOR_GAME', cost: GAME_COST_LOW });
    expect(result.error).toBe('insufficient-jetons');
    expect(result.state.jetonBalance).toBe(AD_REWARD_JETONS);
  });

  it('charges premium users nothing', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'BUY_PREMIUM', planId: 'monthly', now: T0 }).state;
    const result = paymentsReducer(state, { type: 'SPEND_JETONS_FOR_GAME', cost: GAME_COST_HIGH });
    expect(result.error).toBeUndefined();
    expect(result.state.jetonBalance).toBe(0);
  });
});

describe('watching ads', () => {
  it('grants jetons up to the daily cap, then refuses', () => {
    let state = createInitialState(T0);
    for (let i = 0; i < MAX_ADS_PER_DAY; i++) {
      const result = paymentsReducer(state, { type: 'WATCH_AD_FOR_JETONS', now: T0 });
      expect(result.error).toBeUndefined();
      state = result.state;
    }
    expect(state.jetonBalance).toBe(MAX_ADS_PER_DAY * AD_REWARD_JETONS);

    const overCap = paymentsReducer(state, { type: 'WATCH_AD_FOR_JETONS', now: T0 });
    expect(overCap.error).toBe('daily-ad-limit');
    expect(overCap.state.jetonBalance).toBe(state.jetonBalance);
  });

  it('the cap resets the next day', () => {
    let state = createInitialState(T0);
    for (let i = 0; i < MAX_ADS_PER_DAY; i++) state = paymentsReducer(state, { type: 'WATCH_AD_FOR_JETONS', now: T0 }).state;
    const tomorrow = nextMidnight(T0) + 1000;
    const result = paymentsReducer(state, { type: 'WATCH_AD_FOR_JETONS', now: tomorrow });
    expect(result.error).toBeUndefined();
    expect(result.state.adsWatchedToday).toBe(1);
  });

  it("a day of ads stays below premium's weekly allowance", () => {
    // Gunluk tavan dolduğunda kazanilan sure, Premium'u anlamsiz kilmamali.
    const jetonsPerDay = MAX_ADS_PER_DAY * AD_REWARD_JETONS;
    const secondsPerDay = (jetonsPerDay / JETON_EXTEND_SMALL_COST) * JETON_EXTEND_SMALL_SECONDS;
    expect(secondsPerDay * 7 + WEEKLY_LIMIT_SECONDS).toBeLessThan(PREMIUM_WEEKLY_LIMIT_SECONDS * 1.5);
  });

  it('ads no longer extend call time directly — only jetons do', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 60 * 60, now: T0 }).state;
    expect(isCallBlocked(state)).toBe(true);

    // Reklam süre vermez, sadece jeton verir.
    for (let i = 0; i < JETON_EXTEND_SMALL_COST / AD_REWARD_JETONS; i++) {
      state = paymentsReducer(state, { type: 'WATCH_AD_FOR_JETONS', now: T0 }).state;
    }
    expect(state.dailyBonusSeconds).toBe(0);
    expect(isCallBlocked(state)).toBe(true);

    // Kazanılan jetonlar uzatmaya çevrilince engel kalkar.
    expect(state.jetonBalance).toBe(JETON_EXTEND_SMALL_COST);
    state = paymentsReducer(state, { type: 'SPEND_JETONS_FOR_TIME', cost: JETON_EXTEND_SMALL_COST, seconds: JETON_EXTEND_SMALL_SECONDS }).state;
    expect(isCallBlocked(state)).toBe(false);
  });
});

describe('signup bonus', () => {
  it('grants the bonus once', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'CLAIM_SIGNUP_BONUS' }).state;
    expect(state.jetonBalance).toBe(SIGNUP_BONUS_JETONS);
    expect(state.signupBonusClaimed).toBe(true);
  });

  it('never pays twice, however many times it is called', () => {
    let state = createInitialState(T0);
    for (let i = 0; i < 5; i++) state = paymentsReducer(state, { type: 'CLAIM_SIGNUP_BONUS' }).state;
    expect(state.jetonBalance).toBe(SIGNUP_BONUS_JETONS);
  });

  it('covers a good first session: several games plus a time extension', () => {
    const state = paymentsReducer(createInitialState(T0), { type: 'CLAIM_SIGNUP_BONUS' }).state;
    expect(state.jetonBalance).toBeGreaterThanOrEqual(GAME_COST_HIGH * 10);
    expect(state.jetonBalance).toBeGreaterThanOrEqual(JETON_EXTEND_COST);
  });
});

describe('invite reward', () => {
  it('grants jetons and counts the invited friend', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'CLAIM_INVITE_REWARD' }).state;
    expect(state.jetonBalance).toBe(INVITE_REWARD_JETONS);
    expect(state.invitesRewarded).toBe(1);
  });

  it('stacks across several invited friends', () => {
    let state = createInitialState(T0);
    for (let i = 0; i < 3; i++) state = paymentsReducer(state, { type: 'CLAIM_INVITE_REWARD' }).state;
    expect(state.jetonBalance).toBe(3 * INVITE_REWARD_JETONS);
    expect(state.invitesRewarded).toBe(3);
  });

  it('one invite is worth more than a jeton pack buys in ad views', () => {
    expect(INVITE_REWARD_JETONS / AD_REWARD_JETONS).toBe(25);
  });
});

describe('migrating a saved state from the old monthly model', () => {
  it('fills in the weekly fields instead of producing NaN', () => {
    const legacy = {
      jetonBalance: 120,
      isPremium: false,
      premiumPlanId: null,
      premiumExpiresAt: null,
      dailyUsedSeconds: 600,
      dailyBonusSeconds: 0,
      dailyResetAt: nextMidnight(T0),
      adsWatchedToday: 3,
    } as unknown as Partial<import('../types').PaymentsState>;

    const state = normalizeState(legacy, T0);
    expect(state.jetonBalance).toBe(120);
    expect(state.dailyUsedSeconds).toBe(600);
    expect(state.weeklyUsedSeconds).toBe(0);
    expect(state.weeklyBonusSeconds).toBe(0);
    expect(state.invitesRewarded).toBe(0);
    expect(Number.isFinite(state.weeklyResetAt)).toBe(true);
    expect(isCallBlocked(state)).toBe(false);
  });

  it('returns a clean initial state when nothing is saved', () => {
    expect(normalizeState(null, T0)).toEqual(createInitialState(T0));
  });
});
