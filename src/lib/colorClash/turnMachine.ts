import type { ClashDirection, ClashGameState, ClashPhase } from './types';

const PLAYABLE_PHASES: ClashPhase[] = ['awaitingPlay', 'awaitingDraw'];

export function isPlayablePhase(phase: ClashPhase): boolean {
  return PLAYABLE_PHASES.includes(phase);
}

export function currentPlayer(state: ClashGameState) {
  return state.players[state.currentPlayerIndex] ?? null;
}

export function canPlayerAct(state: ClashGameState, playerId: string): boolean {
  const p = currentPlayer(state);
  return isPlayablePhase(state.phase) && !!p && p.id === playerId && p.connected;
}

/** Yon ve baglantili oyunculari dikkate alarak N adim ilerideki oyuncu index'i. */
export function stepPlayerIndex(state: ClashGameState, steps: number): number {
  const count = state.players.length;
  let idx = state.currentPlayerIndex;
  let remaining = steps;
  let guard = 0;
  while (remaining > 0 && guard < count * steps + 10) {
    idx = (idx + state.direction + count) % count;
    if (state.players[idx]?.connected) remaining -= 1;
    guard += 1;
  }
  return idx;
}

export function nextPlayerIndex(state: ClashGameState): number {
  return stepPlayerIndex(state, 1);
}

export function reverseDirection(dir: ClashDirection): ClashDirection {
  return dir === 1 ? -1 : 1;
}
