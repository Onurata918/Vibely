import { effectiveFace, isRealJoker, isValidFace, sameFace } from './tiles';
import { type Assignment, type Face, type MeldInput, type Tile, type TileId } from './types';

export type TileLookup = (id: TileId) => Tile | undefined;

export type MeldContext = { lookup: TileLookup; indicator: Face };

/** Bir perdeki tek tas: fiziksel tas + masada temsil ettigi yuz. */
export type ResolvedTile = { tile: Tile; represents: Face; wild: boolean };

export type MeldResult =
  | { valid: true; value: number; resolved: ResolvedTile[] }
  | { valid: false; reason: MeldRejection };

export type MeldRejection =
  | 'UNKNOWN_TILE'
  | 'DUPLICATE_TILE_IN_MELD'
  | 'ASSIGNMENT_NOT_IN_MELD'
  | 'ASSIGNMENT_ON_NON_JOKER'
  | 'JOKER_WITHOUT_ASSIGNMENT'
  | 'ASSIGNMENT_OUT_OF_RANGE'
  | 'WRONG_TILE_COUNT'
  | 'RUN_COLOR_MISMATCH'
  | 'RUN_NOT_CONSECUTIVE'
  | 'RUN_WRAPS_AROUND'
  | 'SET_VALUE_MISMATCH'
  | 'SET_COLOR_REPEATED'
  | 'PAIR_FACE_MISMATCH'
  | 'ALL_JOKERS';

const MIN_RUN = 3;
const MAX_RUN = 13;

/**
 * R04: tek bir peri dogrular ve temsil edilen sayilarin toplamini dondurur.
 * Sira onemsizdir; RUN kendi icinde temsil degerine gore siralanir.
 */
export function validateMeld(input: MeldInput, ctx: MeldContext): MeldResult {
  const resolved = resolveTiles(input, ctx);
  if ('reason' in resolved) return { valid: false, reason: resolved.reason };
  const tiles = resolved.tiles;

  // R04: en az bir normal tas sarti. PAIR bunun disindadir (Q02 BASELINE).
  if (input.kind !== 'PAIR' && tiles.every((t) => t.wild)) {
    return { valid: false, reason: 'ALL_JOKERS' };
  }

  switch (input.kind) {
    case 'RUN':
      return validateRun(tiles);
    case 'SET':
      return validateSet(tiles);
    case 'PAIR':
      return validatePair(tiles);
  }
}

function resolveTiles(input: MeldInput, ctx: MeldContext): { tiles: ResolvedTile[] } | { reason: MeldRejection } {
  const ids = new Set<TileId>();
  for (const id of input.tiles) {
    if (ids.has(id)) return { reason: 'DUPLICATE_TILE_IN_MELD' };
    ids.add(id);
  }

  const byTile = new Map<TileId, Assignment>();
  for (const assignment of input.assignments) {
    // T045: baska pere ait tileId icin assignment gonderilemez.
    if (!ids.has(assignment.tileId)) return { reason: 'ASSIGNMENT_NOT_IN_MELD' };
    byTile.set(assignment.tileId, assignment);
  }

  const tiles: ResolvedTile[] = [];
  for (const id of input.tiles) {
    const tile = ctx.lookup(id);
    if (!tile) return { reason: 'UNKNOWN_TILE' };

    const wild = isRealJoker(tile, ctx.indicator);
    const assignment = byTile.get(id);

    if (wild) {
      // T043: gercek joker explicit assignment olmadan kullanilamaz.
      if (!assignment) return { reason: 'JOKER_WITHOUT_ASSIGNMENT' };
      // T037: temsil 1..13 disinda olamaz.
      if (!isValidFace(assignment.represents)) return { reason: 'ASSIGNMENT_OUT_OF_RANGE' };
      tiles.push({ tile, represents: assignment.represents, wild: true });
    } else {
      // T044: normal tasa (sahte okey dahil) wildcard assignment verilemez.
      if (assignment) return { reason: 'ASSIGNMENT_ON_NON_JOKER' };
      tiles.push({ tile, represents: effectiveFace(tile, ctx.indicator), wild: false });
    }
  }
  return { tiles };
}

