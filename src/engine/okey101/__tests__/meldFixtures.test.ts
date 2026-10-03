import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { validateMeld, type MeldContext } from '../meld';
import { type Face, type MeldInput, type Tile, type TileId } from '../types';

/**
 * docs/okey101/fixtures/melds.json dosyasini dogrudan calistirir.
 * Beklenen sonuclar sartnameden gelir, uygulamadan degil.
 */
type FixtureTile = { id: TileId; face: Face; kind: 'NUMBER' };
type FixtureCase = {
  id: string;
  indicator: Face;
  kind: MeldInput['kind'];
  tiles: FixtureTile[];
  assignments: MeldInput['assignments'];
  expected: { valid: boolean; value: number | null };
};

const fixturePath = path.resolve(__dirname, '../../../../docs/okey101/fixtures/melds.json');
const fixtures = JSON.parse(readFileSync(fixturePath, 'utf8')) as { cases: FixtureCase[] };

describe('fixtures/melds.json', () => {
  it('beklenen 15 vakayı içerir', () => {
    expect(fixtures.cases).toHaveLength(15);
    expect(fixtures.cases.map((c) => c.id)).toEqual(Array.from({ length: 15 }, (_, i) => `M${String(i + 1).padStart(3, '0')}`));
  });

  for (const fixture of fixtures.cases) {
    it(`${fixture.id}: ${fixture.kind} -> ${fixture.expected.valid ? `geçerli, ${fixture.expected.value}` : 'geçersiz'}`, () => {
      const byId = new Map<TileId, Tile>(
        fixture.tiles.map((t) => [t.id, { id: t.id, kind: 'NUMBER', face: t.face, copy: 1 } as Tile])
      );
      const ctx: MeldContext = { lookup: (id) => byId.get(id), indicator: fixture.indicator };
      const input: MeldInput = { kind: fixture.kind, tiles: fixture.tiles.map((t) => t.id), assignments: fixture.assignments };

      const result = validateMeld(input, ctx);
      expect(result.valid).toBe(fixture.expected.valid);
      if (result.valid && fixture.expected.value !== null) expect(result.value).toBe(fixture.expected.value);
    });
  }
});
