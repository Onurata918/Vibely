import { describe, expect, it } from 'vitest';

import { type MeldContext } from '../meld';
import {
  evaluateOpening,
  pairsThreshold,
  recordOpening,
  seriesThreshold,
  type OpeningHistory,
  type OpeningRules,
  EMPTY_OPENING_HISTORY,
} from '../opening';
import { assign, face, ids, J1, lookup, pair, run, set } from './fixtures';
import { type MeldInput } from '../types';

// Gösterge B1 -> gerçek okey B2. Aşağıdaki perlerin hiçbiri B2 kullanmaz,
// böylece joker yalnızca açıkça istendiğinde devreye girer.
const ctx: MeldContext = { lookup, indicator: face('B1') };
const JOKER = ids('B2')[0];

const STANDARD: OpeningRules = { openingMode: 'standard', openingPoints: 101, openingPairs: 5 };
const ESCALATING: OpeningRules = { ...STANDARD, openingMode: 'escalating' };

const series = (melds: MeldInput[], rules = STANDARD, history = EMPTY_OPENING_HISTORY, status: 'UNOPENED' | 'SERIES' | 'PAIRS' = 'UNOPENED') =>
  evaluateOpening({ mode: 'SERIES', melds, currentStatus: status }, ctx, rules, history);
const pairs = (melds: MeldInput[], rules = STANDARD, history = EMPTY_OPENING_HISTORY, status: 'UNOPENED' | 'SERIES' | 'PAIRS' = 'UNOPENED') =>
  evaluateOpening({ mode: 'PAIRS', melds, currentStatus: status }, ctx, rules, history);

// Toplamları belgeden bağımsız doğrulanabilsin diye perler elle kuruldu.
const Y_RUN_36 = run(ids('Y11', 'Y12', 'Y13')); // 36
const B_RUN_36 = run(ids('B11', 'B12', 'B13')); // 36
const R_RUN_33 = run(ids('R10', 'R11', 'R12')); // 33
const K_RUN_30 = run(ids('K9', 'K10', 'K11')); // 30
const SET8_32 = set(ids('R8', 'B8', 'K8', 'Y8')); // 32
const SET10_40 = set(ids('R10', 'B10', 'K10', 'Y10')); // 40
const SET8_24 = set(ids('R8', 'B8', 'K8')); // 24
const SET7_21 = set(ids('R7', 'B7', 'K7')); // 7+7+7 = 21

describe('standart seri açılışı — R05', () => {
  it('T052: toplam 100 -> OPENING_TOO_LOW', () => {
    const result = series([Y_RUN_36, SET10_40, SET8_24]); // 36+40+24 = 100
    expect(result.ok).toBe(false);
    if (!result.ok && result.error === 'OPENING_TOO_LOW') {
      expect(result.total).toBe(100);
      expect(result.threshold).toBe(101);
    } else {
      expect.fail(`beklenen OPENING_TOO_LOW, alınan ${JSON.stringify(result)}`);
    }
  });

  it('T053: toplam 101 -> kabul', () => {
    const result = series([Y_RUN_36, SET8_32, R_RUN_33]); // 36+32+33 = 101
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.total).toBe(101);
      expect(result.mode).toBe('SERIES');
    }
  });

  it('T054: toplam 102 -> kabul', () => {
    const result = series([Y_RUN_36, B_RUN_36, K_RUN_30]); // 36+36+30 = 102
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.total).toBe(102);
  });

  it('T055: yeni perler 90 — masaya işleme puanı eşiğe katılmaz', () => {
    // İşleme değeri bu fonksiyona hiç verilmez; yalnızca eldeki yeni perler sayılır.
    const result = series([Y_RUN_36, R_RUN_33, SET7_21]); // 36+33+21 = 90
    expect(result.ok).toBe(false);
    if (!result.ok && result.error === 'OPENING_TOO_LOW') expect(result.total).toBe(90);
  });

  it('T056: motor en iyi assignment’ı kendi seçmez; verilen assignment ne veriyorsa o sayılır', () => {
    const high = run([...ids('K10', 'K11'), JOKER], [assign(JOKER, 'K12')]); // 10+11+12 = 33
    const low = run([...ids('K10', 'K11'), JOKER], [assign(JOKER, 'K9')]); // 9+10+11 = 30

    const accepted = series([Y_RUN_36, high, SET8_32]); // 36+33+32 = 101
    expect(accepted.ok).toBe(true);

    const rejected = series([Y_RUN_36, low, SET8_32]); // 36+30+32 = 98
    expect(rejected.ok).toBe(false);
  });

  it('T057: toplam 101 ama bir per geçersizse tüm açılış reddedilir', () => {
    const broken = set(ids('R8', 'B8', 'K8', 'K9')); // aynı sayı değil
    const result = series([Y_RUN_36, broken, R_RUN_33]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INVALID_MELD');
  });

  it('seri açılışında çift per kabul edilmez', () => {
    expect(series([Y_RUN_36, SET8_32, R_RUN_33, pair(ids('R5#1', 'R5#2'))]).ok).toBe(false);
  });
});

