export type SpyLocation = {
  id: string;
  name: string;
  emoji: string;
};

// Casus (Spyfall tarzı) oyunu icin mekan havuzu — casus disindaki herkes
// bu mekani bilir, casus bilmez.
export const SPY_LOCATIONS: readonly SpyLocation[] = [
  { id: 'hastane', name: 'Hastane', emoji: '🏥' },
  { id: 'okul', name: 'Okul', emoji: '🏫' },
  { id: 'ucak', name: 'Uçak', emoji: '✈️' },
  { id: 'plaj', name: 'Plaj', emoji: '🏖️' },
  { id: 'sinema', name: 'Sinema', emoji: '🎬' },
  { id: 'restoran', name: 'Restoran', emoji: '🍽️' },
  { id: 'banka', name: 'Banka', emoji: '🏦' },
  { id: 'market', name: 'Market', emoji: '🛒' },
  { id: 'otel', name: 'Otel', emoji: '🏨' },
  { id: 'kutuphane', name: 'Kütüphane', emoji: '📚' },
  { id: 'stadyum', name: 'Stadyum', emoji: '🏟️' },
  { id: 'muze', name: 'Müze', emoji: '🖼️' },
  { id: 'dugun', name: 'Düğün', emoji: '💍' },
  { id: 'gemi', name: 'Gemi', emoji: '🚢' },
  { id: 'tren', name: 'Tren', emoji: '🚆' },
  { id: 'berber', name: 'Berber', emoji: '💈' },
  { id: 'spor-salonu', name: 'Spor Salonu', emoji: '🏋️' },
  { id: 'kamp', name: 'Kamp Alanı', emoji: '🏕️' },
  { id: 'polis-merkezi', name: 'Polis Merkezi', emoji: '🚔' },
  { id: 'konser', name: 'Konser', emoji: '🎤' },
] as const;
