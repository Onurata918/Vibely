import { describe, expect, it } from 'vitest';

import { validateMeld, validateMeldBatch, type MeldContext } from '../meld';
import { face, assign, ids, INDICATOR_Y12, J1, J2, lookup, pair, run, set } from './fixtures';
import { type Face, type MeldInput } from '../types';

const ctx: MeldContext = { lookup, indicator: INDICATOR_Y12 };
const withIndicator = (indicator: Face): MeldContext => ({ lookup, indicator });

const expectValid = (input: MeldInput, value: number, c: MeldContext = ctx) => {
  const result = validateMeld(input, c);
  expect(result.valid, `beklenen: geçerli, alınan: ${JSON.stringify(result)}`).toBe(true);
  if (result.valid) expect(result.value).toBe(value);
};
const expectInvalid = (input: MeldInput, c: MeldContext = ctx) => {
  expect(validateMeld(input, c).valid).toBe(false);
};

describe('RUN — R04', () => {
  it('T014: R4 R5 R6 kabul, puan 15', () => expectValid(run(ids('R4', 'R5', 'R6')), 15));
  it('T015: R1 R2 R3 kabul, puan 6', () => expectValid(run(ids('R1', 'R2', 'R3')), 6));
  it('T016: R11 R12 R13 kabul, puan 36', () => expectValid(run(ids('R11', 'R12', 'R13')), 36));
  it('T017: R12 R13 R1 red — sarma yok', () => expectInvalid(run(ids('R12', 'R13', 'R1'))));
  it('T018: R13 R1 R2 red — sarma yok', () => expectInvalid(run(ids('R13', 'R1', 'R2'))));
  it('T019: R4 R5 red — minimum üç taş', () => expectInvalid(run(ids('R4', 'R5'))));
  it('T020: R4 R6 R7 red — boşluk var', () => expectInvalid(run(ids('R4', 'R6', 'R7'))));
  it('T021: R4 B5 R6 red — renkler farklı', () => expectInvalid(run(ids('R4', 'B5', 'R6'))));
  it('T022: R5#1 R5#2 R6 red — sayı tekrarı', () => expectInvalid(run(ids('R5#1', 'R5#2', 'R6'))));
  it('T023: R6 R4 R5 kabul — fiziksel sıra zorunlu değil', () => expectValid(run(ids('R6', 'R4', 'R5')), 15));
  it('T024: R1..R13 kabul, puan 91', () => {
    const thirteen = Array.from({ length: 13 }, (_, i) => `R${i + 1}`);
    expectValid(run(ids(...thirteen)), 91);
  });
});

describe('SET — R04', () => {
  it('T025: R8 B8 K8 kabul, puan 24', () => expectValid(set(ids('R8', 'B8', 'K8')), 24));
  it('T026: R8 B8 K8 Y8 kabul, puan 32', () => expectValid(set(ids('R8', 'B8', 'K8', 'Y8')), 32));
  it('T027: R8#1 R8#2 B8 red — renk tekrarı', () => expectInvalid(set(ids('R8#1', 'R8#2', 'B8'))));
  it('T028: R8 B8 K9 red', () => expectInvalid(set(ids('R8', 'B8', 'K9'))));
  it('T029: R8 B8 red — iki taş yetmez', () => expectInvalid(set(ids('R8', 'B8'))));
  it('T030: beş taşlı grup red', () => expectInvalid(set(ids('R8', 'B8', 'K8', 'Y8', 'R8#2'))));
});

describe('PAIR — R04', () => {
  it('T031: R8#1 R8#2 kabul', () => expectValid(pair(ids('R8#1', 'R8#2')), 16));
  it('T032: R8 B8 red', () => expectInvalid(pair(ids('R8', 'B8'))));
  it('T033: R8 R9 red', () => expectInvalid(pair(ids('R8', 'R9'))));
  it('T034: aynı tileId iki kez red — iki fiziksel kopya gerekir', () => {
    expectInvalid(pair([ids('R8#1')[0], ids('R8#1')[0]]));
  });
});