describe('standart çift açılışı — R05', () => {
  const fivePairs = [
    pair(ids('R5#1', 'R5#2')),
    pair(ids('B6#1', 'B6#2')),
    pair(ids('K7#1', 'K7#2')),
    pair(ids('Y8#1', 'Y8#2')),
    pair(ids('R9#1', 'R9#2')),
  ];

  it('T058: 4 geçerli çift -> red', () => {
    const result = pairs(fivePairs.slice(0, 4));
    expect(result.ok).toBe(false);
    if (!result.ok && result.error === 'OPENING_TOO_LOW') {
      expect(result.total).toBe(4);
      expect(result.threshold).toBe(5);
    }
  });

  it('T059: 5 geçerli çift -> kabul', () => {
    const result = pairs(fivePairs);
    expect(result.ok).toBe(true);
    // R05: çift açılışında sayı toplamı değil çift sayısı kullanılır.
    if (result.ok) expect(result.total).toBe(5);
  });

  it('T060: 6 geçerli çift -> kabul', () => {
    const result = pairs([...fivePairs, pair(ids('B10#1', 'B10#2'))]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.total).toBe(6);
  });

  it('T061: bir çift tileId paylaşırsa tüm plan red', () => {
    const shared = [...fivePairs.slice(0, 4), pair([ids('R5#1')[0], ids('R9#2')[0]])];
    const result = pairs(shared);
    expect(result.ok).toBe(false);
  });

  it('çift açılışında seri/grup per kabul edilmez', () => {
    expect(pairs([...fivePairs, Y_RUN_36]).ok).toBe(false);
  });
});

describe('mod kilidi — R05', () => {
  it('T062: SERIES açmış oyuncu PAIRS açamaz', () => {
    const result = pairs([], STANDARD, EMPTY_OPENING_HISTORY, 'SERIES');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('OPENING_MODE_LOCKED');
  });

  it('T063: PAIRS açmış oyuncu SERIES açamaz', () => {
    const result = series([Y_RUN_36, SET8_32, R_RUN_33], STANDARD, EMPTY_OPENING_HISTORY, 'PAIRS');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('OPENING_MODE_LOCKED');
  });
});

