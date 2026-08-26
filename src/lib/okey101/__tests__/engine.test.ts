import { describe, expect, it } from 'vitest';
import { buildOkeySet, computeOkeyOf, isFakeJoker, isWildTile, validateMeld } from '@/lib/okey/engine';

describe('okey deck', () => {
  it('deste tam olarak beklenen taslari icerir: 104 numarali + 2 sahte joker = 106', () => {
    const set = buildOkeySet();
    expect(set.length).toBe(106);
    const jokers = set.filter(isFakeJoker);
    expect(jokers.length).toBe(2);
    const numbered = set.filter((t) => t.kind === 'number');
    expect(numbered.length).toBe(104);
  });

  it('her renk/sayi kombinasyonu tam olarak 2 kopya olarak bulunur', () => {
    const set = buildOkeySet();
    const counts = new Map<string, number>();
    for (const t of set) {
      if (t.kind !== 'number') continue;
      const key = `${t.color}-${t.number}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(4 * 13);
    for (const c of counts.values()) expect(c).toBe(2);
  });

  it('ayni sayi/renkteki iki kopya farkli fiziksel kimlige (id) sahiptir', () => {
    const set = buildOkeySet();
    const ids = new Set(set.map((t) => t.id));
    expect(ids.size).toBe(set.length);
  });
});

describe('indicator / okey hesabi', () => {
  it('gosterge kirmizi 7 ise okey kirmizi 8 olur', () => {
    const okeyOf = computeOkeyOf({ id: 'x', kind: 'number', color: 'red', number: 7 });
    expect(okeyOf).toEqual({ color: 'red', number: 8 });
  });

  it('13 -> 1 sarmasi dogru calisir', () => {
    const okeyOf = computeOkeyOf({ id: 'x', kind: 'number', color: 'blue', number: 13 });
    expect(okeyOf).toEqual({ color: 'blue', number: 1 });
  });

  it('sahte joker gosterge olamaz (null doner)', () => {
    const okeyOf = computeOkeyOf({ id: 'x', kind: 'fakejoker' });
    expect(okeyOf).toBeNull();
  });
});

describe('wild/joker davranisi', () => {
  const okeyOf = { color: 'red' as const, number: 8 };

  it('sahte joker her zaman wild sayilir', () => {
    expect(isWildTile({ id: 'j', kind: 'fakejoker' }, okeyOf)).toBe(true);
  });

  it('gercek okey tasi (kirmizi 8) wild sayilir', () => {
    expect(isWildTile({ id: 't', kind: 'number', color: 'red', number: 8 }, okeyOf)).toBe(true);
  });

  it('okey rengi ama farkli sayidaki tas wild degildir', () => {
    expect(isWildTile({ id: 't', kind: 'number', color: 'red', number: 9 }, okeyOf)).toBe(false);
  });
});

describe('meld dogrulama', () => {
  const okeyOf = { color: 'red' as const, number: 8 };
  const t = (color: 'red' | 'yellow' | 'blue' | 'black', number: number, id?: string) => ({ id: id ?? `${color}${number}`, kind: 'number' as const, color, number });
  const joker = { id: 'j1', kind: 'fakejoker' as const };

  it('gecerli 3 taslik seri kabul edilir', () => {
    const r = validateMeld([t('blue', 5), t('blue', 6), t('blue', 7)], okeyOf);
    expect(r.valid).toBe(true);
  });

  it('gecersiz seri (ayni renk degil) reddedilir', () => {
    const r = validateMeld([t('blue', 5), t('red', 6, 'r6'), t('blue', 7)], okeyOf);
    expect(r.valid).toBe(false);
  });

  it('daha uzun gecerli seri (5 tas) kabul edilir', () => {
    const r = validateMeld([t('black', 3), t('black', 4), t('black', 5), t('black', 6), t('black', 7)], okeyOf);
    expect(r.valid).toBe(true);
  });

  it('gecerli grup (ayni sayi, farkli renk) kabul edilir', () => {
    const r = validateMeld([t('blue', 8, 'b8'), t('yellow', 8), t('black', 8)], okeyOf);
    expect(r.valid).toBe(true);
  });

  it('ayni renk tekrar eden grup reddedilir', () => {
    const r = validateMeld([t('blue', 8, 'b8a'), t('blue', 8, 'b8b'), t('black', 8)], okeyOf);
    expect(r.valid).toBe(false);
  });

  it('joker seri icindeki bosluk doldurur', () => {
    const r = validateMeld([t('yellow', 4), joker, t('yellow', 6)], okeyOf);
    expect(r.valid).toBe(true);
    if (r.valid && r.kind === 'run') expect([r.min, r.max]).toEqual([4, 6]);
  });

  it('joker grubu tamamlar', () => {
    const r = validateMeld([t('yellow', 9), t('black', 9), joker], okeyOf);
    expect(r.valid).toBe(true);
  });
});
