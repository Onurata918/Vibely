export type QuizQuestion = {
  q: string;
  options: readonly [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
};

// Bil Bakalım — genel kültür soru havuzu.
export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  { q: 'Türkiye\'nin başkenti neresidir?', options: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'], correct: 1 },
  { q: 'Güneş sistemindeki en büyük gezegen hangisidir?', options: ['Dünya', 'Mars', 'Jüpiter', 'Satürn'], correct: 2 },
  { q: 'Mona Lisa tablosunu kim yapmıştır?', options: ['Picasso', 'Van Gogh', 'Leonardo da Vinci', 'Michelangelo'], correct: 2 },
  { q: 'Bir futbol takımında sahada kaç oyuncu bulunur?', options: ['9', '10', '11', '12'], correct: 2 },
  { q: 'Dünyanın en uzun nehri hangisidir?', options: ['Amazon', 'Nil', 'Mississippi', 'Yangtze'], correct: 1 },
  { q: 'İnsan vücudundaki en büyük organ hangisidir?', options: ['Kalp', 'Karaciğer', 'Deri', 'Akciğer'], correct: 2 },
  { q: 'Hangi gezegen "Kızıl Gezegen" olarak bilinir?', options: ['Venüs', 'Mars', 'Jüpiter', 'Merkür'], correct: 1 },
  { q: 'Bir yılda kaç mevsim vardır?', options: ['2', '3', '4', '5'], correct: 2 },
  { q: 'Türkiye\'nin para birimi nedir?', options: ['Euro', 'Dolar', 'Lira', 'Sterlin'], correct: 2 },
  { q: 'İlk insanlı ay yürüyüşü hangi yıl gerçekleşti?', options: ['1959', '1969', '1975', '1981'], correct: 1 },
  { q: 'En hızlı kara hayvanı hangisidir?', options: ['Aslan', 'Çita', 'At', 'Antilop'], correct: 1 },
  { q: 'Standart bir piyano kaç tuşa sahiptir?', options: ['76', '88', '92', '100'], correct: 1 },
  { q: 'Dünyanın en büyük okyanusu hangisidir?', options: ['Atlas', 'Hint', 'Pasifik', 'Arktik'], correct: 2 },
  { q: 'Bal arıları neyi üretir?', options: ['Süt', 'Bal', 'İpek', 'Yün'], correct: 1 },
  { q: 'Bir üçgenin iç açıları toplamı kaç derecedir?', options: ['90°', '180°', '270°', '360°'], correct: 1 },
  { q: 'Türkiye kaç ilden oluşur?', options: ['71', '79', '81', '85'], correct: 2 },
  { q: 'Hangi hayvan "ormanların kralı" olarak bilinir?', options: ['Kaplan', 'Aslan', 'Fil', 'Ayı'], correct: 1 },
  { q: 'İstanbul Boğazı hangi iki denizi birbirine bağlar?', options: ['Ege - Akdeniz', 'Karadeniz - Marmara', 'Marmara - Ege', 'Karadeniz - Akdeniz'], correct: 1 },
  { q: 'Su deniz seviyesinde kaç derecede kaynar?', options: ['90°C', '100°C', '110°C', '120°C'], correct: 1 },
  { q: 'Dünyada anadil olarak en çok konuşulan dil hangisidir?', options: ['İngilizce', 'İspanyolca', 'Mandarin Çincesi', 'Hintçe'], correct: 2 },
  { q: 'Bir örümceğin kaç bacağı vardır?', options: ['6', '8', '10', '12'], correct: 1 },
  { q: 'Leonardo da Vinci hangi ülkede doğmuştur?', options: ['Fransa', 'İspanya', 'İtalya', 'Yunanistan'], correct: 2 },
  { q: 'Everest Dağı hangi iki ülke arasındadır?', options: ['Hindistan - Çin', 'Nepal - Çin', 'Nepal - Hindistan', 'Pakistan - Çin'], correct: 1 },
  { q: 'Bir haftada kaç gün vardır?', options: ['5', '6', '7', '8'], correct: 2 },
];
