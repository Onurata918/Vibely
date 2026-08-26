// Okey / 101 Okey ortak taş motoru: taş seti, karma, gösterge/okey belirleme,
// seri/grup ve çift geçerlilik kontrolü (joker destekli).
//
// Kurallar doğrulanmış kaynaklara göre uygulanmıştır (bkz. proje notları):
// - 106 taş: 1-13 arası, 4 renk, her biri 2 kopya (104) + 2 "sahte okey" (joker) = 106.
// - Gösterge: dağıtımdan sonra kalan desteden açılan taş. "Okey" o taşın
//   rengindeki bir sonraki sayıdır (13'ten sonrası 1'e sarar).
// - Seri (per): aynı renk, ardışık en az 3 sayı.
// - Grup: aynı sayı, farklı renkler, 3 ya da 4 taş.
// - Sahte okey ve o turun okey taşı, her ikisi de tam esnek joker olarak çalışır.

export const OKEY_COLORS = ['red', 'yellow', 'blue', 'black'] as const;
export type OkeyColor = (typeof OKEY_COLORS)[number];

export const OKEY_COLOR_HEX: Record<OkeyColor, string> = {
  red: '#dc2626',
  yellow: '#ca8a04',
  blue: '#2563eb',
  black: '#18181b',
};

export type OkeyTile =
  | { id: string; kind: 'number'; color: OkeyColor; number: number }
  | { id: string; kind: 'fakejoker' };

let seq = 0;
function nextId() {
  seq += 1;
  return `ok${seq}`;
}

export function buildOkeySet(): OkeyTile[] {
  const tiles: OkeyTile[] = [];
  for (const color of OKEY_COLORS) {
    for (let n = 1; n <= 13; n++) {
      tiles.push({ id: nextId(), kind: 'number', color, number: n });
      tiles.push({ id: nextId(), kind: 'number', color, number: n });
    }
  }
  tiles.push({ id: nextId(), kind: 'fakejoker' });
  tiles.push({ id: nextId(), kind: 'fakejoker' });
  return tiles;
}

export function shuffleTiles<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isFakeJoker(t: OkeyTile): boolean {
  return t.kind === 'fakejoker';
}

/** O turun "okey" taşı: göstergenin rengi, bir sonraki sayı (13 -> 1 sarar). */
export function computeOkeyOf(indicator: OkeyTile): { color: OkeyColor; number: number } | null {
  if (indicator.kind !== 'number') return null;
  const nextNumber = indicator.number === 13 ? 1 : indicator.number + 1;
  return { color: indicator.color, number: nextNumber };
}

export function isWildTile(t: OkeyTile, okeyOf: { color: OkeyColor; number: number } | null): boolean {
  if (isFakeJoker(t)) return true;
  if (!okeyOf) return false;
  return t.kind === 'number' && t.color === okeyOf.color && t.number === okeyOf.number;
}

// ---------------------------------------------------------------------------
// Seri / grup geçerlilik kontrolü (elin TAMAMI eksiksiz per/gruplara bölünüyor mu)
// ---------------------------------------------------------------------------

type PlainTile = { color: OkeyColor; number: number };

function toPlain(t: OkeyTile, wild: (t: OkeyTile) => boolean): PlainTile | 'wild' {
  if (wild(t)) return 'wild';
  if (t.kind === 'number') return { color: t.color, number: t.number };
  return 'wild';
}

export function canPartitionIntoMelds(tiles: OkeyTile[], okeyOf: { color: OkeyColor; number: number } | null): boolean {
  const wild = (t: OkeyTile) => isWildTile(t, okeyOf);
  const jokerCount = tiles.filter(wild).length;
  const normals = tiles.filter((t) => !wild(t)).map((t) => toPlain(t, wild) as PlainTile);
  return solvePartition(normals, jokerCount);
}

// Tum gecerli C(n,k) alt kumelerini uretir (renk sayisi <=4 oldugu icin ucuz).
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [head, ...tail] = arr;
  const withHead = combinations(tail, k - 1).map((c) => [head, ...c]);
  const withoutHead = combinations(tail, k);
  return [...withHead, ...withoutHead];
}

