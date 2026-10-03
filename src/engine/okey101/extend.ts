import { type ResolvedTile } from './meld';
import { type TableMeld } from './state';
import { effectiveFace, isRealJoker, isValidFace, sameFace } from './tiles';
import { type Assignment, type Face, type Tile, type TileId } from './types';

export type ExtendRejection =
  | 'MELD_NOT_FOUND'
  | 'PAIR_CANNOT_BE_EXTENDED'
  | 'RUN_NOT_AT_END'
  | 'RUN_OUT_OF_RANGE'
  | 'RUN_COLOR_MISMATCH'
  | 'SET_FULL'
  | 'SET_VALUE_MISMATCH'
  | 'SET_COLOR_REPEATED'
  | 'JOKER_WITHOUT_ASSIGNMENT'
  | 'ASSIGNMENT_ON_NON_JOKER'
  | 'ASSIGNMENT_OUT_OF_RANGE'
  | 'DUPLICATE_TILE';

export type ExtendResult = { ok: true; tiles: ResolvedTile[] } | { ok: false; reason: ExtendRejection };

/**
 * R07: mevcut bir pere tas ekler. Perler bolunmez, yeniden dizilmez ve
 * jokerin assignment'i sirasi gelen islemeyle degismez.
 */
export function extendMeld(
  meld: TableMeld,
  incoming: readonly Tile[],
  assignments: readonly Assignment[],
  jokerIndicator: Face
): ExtendResult {
  // R07: PAIR'a ucuncu tas eklenmez (T098).
  if (meld.kind === 'PAIR') return { ok: false, reason: 'PAIR_CANNOT_BE_EXTENDED' };

  const existingIds = new Set(meld.tiles.map((t) => t.tile.id));
  const byTile = new Map<TileId, Assignment>(assignments.map((a) => [a.tileId, a]));

  const resolved: ResolvedTile[] = [];
  const seen = new Set<TileId>();
  for (const tile of incoming) {
    if (seen.has(tile.id) || existingIds.has(tile.id)) return { ok: false, reason: 'DUPLICATE_TILE' };
    seen.add(tile.id);

    const wild = isRealJoker(tile, jokerIndicator);
    const assignment = byTile.get(tile.id);
    if (wild) {
      if (!assignment) return { ok: false, reason: 'JOKER_WITHOUT_ASSIGNMENT' };
      if (!isValidFace(assignment.represents)) return { ok: false, reason: 'ASSIGNMENT_OUT_OF_RANGE' };
      resolved.push({ tile, represents: assignment.represents, wild: true });
    } else {
      if (assignment) return { ok: false, reason: 'ASSIGNMENT_ON_NON_JOKER' };
      resolved.push({ tile, represents: effectiveFace(tile, jokerIndicator), wild: false });
    }
  }

  return meld.kind === 'RUN' ? extendRun(meld, resolved) : extendSet(meld, resolved);
}

function extendRun(meld: TableMeld, incoming: ResolvedTile[]): ExtendResult {
  const color = meld.tiles[0].represents.color;
  if (!incoming.every((t) => t.represents.color === color)) return { ok: false, reason: 'RUN_COLOR_MISMATCH' };

  const existing = meld.tiles.map((t) => t.represents.value).sort((a, b) => a - b);
  let low = existing[0];
  let high = existing[existing.length - 1];

  // R07: yalnizca uctan uzatilir, bosluk olusturulamaz. Sira bagimsiz olsun
  // diye her tas tek tek mevcut uclara yapistirilir.
  const pending = [...incoming].sort((a, b) => a.represents.value - b.represents.value);
  const used = new Array(pending.length).fill(false);
  let placed = 0;
  let progress = true;
  while (progress && placed < pending.length) {
    progress = false;
    for (let i = 0; i < pending.length; i++) {
      if (used[i]) continue;
      const value = pending[i].represents.value;
      if (value === low - 1) {
        low = value;
      } else if (value === high + 1) {
        high = value;
      } else {
        continue;
      }
      used[i] = true;
      placed++;
      progress = true;
    }
  }
  if (placed !== pending.length) return { ok: false, reason: 'RUN_NOT_AT_END' };
  // R04/S03: 13'ten 1'e sarma yok (T094).
  if (low < 1 || high > 13) return { ok: false, reason: 'RUN_OUT_OF_RANGE' };

  const tiles = [...meld.tiles, ...incoming].sort((a, b) => a.represents.value - b.represents.value);
  return { ok: true, tiles };
}

function extendSet(meld: TableMeld, incoming: ResolvedTile[]): ExtendResult {
  // R07: gruba yalnizca eksik renk eklenir, toplam en fazla dort (T097).
  if (meld.tiles.length + incoming.length > 4) return { ok: false, reason: 'SET_FULL' };

  const value = meld.tiles[0].represents.value;
  if (!incoming.every((t) => t.represents.value === value)) return { ok: false, reason: 'SET_VALUE_MISMATCH' };

  const colors = new Set(meld.tiles.map((t) => t.represents.color));
  for (const t of incoming) {
    if (colors.has(t.represents.color)) return { ok: false, reason: 'SET_COLOR_REPEATED' };
    colors.add(t.represents.color);
  }

  return { ok: true, tiles: [...meld.tiles, ...incoming] };
}

export type JokerSwapResult = { ok: true; tiles: ResolvedTile[]; joker: Tile } | { ok: false; reason: 'JOKER_NOT_IN_MELD' | 'FACE_MISMATCH' };

/**
 * R08: masadaki gercek okeyin **tam olarak temsil ettigi** yuze sahip el tasi
 * yerine konularak joker geri alinir. Sahte okey bu yuze esitse kullanilabilir
 * (T108); baska bir yuz reddedilir (T107, T109).
 */
export function replaceJokerInMeld(meld: TableMeld, jokerId: TileId, replacement: Tile, jokerIndicator: Face): JokerSwapResult {
  const index = meld.tiles.findIndex((t) => t.tile.id === jokerId && t.wild);
  if (index === -1) return { ok: false, reason: 'JOKER_NOT_IN_MELD' };

  const slot = meld.tiles[index];
  if (!sameFace(effectiveFace(replacement, jokerIndicator), slot.represents)) return { ok: false, reason: 'FACE_MISMATCH' };

  const tiles = [...meld.tiles];
  // Per ayni yuzleri korur; yalnizca fiziksel tas degisir ve artik wild degildir.
  tiles[index] = { tile: replacement, represents: slot.represents, wild: false };
  return { ok: true, tiles, joker: slot.tile };
}
