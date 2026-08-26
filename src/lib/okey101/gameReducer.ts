// Saf, deterministik 101 Okey oyun motoru. React'ten, ag katmanindan ve
// UI'dan tamamen bagimsizdir — ag/backend eklendiginde bu dosyaya dokunmadan
// sadece bir transport katmani eklenir (bkz. proje denetim notlari).
//
// NOT (bilerek basitlestirme): TURN_ACTION (cektikten sonra) ve TURN_DISCARD
// (dagiticinin fazla tasla basladigi, cekmeden yapilan ilk hamlesi) ayni
// eylem kumesini destekler — ikisinde de duzenle/perde-yap/ac/masaya-ekle
// ve atma serbesttir (`canOrganize`/`canDiscard`). Iki ayri isim, "bu turda
// hic cekme olmadi" bilgisini korumak icin tutuluyor, davranis farki yok.
import { canAddTileToMeld, computeOkeyOf, OKEY_COLORS, validateMeld, type OkeyTile } from '@/lib/okey/engine';
import { dealOkey101 } from './deck';
import { calculateOpeningTotal } from './meldValidator';
import { computeRoundResults } from './scoring';
import { canDiscard, canDraw, canOrganize, canPlayerAct, nextPlayerIndex } from './turnMachine';
import { DEFAULT_OKEY101_RULES, type Okey101GameState, type Okey101Meld, type Okey101Rules } from './types';

export type Okey101Action =
  | { type: 'START_GAME'; players: { id: string; name: string; c1: string; c2: string }[]; rules?: Partial<Okey101Rules> }
  | { type: 'START_NEXT_ROUND' }
  | { type: 'DRAW_FROM_PILE'; playerId: string }
  | { type: 'DRAW_FROM_DISCARD'; playerId: string }
  | { type: 'TOGGLE_SELECT'; playerId: string; tileId: string }
  | { type: 'CLEAR_SELECTION'; playerId: string }
  | { type: 'FORM_MELD_FROM_SELECTION'; playerId: string }
  | { type: 'CANCEL_PENDING_MELDS'; playerId: string }
  | { type: 'COMMIT_OPENING'; playerId: string }
  | { type: 'ADD_SELECTED_TO_TABLE_MELD'; playerId: string; meldId: string }
  | { type: 'DISCARD_TILE'; playerId: string; tileId: string }
  | { type: 'SORT_RACK'; playerId: string; by: 'number' | 'color' }
  | { type: 'REORDER_RACK'; playerId: string; fromIndex: number; toIndex: number };

export type Okey101Result = { state: Okey101GameState; error?: string };