// Grup secenekleri: `first` her zaman gruba dahil edilir; elde ayni sayidan
// gerekenden FAZLA renk varsa (orn. 4 renk de mevcutken 3'lu grup kurulacaksa)
// hangi renklerin kullanilacagini TEK bir sabit siraya gore secmek yerine
// tum gecerli renk kombinasyonlarini dener - aksi halde baska bir seri/grubu
// bozmadan kurulabilecek bir cozum atlanabilir.
function groupOptions(
  sorted: PlainTile[],
  first: PlainTile,
  jokerCount: number
): { used: PlainTile[]; jokersUsed: number; value: number }[] {
  const byColor = new Map<OkeyColor, PlainTile>();
  for (const t of sorted) {
    if (t.number === first.number && !byColor.has(t.color)) byColor.set(t.color, t);
  }
  const otherColors = Array.from(byColor.keys()).filter((c) => c !== first.color);
  const options: { used: PlainTile[]; jokersUsed: number; value: number }[] = [];
  for (let size = 4; size >= 3; size--) {
    const maxOthers = Math.min(otherColors.length, size - 1);
    for (let numOthers = maxOthers; numOthers >= 0; numOthers--) {
      const jokersNeeded = size - 1 - numOthers;
      if (jokersNeeded > jokerCount) continue;
      for (const combo of combinations(otherColors, numOthers)) {
        const used = [byColor.get(first.color)!, ...combo.map((c) => byColor.get(c)!)];
        options.push({ used, jokersUsed: jokersNeeded, value: size * first.number });
      }
    }
  }
  return options;
}

