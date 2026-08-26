import type { ClashCard } from './types';

export type CardEffect = {
  /** Bu karttan sonra kac oyuncu (dahil bir sonraki) sirasini kaybeder. 0 = normal gecis. */
  skipCount: number;
  /** Yon degisir mi. */
  flipsDirection: boolean;
  /** Bir sonraki oyuncuya eklenecek cekme cezasi (stacking kapaliyken hemen uygulanir). */
  drawPenalty: number;
  /** Oynayan oyuncunun renk secmesi gerekiyor mu. */
  needsColorChoice: boolean;
};

export function computeCardEffect(card: ClashCard): CardEffect {
  switch (card.kind) {
    case 'skip':
      return { skipCount: 1, flipsDirection: false, drawPenalty: 0, needsColorChoice: false };
    case 'reverse':
      return { skipCount: 0, flipsDirection: true, drawPenalty: 0, needsColorChoice: false };
    case 'drawTwo':
      return { skipCount: 0, flipsDirection: false, drawPenalty: 2, needsColorChoice: false };
    case 'wild':
      return { skipCount: 0, flipsDirection: false, drawPenalty: 0, needsColorChoice: true };
    case 'drawFour':
      return { skipCount: 0, flipsDirection: false, drawPenalty: 4, needsColorChoice: true };
    case 'number':
    default:
      return { skipCount: 0, flipsDirection: false, drawPenalty: 0, needsColorChoice: false };
  }
}
