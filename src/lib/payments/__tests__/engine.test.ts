import { describe, expect, it } from 'vitest';

import {
  createInitialState,
  dailyLimit,
  isCallBlocked,
  monthlyLimit,
  nextMidnight,
  nextMonthStart,
  paymentsReducer,
  remainingDailySeconds,
} from '../engine';
import { AD_REWARD_JETONS, GAME_COST_HIGH, GAME_COST_LOW, JETON_EXTEND_COST, JETON_EXTEND_SECONDS, MAX_ADS_PER_DAY } from '../types';

const T0 = new Date('2026-01-15T10:00:00Z').getTime();

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

  it('premium bypasses call-time tracking entirely', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'BUY_PREMIUM', planId: 'monthly', now: T0 }).state;
    state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 10 * 60 * 60, now: T0 + 1000 }).state;
    expect(state.dailyUsedSeconds).toBe(0);
    expect(isCallBlocked(state)).toBe(false);
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

describe('daily/monthly call-time limit', () => {
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

  it('blocks once the monthly 8-hour limit is reached even if daily is under', () => {
    // 10 separate days of 50 minutes each: each day stays well under the 60-minute
    // daily cap, but the monthly total (500 min = 30,000s) exceeds the 8h (28,800s) cap.
    let state = createInitialState(T0);
    for (let day = 0; day < 10; day++) {
      const dayNow = T0 + day * 24 * 60 * 60 * 1000;
      state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 50 * 60, now: dayNow }).state;
    }
    expect(monthlyLimit(state)).toBe(8 * 60 * 60);
    expect(state.monthlyUsedSeconds).toBe(10 * 50 * 60);
    expect(state.dailyUsedSeconds).toBe(50 * 60);
    expect(state.dailyUsedSeconds).toBeLessThan(dailyLimit(state));
    expect(isCallBlocked(state)).toBe(true);
  });
});

describe('daily reset', () => {
  it('resets daily usage after midnight but keeps monthly usage', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 60 * 60, now: T0 }).state;
    expect(isCallBlocked(state)).toBe(true);

    const tomorrow = nextMidnight(T0) + 1000;
    const result = paymentsReducer(state, { type: 'CHECK_RESETS', now: tomorrow });
    expect(result.state.dailyUsedSeconds).toBe(0);
    expect(result.state.monthlyUsedSeconds).toBe(60 * 60); // ay içindeki toplam korunur
    expect(isCallBlocked(result.state)).toBe(false);
  });

  it('resets monthly usage and ad count at month start', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'WATCH_AD_FOR_JETONS', now: T0 }).state;
    const nextMonth = nextMonthStart(T0) + 1000;
    const result = paymentsReducer(state, { type: 'CHECK_RESETS', now: nextMonth });
    expect(result.state.monthlyUsedSeconds).toBe(0);
    expect(result.state.adsWatchedToday).toBe(0);
  });
});

describe('spending jetons for a time extension', () => {
  it('extends both the daily and monthly allowance and deducts jetons', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'BUY_JETON_PACKAGE', packageId: 'jeton_100' }).state;
    state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 60 * 60, now: T0 }).state;
    expect(isCallBlocked(state)).toBe(true);

    const result = paymentsReducer(state, { type: 'SPEND_JETONS_FOR_TIME' });
    expect(result.error).toBeUndefined();
    expect(result.state.jetonBalance).toBe(100 - JETON_EXTEND_COST);
    expect(result.state.dailyBonusSeconds).toBe(JETON_EXTEND_SECONDS);
    expect(isCallBlocked(result.state)).toBe(false);
  });

  it('rejects spending when the balance is insufficient', () => {
    const state = createInitialState(T0);
    const result = paymentsReducer(state, { type: 'SPEND_JETONS_FOR_TIME' });
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
    state = paymentsReducer(state, { type: 'WATCH_AD_FOR_JETONS', now: T0 }).state; // +2 jetons
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
  it('grants jetons and enforces the daily ad cap', () => {
    let state = createInitialState(T0);
    for (let i = 0; i < MAX_ADS_PER_DAY; i++) {
      state = paymentsReducer(state, { type: 'WATCH_AD_FOR_JETONS', now: T0 }).state;
    }
    expect(state.jetonBalance).toBe(MAX_ADS_PER_DAY * AD_REWARD_JETONS);
    const overCap = paymentsReducer(state, { type: 'WATCH_AD_FOR_JETONS', now: T0 });
    expect(overCap.error).toBe('daily-ad-limit');
    expect(overCap.state.jetonBalance).toBe(state.jetonBalance);
  });

  it('watching an ad for a time extension unblocks a capped call and shares the same daily cap', () => {
    let state = createInitialState(T0);
    state = paymentsReducer(state, { type: 'TICK_CALL_SECONDS', seconds: 60 * 60, now: T0 }).state;
    expect(isCallBlocked(state)).toBe(true);

    const result = paymentsReducer(state, { type: 'WATCH_AD_FOR_TIME_EXTENSION', now: T0 });
    expect(result.error).toBeUndefined();
    expect(isCallBlocked(result.state)).toBe(false);
    expect(result.state.adsWatchedToday).toBe(1);
  });
});
