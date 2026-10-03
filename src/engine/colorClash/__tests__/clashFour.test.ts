import { describe, expect, it } from 'vitest';

import { hasColorMatch } from '../engine';
import { toPrivateState, toPublicState } from '../projection';
import { assertConservation } from '../state';
import { action, num, wild } from './fixtures';
import { gameWith, handSize, play } from './engineFixtures';

/** Seat 0 Clash 4 oynar; elinde önceki aktif renk (CRIMSON) kartı var mı seçilebilir. */
function clashFourGame(options: { hand: ReturnType<typeof num>[]; lastCardOnly?: boolean }) {
  const hand = options.lastCardOnly ? [wild('CLASH_FOUR')] : [wild('CLASH_FOUR'), ...options.hand];
  return gameWith({ hands: { 0: hand }, start: num('CRIMSON', 7), currentSeat: 0 });
}

const LEGAL_HAND = [num('AZURE', 1), num('LIME', 2), num('GOLD', 3), num('AZURE', 4), num('LIME', 5), num('GOLD', 6)];
const ILLEGAL_HAND = [num('CRIMSON', 1), num('LIME', 2), num('GOLD', 3), num('AZURE', 4), num('LIME', 5), num('GOLD', 6)];

const playClashFour = (state: ReturnType<typeof clashFourGame>) =>
  play(state, 0, { type: 'PLAY_CARD', cardId: wild('CLASH_FOUR').id, chosenColor: 'LIME', calledClash: false });

