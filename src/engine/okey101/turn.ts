import { extendMeld, replaceJokerInMeld } from './extend';
import { validateMeldBatch, type MeldContext, type ResolvedTile } from './meld';
import { evaluateOpening, recordOpening } from './opening';
import { indicatorFace, lookupTile, nextSeat, previousSeat, type FullState, type TableMeld } from './state';
import { isRealJoker } from './tiles';
import {
  type Assignment,
  type EngineErrorCode,
  type MeldInput,
  type Seat,
  type Tile,
  type TileId,
} from './types';

export type TableStep =
  | { type: 'OPEN'; mode: 'SERIES' | 'PAIRS'; melds: MeldInput[] }
  | { type: 'ADD_MELDS'; melds: MeldInput[] }
  | { type: 'EXTEND'; meldId: string; tiles: TileId[]; assignments: Assignment[] }
  | { type: 'REPLACE_JOKER'; meldId: string; jokerId: TileId; replacementId: TileId };

export type Action =
  | { type: 'DRAW_STOCK' }
  | { type: 'TAKE_DISCARD_AND_PLAY'; discardTileId: TileId; steps: TableStep[] }
  | { type: 'PLAY_STEPS'; steps: TableStep[] }
  | { type: 'COMMIT_TURN'; steps: TableStep[]; discardTileId: TileId };

export type EngineResult = { ok: true; state: FullState } | { ok: false; error: EngineErrorCode; state: FullState };

const reject = (state: FullState, error: EngineErrorCode): EngineResult => ({ ok: false, error, state });

/**
 * Tek giris noktasi. Basarisizlikta **girdi state nesnesi aynen** dondurulur;
 * boylece el, masa, skor ve version degismez (T057, T079, T087, T111).
 */
export function applyAction(state: FullState, actorSeat: Seat, action: Action): EngineResult {
  if (state.status !== 'ACTIVE') return reject(state, 'ROUND_ENDED');
  if (actorSeat !== state.currentSeat) return reject(state, 'NOT_YOUR_TURN');

  switch (action.type) {
    case 'DRAW_STOCK':
      return drawStock(state, actorSeat);
    case 'TAKE_DISCARD_AND_PLAY':
      return takeDiscardAndPlay(state, actorSeat, action);
    case 'PLAY_STEPS':
      return playSteps(state, actorSeat, action.steps);
    case 'COMMIT_TURN':
      return commitTurn(state, actorSeat, action);
  }
}

// ---------------------------------------------------------------------------
// Cekme — R06
// ---------------------------------------------------------------------------

function drawStock(state: FullState, seat: Seat): EngineResult {
  // T074: 22 tasla baslayan oyuncu ilk tur cekmez. T077: iki kez cekilemez.
  if (state.phase !== 'AWAIT_DRAW') return reject(state, 'INVALID_PHASE');
  if (state.stock.length === 0) return reject(state, 'STOCK_EMPTY');

  const [drawn, ...rest] = state.stock;
  const seats = state.seats.map((s) => (s.seat === seat ? { ...s, hand: [...s.hand, drawn] } : s));
  return {
    ok: true,
    state: { ...state, version: state.version + 1, stock: rest, seats, phase: 'AWAIT_PLAY', drawnTileId: drawn.id },
  };
}

function takeDiscardAndPlay(state: FullState, seat: Seat, action: Extract<Action, { type: 'TAKE_DISCARD_AND_PLAY' }>): EngineResult {
  if (state.phase !== 'AWAIT_DRAW') return reject(state, 'INVALID_PHASE');

  // R06: yalnizca onceki seat'in **hala tepede duran** son attigi tas alinabilir.
  const from = previousSeat(seat);
  const pile = state.discards[from];
  const top = pile[pile.length - 1];
  if (!top || top.id !== action.discardTileId) return reject(state, 'INVALID_DISCARD_PICKUP');

  const picked = { ...state };
  const discards = state.discards.map((p, i) => (i === from ? p.slice(0, -1) : p));
  const seats = state.seats.map((s) => (s.seat === seat ? { ...s, hand: [...s.hand, top] } : s));
  const afterPickup: FullState = { ...picked, discards, seats, phase: 'AWAIT_PLAY', pickedDiscardId: top.id };

  const applied = applySteps(afterPickup, seat, action.steps);
  if (!applied.ok) return reject(state, applied.error);

  // R06: alinan tas gercekten masaya konmus olmalidir; elde tutulamaz (T084, T085).
  const onTable = applied.state.table.some((m) => m.tiles.some((t) => t.tile.id === top.id));
  if (!onTable) return reject(state, 'INVALID_DISCARD_PICKUP');

  return { ok: true, state: { ...applied.state, version: state.version + 1, drawnTileId: null } };
}

