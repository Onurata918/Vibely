export type TabuCard = {
  word: string;
  taboo: readonly string[];
};

// Tabu — anlatıcı "word"ü anlatır ama "taboo" listesindeki kelimeleri kullanamaz.
export const TABU_CARDS: readonly TabuCard[] = [
  { word: 'Kahve', taboo: ['Sıcak', 'İçecek', 'Fincan', 'Sabah', 'Çay'] },
  { word: 'Deniz', taboo: ['Su', 'Mavi', 'Kum', 'Balık', 'Tatil'] },
  { word: 'Okul', taboo: ['Öğrenci', 'Ders', 'Sınıf', 'Öğretmen', 'Sınav'] },
  { word: 'Telefon', taboo: ['Arama', 'Ekran', 'Uygulama', 'Mesaj', 'Şarj'] },
  { word: 'Sinema', taboo: ['Film', 'Bilet', 'Koltuk', 'Perde', 'Patlamış Mısır'] },
  { word: 'Kedi', taboo: ['Miyav', 'Evcil', 'Tüy', 'Pati', 'Köpek'] },
  { word: 'Kar', taboo: ['Beyaz', 'Soğuk', 'Kış', 'Kartop', 'Buz'] },
  { word: 'Doğum Günü', taboo: ['Pasta', 'Mum', 'Hediye', 'Kutlama', 'Parti'] },
  { word: 'Futbol', taboo: ['Top', 'Gol', 'Saha', 'Kale', 'Maç'] },
  { word: 'Uçak', taboo: ['Havalimanı', 'Pilot', 'Uçmak', 'Bilet', 'Gökyüzü'] },
  { word: 'Market', taboo: ['Alışveriş', 'Kasa', 'Ürün', 'Sepet', 'Fiyat'] },
  { word: 'Uyku', taboo: ['Yatak', 'Rüya', 'Yorgan', 'Gece', 'Uyumak'] },
  { word: 'Doktor', taboo: ['Hastane', 'Muayene', 'İlaç', 'Beyaz Önlük', 'Reçete'] },
  { word: 'Gitar', taboo: ['Tel', 'Müzik', 'Çalmak', 'Nota', 'Enstrüman'] },
  { word: 'Yağmur', taboo: ['Şemsiye', 'Islak', 'Bulut', 'Gökkuşağı', 'Damla'] },
  { word: 'Kitap', taboo: ['Sayfa', 'Okumak', 'Yazar', 'Kütüphane', 'Roman'] },
  { word: 'Tatil', taboo: ['Deniz', 'Uçak', 'Valiz', 'Otel', 'Dinlenmek'] },
  { word: 'Bisiklet', taboo: ['Tekerlek', 'Pedal', 'Zincir', 'Sürmek', 'İki Tekerlekli'] },
  { word: 'Kahvaltı', taboo: ['Sabah', 'Ekmek', 'Peynir', 'Çay', 'Yumurta'] },
  { word: 'Düğün', taboo: ['Gelin', 'Damat', 'Nikah', 'Alyans', 'Kutlama'] },
];
