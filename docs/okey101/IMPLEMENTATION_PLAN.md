# Aşamalar ve çıkış koşulları

1. Repo keşfi: paket yöneticisi, React Native/Expo sürümü, oda/auth/video lifecycle ve mevcut backend belgelenir. Mevcut talimatlar okunur. IMPLEMENTATION_STATUS.md oluşturulur.
2. Saf model: 106 kimlik, efektif yüz, gerçek/sahte okey, deterministik dağıtım. Deck/ownership invariants test edilir.
3. Validator: RUN/SET/PAIR, explicit joker assignment, per toplamı, açılış/mod/katlamalı. Fixtures ve ilgili senaryolar geçer.
4. Tur motoru: draw, atomic soldan alım, adım planı, işleme, yerden joker, discard, bitiş. Red işlemlerinin rollback'i doğrulanır.
5. Puan: skor bileşenleri, joker/çift/elden/stok sonu, hamle cezaları. Bağımsız beklenen sayılarla test edilir.
6. Server: auth/seat/version/idempotency, tek oda kuyruğu, public/private projection. Sahte client hile testleri geçer.
7. Kalıcılık: transaction/outbox, event replay, crash/restart/deadline, timeout/reconnect. İki process sahipliği test edilir veya tek process sınırı açıkça konur.
8. Mobil masa: 4 seat, 21/22 taş, joker görünümü, drag/tap, sıralama, açma/çift/işleme/atma, açıklanabilir skor, yeniden senkronizasyon.
9. Video: mevcut LiveKit bağlantısını koruyarak dört kamera/mikrofon ile masa entegrasyonu; izinler ve kesinti senaryoları.
10. Tam kabul: dört hesap/cihaz veya emülatör, tam el+maç, offline/reconnect, gizli eller. Otomatik test raporu ve manuel gerçek sonuç.
11. Plus karşılaştırma: Q01-Q18 için sürüm/masa kanıtı, farklı config profili ve regresyon testleri. Birebir uyum bayrağı yalnız doğrulanan kapsama göre açılır.

Her aşamada gerekli testler geçmeden bağımlı aşamanın tamamlandığını raporlama.
İlk teslimde eşli/çip/rizikolu mod yapma. Motor için çekirdek, okey101 paket klasörü;
sunucu için game-server; mobil için mevcut oda içine GamePanel önerilir. Repo uygunsa
monorepo kullanılabilir, sırf bu belge için mevcut projeyi monorepo'ya taşıma.
