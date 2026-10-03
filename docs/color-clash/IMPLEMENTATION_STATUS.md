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
| 3 Motor | BAŞLADI |
| 4 Clash 4 | — |
| 5 Clash çağrısı | — |
| 6 El/maç | — |
| 7 Server | ENGELLİ (backend yok) |
| 8 Kalıcılık | ENGELLİ (backend yok) |
| 9 Mobil masa | — |
| 10 Video | ENGELLİ (LiveKit yok) |
| 11 Dört hesap kabulü | ENGELLİ |

## Tamamlanan test ID'leri

**Faz 2 — `src/engine/colorClash/__tests__/deck.test.ts` (13 test geçti):**
C001, C002, C003, C004, C005, C006, C007, C008, C009, C010, C011.

Komutlar: `npx tsc --noEmit` (temiz), `npx vitest run src/engine/colorClash`
(13/13 geçti).

### Faz 2'de verilen uygulama kararı

GAME_RULES "ilk Clash 4 tekrar desteye **karıştırılır**" diyor, ama motor kendi
rastgeleliğini üretemez. Karıştırma `RandomSource.shuffle` olarak dışarıdan
enjekte ediliyor; sunucu gerçek karıştırmayı sağlar, testler tohumlanabilir bir
üreteç verir. Kural değişmedi, yalnızca rastgelelik kaynağı dışarı alındı.
