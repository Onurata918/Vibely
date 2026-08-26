// 101 Okey'e ozel meld/acilis degerlendirmesi. Fiziksel gecerlilik VE deger
// hesabi (`validateMeld`) mevcut `@/lib/okey/engine`'den birebir reuse edilir
// — burada sadece 101'e ozgu "acilis puani" toplami ve kural filtresi eklenir.
import { isWildTile, validateMeld, type OkeyColor, type OkeyTile } from '@/lib/okey/engine';
import type { Okey101Meld, Okey101Rules } from './types';

/**
 * Bir perdenin/grubun acilis degeri. `validateMeld` zaten dogru deger
 * hesabini (joker'lerin doldurdugu/uzattigi bosluklar dahil) donuyor;
 * burada sadece `allowJokerInOpening` kurali uygulanir.
 */
export function calculateMeldValue(tiles: OkeyTile[], okeyOf: { color: OkeyColor; number: number } | null, rules: Okey101Rules): number {
  const info = validateMeld(tiles, okeyOf);
  if (!info.valid) return 0;
  const hasWild = tiles.some((t) => isWildTile(t, okeyOf));
  if (hasWild && !rules.allowJokerInOpening) return 0;
  return info.value;
}

export function calculateOpeningTotal(melds: Okey101Meld[], okeyOf: { color: OkeyColor; number: number } | null, rules: Okey101Rules): number {
  return melds.reduce((sum, m) => sum + calculateMeldValue(m.tiles, okeyOf, rules), 0);
}

export function meetsOpeningRequirement(melds: Okey101Meld[], okeyOf: { color: OkeyColor; number: number } | null, rules: Okey101Rules): boolean {
  if (melds.length === 0) return false;
  if (melds.some((m) => !validateMeld(m.tiles, okeyOf).valid)) return false;
  return calculateOpeningTotal(melds, okeyOf, rules) >= rules.openingScore;
}