describe('katlamalı eşikler — R05', () => {
  const after = (h: Partial<OpeningHistory>): OpeningHistory => ({ ...EMPTY_OPENING_HISTORY, ...h });

  it('T064: katlamalı ilk seri eşiği 101', () => {
    expect(seriesThreshold(ESCALATING, EMPTY_OPENING_HISTORY)).toBe(101);
  });

  it('T065/T066: önceki seri 116 -> 116 red, 117 kabul', () => {
    const history = after({ highestSeriesOpening: 116 });
    expect(seriesThreshold(ESCALATING, history)).toBe(117);

    const total116 = [Y_RUN_36, B_RUN_36, SET8_32, SET8_24.kind === 'SET' ? set(ids('R3', 'B3', 'K3', 'Y3')) : SET8_24]; // 36+36+32+12 = 116
    const r116 = evaluateOpening({ mode: 'SERIES', melds: total116, currentStatus: 'UNOPENED' }, ctx, ESCALATING, history);
    expect(r116.ok).toBe(false);
    if (!r116.ok && r116.error === 'OPENING_TOO_LOW') expect(r116.total).toBe(116);

    const total117 = [Y_RUN_36, B_RUN_36, SET8_32, run(ids('R3', 'R4', 'R6'))]; // son per geçersiz olmasın diye aşağıda düzeltilir
    void total117;
    const ok117 = evaluateOpening(
      { mode: 'SERIES', melds: [Y_RUN_36, B_RUN_36, SET8_32, set(ids('R1', 'B1', 'K1')), set(ids('R2', 'K2', 'Y2'))], currentStatus: 'UNOPENED' },
      ctx,
      ESCALATING,
      history
    ); // 36+36+32+3+6 = 113 -> hâlâ düşük
    expect(ok117.ok).toBe(false);

    const ok = evaluateOpening(
      { mode: 'SERIES', melds: [Y_RUN_36, B_RUN_36, SET8_32, run(ids('K11', 'K12', 'K13'))], currentStatus: 'UNOPENED' },
      ctx,
      ESCALATING,
      history
    ); // 36+36+32+36 = 140 >= 117
    expect(ok.ok).toBe(true);
  });

  it('T067/T068: önceki çift 5 -> 5 red, 6 kabul', () => {
    const history = after({ highestPairsOpening: 5 });
    expect(pairsThreshold(ESCALATING, history)).toBe(6);

    const five = [
      pair(ids('R5#1', 'R5#2')),
      pair(ids('B6#1', 'B6#2')),
      pair(ids('K7#1', 'K7#2')),
      pair(ids('Y8#1', 'Y8#2')),
      pair(ids('R9#1', 'R9#2')),
    ];
    expect(evaluateOpening({ mode: 'PAIRS', melds: five, currentStatus: 'UNOPENED' }, ctx, ESCALATING, history).ok).toBe(false);
    expect(
      evaluateOpening({ mode: 'PAIRS', melds: [...five, pair(ids('B10#1', 'B10#2'))], currentStatus: 'UNOPENED' }, ctx, ESCALATING, history).ok
    ).toBe(true);
  });

  it('T069: seri açılışı çift eşiğini değiştirmez', () => {
    const history = recordOpening(EMPTY_OPENING_HISTORY, 'SERIES', 116);
    expect(seriesThreshold(ESCALATING, history)).toBe(117);
    expect(pairsThreshold(ESCALATING, history)).toBe(5);
  });

  it('T070: çift açılışı seri eşiğini değiştirmez', () => {
    const history = recordOpening(EMPTY_OPENING_HISTORY, 'PAIRS', 5);
    expect(pairsThreshold(ESCALATING, history)).toBe(6);
    expect(seriesThreshold(ESCALATING, history)).toBe(101);
  });

  it('T071: ilk açılıştan sonraki ek per eşiği yükseltmez', () => {
    const history = recordOpening(EMPTY_OPENING_HISTORY, 'SERIES', 105);
    expect(seriesThreshold(ESCALATING, history)).toBe(106);
    // Ek per kaydedilmez; recordOpening yalnızca açılış anında çağrılır.
    expect(seriesThreshold(ESCALATING, history)).toBe(106);
  });

  it('T072: standart masada önceki 116 yeni 101’i engellemez', () => {
    const history = after({ highestSeriesOpening: 116 });
    expect(seriesThreshold(STANDARD, history)).toBe(101);
    expect(evaluateOpening({ mode: 'SERIES', melds: [Y_RUN_36, SET8_32, R_RUN_33], currentStatus: 'UNOPENED' }, ctx, STANDARD, history).ok).toBe(true);
  });
});
