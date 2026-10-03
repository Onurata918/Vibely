# Uygulama aşamaları

1. Repo keşfi: mevcut app/backend/video/auth yapısını ve komutları `IMPLEMENTATION_STATUS.md` içine yaz.
2. Model: 108 benzersiz kart, deste doğrulama, dağıtım, başlangıç kartı etkileri ve deterministik shuffle girişi.
3. Motor: eşleşme, çekme, yalnız çekilen kartı oynama, Block/Flip/Draw 2/Color Shift.
4. Clash 4: yasal oynama kanıtı, accept/challenge, gizlilik ve round-end bekleme.
5. Clash çağrısı: atomik çağrı, yakalama penceresi, yarış/idempotency.
6. El/maç: puanlar, 500 hedefi, yeni el dealer dönüşü, reshuffle.
7. Server: JWT, üyelik, seat, version, dedupe, tek oda kuyruğu ve projection testleri.
8. Kalıcılık: transaction/outbox, restart/replay, deadline ve reconnect.
9. Mobil masa: özgün Color Clash kartları, fan/scroll el, renk seçici, itiraz/çağrı ve erişilebilirlik.
10. Video entegrasyonu: mevcut LiveKit bağlantısını koruyarak oyun paneli.
11. Dört gerçek hesap/cihaz testi: tam el, tam maç, challenge, çağrı cezası, disconnect/reconnect ve gizlilik.

Eşli oyun, turnuva, jeton, kart yığma, 7–0 ve jump-in ilk sürümün dışında kalır.
