# IMPLEMENTATION_STATUS — Color Clash

Profil: `color-clash-classic-v1`
Son güncelleme: 2026-10-03

> Not: Depoda iki ayrı şartname paketi var. Kök dizindeki `IMPLEMENTATION_STATUS.md`
> **101 Okey**'e aittir; bu dosya yalnızca Color Clash'i izler.

## Faz 1 — Repo keşfi (TAMAM)

| Konu | Repoda bulunan |
|---|---|
| Paket yöneticisi | npm (`package-lock.json`) |
| Çatı | Expo SDK ~57.0.14, React Native 0.86.2, expo-router ~57.0.14, TypeScript ~6.0.3 |
| Navigasyon | expo-router, `src/app/`; oda ekranı `src/app/call.tsx` |
| Kimlik | **Mock.** `src/context/AppContext.tsx`; oturum AsyncStorage'da. Gerçek Auth yok. |
| Oda / görüşme | **Mock.** Repoda WebRTC/LiveKit **yok**. Yerel kamera önizlemesi yalnızca `expo-camera`. |
| Backend | Bağlı backend **yok**. Supabase migration'ı yazıldı ama proje açılmadı, istemci kurulu değil. |
| Test | vitest 4, `npm test`. Include: `src/lib/**/*.test.ts` + `src/engine/**/*.test.ts`. |
| Komutlar | `npm test`, `npx vitest run`, `npx tsc --noEmit`, `npx expo start --web` |

### Depoda zaten bir "Color Clash" var

`src/lib/colorClash/` (deck, reducer, validation, scoring, turnMachine, effects) ve
`src/components/call/ColorClashOverlay.tsx` mevcut ve arayüze bağlı. **Bu şartnameyi
karşılamıyor:**

| Şartname | Mevcut mock |
|---|---|
| Renkler CRIMSON / AZURE / LIME / GOLD | `coral` / `violet` / `teal` / `amber` |
| Kart adları Block / Flip / Draw 2 / Color Shift / Clash 4 | `skip` / `reverse` / `drawTwo` / `wild` / `drawFour` |
| Sunucu otoritesi, requestId, expectedVersion | Yok; tek cihazda yerel reducer |
| Clash 4 itiraz kanıtı gizli tutulur | Kanıt kavramı yok |
| Clash! çağrısı ve yakalama penceresi | Basit "son kart" bildirimi |

### Kararlar

1. **Yeni motor `src/engine/colorClash/` altına yazılır.** `src/lib` React Native'e
   bağımlı dosyalar içerdiği için, "motor RN/Expo/LiveKit/Supabase/ağ/saat/rastgelelik
   import etmez" kuralı ancak ayrı bir üst klasörle denetlenebilir şekilde korunur.
   101 Okey motoru da aynı sebeple `src/engine/okey101/` altında.
2. **Mevcut `src/lib/colorClash/` mock'una dokunulmaz.** Faz 9'da arayüz yeni motora
   bağlanana kadar çalışmaya devam eder; o noktada kaldırılır. İki motor aynı anda
   aktif değildir.
3. Kök `CLAUDE.md` korundu; yalnızca `docs/color-clash/CLAUDE.md` okuma talimatı eklendi.
4. Görsel kimlik zaten özgün: kart arkası mor "V" motifi, renk paleti Vibely'ye ait,
   referans oyunun adı/logosu/kart düzeni kullanılmıyor (SOURCES.md şartı).

### Faz 1 engelleri

Faz 7 (sunucu), 8 (kalıcılık), 10 (video) ve 11 (dört gerçek hesap) için altyapı yok:
backend bağlı değil, görüntülü görüşme hiç kurulmadı. Motor, Clash 4, çağrı, el/maç
ve mobil masa bunlardan bağımsız tamamlanabilir.

## Faz durumları

| Faz | Durum |
|---|---|
| 1 Repo keşfi | TAMAM |
| 2 Model | TAMAM |
| 3 Motor | TAMAM |
| 4 Clash 4 | TAMAM |
| 5 Clash çağrısı | TAMAM |
| 6 El/maç | TAMAM |
| 7 Server | ENGELLİ (backend yok) |
| 8 Kalıcılık | ENGELLİ (backend yok) |
| 9 Mobil masa | SIRADA |
| 10 Video | ENGELLİ (LiveKit yok) |
| 11 Dört hesap kabulü | ENGELLİ |

## Tamamlanan test ID'leri

**Faz 2 — `src/engine/colorClash/__tests__/deck.test.ts` (13 test geçti):**
C001, C002, C003, C004, C005, C006, C007, C008, C009, C010, C011.

Komutlar: `npx tsc --noEmit` (temiz), `npx vitest run src/engine/colorClash`
(13/13 geçti).

**Faz 3 — `engine.test.ts` (21 test geçti):**
C012–C033 aralığındaki eşleşme, çekme ve özel kart senaryoları
(C012, C013, C014, C015, C016, C017, C018, C019, C020, C021, C022, C023,
C024, C025, C026, C027, C028, C029, C030, C031, C032, C033).

Komutlar: `npx tsc --noEmit` (temiz), `npx vitest run src/engine/colorClash`
(34/34 geçti).

**Faz 4 — `clashFour.test.ts` (13 test geçti):**
C034, C035, C036, C037, C038, C039, C040, C041, C042, C043, C044, C045,
C046, C047.

Gizlilik: `src/engine/colorClash/projection.ts` public ve private görünümleri
açık alan listesi olarak üretir. C043 testi public JSON'u tarayıp
`hadPreviousColorMatch`, `clashFour` ve rakip cardId'lerinin bulunmadığını
doğruluyor.

Komutlar: `npx tsc --noEmit` (temiz), `npx vitest run src/engine/colorClash`
(47/47 geçti).

**Faz 5 — `clashCall.test.ts` (9 test geçti):**
C048, C049, C050, C051, C052, C053, C054, C055.

**Faz 6 — `score.test.ts` (11 test geçti):**
C056, C057, C058, C059, C060, C061, C062, C063, C064.

Komutlar: `npx tsc --noEmit` (temiz), `npx vitest run src/engine/colorClash`
(67/67 geçti), `npx vitest run` (423/423 geçti).

### Faz 6'da fixture'da düzeltilen hata

`gameWith` her kısa eli aynı havuzun başından dolduruyordu; üç kısa el aynı
kartları alınca deste 126 karta çıktı ve `assertValidDeck` C059'u kırmızıya
düşürdü. Fixture tek paylaşılan "kullanıldı" kümesine çevrildi. Motor ve
beklenen kural sonuçları değişmedi.

### Faz 3'te korunum kontrolünün yakaladığı hata

Test fixture'ı, çekme destesine zorladığı kartı aynı zamanda dolgu ellerine de
dağıtıyordu; `assertConservation` 109 kart sayıp C020'yi kırmızıya düşürdü.
Fixture düzeltildi, motor ve beklenen kural sonucu değişmedi.

### Faz 2'de verilen uygulama kararı

GAME_RULES "ilk Clash 4 tekrar desteye **karıştırılır**" diyor, ama motor kendi
rastgeleliğini üretemez. Karıştırma `RandomSource.shuffle` olarak dışarıdan
enjekte ediliyor; sunucu gerçek karıştırmayı sağlar, testler tohumlanabilir bir
üreteç verir. Kural değişmedi, yalnızca rastgelelik kaynağı dışarı alındı.
