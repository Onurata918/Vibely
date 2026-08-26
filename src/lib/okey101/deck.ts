// 101 Okey'e ozel dagitim. Fiziksel deste/karma `@/lib/okey/engine`'den
// reuse edilir; burada sadece 101'in dagitim sirasi (dagitici 15, digerleri
// 14 tas + gosterge) uygulanir.
import { buildOkeySet, shuffleTiles, type OkeyTile } from '@/lib/okey/engine';

export type Okey101Deal = {
  racks: Record<string, OkeyTile[]>;
  drawPile: OkeyTile[];
  indicator: OkeyTile;
};

export function dealOkey101(playerIds: string[]): Okey101Deal {
  const set = shuffleTiles(buildOkeySet());
  const racks: Record<string, OkeyTile[]> = {};
  let idx = 0;
  playerIds.forEach((id, i) => {
    const count = i === 0 ? 15 : 14; // dagitici (ilk oyuncu) fazladan tasla baslar ve direkt atar
    racks[id] = set.slice(idx, idx + count);
    idx += count;
  });
  const indicator = set[idx];
  idx += 1;
  const drawPile = set.slice(idx);
  return { racks, drawPile, indicator };
}