function sumOf(tiles: ResolvedTile[]): number {
  return tiles.reduce((total, t) => total + t.represents.value, 0);
}

function validateRun(tiles: ResolvedTile[]): MeldResult {
  if (tiles.length < MIN_RUN || tiles.length > MAX_RUN) return { valid: false, reason: 'WRONG_TILE_COUNT' };

  const color = tiles[0].represents.color;
  if (!tiles.every((t) => t.represents.color === color)) return { valid: false, reason: 'RUN_COLOR_MISMATCH' };

  const values = tiles.map((t) => t.represents.value).sort((a, b) => a - b);
  for (let i = 1; i < values.length; i++) {
    // Esitlik de bosluk da ayni kontrole takilir; tekrar eden sayi ardisik degildir.
    if (values[i] !== values[i - 1] + 1) return { valid: false, reason: 'RUN_NOT_CONSECUTIVE' };
  }
  // R04/S03: 12-13-1 ve 13-1-2 gecersiz. 1..13 araligi disina cikilamadigi ve
  // siralama artan oldugu icin sarma zaten olusamaz; acik kontrol niyeti belgeler.
  if (values[0] < 1 || values[values.length - 1] > MAX_RUN) return { valid: false, reason: 'RUN_WRAPS_AROUND' };

  return { valid: true, value: sumOf(tiles), resolved: tiles };
}

function validateSet(tiles: ResolvedTile[]): MeldResult {
  if (tiles.length < 3 || tiles.length > 4) return { valid: false, reason: 'WRONG_TILE_COUNT' };

  const value = tiles[0].represents.value;
  if (!tiles.every((t) => t.represents.value === value)) return { valid: false, reason: 'SET_VALUE_MISMATCH' };

  // R04: her renk en fazla bir kez; joker temsilinde de ayni sart gecerlidir.
  const colors = new Set(tiles.map((t) => t.represents.color));
  if (colors.size !== tiles.length) return { valid: false, reason: 'SET_COLOR_REPEATED' };

  return { valid: true, value: sumOf(tiles), resolved: tiles };
}

function validatePair(tiles: ResolvedTile[]): MeldResult {
  if (tiles.length !== 2) return { valid: false, reason: 'WRONG_TILE_COUNT' };
  if (!sameFace(tiles[0].represents, tiles[1].represents)) return { valid: false, reason: 'PAIR_FACE_MISMATCH' };
  return { valid: true, value: sumOf(tiles), resolved: tiles };
}

export type BatchResult =
  | { valid: true; melds: { input: MeldInput; value: number; resolved: ResolvedTile[] }[]; totalValue: number }
  | { valid: false; index: number | null; reason: MeldRejection | 'DUPLICATE_TILE_ACROSS_MELDS' };

/**
 * R04: birden fazla per birlikte dogrulanir. Ayni tas iki perde kullanilamaz
 * (T051); herhangi biri gecersizse butun grup reddedilir (T057).
 */
export function validateMeldBatch(inputs: readonly MeldInput[], ctx: MeldContext): BatchResult {
  const used = new Set<TileId>();
  const melds: { input: MeldInput; value: number; resolved: ResolvedTile[] }[] = [];

  for (let index = 0; index < inputs.length; index++) {
    const input = inputs[index];
    for (const id of input.tiles) {
      if (used.has(id)) return { valid: false, index, reason: 'DUPLICATE_TILE_ACROSS_MELDS' };
      used.add(id);
    }
    const result = validateMeld(input, ctx);
    if (!result.valid) return { valid: false, index, reason: result.reason };
    melds.push({ input, value: result.value, resolved: result.resolved });
  }

  return { valid: true, melds, totalValue: melds.reduce((n, m) => n + m.value, 0) };
}
