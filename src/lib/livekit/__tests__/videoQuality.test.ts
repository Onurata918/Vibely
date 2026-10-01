import { describe, expect, it } from 'vitest';

import { estimateDownstreamGBPerHour, pickVideoQuality, VIDEO_PROFILES } from '../videoQuality';

describe('picking video quality', () => {
  it('uses 480p in small rooms when no game is running', () => {
    expect(pickVideoQuality({ participantCount: 2, gameActive: false })).toBe('480p');
    expect(pickVideoQuality({ participantCount: 3, gameActive: false })).toBe('480p');
  });

  it('drops to 360p in rooms of four or more', () => {
    expect(pickVideoQuality({ participantCount: 4, gameActive: false })).toBe('360p');
    expect(pickVideoQuality({ participantCount: 5, gameActive: false })).toBe('360p');
    expect(pickVideoQuality({ participantCount: 6, gameActive: false })).toBe('360p');
  });

  it('drops one step further while a game is on', () => {
    expect(pickVideoQuality({ participantCount: 2, gameActive: true })).toBe('360p');
    expect(pickVideoQuality({ participantCount: 3, gameActive: true })).toBe('360p');
    expect(pickVideoQuality({ participantCount: 4, gameActive: true })).toBe('240p');
    expect(pickVideoQuality({ participantCount: 6, gameActive: true })).toBe('240p');
  });

  it('never goes up when the room grows or a game starts', () => {
    const order = ['240p', '360p', '480p'] as const;
    const rank = (q: ReturnType<typeof pickVideoQuality>) => order.indexOf(q);
    for (let n = 2; n <= 6; n++) {
      expect(rank(pickVideoQuality({ participantCount: n, gameActive: true }))).toBeLessThanOrEqual(
        rank(pickVideoQuality({ participantCount: n, gameActive: false }))
      );
      if (n > 2) {
        expect(rank(pickVideoQuality({ participantCount: n, gameActive: false }))).toBeLessThanOrEqual(
          rank(pickVideoQuality({ participantCount: n - 1, gameActive: false }))
        );
      }
    }
  });
});

describe('estimating downstream data', () => {
  it('is zero for someone sitting alone', () => {
    expect(estimateDownstreamGBPerHour({ participantCount: 1, gameActive: false })).toBe(0);
  });

  it('grows with the square of the room, not linearly', () => {
    const two = estimateDownstreamGBPerHour({ participantCount: 2, gameActive: false });
    const four = estimateDownstreamGBPerHour({ participantCount: 4, gameActive: false });
    // 4 kişilik odada 12 akış var, 2 kişilikte 2; ayrıca 4 kişilik 360p'ye düşüyor.
    const ratio = four / two;
    expect(ratio).toBeGreaterThan(3);
  });

  it('the quality rules cut a six-person game room by more than half', () => {
    const naive = 6 * 5 * ((VIDEO_PROFILES['480p'].bitrateKbps * 3600) / 8 / 1_000_000);
    const actual = estimateDownstreamGBPerHour({ participantCount: 6, gameActive: true });
    expect(actual).toBeLessThan(naive / 2);
  });
});
