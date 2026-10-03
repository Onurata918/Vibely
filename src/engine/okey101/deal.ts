import { assertValidDeck } from './deck';
import {
  HAND_SIZE,
  InvariantError,
  SEAT_COUNT,
  STARTER_HAND_SIZE,
  STOCK_SIZE,
  TOTAL_TILES,
  type Seat,
  type Tile,
  type TileId,
} from './types';

export type DealResult = {
  /** seat -> el. Baslayan 22, digerleri 21. */
  hands: Tile[][];
  indicator: Tile;
  stock: Tile[];
  starterSeat: Seat;
};

export function nextStarterSeat(previous: Seat): Seat {
  return (((previous + 1) % SEAT_COUNT) as Seat);
}

/**
 * R03: deterministik dagitim. Karistirma motorun disinda yapilir; burada
 * yalnizca verilen deste sirasi kullanilir, ayni deste daima ayni sonucu verir.
 *
 * Sira: once eller bastan dagitilir (baslayan 22, digerleri 21 = 85 tas),
 * kalan 21 tastan ilk sahte-okey-olmayan tas gosterge olur (T004), geri kalan
 * 20 tas stok olur.
 */
export function deal(deck: readonly Tile[], starterSeat: Seat): DealResult {
  assertValidDeck(deck);

  const hands: Tile[][] = [];
  let cursor = 0;
  for (let seat = 0; seat < SEAT_COUNT; seat++) {
    const size = seat === starterSeat ? STARTER_HAND_SIZE : HAND_SIZE;
    hands.push(deck.slice(cursor, cursor + size));
    cursor += size;
  }

  const rest = deck.slice(cursor);
  const indicatorIndex = rest.findIndex((t) => t.kind !== 'FALSE_JOKER');
  if (indicatorIndex === -1) {
    // Destede yalnizca iki sahte okey var, kalan 21 tasin hepsi sahte okey olamaz.
    throw new InvariantError('no eligible indicator tile left after dealing');
  }
  const indicator = rest[indicatorIndex];
  const stock = rest.filter((_, i) => i !== indicatorIndex);

  if (stock.length !== STOCK_SIZE) {
    throw new InvariantError(`stock must hold ${STOCK_SIZE} tiles, got ${stock.length}`);
  }
  assertConservation({ hands, indicator, stock, starterSeat });
  return { hands, indicator, stock, starterSeat };
}

/**
 * R01: her fiziksel tas tam bir bolgede bulunur ve bolgelerin birlesimi 106'dir.
 * Dagitimdan sonra ve her commit sonrasinda cagrilir.
 */
export function assertConservation(result: DealResult): void {
  const seen = new Set<TileId>();
  const add = (tile: Tile, where: string) => {
    if (seen.has(tile.id)) throw new InvariantError(`tile ${tile.id} appears twice (${where})`);
    seen.add(tile.id);
  };
  result.hands.forEach((hand, seat) => hand.forEach((t) => add(t, `hand ${seat}`)));
  add(result.indicator, 'indicator');
  result.stock.forEach((t) => add(t, 'stock'));
  if (seen.size !== TOTAL_TILES) {
    throw new InvariantError(`conservation broken: ${seen.size} tiles across regions, expected ${TOTAL_TILES}`);
  }
}