describe('gerçek joker ve assignment — R02/R04', () => {
  it('T035: R4 J(R5) R6 kabul, puan 15', () => expectValid(run([ids('R4')[0], J1, ids('R6')[0]], [assign(J1, 'R5')]), 15));
  it('T036: R4 J(B5) R6 red — renk uyuşmuyor', () => expectInvalid(run([ids('R4')[0], J1, ids('R6')[0]], [assign(J1, 'B5')])));
  it('T037: assignment 1..13 dışında red', () => {
    expectInvalid(run([ids('R12')[0], ids('R13')[0], J1], [{ tileId: J1, represents: { color: 'RED', value: 14 } }]));
  });
  it('T038: R8 B8 J(K8) kabul, puan 24', () => expectValid(set([ids('R8')[0], ids('B8')[0], J1], [assign(J1, 'K8')]), 24));
  it('T039: R8 B8 J(R8) red — joker rengi tekrar ediyor', () => {
    expectInvalid(set([ids('R8')[0], ids('B8')[0], J1], [assign(J1, 'R8')]));
  });
  it('T040: R8#1 J(R8) çift kabul — BASELINE', () => expectValid(pair([ids('R8#1')[0], J1], [assign(J1, 'R8')]), 16));
  it('T041: J1(R8) J2(R8) çift kabul — BASELINE', () => {
    expectValid(pair([J1, J2], [assign(J1, 'R8'), assign(J2, 'R8')]), 16);
  });
  it('T042: J1(R8) J2(B8) çift red', () => expectInvalid(pair([J1, J2], [assign(J1, 'R8'), assign(J2, 'B8')])));
  it('T043: assignment verilmemiş gerçek joker red', () => expectInvalid(run([ids('R4')[0], J1, ids('R6')[0]])));
  it('T044: normal taşa wildcard assignment red', () => {
    expectInvalid(run(ids('R4', 'R5', 'R6'), [assign(ids('R5')[0], 'R9')]));
  });
  it('T045: başka pere ait tileId için assignment red', () => {
    expectInvalid(run(ids('R4', 'R5', 'R6'), [assign(J1, 'R7')]));
  });
  it('R04: yalnızca gerçek jokerlerden oluşan per red', () => {
    expectInvalid(set([J1, J2], [assign(J1, 'R8'), assign(J2, 'B8')]));
  });
});

describe('sahte okey — R02', () => {
  const RED6 = withIndicator(face('R6')); // gösterge R6 -> gerçek okey R7, sahte okey efektif R7

  it('T046: R5 R6 F kabul, puan 18', () => expectValid(run(ids('R5', 'R6', 'FJ')), 18, RED6));
  it('T047: B5 B6 F red — sahte okey B7 olamaz', () => expectInvalid(run(ids('B5', 'B6', 'FJ')), RED6));
  it('T048: F1 F2 çift kabul — ikisi de R7', () => expectValid(pair(ids('FJ#1', 'FJ#2')), 14, RED6));
  it('T049: F R8 çift red', () => expectInvalid(pair(ids('FJ', 'R8')), RED6));
  it('T050: göstergenin eldeki eşi R6 ile B8 çift red — gösterge ek özelliği kapalı', () => {
    expectInvalid(pair(ids('R6', 'B8')), RED6);
  });
  it('sahte okeye wildcard assignment verilemez', () => {
    expectInvalid(run(ids('R5', 'R6', 'FJ'), [assign(ids('FJ')[0], 'R7')]), RED6);
  });
});

describe('toplu doğrulama — R04', () => {
  it('T051: iki farklı perde aynı tileId red', () => {
    const batch = validateMeldBatch([run(ids('R4', 'R5', 'R6')), run(ids('R6', 'R7', 'R8'))], ctx);
    expect(batch.valid).toBe(false);
    if (!batch.valid) expect(batch.reason).toBe('DUPLICATE_TILE_ACROSS_MELDS');
  });

  it('geçerli grup toplam değeri döndürür', () => {
    const batch = validateMeldBatch([run(ids('R4', 'R5', 'R6')), set(ids('R8', 'B8', 'K8'))], ctx);
    expect(batch.valid).toBe(true);
    if (batch.valid) expect(batch.totalValue).toBe(15 + 24);
  });
});
