import { describe, expect, it } from 'vitest';

import { isPlayable } from '../engine';
import { assertConservation, seatAfter, topDiscard } from '../state';
import { STARTING_HAND_SIZE } from '../types';
import { action, num, wild } from './fixtures';
import { gameWith, handSize, play } from './engineFixtures';

describe('eşleşme — C012-C016, C033', () => {
  const top = num('CRIMSON', 7);
  const state = () => gameWith({ hands: { 0: [num('CRIMSON', 2), num('AZURE', 7), num('AZURE', 6), action('AZURE', 'BLOCK'), wild('COLOR_SHIFT'), num('LIME', 3), num('GOLD', 4)] }, start: top, currentSeat: 0 });

  it('C012: aynı renk oynanır', () => {
    const result = play(state(), 0, { type: 'PLAY_CARD', cardId: num('CRIMSON', 2).id, calledClash: false });
    expect(result.ok).toBe(true);
    if (result.ok) expect(topDiscard(result.state).id).toBe(num('CRIMSON', 2).id);
  });

  it('C013: aynı sayı farklı renk oynanır', () => {
    expect(play(state(), 0, { type: 'PLAY_CARD', cardId: num('AZURE', 7).id, calledClash: false }).ok).toBe(true);
  });

  it('C015: farklı renk farklı sayı reddedilir', () => {
    const result = play(state(), 0, { type: 'PLAY_CARD', cardId: num('AZURE', 6).id, calledClash: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('CARD_NOT_PLAYABLE');
  });

  it('C014: aynı sembol farklı renk oynanır', () => {
    const blockTop = gameWith({ hands: { 0: [action('AZURE', 'BLOCK'), num('LIME', 1), num('LIME', 2), num('LIME', 3), num('LIME', 4), num('LIME', 5), num('LIME', 6)] }, start: action('CRIMSON', 'BLOCK'), currentSeat: 0 });
    expect(play(blockTop, 0, { type: 'PLAY_CARD', cardId: action('AZURE', 'BLOCK').id, calledClash: false }).ok).toBe(true);
  });

  it('C016: Color Shift her zaman oynanır ama renk zorunludur', () => {
    const missing = play(state(), 0, { type: 'PLAY_CARD', cardId: wild('COLOR_SHIFT').id, calledClash: false });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error).toBe('COLOR_REQUIRED');

    const chosen = play(state(), 0, { type: 'PLAY_CARD', cardId: wild('COLOR_SHIFT').id, chosenColor: 'LIME', calledClash: false });
    expect(chosen.ok).toBe(true);
    if (chosen.ok) expect(chosen.state.activeColor).toBe('LIME');
  });

  it('C032: Color Shift mevcut rengi yeniden seçebilir', () => {
    const same = play(state(), 0, { type: 'PLAY_CARD', cardId: wild('COLOR_SHIFT').id, chosenColor: 'CRIMSON', calledClash: false });
    expect(same.ok).toBe(true);
    if (same.ok) expect(same.state.activeColor).toBe('CRIMSON');
  });

  it('C033: seçilen aktif renk sonraki eşleşmede belirleyicidir', () => {
    const shifted = play(state(), 0, { type: 'PLAY_CARD', cardId: wild('COLOR_SHIFT').id, chosenColor: 'LIME', calledClash: false });
    expect(shifted.ok).toBe(true);
    if (!shifted.ok) return;
    const top = topDiscard(shifted.state);
    expect(isPlayable(num('LIME', 9), top, shifted.state.activeColor)).toBe(true);
    expect(isPlayable(num('GOLD', 9), top, shifted.state.activeColor)).toBe(false);
  });

  it('C017: sırası olmayan oyuncunun hamlesi reddedilir', () => {
    const result = play(state(), 1, { type: 'PLAY_CARD', cardId: num('CRIMSON', 2).id, calledClash: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NOT_YOUR_TURN');
  });

  it('C018: elde olmayan kart reddedilir ve state değişmez', () => {
    const before = state();
    const result = play(before, 0, { type: 'PLAY_CARD', cardId: num('GOLD', 9).id, calledClash: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('CARD_NOT_OWNED');
    expect(result.state).toBe(before);
  });

  it('C023: aynı turda ikinci kart oynanamaz', () => {
    const first = play(state(), 0, { type: 'PLAY_CARD', cardId: num('CRIMSON', 2).id, calledClash: false });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    // Sıra artık seat 1'de; seat 0 tekrar oynayamaz.
    const second = play(first.state, 0, { type: 'PLAY_CARD', cardId: num('AZURE', 7).id, calledClash: false });
    expect(second.ok).toBe(false);
  });
});

describe('çekme — C019-C022, C025, C026', () => {
  const noPlayable = () =>
    gameWith({
      hands: { 0: [num('AZURE', 1), num('AZURE', 2), num('LIME', 3), num('LIME', 4), num('GOLD', 5), num('GOLD', 6), num('AZURE', 8)] },
      start: num('CRIMSON', 7),
      currentSeat: 0,
      drawPile: [num('CRIMSON', 9)],
    });

  it('C019: oynanabilir kart varken de çekilebilir', () => {
    const withPlayable = gameWith({ hands: { 0: [num('CRIMSON', 2), num('AZURE', 1), num('AZURE', 2), num('LIME', 3), num('LIME', 4), num('GOLD', 5), num('GOLD', 6)] }, start: num('CRIMSON', 7), currentSeat: 0 });
    const result = play(withPlayable, 0, { type: 'DRAW_CARD' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(handSize(result.state, 0)).toBe(STARTING_HAND_SIZE + 1);
      expect(result.state.phase).toBe('AFTER_DRAW');
    }
  });

  it('C020: çekilen oynanabilir kart aynı tur oynanır', () => {
    const drawn = play(noPlayable(), 0, { type: 'DRAW_CARD' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;
    expect(drawn.state.drawnCardId).toBe(num('CRIMSON', 9).id);

    const played = play(drawn.state, 0, { type: 'PLAY_DRAWN_CARD', cardId: num('CRIMSON', 9).id, calledClash: false });
    expect(played.ok).toBe(true);
    if (played.ok) expect(topDiscard(played.state).id).toBe(num('CRIMSON', 9).id);
  });

  it('C021: çekimden sonra elde önceden bulunan kart oynanamaz', () => {
    const hand = [num('CRIMSON', 2), num('AZURE', 1), num('AZURE', 2), num('LIME', 3), num('LIME', 4), num('GOLD', 5), num('GOLD', 6)];
    const state = gameWith({ hands: { 0: hand }, start: num('CRIMSON', 7), currentSeat: 0, drawPile: [num('CRIMSON', 9)] });
    const drawn = play(state, 0, { type: 'DRAW_CARD' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;

    const result = play(drawn.state, 0, { type: 'PLAY_DRAWN_CARD', cardId: num('CRIMSON', 2).id, calledClash: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('CARD_NOT_PLAYABLE');
  });

  it('C022: çekilen kart oynanmazsa PASS turu ilerletir', () => {
    const drawn = play(noPlayable(), 0, { type: 'DRAW_CARD' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;
    const passed = play(drawn.state, 0, { type: 'PASS_AFTER_DRAW' });
    expect(passed.ok).toBe(true);
    if (passed.ok) {
      expect(passed.state.currentSeat).toBe(1);
      expect(passed.state.phase).toBe('AWAIT_ACTION');
    }
  });

  it('C025: çekme destesi boşsa üst atık hariç atıklar karıştırılır', () => {
    const state = gameWith({ hands: { 0: [num('AZURE', 1), num('AZURE', 2), num('LIME', 3), num('LIME', 4), num('GOLD', 5), num('GOLD', 6), num('AZURE', 8)] }, start: num('CRIMSON', 7), currentSeat: 0 });
    // Çekme destesini boşalt, atığa birkaç kart koy.
    const emptied = { ...state, drawPile: [], discardPile: [num('GOLD', 1), num('GOLD', 2), num('CRIMSON', 7)] };

    const result = play(emptied, 0, { type: 'DRAW_CARD' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Üst kart yerinde kalır, diğer iki atık yeni desteye döner (biri çekilir).
    expect(topDiscard(result.state).id).toBe(num('CRIMSON', 7).id);
    expect(result.state.discardPile).toHaveLength(1);
    expect(handSize(result.state, 0)).toBe(8);
  });

  it('C026: karıştıracak kart yoksa PASS ile kilitlenme olmaz', () => {
    const state = gameWith({ hands: { 0: [num('AZURE', 1), num('AZURE', 2), num('LIME', 3), num('LIME', 4), num('GOLD', 5), num('GOLD', 6), num('AZURE', 8)] }, start: num('CRIMSON', 7), currentSeat: 0 });
    const stuck = { ...state, drawPile: [], discardPile: [num('CRIMSON', 7)] };

    const result = play(stuck, 0, { type: 'DRAW_CARD' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.currentSeat).toBe(1);
    expect(result.state.phase).toBe('AWAIT_ACTION');
    expect(handSize(result.state, 0)).toBe(7);
  });
});

describe('özel kartlar — C027-C031', () => {
  const withCard = (card: Parameters<typeof play>[2] extends never ? never : ReturnType<typeof num>, playerCount = 4) =>
    gameWith({
      hands: { 0: [card, num('LIME', 1), num('LIME', 2), num('LIME', 3), num('LIME', 4), num('LIME', 5), num('LIME', 6)] },
      start: num('CRIMSON', 7),
      currentSeat: 0,
      rules: { playerCount },
    });

  it('C027: Block sıradaki seat’i atlar', () => {
    const state = withCard(action('CRIMSON', 'BLOCK'));
    const result = play(state, 0, { type: 'PLAY_CARD', cardId: action('CRIMSON', 'BLOCK').id, calledClash: false });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.currentSeat).toBe(2);
  });

  it('C028: Flip dört oyuncuda yönü değiştirir ve yeni yöndeki seat’e gider', () => {
    const state = withCard(action('CRIMSON', 'FLIP'));
    const result = play(state, 0, { type: 'PLAY_CARD', cardId: action('CRIMSON', 'FLIP').id, calledClash: false });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.direction).toBe(-1);
      expect(result.state.currentSeat).toBe(seatAfter(0, -1, 4));
    }
  });

  it('C029: Flip iki oyuncuda oynayana tekrar sıra verir', () => {
    const state = withCard(action('CRIMSON', 'FLIP'), 2);
    const result = play(state, 0, { type: 'PLAY_CARD', cardId: action('CRIMSON', 'FLIP').id, calledClash: false });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.currentSeat).toBe(0);
  });

  it('C030: Draw 2 sıradaki oyuncuya tam iki kart verir ve atlar', () => {
    const state = withCard(action('CRIMSON', 'DRAW_TWO'));
    const before = handSize(state, 1);
    const result = play(state, 0, { type: 'PLAY_CARD', cardId: action('CRIMSON', 'DRAW_TWO').id, calledClash: false });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(handSize(result.state, 1)).toBe(before + 2);
      expect(result.state.currentSeat).toBe(2);
      expect(() => assertConservation(result.state)).not.toThrow();
    }
  });

  it('C024/C031: ceza alan oyuncu karşılık veremez; sıra ona hiç gelmez', () => {
    const state = gameWith({
      hands: {
        0: [action('CRIMSON', 'DRAW_TWO'), num('LIME', 1), num('LIME', 2), num('LIME', 3), num('LIME', 4), num('LIME', 5), num('LIME', 6)],
        1: [action('CRIMSON', 'DRAW_TWO', 2), num('GOLD', 1), num('GOLD', 2), num('GOLD', 3), num('GOLD', 4), num('GOLD', 5), num('GOLD', 6)],
      },
      start: num('CRIMSON', 7),
      currentSeat: 0,
    });
    const played = play(state, 0, { type: 'PLAY_CARD', cardId: action('CRIMSON', 'DRAW_TWO').id, calledClash: false });
    expect(played.ok).toBe(true);
    if (!played.ok) return;

    // Seat 1 cezayı aldı ve atlandı; yığmak için oynamayı denerse sırası değil.
    const stack = play(played.state, 1, { type: 'PLAY_CARD', cardId: action('CRIMSON', 'DRAW_TWO', 2).id, calledClash: false });
    expect(stack.ok).toBe(false);
    if (!stack.ok) expect(stack.error).toBe('NOT_YOUR_TURN');
  });
});
