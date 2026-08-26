// Acik durum makinesi yardimcilari. Rastgele booleanlar yerine `Okey101Phase`
// union'i uzerinden calisir; gecersiz gecisleri ve sira-disi eylemleri
// merkezi bir yerden reddeder.
import type { Okey101GameState, Okey101Phase } from './types';

const PLAYABLE_PHASES: Okey101Phase[] = ['TURN_DRAW', 'TURN_ACTION', 'TURN_DISCARD'];

export function isPlayablePhase(phase: Okey101Phase): boolean {
  return PLAYABLE_PHASES.includes(phase);
}

export function currentPlayer(state: Okey101GameState) {
  return state.players[state.currentPlayerIndex] ?? null;
}

/** Verilen oyuncunun su an gercekten hamle yapabilecegi (sirasi gelmis) durumda olup olmadigi. */
export function canPlayerAct(state: Okey101GameState, playerId: string): boolean {
  if (!isPlayablePhase(state.phase)) return false;
  const p = currentPlayer(state);
  return !!p && p.id === playerId && p.connected;
}

export function canDraw(state: Okey101GameState, playerId: string): boolean {
  return canPlayerAct(state, playerId) && state.phase === 'TURN_DRAW';
}

export function canDiscard(state: Okey101GameState, playerId: string): boolean {
  if (!canPlayerAct(state, playerId)) return false;
  return state.phase === 'TURN_ACTION' || state.phase === 'TURN_DISCARD';
}

/** Cekmis (ya da dagiticinin ilk hamlesi olan) bir oyuncunun elini duzenleyip
 * meld olusturabilecegi/acabilecegi/masaya taş ekleyebilecegi fazlar. */
export function canOrganize(state: Okey101GameState, playerId: string): boolean {
  if (!canPlayerAct(state, playerId)) return false;
  return state.phase === 'TURN_ACTION' || state.phase === 'TURN_DISCARD';
}

export function nextPlayerIndex(state: Okey101GameState): number {
  const n = state.players.length;
  for (let step = 1; step <= n; step++) {
    const idx = (state.currentPlayerIndex + step) % n;
    if (state.players[idx]?.connected) return idx;
  }
  return state.currentPlayerIndex;
}