// ---------------------------------------------------------------------------
// Adim plani — R07, R08, R12
// ---------------------------------------------------------------------------

function playSteps(state: FullState, seat: Seat, steps: TableStep[]): EngineResult {
  if (state.phase !== 'AWAIT_PLAY') return reject(state, 'INVALID_PHASE');
  const applied = applySteps(state, seat, steps);
  if (!applied.ok) return reject(state, applied.error);
  return { ok: true, state: { ...applied.state, version: state.version + 1 } };
}

type StepsOutcome = { ok: true; state: FullState; openedInThisPlan: boolean } | { ok: false; error: EngineErrorCode };

/**
 * R12: adimlar sirayla dogrulanir. Herhangi biri yanlissa cagiran taraf
 * girdi state'ini aynen dondurur; kismi uygulama disari sizmaz.
 */
function applySteps(state: FullState, seat: Seat, steps: readonly TableStep[]): StepsOutcome {
  let draft = state;
  let openedInThisPlan = false;

  for (const step of steps) {
    const result = applyStep(draft, seat, step);
    if (!result.ok) return result;
    draft = result.state;
    if (step.type === 'OPEN') openedInThisPlan = true;
  }
  return { ok: true, state: draft, openedInThisPlan };
}

function applyStep(state: FullState, seat: Seat, step: TableStep): { ok: true; state: FullState } | { ok: false; error: EngineErrorCode } {
  switch (step.type) {
    case 'OPEN':
      return applyOpen(state, seat, step);
    case 'ADD_MELDS':
      return applyAddMelds(state, seat, step);
    case 'EXTEND':
      return applyExtend(state, seat, step);
    case 'REPLACE_JOKER':
      return applyReplaceJoker(state, seat, step);
  }
}

function meldContext(state: FullState): MeldContext {
  return { lookup: lookupTile(state), indicator: indicatorFace(state.indicator) };
}

/** Taslarin gercekten oyuncunun elinde oldugunu dogrular ve elden cikarir. */
function takeFromHand(state: FullState, seat: Seat, ids: readonly TileId[]): { ok: true; state: FullState; tiles: Tile[] } | { ok: false; error: EngineErrorCode } {
  const hand = state.seats[seat].hand;
  const index = new Map(hand.map((t) => [t.id, t]));
  const tiles: Tile[] = [];
  const removing = new Set<TileId>();

  for (const id of ids) {
    if (removing.has(id)) return { ok: false, error: 'DUPLICATE_TILE' };
    const tile = index.get(id);
    if (!tile) return { ok: false, error: 'TILE_NOT_OWNED' };
    removing.add(id);
    tiles.push(tile);
  }

  const seats = state.seats.map((s) => (s.seat === seat ? { ...s, hand: s.hand.filter((t) => !removing.has(t.id)) } : s));
  return { ok: true, state: { ...state, seats }, tiles };
}

function toTableMelds(state: FullState, seat: Seat, melds: { input: MeldInput; resolved: ResolvedTile[] }[]): { table: TableMeld[]; nextMeldSeq: number } {
  let seq = state.nextMeldSeq;
  const added = melds.map((m) => ({ id: `m${seq++}`, kind: m.input.kind, ownerSeat: seat, tiles: m.resolved }));
  return { table: [...state.table, ...added], nextMeldSeq: seq };
}

