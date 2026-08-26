// Data files (vibely-data.ts and friends) store item names in Turkish only.
// Rather than restructuring those large data files, we keep a parallel
// English lookup here, keyed by the original Turkish name, and localize
// at render time via `localizeName()`.
export const EN_NAMES: Record<string, string> = {
  // RANK_GAMES (Blind Rank categories)
  'Yemek Sıralama': 'Food Ranking',
  'Dizi Sıralama': 'TV Show Ranking',
  'Ülke Sıralama': 'Country Ranking',
  'Tüm Zamanların En İyileri': 'All Time Best Football Players Ranking',
  '2026 En İyi Oyuncular': '2026 Best Football Players',
  'Türk Yemekleri': 'Turkish Food',
  'Takım Sıralama': 'Team Ranking',
  'İçecek Sıralama': 'Drink Ranking',
  'Şehir Sıralama': 'City Ranking',

  // GAMES (menu-level)
  'Bil Bakalım': 'Guess What',
  'Çizim Tahmin': 'Draw & Guess',
  'Doğruluk mu?': 'Truth or Dare?',

  // RANK_POOL_MAP titles (used in share/system messages)
  'Yemek Sıralaması': 'Food Ranking',
  'Dizi Sıralaması': 'TV Show Ranking',
  'Ülke Sıralaması': 'Country Ranking',
  'Tüm Zamanların En İyileri Sıralaması': 'All Time Best Football Players Ranking',
  '2026 En İyi Oyuncular Sıralaması': '2026 Best Football Players Ranking',
  'Türk Yemekleri Sıralaması': 'Turkish Food Ranking',
  'Takım Sıralaması': 'Team Ranking',
  'İçecek Sıralaması': 'Drink Ranking',
  'Şehir Sıralaması': 'City Ranking',
};

export function localizeName(name: string, language: 'en' | 'tr'): string {
  if (language === 'tr') return name;
  return EN_NAMES[name] ?? name;
}
