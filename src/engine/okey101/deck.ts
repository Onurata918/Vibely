import { faceKey } from './tiles';
import {
  COLORS,
  FALSE_JOKER_COUNT,
  InvariantError,
  MAX_VALUE,
  MIN_VALUE,
  NUMBER_TILE_COUNT,
  TILES_PER_FACE,
  TOTAL_TILES,
  type Color,
  type Tile,
  type TileId,
} from './types';

/**
 * Renk kodlari OKEY101_TESTS.md ile ayni: R=RED, B=BLUE, K=BLACK, Y=YELLOW.
 * BLUE ve BLACK'in ilk harfi ayni oldugu icin acik tablo sarttir.
 */
export const COLOR_CODE: Record<Color, string> = {
  RED: 'R',
  BLUE: 'B',
  BLACK: 'K',
  YELLOW: 'Y',
};

/**
 * R01: tileId bicimi `<RENKKODU><SAYI>#<kopya>` ve `FJ#<kopya>`.
 * Okunabilir olmasi testleri ve hata ayiklamayi kolaylastirir; motor yalnizca
 * benzersizlige guvenir, bicimi ayristirmaz.
 */
export function numberTileId(color: Color, value: number, copy: 1 | 2): TileId {
  return `${COLOR_CODE[color]}${value}#${copy}`;
}

export function falseJokerId(copy: 1 | 2): TileId {
  return `FJ#${copy}`;
}

/**
 * R01: tam 106 tas. Sirasi sabittir (karistirilmamis kanonik deste);
 * karistirma motorun disinda, sunucuda yapilir.
 */
export function buildDeck(): Tile[] {
  const tiles: Tile[] = [];
  for (const color of COLORS) {
    for (let value = MIN_VALUE; value <= MAX_VALUE; value++) {
      for (let copy = 1 as 1 | 2; copy <= TILES_PER_FACE; copy = (copy + 1) as 1 | 2) {
        tiles.push({ id: numberTileId(color, value, copy), kind: 'NUMBER', face: { color, value }, copy });
      }
    }
  }
  for (let copy = 1 as 1 | 2; copy <= FALSE_JOKER_COUNT; copy = (copy + 1) as 1 | 2) {
    tiles.push({ id: falseJokerId(copy), kind: 'FALSE_JOKER', copy });
  }
  return tiles;
}

/** Kanonik destenin tileId kumesi; dogrulamada beklenen coklu kume budur. */
export function canonicalTileIds(): Set<TileId> {
  return new Set(buildDeck().map((t) => t.id));
}

/**
 * Verilen destenin gercekten 106 tasin bir permutasyonu oldugunu dogrular.
 * T012: bozuk/eksik/degistirilmis girdi dagitimi baslatmaz.
 */
export function assertValidDeck(deck: readonly Tile[]): void {
  if (deck.length !== TOTAL_TILES) {
    throw new InvariantError(`deck must hold ${TOTAL_TILES} tiles, got ${deck.length}`);
  }

  const ids = new Set<TileId>();
  for (const tile of deck) {
    if (ids.has(tile.id)) throw new InvariantError(`duplicate tileId ${tile.id}`);
    ids.add(tile.id);
  }

  const expected = canonicalTileIds();
  if (ids.size !== expected.size) throw new InvariantError('deck tileId count mismatch');
  for (const id of expected) {
    if (!ids.has(id)) throw new InvariantError(`deck is missing tileId ${id}`);
  }

  // Yuz dagilimi: her yuzden tam iki fiziksel kopya, tam iki sahte okey.
  const faceCounts = new Map<string, number>();
  let falseJokers = 0;
  for (const tile of deck) {
    if (tile.kind === 'FALSE_JOKER') {
      falseJokers++;
      continue;
    }
    const key = faceKey(tile.face);
    faceCounts.set(key, (faceCounts.get(key) ?? 0) + 1);
  }
  if (falseJokers !== FALSE_JOKER_COUNT) {
    throw new InvariantError(`expected ${FALSE_JOKER_COUNT} false jokers, got ${falseJokers}`);
  }
  if (faceCounts.size * TILES_PER_FACE !== NUMBER_TILE_COUNT) {
    throw new InvariantError(`expected ${NUMBER_TILE_COUNT / TILES_PER_FACE} distinct faces, got ${faceCounts.size}`);
  }
  for (const [key, count] of faceCounts) {
    if (count !== TILES_PER_FACE) throw new InvariantError(`face ${key} has ${count} copies, expected ${TILES_PER_FACE}`);
  }
}
