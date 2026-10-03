# IMPLEMENTATION_STATUS — Vibely 101 Okey

Profil: `vibely-101-development-v1` · `referenceParityVerified: false`
Son güncelleme: 2026-10-03

## Faz 1 — Repo keşfi (TAMAM)

| Konu | Repoda bulunan |
|---|---|
| Paket yöneticisi | npm (`package-lock.json`) |
| Çatı | Expo SDK ~57.0.14, React Native 0.86.2, expo-router ~57.0.14, TypeScript ~6.0.3 |
| Navigasyon | expo-router, `src/app/` dosya tabanlı; `(tabs)` grubu: home, friends, calls, profile |
| Kimlik | **Mock.** `src/context/AppContext.tsx` içinde `login`/`register`/`socialLogin`/`emailCodeLogin`; oturum AsyncStorage'da (`src/lib/storage.ts`). Gerçek Auth yok. |
| Oda / görüşme | **Mock.** `src/app/call.tsx` sahte katılımcı listesi + sayaç. Repoda WebRTC/LiveKit **yok** (grep: 0 eşleşme). Yerel kamera önizlemesi yalnızca `expo-camera`. |
| Backend | Bağlı backend **yok**. `supabase/migrations/0001_profiles_wallet_usage.sql` yazıldı ama proje açılmadı, istemci kurulu değil. |
| Test | vitest 4, `npm test`. Include artık `src/lib/**/*.test.ts` + `src/engine/**/*.test.ts`. |
| Mevcut oyunlar | `src/lib/<oyun>/` saf motor + `src/components/call/<Oyun>Overlay.tsx`. Eski `src/lib/okey101/` **bu şartnameye uymayan yerel mock**'tur (14 taş, tek cihaz). |

### Kararlar

1. **Yeni motor `src/engine/okey101/` altına yazılır.** Ayrı üst klasör, çünkü CLAUDE.md motorda React Native/Expo/LiveKit/Supabase/ağ/duvar saati/rastgelelik importu yasaklıyor; `src/lib` RN'e bağımlı dosyalar içeriyor. Sınır böylece denetlenebilir.
2. **Eski `src/lib/okey101/` mock'una dokunulmaz.** Faz 8'de arayüz yeni motora bağlanana kadar çalışmaya devam eder; o noktada kaldırılır. İki motor aynı anda aktif değildir.
3. **Monorepo'ya geçilmez** (IMPLEMENTATION_PLAN son paragrafı).
4. Mevcut `CLAUDE.md` korundu; yalnızca `docs/okey101/CLAUDE.md` okuma talimatı eklendi (README_TR adım 2).

### Faz 1 engelleri

Faz 6 (sunucu), 7 (kalıcılık) ve 9 (video) için repoda altyapı yok: backend bağlı değil, görüntülü görüşme hiç kurulmadı. Bu fazlar başlamadan önce Supabase projesi ve LiveKit hesabı gerekiyor; motor, validator, tur, skor ve yerel masa bunlardan bağımsız tamamlanabilir.

## Faz durumları

| Faz | Durum |
|---|---|
| 1 Repo keşfi | TAMAM |
| 2 Saf model | TAMAM |
| 3 Validator | TAMAM |
| 4 Tur motoru | BAŞLADI |
| 5 Puan | — |
| 6 Server | ENGELLİ (backend yok) |
| 7 Kalıcılık | ENGELLİ (backend yok) |
| 8 Mobil masa | — |
| 9 Video | ENGELLİ (LiveKit yok) |
| 10 Tam kabul | — |
| 11 Plus karşılaştırma | — |

## Tamamlanan test ID'leri

**Faz 2 — `src/engine/okey101/__tests__/model.test.ts` (12 test geçti):**
T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012.

T013 (üretim shuffle'ı istemciye sızmaz) Faz 6'ya aittir: projeksiyon katmanı
olmadan anlamlı doğrulanamaz, bu yüzden geçti işaretlenmedi.

**Faz 3 — `meld.test.ts`, `opening.test.ts`, `meldFixtures.test.ts` (78 test geçti):**
T014–T051 (per ve joker doğrulama), T052–T072 (açılış, mod kilidi, katlamalı eşik),
`fixtures/melds.json` M001–M015 doğrudan çalıştırılıyor.

T073 (açmış oyuncunun yeni peri için 101 aranmaması) Faz 4'e aittir: `ADD_MELDS`
adımı olmadan doğrulanamaz.

### Faz 2'de testlerin yakaladığı gerçek hata

İlk `numberTileId` uygulaması rengin ilk harfini kullanıyordu; BLUE ve BLACK
aynı `B` kodunu üretince deste 106 yerine 80 benzersiz tileId'ye düşüyordu
(T001 kırmızı). Renk kodları OKEY101_TESTS.md'deki R/B/K/Y tablosuna
sabitlendi. Test zayıflatılmadı.

### Faz 3'te düzeltilen test hatası

T055 fixture'ında üç altılı perin değerini 21 yazmıştım; gerçek değeri 18.
Beklenti değil **fixture** düzeltildi: senaryonun istediği 90 toplamını gerçekten
veren per (R7 B7 K7 = 21) kullanıldı. Kural veya beklenen sonuç değiştirilmedi.

## Çözülmemiş referans kontrolleri

Q01–Q18 açık. `referenceParityVerified` false kalır.
