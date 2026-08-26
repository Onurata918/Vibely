import { cardScoreValue } from './validation';
import type { ClashCard, ClashPlayerState } from './types';

/** Round sonu: kazanan, kaybedenlerin elindeki kartlarin toplam degerini kazanir. */
export function computeRoundScore(players: ClashPlayerState[], hands: Record<string, ClashCard[]>, winnerId: string): number {
  let total = 0;
  for (const p of players) {
    if (p.id === winnerId) continue;
    const hand = hands[p.id] ?? [];
    total += hand.reduce((sum, c) => sum + cardScoreValue(c), 0);
  }
  return total;
}
