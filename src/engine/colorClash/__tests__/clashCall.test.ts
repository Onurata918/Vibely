import { describe, expect, it } from 'vitest';

import { assertConservation } from '../state';
import { num } from './fixtures';
import { gameWith, handSize, play } from './engineFixtures';

/** Seat 0'ın elinde tam iki kart var; biri oynanınca bire düşer. */
const twoCards = () =>
  gameWith({ hands: { 0: [num('CRIMSON', 2), num('CRIMSON', 3)] }, start: num('CRIMSON', 7), currentSeat: 0 });

/** Seat 0'ın elinde tek kart var; oynayınca el biter. */
const oneCard = () => gameWith({ hands: { 0: [num('CRIMSON', 2)] }, start: num('CRIMSON', 7), currentSeat: 0 });

const playOne = (state: ReturnType<typeof twoCards>, calledClash: boolean) =>
  play(state, 0, { type: 'PLAY_CARD', cardId: num('CRIMSON', 2).id, calledClash });

describe('Clash! çağrısı — C048, C049, C054, C055', () => {
  it('C048: çağrı yapılırsa ceza penceresi açılmaz', () => {
    const result = playOne(twoCards(), true);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(handSize(result.state, 0)).toBe(1);
    expect(result.state.missedClashTargetSeat).toBeNull();
    expect(result.state.seats[0].calledClash).toBe(true);
  });

  it('C049: çağrısız düşüş yakalama penceresi açar', () => {
    const result = playOne(twoCards(), false);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.missedClashTargetSeat).toBe(0);
  });

  it('C054: kart çekerek bire düşmek çağrı gerektirmez', () => {
    // Seat 0 iki kartla başlar, oynanamaz kartları vardır ve çeker.
    const state = gameWith({ hands: { 0: [num('AZURE', 1), num('LIME', 2)] }, start: num('CRIMSON', 7), currentSeat: 0, drawPile: [num('CRIMSON', 9)] });
    const drawn = play(state, 0, { type: 'DRAW_CARD' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;

    // Çektiği kartı oynayıp ikiden bire düşerse bu bir "oynayarak düşüş"tür;
    // ama çekişin kendisi hiçbir zaman pencere açmaz.
    expect(drawn.state.missedClashTargetSeat).toBeNull();
  });

  it('C055: son kart oynanırken çağrı aranmaz', () => {
    const result = play(oneCard(), 0, { type: 'PLAY_CARD', cardId: num('CRIMSON', 2).id, calledClash: false });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(handSize(result.state, 0)).toBe(0);
    expect(result.state.missedClashTargetSeat).toBeNull();
    expect(result.state.status).toBe('ROUND_ENDED');
  });
});

describe('yakalama — C050-C053', () => {
  const missed = () => {
    const result = playOne(twoCards(), false);
    if (!result.ok) throw new Error('play failed');
    return result.state;
  };

  it('C050: zamanında ilk yakalama hedefe 2 kart verir', () => {
    const state = missed();
    const before = handSize(state, 0);
    const result = play(state, 2, { type: 'CATCH_MISSED_CLASH', targetSeat: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(handSize(result.state, 0)).toBe(before + 2);
    expect(result.state.missedClashTargetSeat).toBeNull();
    expect(() => assertConservation(result.state)).not.toThrow();
  });

  it('C051: ikinci eşzamanlı yakalama ek ceza vermez', () => {
    const first = play(missed(), 2, { type: 'CATCH_MISSED_CLASH', targetSeat: 0 });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = play(first.state, 3, { type: 'CATCH_MISSED_CLASH', targetSeat: 0 });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toBe('CATCH_WINDOW_CLOSED');
    expect(second.state).toBe(first.state);
    expect(handSize(second.state, 0)).toBe(handSize(first.state, 0));
  });

  it('C052: sonraki oyuncunun aksiyonu commit olunca yakalama reddedilir', () => {
    const state = missed();
    expect(state.currentSeat).toBe(1);

    const nextAction = play(state, 1, { type: 'DRAW_CARD' });
    expect(nextAction.ok).toBe(true);
    if (!nextAction.ok) return;
    expect(nextAction.state.missedClashTargetSeat).toBeNull();

    const late = play(nextAction.state, 2, { type: 'CATCH_MISSED_CLASH', targetSeat: 0 });
    expect(late.ok).toBe(false);
    if (!late.ok) expect(late.error).toBe('CATCH_WINDOW_CLOSED');
  });

  it('C053: yanlış hedef veya çağrı yapmış hedef state’i değiştirmez', () => {
    const state = missed();
    const wrongTarget = play(state, 2, { type: 'CATCH_MISSED_CLASH', targetSeat: 1 });
    expect(wrongTarget.ok).toBe(false);
    expect(wrongTarget.state).toBe(state);

    // Çağrı yapılmış oyuncu hiç pencere açmaz.
    const called = playOne(twoCards(), true);
    if (!called.ok) throw new Error('play failed');
    const noWindow = play(called.state, 2, { type: 'CATCH_MISSED_CLASH', targetSeat: 0 });
    expect(noWindow.ok).toBe(false);
    expect(noWindow.state).toBe(called.state);
  });

  it('oyuncu kendi kaçırdığı çağrıyı yakalayamaz', () => {
    const state = missed();
    const selfCatch = play(state, 0, { type: 'CATCH_MISSED_CLASH', targetSeat: 0 });
    expect(selfCatch.ok).toBe(false);
    expect(selfCatch.state).toBe(state);
  });
});
