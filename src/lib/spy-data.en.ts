import type { SpyLocation } from './spy-data';

// Spy game — English location pool (mirrors spy-data.ts 1:1 by order).
export const SPY_LOCATIONS_EN: readonly SpyLocation[] = [
  { id: 'hastane', name: 'Hospital', emoji: '🏥' },
  { id: 'okul', name: 'School', emoji: '🏫' },
  { id: 'ucak', name: 'Airplane', emoji: '✈️' },
  { id: 'plaj', name: 'Beach', emoji: '🏖️' },
  { id: 'sinema', name: 'Cinema', emoji: '🎬' },
  { id: 'restoran', name: 'Restaurant', emoji: '🍽️' },
  { id: 'banka', name: 'Bank', emoji: '🏦' },
  { id: 'market', name: 'Grocery Store', emoji: '🛒' },
  { id: 'otel', name: 'Hotel', emoji: '🏨' },
  { id: 'kutuphane', name: 'Library', emoji: '📚' },
  { id: 'stadyum', name: 'Stadium', emoji: '🏟️' },
  { id: 'muze', name: 'Museum', emoji: '🖼️' },
  { id: 'dugun', name: 'Wedding', emoji: '💍' },
  { id: 'gemi', name: 'Ship', emoji: '🚢' },
  { id: 'tren', name: 'Train', emoji: '🚆' },
  { id: 'berber', name: 'Barbershop', emoji: '💈' },
  { id: 'spor-salonu', name: 'Gym', emoji: '🏋️' },
  { id: 'kamp', name: 'Campsite', emoji: '🏕️' },
  { id: 'polis-merkezi', name: 'Police Station', emoji: '🚔' },
  { id: 'konser', name: 'Concert', emoji: '🎤' },
] as const;
