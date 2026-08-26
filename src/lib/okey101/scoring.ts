// 101 Okey tur-sonu puanlamasi. Mevcut Vibely YuzBir implementasyonundaki
// (AppContext.tsx) kuralla ayni: kazanan -101, acmis ama bitirmemis
// oyuncular elindeki taslarin toplam degeri kadar ceza, hic acmamis
// oyuncu sabit 202 ceza alir (golf skoru gibi — dusuk/negatif iyi).
import { isWildTile, type OkeyColor, type OkeyTile } from '@/lib/okey/engine';
import type { Okey101PlayerState, Okey101Rules, Okey101RoundResult } from './types';

const JOKER_HAND_PENALTY = 25;
const NOT_OPENED_PENALTY = 202;

export function computeRoundResults(
  players: Okey101PlayerState[],
  racks: Record<string, OkeyTile[]>,
  hasOpened: Record<string, boolean>,
  winnerId: string,
  okeyOf: { color: OkeyColor; number: number } | null,
  rules: Okey101Rules
): Okey101RoundResult[] {
  const results: Okey101RoundResult[] = [
    {
      playerId: winnerId,
      opened: true,
      finishedHand: true,
      finishedWithOkey: false,
      scoreDelta: -rules.openingScore + (rules.handFinishBonus ? -10 : 0),
    },
  ];

  players.forEach((p) => {
    if (p.id === winnerId) return;
    if (hasOpened[p.id]) {
      const rack = racks[p.id] ?? [];
      const value = rack.reduce((sum, t) => sum + (isWildTile(t, okeyOf) ? JOKER_HAND_PENALTY : t.kind === 'number' ? t.number : 0), 0);
      results.push({ playerId: p.id, opened: true, finishedHand: false, finishedWithOkey: false, scoreDelta: value });
    } else {
      results.push({ playerId: p.id, opened: false, finishedHand: false, finishedWithOkey: false, scoreDelta: NOT_OPENED_PENALTY });
    }
  });

  return results;
}