function solvePartition(normals: PlainTile[], jokerCount: number): boolean {
  if (normals.length === 0) return jokerCount === 0 || jokerCount >= 3;

  const sorted = normals.slice().sort((a, b) => (a.color === b.color ? a.number - b.number : a.color.localeCompare(b.color)));
  const first = sorted[0];
  const options: { used: PlainTile[]; jokersUsed: number }[] = groupOptions(sorted, first, jokerCount).map(
    ({ used, jokersUsed }) => ({ used, jokersUsed })
  );

  // Seri: ayni renk, ardisik sayilar (min 3, sarma yok: 1..13 arasi)
  const sameColor = sorted.filter((t) => t.color === first.color);
  const maxLen = 13 - first.number + 1;
  for (let len = maxLen; len >= 3; len--) {
    const used: PlainTile[] = [];
    let jokersNeeded = 0;
    for (let n = first.number; n < first.number + len; n++) {
      const tile = sameColor.find((t) => t.number === n && !used.includes(t));
      if (tile) used.push(tile);
      else jokersNeeded++;
    }
    if (jokersNeeded <= jokerCount) options.push({ used, jokersUsed: jokersNeeded });
  }

  for (const opt of options) {
    const usedSet = new Set(opt.used);
    const rest = sorted.filter((t) => !usedSet.has(t));
    if (solvePartition(rest, jokerCount - opt.jokersUsed)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Çift geçerlilik kontrolü ("çifte gitmek" / 101 Okey "çift açma")
// ---------------------------------------------------------------------------

export function canFormAllPairs(tiles: OkeyTile[], okeyOf: { color: OkeyColor; number: number } | null): boolean {
  const wild = (t: OkeyTile) => isWildTile(t, okeyOf);
  const jokers = tiles.filter(wild).length;
  const normals = tiles.filter((t) => !wild(t));

  const counts = new Map<string, number>();
  for (const t of normals) {
    if (t.kind !== 'number') continue;
    const k = `${t.color}-${t.number}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let leftoverSingles = 0;
  for (const count of counts.values()) {
    leftoverSingles += count % 2;
  }
  if (leftoverSingles > jokers) return false;
  const remainingJokers = jokers - leftoverSingles;
  return remainingJokers % 2 === 0;
}

export function tileMatches(a: OkeyTile, b: OkeyTile): boolean {
  if (a.kind === 'fakejoker' || b.kind === 'fakejoker') return a.kind === b.kind;
  return a.kind === 'number' && b.kind === 'number' && a.color === b.color && a.number === b.number;
}

// ---------------------------------------------------------------------------
// Tek meld (seri/grup) dogrulamasi ve mevcut bir meld'e tas ekleme
// (101 Okey'in ilerlemeli masa oyunu icin: oyuncu elinden manuel sectigi
// taslarla yeni bir seri/grup kurar, ya da acilmis bir meld'e tek tas ekler).
// ---------------------------------------------------------------------------

export type MeldValidation =
  | { valid: true; kind: 'run'; color: OkeyColor; min: number; max: number; value: number }
  | { valid: true; kind: 'group'; number: number; value: number }
  | { valid: false };

/**
 * Verilen tas dizisinin TEK BASINA gecerli bir seri ya da grup olup olmadigini
 * kontrol eder. Joker/okey taslari bosluk doldurmak ya da uc(lar)i uzatmak
 * icin kullanilabilir; sarma (13->1) yoktur; tum-joker meld desteklenmez.
 */
export function validateMeld(tiles: OkeyTile[], okeyOf: { color: OkeyColor; number: number } | null): MeldValidation {
  if (tiles.length < 3) return { valid: false };
  const wild = (t: OkeyTile) => isWildTile(t, okeyOf);
  const reals = tiles.filter((t) => !wild(t)).map((t) => toPlain(t, wild) as PlainTile);
  const wildCount = tiles.length - reals.length;
  if (reals.length === 0) return { valid: false };

  const sameNumber = reals.every((r) => r.number === reals[0].number);
  if (sameNumber) {
    const colors = reals.map((r) => r.color);
    const distinctColors = new Set(colors).size === colors.length;
    if (distinctColors && tiles.length <= 4) {
      return { valid: true, kind: 'group', number: reals[0].number, value: tiles.length * reals[0].number };
    }
  }

  const sameColor = reals.every((r) => r.color === reals[0].color);
  if (sameColor) {
    const numbers = reals.map((r) => r.number);
    const distinctNumbers = new Set(numbers).size === numbers.length;
    if (distinctNumbers) {
      const minNum = Math.min(...numbers);
      const maxNum = Math.max(...numbers);
      const internalGaps = maxNum - minNum + 1 - reals.length;
      if (internalGaps <= wildCount) {
        const leftover = wildCount - internalGaps;
        const roomHigh = 13 - maxNum;
        const roomLow = minNum - 1;
        if (leftover <= roomHigh + roomLow) {
          const usedHigh = Math.min(leftover, roomHigh);
          const usedLow = leftover - usedHigh;
          const newMin = minNum - usedLow;
          const newMax = maxNum + usedHigh;
          let value = 0;
          for (let n = newMin; n <= newMax; n++) value += n;
          return { valid: true, kind: 'run', color: reals[0].color, min: newMin, max: newMax, value };
        }
      }
    }
  }

  return { valid: false };
}

/** Mevcut (gecerli) bir meld'e tek bir tas eklemeyi dener; basarili olursa yeni tas dizisini ve degerini doner. */
export function canAddTileToMeld(
  meldTiles: OkeyTile[],
  newTile: OkeyTile,
  okeyOf: { color: OkeyColor; number: number } | null
): { ok: true; tiles: OkeyTile[]; value: number } | { ok: false } {
  const info = validateMeld(meldTiles, okeyOf);
  if (!info.valid) return { ok: false };
  const wild = isWildTile(newTile, okeyOf);

  if (info.kind === 'group') {
    if (meldTiles.length >= 4) return { ok: false };
    if (wild) {
      const candidate = [...meldTiles, newTile];
      const check = validateMeld(candidate, okeyOf);
      return check.valid ? { ok: true, tiles: candidate, value: check.value } : { ok: false };
    }
    if (newTile.kind !== 'number' || newTile.number !== info.number) return { ok: false };
    const alreadyHasColor = meldTiles.some((t) => !isWildTile(t, okeyOf) && t.kind === 'number' && t.color === newTile.color);
    if (alreadyHasColor) return { ok: false };
    const candidate = [...meldTiles, newTile];
    const check = validateMeld(candidate, okeyOf);
    return check.valid ? { ok: true, tiles: candidate, value: check.value } : { ok: false };
  }

  // kind === 'run'
  if (wild) {
    if (info.max < 13) {
      const candidate = [...meldTiles, newTile];
      const check = validateMeld(candidate, okeyOf);
      if (check.valid) return { ok: true, tiles: candidate, value: check.value };
    }
    if (info.min > 1) {
      const candidate = [newTile, ...meldTiles];
      const check = validateMeld(candidate, okeyOf);
      if (check.valid) return { ok: true, tiles: candidate, value: check.value };
    }
    return { ok: false };
  }
  if (newTile.kind !== 'number' || newTile.color !== info.color) return { ok: false };
  if (newTile.number === info.max + 1) {
    const candidate = [...meldTiles, newTile];
    const check = validateMeld(candidate, okeyOf);
    return check.valid ? { ok: true, tiles: candidate, value: check.value } : { ok: false };
  }
  if (newTile.number === info.min - 1) {
    const candidate = [newTile, ...meldTiles];
    const check = validateMeld(candidate, okeyOf);
    return check.valid ? { ok: true, tiles: candidate, value: check.value } : { ok: false };
  }
  return { ok: false };
}
