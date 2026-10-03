import { describe, expect, it } from 'vitest';

import { allTileIds } from '../state';
import { applyAction, type Action } from '../turn';
import { TOTAL_TILES, type Seat } from '../types';
import { id, ids } from './fixtures';
import { buildState, handIds, meldIdOf } from './turnFixtures';

const run = (tiles: string[]) => ({ kind: 'RUN' as const, tiles: ids(...tiles), assignments: [] });
const set = (tiles: string[]) => ({ kind: 'SET' as const, tiles: ids(...tiles), assignments: [] });

/**
 * Gerçekten 101 eden açılış: 33 + 36 + 32.
 * Gösterge Y12 ve gerçek okey Y13 olduğu için o iki taş kullanılmaz.
 */
const OPEN_101 = [run(['R10', 'R11', 'R12']), run(['K11', 'K12', 'K13']), set(['R8', 'B8', 'K8', 'Y8'])];
const OPEN_101_TILES = ['R10', 'R11', 'R12', 'K11', 'K12', 'K13', 'R8', 'B8', 'K8', 'Y8'];

const act = (state: Parameters<typeof applyAction>[0], seat: Seat, action: Action) => applyAction(state, seat, action);

describe('çekme — R06', () => {
  it('T074: 22 taşla başlayan oyuncu ilk tur çekemez', () => {
    const state = buildState({ hands: { 0: ['R1', 'R2'] }, phase: 'AWAIT_PLAY' });
    const result = act(state, 0, { type: 'DRAW_STOCK' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INVALID_PHASE');
    expect(result.state).toBe(state);
  });

  it('T075: çekmeden atış yapılamaz', () => {
    const state = buildState({ hands: { 0: ['R1', 'R2'] }, phase: 'AWAIT_DRAW' });
    const result = act(state, 0, { type: 'COMMIT_TURN', steps: [], discardTileId: id('R1') });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INVALID_PHASE');
  });

  it('T076: başkasının sırasında çekme reddedilir', () => {
    const state = buildState({ hands: { 0: ['R1'] }, currentSeat: 0, phase: 'AWAIT_DRAW' });
    const result = act(state, 1, { type: 'DRAW_STOCK' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NOT_YOUR_TURN');
  });

  it('T077/T078: bir çekiş eli büyütür, ikinci çekiş reddedilir', () => {
    const state = buildState({ hands: { 0: ['R1'] }, phase: 'AWAIT_DRAW', stock: ['K5', 'K6'] });
    const first = act(state, 0, { type: 'DRAW_STOCK' });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    // T078: stok tam 1 azalır, el tam 1 artar; korunum bozulmaz.
    expect(first.state.seats[0].hand).toHaveLength(state.seats[0].hand.length + 1);
    expect(first.state.stock).toHaveLength(state.stock.length - 1);
    expect(first.state.drawnTileId).toBe(id('K5'));
    expect(allTileIds(first.state)).toHaveLength(TOTAL_TILES);

    const second = act(first.state, 0, { type: 'DRAW_STOCK' });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toBe('INVALID_PHASE');
    expect(second.state.seats[0].hand).toHaveLength(2);
  });
});

describe('atış ve sıra — R06', () => {
  it('T079: elde olmayan taş atılamaz, state değişmez', () => {
    const state = buildState({ hands: { 0: ['R1', 'R2'] } });
    const result = act(state, 0, { type: 'COMMIT_TURN', steps: [], discardTileId: id('K9') });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('TILE_NOT_OWNED');
    expect(result.state).toBe(state);
  });

  it('T080: geçerli atış bir taş eksiltir ve sırayı devreder', () => {
    const state = buildState({ hands: { 0: ['R1', 'R2'] } });
    const result = act(state, 0, { type: 'COMMIT_TURN', steps: [], discardTileId: id('R1') });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.seats[0].hand).toHaveLength(1);
    expect(result.state.discards[0].map((t) => t.id)).toEqual([id('R1')]);
    expect(result.state.currentSeat).toBe(1);
    expect(result.state.phase).toBe('AWAIT_DRAW');
    expect(allTileIds(result.state)).toHaveLength(TOTAL_TILES);
  });

  it('T081: seat 3 attıktan sonra sıra seat 0’a döner', () => {
    const state = buildState({ hands: { 3: ['R1', 'R2'] }, currentSeat: 3 });
    const result = act(state, 3, { type: 'COMMIT_TURN', steps: [], discardTileId: id('R1') });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.currentSeat).toBe(0);
  });

  it('T113: bütün taşları masaya koyup atacak taş bırakmayan plan reddedilir', () => {
    const state = buildState({ hands: { 0: OPEN_101_TILES } });
    const result = act(state, 0, { type: 'COMMIT_TURN', steps: [{ type: 'OPEN', mode: 'SERIES', melds: OPEN_101 }], discardTileId: id('R10') });
    // Açılış 101'i tutuyor; reddin sebebi atılacak taş kalmaması olmalı.
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('MUST_LEAVE_DISCARD');
    expect(result.state).toBe(state);
  });
});

describe('soldan alma — R06', () => {
  const pickupState = () =>
    buildState({
      hands: { 1: [...OPEN_101_TILES.filter((t) => t !== 'Y8'), 'K2'] },
      currentSeat: 1,
      phase: 'AWAIT_DRAW',
      discards: { 0: ['Y8'] },
    });

  it('T082: alınan taş açılışta kullanılırsa atomik olarak kabul', () => {
    const state = pickupState();
    const result = act(state, 1, {
      type: 'TAKE_DISCARD_AND_PLAY',
      discardTileId: id('Y8'),
      steps: [{ type: 'OPEN', mode: 'SERIES', melds: OPEN_101 }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.seats[1].opening).toBe('SERIES');
    expect(result.state.discards[0]).toHaveLength(0);
    expect(result.state.table.flatMap((m) => m.tiles.map((t) => t.tile.id))).toContain(id('Y8'));
    expect(allTileIds(result.state)).toHaveLength(TOTAL_TILES);
  });

  it('T084: alınan taş elde tutulursa plan reddedilir', () => {
    const state = pickupState();
    const result = act(state, 1, { type: 'TAKE_DISCARD_AND_PLAY', discardTileId: id('Y8'), steps: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INVALID_DISCARD_PICKUP');
    expect(result.state).toBe(state);
  });

  it('T085: açmamış oyuncu sadece işleme için soldan alamaz', () => {
    const state = buildState({
      hands: { 1: ['K2', 'K3'] },
      currentSeat: 1,
      phase: 'AWAIT_DRAW',
      discards: { 0: ['R7'] },
      table: [{ kind: 'RUN', ownerSeat: 0, tiles: ['R4', 'R5', 'R6'] }],
      opening: { 0: 'SERIES' },
    });
    const result = act(state, 1, {
      type: 'TAKE_DISCARD_AND_PLAY',
      discardTileId: id('R7'),
      steps: [{ type: 'EXTEND', meldId: meldIdOf(state), tiles: ids('R7'), assignments: [] }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NOT_OPENED');
    expect(result.state).toBe(state);
  });

  it('T086: başka seat’in veya eski atılanın alınması reddedilir', () => {
    const state = buildState({
      hands: { 1: ['K2'] },
      currentSeat: 1,
      phase: 'AWAIT_DRAW',
      discards: { 0: ['R7', 'K9'], 2: ['B4'] },
    });
    // Seat 0'in tepesi K9; R7 artik tepede degil.
    expect(act(state, 1, { type: 'TAKE_DISCARD_AND_PLAY', discardTileId: id('R7'), steps: [] }).ok).toBe(false);
    // Seat 2 onceki seat degil.
    expect(act(state, 1, { type: 'TAKE_DISCARD_AND_PLAY', discardTileId: id('B4'), steps: [] }).ok).toBe(false);
  });

  it('T087: açılış yetersizse el, atılan ve masa hiç değişmez', () => {
    const state = pickupState();
    const weak = [set(['R8', 'B8', 'K8', 'Y8'])]; // yalnızca 32 puan
    const result = act(state, 1, { type: 'TAKE_DISCARD_AND_PLAY', discardTileId: id('Y8'), steps: [{ type: 'OPEN', mode: 'SERIES', melds: weak }] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('OPENING_TOO_LOW');
    expect(result.state).toBe(state);
    expect(result.state.discards[0].map((t) => t.id)).toEqual([id('Y8')]);
  });
});

describe('işleme ve mod kısıtları — R07', () => {
  const tableRun = () => ({ kind: 'RUN' as const, ownerSeat: 0 as Seat, tiles: ['R4', 'R5', 'R6'] });
  const tableSet = () => ({ kind: 'SET' as const, ownerSeat: 0 as Seat, tiles: ['R8', 'B8', 'K8'] });

  type TableSpec = { kind: 'RUN' | 'SET' | 'PAIR'; ownerSeat: Seat; tiles: string[] };

  const extendState = (hand: string[], opening: 'UNOPENED' | 'SERIES' | 'PAIRS' = 'SERIES', table: TableSpec[] = [tableRun()]) =>
    buildState({ hands: { 1: hand }, currentSeat: 1, opening: { 0: 'SERIES', 1: opening }, table });

  const tryExtend = (hand: string[], extendTiles: string[], opening: 'UNOPENED' | 'SERIES' | 'PAIRS' = 'SERIES', table: TableSpec[] = [tableRun()]) => {
    const state = extendState(hand, opening, table);
    return { state, result: act(state, 1, { type: 'PLAY_STEPS', steps: [{ type: 'EXTEND', meldId: meldIdOf(state), tiles: ids(...extendTiles), assignments: [] }] }) };
  };

  it('T088: açmamış oyuncu masaya işleyemez', () => {
    const { result } = tryExtend(['R3'], ['R3'], 'UNOPENED');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NOT_OPENED');
  });

  it('T090/T091: seriye alttan ve üstten ekleme kabul', () => {
    expect(tryExtend(['R3'], ['R3']).result.ok).toBe(true);
    expect(tryExtend(['R7'], ['R7']).result.ok).toBe(true);
  });

  it('T092/T093: boşluk bırakan veya renk uymayan ekleme red', () => {
    expect(tryExtend(['R8'], ['R8']).result.ok).toBe(false);
    expect(tryExtend(['B7'], ['B7']).result.ok).toBe(false);
  });

  it('T094: R11 R12 R13 serisine R1 eklenemez — sarma yok', () => {
    const table: TableSpec[] = [{ kind: 'RUN' as const, ownerSeat: 0 as Seat, tiles: ['R11', 'R12', 'R13'] }];
    expect(tryExtend(['R1'], ['R1'], 'SERIES', table).result.ok).toBe(false);
  });

  it('T095/T096/T097: gruba eksik renk eklenir, tekrar renk ve beşinci taş reddedilir', () => {
    expect(tryExtend(['Y8'], ['Y8'], 'SERIES', [tableSet()]).result.ok).toBe(true);
    expect(tryExtend(['R8#2'], ['R8#2'], 'SERIES', [tableSet()]).result.ok).toBe(false);

    const fullSet: TableSpec[] = [{ kind: 'SET' as const, ownerSeat: 0 as Seat, tiles: ['R8', 'B8', 'K8', 'Y8'] }];
    expect(tryExtend(['R8#2'], ['R8#2'], 'SERIES', fullSet).result.ok).toBe(false);
  });

  it('T098: çift perine üçüncü taş eklenemez', () => {
    const pairTable: TableSpec[] = [{ kind: 'PAIR' as const, ownerSeat: 0 as Seat, tiles: ['R5#1', 'R5#2'] }];
    expect(tryExtend(['K5'], ['K5'], 'SERIES', pairTable).result.ok).toBe(false);
  });

  it('T099/T100: seri açan, ancak başkası çift açtıysa yeni çift koyabilir', () => {
    const withoutPairs = buildState({ hands: { 1: ['K3#1', 'K3#2'] }, currentSeat: 1, opening: { 1: 'SERIES' } });
    const rejected = act(withoutPairs, 1, { type: 'PLAY_STEPS', steps: [{ type: 'ADD_MELDS', melds: [{ kind: 'PAIR', tiles: ids('K3#1', 'K3#2'), assignments: [] }] }] });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.error).toBe('OPENING_MODE_LOCKED');

    const withPairs = buildState({ hands: { 1: ['K3#1', 'K3#2'] }, currentSeat: 1, opening: { 1: 'SERIES', 2: 'PAIRS' } });
    const accepted = act(withPairs, 1, { type: 'PLAY_STEPS', steps: [{ type: 'ADD_MELDS', melds: [{ kind: 'PAIR', tiles: ids('K3#1', 'K3#2'), assignments: [] }] }] });
    expect(accepted.ok).toBe(true);
    if (accepted.ok) expect(accepted.state.seats[1].opening).toBe('SERIES');
  });

  it('T101: çift açan yeni seri açamaz', () => {
    const state = buildState({ hands: { 1: ['Y4', 'Y5', 'Y6'] }, currentSeat: 1, opening: { 1: 'PAIRS' } });
    const result = act(state, 1, { type: 'PLAY_STEPS', steps: [{ type: 'ADD_MELDS', melds: [run(['Y4', 'Y5', 'Y6'])] }] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('OPENING_MODE_LOCKED');
  });

  it('T102/T103: çift açan başkasının serisini uzatabilir, tur başına sınır yok', () => {
    const state = buildState({
      hands: { 1: ['R3', 'R7', 'R8'] },
      currentSeat: 1,
      opening: { 0: 'SERIES', 1: 'PAIRS' },
      table: [tableRun()],
    });
    const meldId = meldIdOf(state);
    const result = act(state, 1, {
      type: 'PLAY_STEPS',
      steps: [
        { type: 'EXTEND', meldId, tiles: ids('R3'), assignments: [] },
        { type: 'EXTEND', meldId, tiles: ids('R7'), assignments: [] },
        { type: 'EXTEND', meldId, tiles: ids('R8'), assignments: [] },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.table[0].tiles).toHaveLength(6);
  });

  it('T089: aynı planda OPEN sonrası EXTEND kabul', () => {
    const state = buildState({
      hands: { 1: [...OPEN_101_TILES, 'R3', 'K2'] },
      currentSeat: 1,
      opening: { 0: 'SERIES' },
      table: [tableRun()],
    });
    const result = act(state, 1, {
      type: 'PLAY_STEPS',
      steps: [
        { type: 'OPEN', mode: 'SERIES', melds: OPEN_101 },
        { type: 'EXTEND', meldId: meldIdOf(state), tiles: ids('R3'), assignments: [] },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.seats[1].opening).toBe('SERIES');
  });

  it('T111: planın ikinci adımı yanlışsa tüm plan geri alınır', () => {
    const state = buildState({ hands: { 1: ['R3', 'R9'] }, currentSeat: 1, opening: { 0: 'SERIES', 1: 'SERIES' }, table: [tableRun()] });
    const meldId = meldIdOf(state);
    const result = act(state, 1, {
      type: 'PLAY_STEPS',
      steps: [
        { type: 'EXTEND', meldId, tiles: ids('R3'), assignments: [] },
        { type: 'EXTEND', meldId, tiles: ids('R9'), assignments: [] },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
    expect(handIds(result.state, 1)).toEqual(ids('R3', 'R9'));
    expect(result.state.table[0].tiles).toHaveLength(3);
  });

  it('T112: önceden commit edilmiş çekiş, başarısız planda geri alınmaz', () => {
    const state = buildState({ hands: { 1: ['R9'] }, currentSeat: 1, phase: 'AWAIT_DRAW', opening: { 1: 'SERIES' }, stock: ['K5'] });
    const drawn = act(state, 1, { type: 'DRAW_STOCK' });
    expect(drawn.ok).toBe(true);
    if (!drawn.ok) return;

    const failed = act(drawn.state, 1, { type: 'PLAY_STEPS', steps: [{ type: 'EXTEND', meldId: 'yok', tiles: ids('R9'), assignments: [] }] });
    expect(failed.ok).toBe(false);
    expect(failed.state).toBe(drawn.state);
    expect(handIds(failed.state, 1)).toContain(id('K5'));
  });
});

describe('yerden okey alma — R08', () => {
  // Gösterge Y12 -> gerçek okey Y13. Masada J(R5) temsil eden bir seri kurulur.
  const jokerTable = (state = buildState({ hands: {} })) => state;
  void jokerTable;

  const withJokerMeld = (hand: string[], opening: 'UNOPENED' | 'SERIES' = 'SERIES') => {
    const state = buildState({ hands: { 1: hand }, currentSeat: 1, opening: { 0: 'SERIES', 1: opening }, table: [] });
    // Masaya elle R4 J(R5) R6 kurulur; J fiziksel olarak Y13'tur.
    const joker = state.stock.find((t) => t.id === id('Y13'))!;
    const r4 = state.stock.find((t) => t.id === id('R4'))!;
    const r6 = state.stock.find((t) => t.id === id('R6'))!;
    const stock = state.stock.filter((t) => ![joker.id, r4.id, r6.id].includes(t.id));
    return {
      ...state,
      stock,
      table: [
        {
          id: 'm1',
          kind: 'RUN' as const,
          ownerSeat: 0 as Seat,
          tiles: [
            { tile: r4, represents: { color: 'RED' as const, value: 4 }, wild: false },
            { tile: joker, represents: { color: 'RED' as const, value: 5 }, wild: true },
            { tile: r6, represents: { color: 'RED' as const, value: 6 }, wild: false },
          ],
        },
      ],
      nextMeldSeq: 2,
    };
  };

  it('T105: doğru yüzle değiştirilince joker ele gelir, per yüzleri korunur', () => {
    const state = withJokerMeld(['R5']);
    const result = act(state, 1, { type: 'PLAY_STEPS', steps: [{ type: 'REPLACE_JOKER', meldId: 'm1', jokerId: id('Y13'), replacementId: id('R5') }] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(handIds(result.state, 1)).toEqual([id('Y13')]);
    expect(result.state.table[0].tiles.map((t) => t.represents.value)).toEqual([4, 5, 6]);
    expect(result.state.table[0].tiles.every((t) => !t.wild)).toBe(true);
  });

  it('T106: açmamış oyuncu yerden joker alamaz', () => {
    const state = withJokerMeld(['R5'], 'UNOPENED');
    const result = act(state, 1, { type: 'PLAY_STEPS', steps: [{ type: 'REPLACE_JOKER', meldId: 'm1', jokerId: id('Y13'), replacementId: id('R5') }] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NOT_OPENED');
  });

  it('T107: yanlış yüzle değiştirme reddedilir', () => {
    const state = withJokerMeld(['B5']);
    const result = act(state, 1, { type: 'PLAY_STEPS', steps: [{ type: 'REPLACE_JOKER', meldId: 'm1', jokerId: id('Y13'), replacementId: id('B5') }] });
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
  });

  it('T110: alınan joker aynı tur tekrar oynanmak zorunda değil', () => {
    const state = withJokerMeld(['R5', 'K2']);
    const swapped = act(state, 1, { type: 'PLAY_STEPS', steps: [{ type: 'REPLACE_JOKER', meldId: 'm1', jokerId: id('Y13'), replacementId: id('R5') }] });
    expect(swapped.ok).toBe(true);
    if (!swapped.ok) return;
    const discarded = act(swapped.state, 1, { type: 'COMMIT_TURN', steps: [], discardTileId: id('K2') });
    expect(discarded.ok).toBe(true);
    if (discarded.ok) expect(handIds(discarded.state, 1)).toEqual([id('Y13')]);
  });
});

describe('tur sonrası durum', () => {
  it('T145: el bittikten sonra gelen komutlar ROUND_ENDED döner', () => {
    const state = buildState({ hands: { 0: ['R1'], 1: ['K2'] } });
    const finished = act(state, 0, { type: 'COMMIT_TURN', steps: [], discardTileId: id('R1') });
    expect(finished.ok).toBe(true);
    if (!finished.ok) return;
    expect(finished.state.status).toBe('ROUND_ENDED');

    const after = act(finished.state, 1, { type: 'DRAW_STOCK' });
    expect(after.ok).toBe(false);
    if (!after.ok) expect(after.error).toBe('ROUND_ENDED');
  });
});
