import { type Face, type Tile, MAX_VALUE, MIN_VALUE } from './types';

export function sameFace(a: Face, b: Face): boolean {
  return a.color === b.color && a.value === b.value;
}

export function isValidFace(face: Face): boolean {
  return Number.isInteger(face.value) && face.value >= MIN_VALUE && face.value <= MAX_VALUE;
}

/**
 * R02: gostergenin bir ustu gercek okeydir; 13'ten sonra 1'e doner.
 * Renk gostergenin rengidir.
 */
export function jokerFaceOf(indicator: Face): Face {
  return { color: indicator.color, value: indicator.value === MAX_VALUE ? MIN_VALUE : indicator.value + 1 };
}

/** R02: gercek okey, joker yuzunun iki fiziksel NUMBER kopyasidir. */
export function isRealJoker(tile: Tile, indicator: Face): boolean {
  return tile.kind === 'NUMBER' && sameFace(tile.face, jokerFaceOf(indicator));
}

export function isFalseJoker(tile: Tile): boolean {
  return tile.kind === 'FALSE_JOKER';
}

/**
 * R02: sahte okey bu tur joker yuzlu **normal** tastir; joker gibi her yere
 * konulmaz. Normal tasin efektif yuzu kendi yuzudur.
 */
export function effectiveFace(tile: Tile, indicator: Face): Face {
  return tile.kind === 'FALSE_JOKER' ? jokerFaceOf(indicator) : tile.face;
}

/**
 * R10: elde kalan tasin ceza degeri. Gercek okey buraya girmez (ayri 101
 * bileseni), cagiran taraf once isRealJoker ile ayiklar.
 */
export function handValueOf(tile: Tile, indicator: Face): number {
  return effectiveFace(tile, indicator).value;
}

export function faceKey(face: Face): string {
  return `${face.color}${face.value}`;
}
