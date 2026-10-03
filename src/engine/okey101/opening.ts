import { validateMeldBatch, type BatchResult, type MeldContext } from './meld';
import { type MeldInput, type OpeningStatus } from './types';

export const DEFAULT_OPENING_POINTS = 101;
export const DEFAULT_OPENING_PAIRS = 5;

export type OpeningMode = 'standard' | 'escalating';

export type OpeningRules = {
  openingMode: OpeningMode;
  openingPoints: number;
  openingPairs: number;
};

export const DEFAULT_OPENING_RULES: OpeningRules = {
  openingMode: 'standard',
  openingPoints: DEFAULT_OPENING_POINTS,
  openingPairs: DEFAULT_OPENING_PAIRS,
};

/**
 * R05 katlamali: esikler masada daha once yapilmis acilislara gore yukselir.
 * Iki esik birbirinden bagimsizdir (T069, T070).
 */
export type OpeningHistory = {
  /** Onceki SERIES acilislarinin en yuksek toplami; hic yoksa null. */
  highestSeriesOpening: number | null;
  /** Onceki PAIRS acilislarinin en yuksek cift sayisi; hic yoksa null. */
  highestPairsOpening: number | null;
};

export const EMPTY_OPENING_HISTORY: OpeningHistory = { highestSeriesOpening: null, highestPairsOpening: null };

export function seriesThreshold(rules: OpeningRules, history: OpeningHistory): number {
  if (rules.openingMode !== 'escalating' || history.highestSeriesOpening === null) return rules.openingPoints;
  return Math.max(rules.openingPoints, history.highestSeriesOpening + 1);
}

export function pairsThreshold(rules: OpeningRules, history: OpeningHistory): number {
  if (rules.openingMode !== 'escalating' || history.highestPairsOpening === null) return rules.openingPairs;
  return Math.max(rules.openingPairs, history.highestPairsOpening + 1);
}

export type OpeningAttempt = {
  mode: 'SERIES' | 'PAIRS';
  melds: readonly MeldInput[];
  /** Oyuncunun bu eldeki mevcut durumu; mod kilidi buradan gelir. */
  currentStatus: OpeningStatus;
};

export type OpeningResult =
  | { ok: true; mode: 'SERIES' | 'PAIRS'; total: number; threshold: number; batch: Extract<BatchResult, { valid: true }> }
  | { ok: false; error: 'OPENING_MODE_LOCKED' }
  | { ok: false; error: 'INVALID_MELD'; index: number | null; reason: string }
  | { ok: false; error: 'OPENING_TOO_LOW'; total: number; threshold: number };

/**
 * R05: tek acilis islemindeki yalnizca **eldeki yeni** perler sayilir.
 * Masaya yapilan isleme bu toplama girmez (T055) — cagiran taraf oraya
 * sadece yeni perleri verir.
 */
export function evaluateOpening(attempt: OpeningAttempt, ctx: MeldContext, rules: OpeningRules, history: OpeningHistory): OpeningResult {
  // R05: tek elde ilk secilen mod kalicidir (T062, T063).
  if (attempt.currentStatus !== 'UNOPENED') return { ok: false, error: 'OPENING_MODE_LOCKED' };

  // R05: seri ve cift acilis ayni islemde karistirilmaz.
  const wantedKind = attempt.mode === 'PAIRS' ? 'PAIR' : null;
  for (const meld of attempt.melds) {
    const isPair = meld.kind === 'PAIR';
    if (attempt.mode === 'PAIRS' && !isPair) return { ok: false, error: 'INVALID_MELD', index: null, reason: 'PAIRS_OPENING_ACCEPTS_PAIRS_ONLY' };
    if (attempt.mode === 'SERIES' && isPair) return { ok: false, error: 'INVALID_MELD', index: null, reason: 'SERIES_OPENING_REJECTS_PAIRS' };
  }
  void wantedKind;

  const batch = validateMeldBatch(attempt.melds, ctx);
  if (!batch.valid) return { ok: false, error: 'INVALID_MELD', index: batch.index, reason: batch.reason };

  if (attempt.mode === 'PAIRS') {
    // R05: cift acilisinda sayi toplami degil **cift sayisi** kullanilir.
    const threshold = pairsThreshold(rules, history);
    const total = batch.melds.length;
    if (total < threshold) return { ok: false, error: 'OPENING_TOO_LOW', total, threshold };
    return { ok: true, mode: 'PAIRS', total, threshold, batch };
  }

  const threshold = seriesThreshold(rules, history);
  const total = batch.totalValue;
  if (total < threshold) return { ok: false, error: 'OPENING_TOO_LOW', total, threshold };
  return { ok: true, mode: 'SERIES', total, threshold, batch };
}

/**
 * R05: esik yalnizca ilk acilista konan perlerin degeri/sayisiyla yukselir;
 * sonraki isleme ve ek perler esigi yukseltmez (T071).
 */
export function recordOpening(history: OpeningHistory, mode: 'SERIES' | 'PAIRS', total: number): OpeningHistory {
  if (mode === 'SERIES') {
    return { ...history, highestSeriesOpening: Math.max(history.highestSeriesOpening ?? 0, total) };
  }
  return { ...history, highestPairsOpening: Math.max(history.highestPairsOpening ?? 0, total) };
}