function applyOpen(state: FullState, seat: Seat, step: Extract<TableStep, { type: 'OPEN' }>): { ok: true; state: FullState } | { ok: false; error: EngineErrorCode } {
  const me = state.seats[seat];

  // Taslar once elden alinir ki validator onlari elde degil planda gorsun.
  const ids = step.melds.flatMap((m) => m.tiles);
  const taken = takeFromHand(state, seat, ids);
  if (!taken.ok) return taken;

  const result = evaluateOpening({ mode: step.mode, melds: step.melds, currentStatus: me.opening }, meldContext(state), state.rules, state.openingHistory);
  if (!result.ok) {
    if (result.error === 'OPENING_MODE_LOCKED') return { ok: false, error: 'OPENING_MODE_LOCKED' };
    if (result.error === 'OPENING_TOO_LOW') return { ok: false, error: 'OPENING_TOO_LOW' };
    return { ok: false, error: 'INVALID_MELD' };
  }

  const { table, nextMeldSeq } = toTableMelds(taken.state, seat, result.batch.melds);
  const seats = taken.state.seats.map((s) => (s.seat === seat ? { ...s, opening: result.mode } : s));
  return {
    ok: true,
    state: { ...taken.state, seats, table, nextMeldSeq, openingHistory: recordOpening(state.openingHistory, result.mode, result.total) },
  };
}

function applyAddMelds(state: FullState, seat: Seat, step: Extract<TableStep, { type: 'ADD_MELDS' }>): { ok: true; state: FullState } | { ok: false; error: EngineErrorCode } {
  const me = state.seats[seat];
  // R07/S10: acmadan masaya is yapilmaz (T088).
  if (me.opening === 'UNOPENED') return { ok: false, error: 'NOT_OPENED' };

  const somebodyOpenedPairs = state.seats.some((s) => s.seat !== seat && s.opening === 'PAIRS');
  for (const meld of step.melds) {
    if (me.opening === 'PAIRS' && meld.kind !== 'PAIR') {
      // R07: cift acan yeni RUN/SET acamaz (T101).
      return { ok: false, error: 'OPENING_MODE_LOCKED' };
    }
    if (me.opening === 'SERIES' && meld.kind === 'PAIR' && !somebodyOpenedPairs) {
      // R07/S07: seri acan ancak baska biri cift actiysa cift koyabilir (T099, T100).
      return { ok: false, error: 'OPENING_MODE_LOCKED' };
    }
  }

  const taken = takeFromHand(state, seat, step.melds.flatMap((m) => m.tiles));
  if (!taken.ok) return taken;

  const batch = validateMeldBatch(step.melds, meldContext(state));
  if (!batch.valid) return { ok: false, error: 'INVALID_MELD' };

  const { table, nextMeldSeq } = toTableMelds(taken.state, seat, batch.melds);
  return { ok: true, state: { ...taken.state, table, nextMeldSeq } };
}

function applyExtend(state: FullState, seat: Seat, step: Extract<TableStep, { type: 'EXTEND' }>): { ok: true; state: FullState } | { ok: false; error: EngineErrorCode } {
  if (state.seats[seat].opening === 'UNOPENED') return { ok: false, error: 'NOT_OPENED' };

  const meldIndex = state.table.findIndex((m) => m.id === step.meldId);
  if (meldIndex === -1) return { ok: false, error: 'INVALID_MELD' };

  const taken = takeFromHand(state, seat, step.tiles);
  if (!taken.ok) return taken;

  const result = extendMeld(state.table[meldIndex], taken.tiles, step.assignments, indicatorFace(state.indicator));
  if (!result.ok) return { ok: false, error: 'INVALID_MELD' };

  const table = taken.state.table.map((m, i) => (i === meldIndex ? { ...m, tiles: result.tiles } : m));
  return { ok: true, state: { ...taken.state, table } };
}

function applyReplaceJoker(state: FullState, seat: Seat, step: Extract<TableStep, { type: 'REPLACE_JOKER' }>): { ok: true; state: FullState } | { ok: false; error: EngineErrorCode } {
  // R08/T106: acmamis oyuncu yerden joker alamaz.
  if (state.seats[seat].opening === 'UNOPENED') return { ok: false, error: 'NOT_OPENED' };

  const meldIndex = state.table.findIndex((m) => m.id === step.meldId);
  if (meldIndex === -1) return { ok: false, error: 'INVALID_MELD' };

  const taken = takeFromHand(state, seat, [step.replacementId]);
  if (!taken.ok) return taken;

  const result = replaceJokerInMeld(state.table[meldIndex], step.jokerId, taken.tiles[0], indicatorFace(state.indicator));
  if (!result.ok) return { ok: false, error: 'INVALID_MELD' };

  const table = taken.state.table.map((m, i) => (i === meldIndex ? { ...m, tiles: result.tiles } : m));
  // Joker ele gelir; bu profilde ayni tur tekrar oynama zorunlulugu yok (T110).
  const seats = taken.state.seats.map((s) => (s.seat === seat ? { ...s, hand: [...s.hand, result.joker] } : s));
  return { ok: true, state: { ...taken.state, table, seats } };
}