function meldId(): string {
  return `m${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function withRack(state: Okey101GameState, playerId: string, rack: OkeyTile[]): Okey101GameState {
  return { ...state, players: state.players.map((p) => (p.id === playerId ? { ...p, rack } : p)) };
}

function finishRoundIfEmpty(state: Okey101GameState, playerId: string, rackAfter: OkeyTile[]): Okey101GameState {
  if (rackAfter.length > 0) return state;
  const racks = Object.fromEntries(state.players.map((p) => [p.id, p.id === playerId ? rackAfter : p.rack]));
  const hasOpened = Object.fromEntries(state.players.map((p) => [p.id, p.id === playerId ? true : p.hasOpened]));
  const okeyOf = state.indicator ? computeOkeyOf(state.indicator) : null;
  const results = computeRoundResults(state.players, racks, hasOpened, playerId, okeyOf, state.rules);
  const scoreById = Object.fromEntries(results.map((r) => [r.playerId, r.scoreDelta]));
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, score: p.score + (scoreById[p.id] ?? 0), hasOpened: hasOpened[p.id] })),
    winnerId: playerId,
    lastRoundResults: results,
    phase: 'ROUND_FINISHED',
    selectedRackIds: [],
    pendingMelds: [],
  };
}

function advanceTurn(state: Okey101GameState): Okey101GameState {
  return { ...state, currentPlayerIndex: nextPlayerIndex(state), phase: 'TURN_DRAW', selectedRackIds: [] };
}

export function createInitialState(): Okey101GameState {
  return {
    phase: 'WAITING_FOR_PLAYERS',
    rules: DEFAULT_OKEY101_RULES,
    players: [],
    currentPlayerIndex: 0,
    drawPile: [],
    discardPile: [],
    indicator: null,
    tableMelds: [],
    pendingMelds: [],
    selectedRackIds: [],
    roundNumber: 0,
    winnerId: null,
    lastRoundResults: null,
    version: 0,
  };
}

function dealNewRound(state: Okey101GameState, players: { id: string; name: string; c1: string; c2: string; score: number }[], rules: Okey101Rules): Okey101GameState {
  const deal = dealOkey101(players.map((p) => p.id));
  return {
    phase: 'TURN_DISCARD', // dagitici (players[0]) fazladan tasla basliyor, direkt atar
    rules,
    players: players.map((p) => ({ ...p, rack: deal.racks[p.id] ?? [], hasOpened: false, connected: true })),
    currentPlayerIndex: 0,
    drawPile: deal.drawPile,
    discardPile: [],
    indicator: deal.indicator,
    tableMelds: [],
    pendingMelds: [],
    selectedRackIds: [],
    roundNumber: state.roundNumber + 1,
    winnerId: null,
    lastRoundResults: null,
    version: state.version + 1,
  };
}

export function okey101Reducer(state: Okey101GameState, action: Okey101Action): Okey101Result {
  switch (action.type) {
    case 'START_GAME': {
      if (action.players.length < 2) return { state, error: 'En az 2 oyuncu gerekli' };
      const rules: Okey101Rules = { ...DEFAULT_OKEY101_RULES, ...action.rules };
      const players = action.players.map((p) => ({ ...p, score: 0 }));
      const initial = createInitialState();
      const dealt = dealNewRound({ ...initial, roundNumber: 0 }, players, rules);
      return { state: dealt };
    }

    case 'START_NEXT_ROUND': {
      if (state.phase !== 'ROUND_FINISHED' && state.phase !== 'GAME_FINISHED') return { state, error: 'Tur henuz bitmedi' };
      const players = state.players.map((p) => ({ id: p.id, name: p.name, c1: p.c1, c2: p.c2, score: p.score }));
      return { state: dealNewRound(state, players, state.rules) };
    }

    case 'DRAW_FROM_PILE': {
      if (!canDraw(state, action.playerId)) return { state, error: 'Su an cekemezsin' };
      if (state.drawPile.length === 0) {
        return { state: { ...state, phase: 'ROUND_FINISHED', winnerId: null, lastRoundResults: null } };
      }
      const [tile, ...rest] = state.drawPile;
      const player = state.players.find((p) => p.id === action.playerId)!;
      const next = withRack({ ...state, drawPile: rest, phase: 'TURN_ACTION' }, action.playerId, [...player.rack, tile]);
      return { state: next };
    }

    case 'DRAW_FROM_DISCARD': {
      if (!canDraw(state, action.playerId)) return { state, error: 'Su an cekemezsin' };
      const top = state.discardPile[state.discardPile.length - 1];
      if (!top) return { state, error: 'Atilan tas yok' };
      const player = state.players.find((p) => p.id === action.playerId)!;
      const next = withRack(
        { ...state, discardPile: state.discardPile.slice(0, -1), phase: 'TURN_ACTION' },
        action.playerId,
        [...player.rack, top]
      );
      return { state: next };
    }

    case 'TOGGLE_SELECT': {
      if (!canPlayerAct(state, action.playerId)) return { state, error: 'Sira sende degil' };
      const has = state.selectedRackIds.includes(action.tileId);
      return { state: { ...state, selectedRackIds: has ? state.selectedRackIds.filter((id) => id !== action.tileId) : [...state.selectedRackIds, action.tileId] } };
    }

    case 'CLEAR_SELECTION': {
      if (!canPlayerAct(state, action.playerId)) return { state, error: 'Sira sende degil' };
      return { state: { ...state, selectedRackIds: [] } };
    }

    case 'FORM_MELD_FROM_SELECTION': {
      if (!canOrganize(state, action.playerId)) return { state, error: 'Su an meld olusturamazsin' };
      if (state.selectedRackIds.length < 3) return { state, error: 'En az 3 tas secmelisin' };
      const player = state.players.find((p) => p.id === action.playerId)!;
      const selectedSet = new Set(state.selectedRackIds);
      const selectedTiles = player.rack.filter((t) => selectedSet.has(t.id));
      if (selectedTiles.length !== state.selectedRackIds.length) return { state, error: 'Gecersiz secim' };
      const okeyOf = state.indicator ? computeOkeyOf(state.indicator) : null;
      const check = validateMeld(selectedTiles, okeyOf);
      if (!check.valid) return { state, error: 'Bu taslar gecerli bir seri/grup olusturmuyor' };

      const newRack = player.rack.filter((t) => !selectedSet.has(t.id));
      const meld: Okey101Meld = { id: meldId(), tiles: selectedTiles, kind: check.kind, ownerId: player.id };
      let next = withRack(state, action.playerId, newRack);
      next = { ...next, selectedRackIds: [] };

      if (player.hasOpened) {
        next = { ...next, tableMelds: [...next.tableMelds, meld] };
        next = finishRoundIfEmpty(next, action.playerId, newRack);
      } else {
        next = { ...next, pendingMelds: [...next.pendingMelds, meld] };
      }
      return { state: next };
    }

    case 'CANCEL_PENDING_MELDS': {
      if (!canPlayerAct(state, action.playerId)) return { state, error: 'Sira sende degil' };
      if (state.pendingMelds.length === 0) return { state };
      const player = state.players.find((p) => p.id === action.playerId)!;
      const returned = state.pendingMelds.flatMap((m) => m.tiles);
      const next = withRack({ ...state, pendingMelds: [] }, action.playerId, [...player.rack, ...returned]);
      return { state: next };
    }

    case 'COMMIT_OPENING': {
      if (!canOrganize(state, action.playerId)) return { state, error: 'Su an acamazsin' };
      const player = state.players.find((p) => p.id === action.playerId)!;
      if (player.hasOpened) return { state, error: 'Zaten acmissin' };
      if (state.pendingMelds.length === 0) return { state, error: 'Once perde/grup olustur' };
      const okeyOf = state.indicator ? computeOkeyOf(state.indicator) : null;
      const total = calculateOpeningTotal(state.pendingMelds, okeyOf, state.rules);
      if (total < state.rules.openingScore) return { state, error: `Acilis icin en az ${state.rules.openingScore} puan gerekli (su an ${total})` };

      let next: Okey101GameState = {
        ...state,
        tableMelds: [...state.tableMelds, ...state.pendingMelds],
        pendingMelds: [],
        players: state.players.map((p) => (p.id === action.playerId ? { ...p, hasOpened: true } : p)),
      };
      next = finishRoundIfEmpty(next, action.playerId, player.rack);
      return { state: next };
    }

    case 'ADD_SELECTED_TO_TABLE_MELD': {
      if (!canOrganize(state, action.playerId)) return { state, error: 'Su an ekleyemezsin' };
      const player = state.players.find((p) => p.id === action.playerId)!;
      if (!player.hasOpened) return { state, error: 'Once acmalisin' };
      if (state.selectedRackIds.length !== 1) return { state, error: 'Tek bir tas sec' };
      const tile = player.rack.find((t) => t.id === state.selectedRackIds[0]);
      const meld = state.tableMelds.find((m) => m.id === action.meldId);
      if (!tile || !meld) return { state, error: 'Gecersiz secim' };
      const okeyOf = state.indicator ? computeOkeyOf(state.indicator) : null;
      const result = canAddTileToMeld(meld.tiles, tile, okeyOf);
      if (!result.ok) return { state, error: 'Bu tas bu perdeye eklenemez' };

      const newRack = player.rack.filter((t) => t.id !== tile.id);
      let next = withRack(state, action.playerId, newRack);
      next = {
        ...next,
        tableMelds: next.tableMelds.map((m) => (m.id === action.meldId ? { ...m, tiles: result.tiles } : m)),
        selectedRackIds: [],
      };
      next = finishRoundIfEmpty(next, action.playerId, newRack);
      return { state: next };
    }

    case 'DISCARD_TILE': {
      if (!canDiscard(state, action.playerId)) return { state, error: 'Su an atamazsin' };
      if (state.pendingMelds.length > 0) return { state, error: 'Once acilisini tamamla ya da geri al' };
      const player = state.players.find((p) => p.id === action.playerId)!;
      const tile = player.rack.find((t) => t.id === action.tileId);
      if (!tile) return { state, error: 'Bu tas elinde degil' };
      const newRack = player.rack.filter((t) => t.id !== action.tileId);
      let next = withRack({ ...state, discardPile: [...state.discardPile, tile] }, action.playerId, newRack);
      next = { ...next, selectedRackIds: [] };

      const finished = finishRoundIfEmpty(next, action.playerId, newRack);
      if (finished.phase === 'ROUND_FINISHED') return { state: finished };

      return { state: advanceTurn(next) };
    }

    case 'SORT_RACK': {
      if (!canPlayerAct(state, action.playerId)) return { state, error: 'Sira sende degil' };
      const player = state.players.find((p) => p.id === action.playerId)!;
      const colorIdx = (t: OkeyTile) => (t.kind === 'fakejoker' ? 99 : OKEY_COLORS.indexOf(t.color));
      const numberOf = (t: OkeyTile) => (t.kind === 'fakejoker' ? 0 : t.number);
      const sorted = [...player.rack].sort((a, b) =>
        action.by === 'number'
          ? numberOf(a) - numberOf(b) || colorIdx(a) - colorIdx(b)
          : colorIdx(a) - colorIdx(b) || numberOf(a) - numberOf(b)
      );
      return { state: withRack(state, action.playerId, sorted) };
    }

    case 'REORDER_RACK': {
      if (!canPlayerAct(state, action.playerId)) return { state, error: 'Sira sende degil' };
      const player = state.players.find((p) => p.id === action.playerId)!;
      const rack = [...player.rack];
      const [moved] = rack.splice(action.fromIndex, 1);
      if (!moved) return { state, error: 'Gecersiz indeks' };
      rack.splice(action.toIndex, 0, moved);
      return { state: withRack(state, action.playerId, rack) };
    }

    default:
      return { state };
  }
}