describe('Clash 4 yasallığı — C034-C038', () => {
  it('C034: önceki aktif renkle eşleşen kart yoksa yasaldır', () => {
    expect(hasColorMatch(LEGAL_HAND, 'CRIMSON')).toBe(false);
    const played = playClashFour(clashFourGame({ hand: LEGAL_HAND }));
    expect(played.ok).toBe(true);
    if (played.ok) expect(played.state.clashFour?.hadPreviousColorMatch).toBe(false);
  });

  it('C035: aktif renk kartı varsa oynama kabul edilir ama kanıt illegal kaydedilir', () => {
    const played = playClashFour(clashFourGame({ hand: ILLEGAL_HAND }));
    expect(played.ok).toBe(true);
    if (played.ok) expect(played.state.clashFour?.hadPreviousColorMatch).toBe(true);
  });

  it('C036: yalnız aynı sayı farklı renk varsa yasaldır', () => {
    const sameNumber = [num('AZURE', 7), num('LIME', 2), num('GOLD', 3), num('AZURE', 4), num('LIME', 5), num('GOLD', 6)];
    expect(hasColorMatch(sameNumber, 'CRIMSON')).toBe(false);
    const played = playClashFour(clashFourGame({ hand: sameNumber }));
    if (played.ok) expect(played.state.clashFour?.hadPreviousColorMatch).toBe(false);
  });

  it('C037: yalnız aynı sembol farklı renk varsa yasaldır', () => {
    const sameSymbol = [action('AZURE', 'BLOCK'), num('LIME', 2), num('GOLD', 3), num('AZURE', 4), num('LIME', 5), num('GOLD', 6)];
    const state = gameWith({ hands: { 0: [wild('CLASH_FOUR'), ...sameSymbol] }, start: action('CRIMSON', 'BLOCK'), currentSeat: 0 });
    const played = play(state, 0, { type: 'PLAY_CARD', cardId: wild('CLASH_FOUR').id, chosenColor: 'LIME', calledClash: false });
    expect(played.ok).toBe(true);
    if (played.ok) expect(played.state.clashFour?.hadPreviousColorMatch).toBe(false);
  });

  it('C038: renk seçmeden tamamlanmaz', () => {
    const state = clashFourGame({ hand: LEGAL_HAND });
    const result = play(state, 0, { type: 'PLAY_CARD', cardId: wild('CLASH_FOUR').id, calledClash: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('COLOR_REQUIRED');
  });
});

describe('Clash 4 itirazı — C039-C045', () => {
  const afterPlay = (hand: ReturnType<typeof num>[]) => {
    const played = playClashFour(clashFourGame({ hand }));
    if (!played.ok) throw new Error('clash four play failed');
    return played.state;
  };

  it('C039: yalnız cezayı alacak oyuncu itiraz edebilir', () => {
    const state = afterPlay(LEGAL_HAND);
    expect(state.clashFour?.targetSeat).toBe(1);
    const wrongSeat = play(state, 2, { type: 'CHALLENGE_DRAW_FOUR' });
    expect(wrongSeat.ok).toBe(false);
    if (!wrongSeat.ok) expect(wrongSeat.error).toBe('CHALLENGE_NOT_ALLOWED');
  });

  it('C040: doğru itiraz — oynayan 4 çeker, itiraz eden normal turuna geçer', () => {
    const state = afterPlay(ILLEGAL_HAND);
    const before = handSize(state, 0);
    const result = play(state, 1, { type: 'CHALLENGE_DRAW_FOUR' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(handSize(result.state, 0)).toBe(before + 4);
    expect(handSize(result.state, 1)).toBe(handSize(state, 1));
    expect(result.state.currentSeat).toBe(1);
    expect(() => assertConservation(result.state)).not.toThrow();
  });

  it('C041: yanlış itiraz — itiraz eden 6 çeker ve atlanır', () => {
    const state = afterPlay(LEGAL_HAND);
    const before = handSize(state, 1);
    const result = play(state, 1, { type: 'CHALLENGE_DRAW_FOUR' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(handSize(result.state, 1)).toBe(before + 6);
    expect(result.state.currentSeat).toBe(2);
  });

  it('C042: accept — itiraz eden 4 çeker ve atlanır', () => {
    const state = afterPlay(LEGAL_HAND);
    const before = handSize(state, 1);
    const result = play(state, 1, { type: 'ACCEPT_DRAW_FOUR' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(handSize(result.state, 1)).toBe(before + 4);
    expect(result.state.currentSeat).toBe(2);
  });

  it('C044/C045: pencere kapandıktan sonra ikinci itiraz reddedilir ve kart çektirmez', () => {
    const state = afterPlay(LEGAL_HAND);
    const first = play(state, 1, { type: 'ACCEPT_DRAW_FOUR' });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = play(first.state, 1, { type: 'CHALLENGE_DRAW_FOUR' });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toBe('CHALLENGE_NOT_ALLOWED');
    expect(second.state).toBe(first.state);
    expect(handSize(second.state, 1)).toBe(handSize(first.state, 1));
  });

  it('C043: kanıt hiçbir projeksiyona sızmaz', () => {
    const state = afterPlay(ILLEGAL_HAND);
    const publicState = toPublicState(state);
    const serialized = JSON.stringify(publicState);

    expect(serialized).not.toContain('hadPreviousColorMatch');
    expect(serialized).not.toContain('clashFour');
    // Rakip kartlarının kimliği public state'te bulunmaz.
    for (const card of state.seats[0].hand) expect(serialized).not.toContain(card.id);
    expect(publicState.seats.map((s) => s.cardCount)).toEqual(state.seats.map((s) => s.hand.length));

    // Private projeksiyon yalnızca alıcının elini verir.
    const ownPrivate = toPrivateState(state, 1);
    const privateSerialized = JSON.stringify(ownPrivate);
    for (const card of state.seats[0].hand) expect(privateSerialized).not.toContain(card.id);
    expect(ownPrivate.hand).toEqual(state.seats[1].hand);
  });
});

describe('Clash 4 ile el bitirme — C046, C047', () => {
  it('C046: son kart Clash 4 ise el itiraz çözülmeden puanlanmaz', () => {
    const state = clashFourGame({ hand: [], lastCardOnly: true });
    const played = playClashFour(state);
    expect(played.ok).toBe(true);
    if (!played.ok) return;

    expect(played.state.seats[0].hand).toHaveLength(0);
    expect(played.state.status).toBe('ROUND_END_PENDING');
    expect(played.state.winnerSeat).toBeNull();
  });

  it('C047: accept sonrası çekilen 4 kart rakibin elinde kalır ve el kapanır', () => {
    const state = clashFourGame({ hand: [], lastCardOnly: true });
    const played = playClashFour(state);
    if (!played.ok) throw new Error('play failed');

    const before = handSize(played.state, 1);
    const accepted = play(played.state, 1, { type: 'ACCEPT_DRAW_FOUR' });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;

    expect(handSize(accepted.state, 1)).toBe(before + 4);
    expect(accepted.state.status).toBe('ROUND_ENDED');
    expect(accepted.state.winnerSeat).toBe(0);
  });
});