// ---------------------------------------------------------------------------
// Atis ve bitis — R09, R11
// ---------------------------------------------------------------------------

function commitTurn(state: FullState, seat: Seat, action: Extract<Action, { type: 'COMMIT_TURN' }>): EngineResult {
  if (state.phase !== 'AWAIT_PLAY') return reject(state, 'INVALID_PHASE');

  const wasUnopened = state.seats[seat].opening === 'UNOPENED';
  const applied = applySteps(state, seat, action.steps);
  if (!applied.ok) return reject(state, applied.error);

  let draft = applied.state;

  // R06: soldan alinan tas, plan icinde masaya konmus olmalidir.
  if (draft.pickedDiscardId && !draft.table.some((m) => m.tiles.some((t) => t.tile.id === draft.pickedDiscardId))) {
    return reject(state, 'INVALID_DISCARD_PICKUP');
  }

  // R09: adimlardan sonra elde atilacak en az bir tas kalmalidir (T113).
  // El bosaldiysa bu "sahipsiz tas" degil, eksik atis hatasidir.
  if (draft.seats[seat].hand.length === 0) return reject(state, 'MUST_LEAVE_DISCARD');

  const removed = takeFromHand(draft, seat, [action.discardTileId]);
  if (!removed.ok) return reject(state, removed.error);
  const discarded = removed.tiles[0];
  draft = removed.state;

  const handAfter = draft.seats[seat].hand;

  const discards = draft.discards.map((p, i) => (i === seat ? [...p, discarded] : p));
  draft = { ...draft, discards };

  const finished = handAfter.length === 0;
  const jokerDiscard = isRealJoker(discarded, indicatorFace(state.indicator));

  // R11: bitis atisinda ceza yok (T136, T139).
  if (!finished) {
    const penalty = discardPenalty(state, discarded, jokerDiscard);
    if (penalty > 0) {
      draft = { ...draft, seats: draft.seats.map((s) => (s.seat === seat ? { ...s, actionPenalties: s.actionPenalties + penalty } : s)) };
    }
  }

  if (finished) {
    // R09 CLEAN: tur baslamadan once kimse acmamis olacak ve kazanan bu tek
    // planin icinde acip bitirecek (T117, T118, T119).
    const clean = !state.anyoneOpenedBeforeTurn && wasUnopened && applied.openedInThisPlan;
    const finishKind = clean ? (jokerDiscard ? 'CLEAN_JOKER' : 'CLEAN') : jokerDiscard ? 'JOKER' : 'NORMAL';
    return {
      ok: true,
      state: { ...draft, version: state.version + 1, status: 'ROUND_ENDED', winnerSeat: seat, finishKind, drawnTileId: null, pickedDiscardId: null },
    };
  }

  return { ok: true, state: beginTurn({ ...draft, version: state.version + 1 }, nextSeat(seat)) };
}

/** Sira sonraki oyuncuya gecerken tur basi bilgileri tazelenir. */
function beginTurn(state: FullState, seat: Seat): FullState {
  return {
    ...state,
    currentSeat: seat,
    phase: 'AWAIT_DRAW',
    drawnTileId: null,
    pickedDiscardId: null,
    anyoneOpenedBeforeTurn: state.seats.some((s) => s.opening !== 'UNOPENED'),
  };
}

/**
 * R11: atis cezasi. Gercek okey atildiysa **yalnizca** joker cezasi islenir;
 * ayrica islenebilirlik cezasi eklenmez (T140).
 */
export function discardPenalty(state: FullState, discarded: Tile, jokerDiscard: boolean): number {
  if (jokerDiscard) return state.rules.nonWinningJokerDiscardPenalty;
  return isPlayableOnTable(state, discarded) ? state.rules.playableDiscardPenalty : 0;
}

/**
 * R11: atilan tas, atis oncesindeki committed masada herhangi bir RUN/SET'e
 * normal yuzuyle islenebiliyor mu? PAIR bolumune tek tas islenemez.
 */
export function isPlayableOnTable(state: FullState, tile: Tile): boolean {
  const indicator = indicatorFace(state.indicator);
  return state.table.some((meld) => meld.kind !== 'PAIR' && extendMeld(meld, [tile], [], indicator).ok);
}
