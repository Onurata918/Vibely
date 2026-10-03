# Vibely video odasında 101

Bu bir tasarım önerisidir; repo mevcut yapısı önceliklidir. React Native mobil istemci, ayrı TypeScript motor paketi, uzun ömürlü WebSocket oyun servisi önerilir. SDK/import/sürüm seçimleri kurulumda resmî dokümanla doğrulanır.

## Sorumluluklar

| Bileşen | Sorumluluk |
|---|---|
| LiveKit mevcut bağlantısı | Kamera, mikrofon, medya; oyun açılırken remount edilmez |
| Mobil masa | Kendi elinin istaka düzeni, taslak plan, drag/tap, animasyon, public snapshot |
| Saf motor | Verilen state + komut + zaman/rastgele girişlerinden yeni state; React/DB/socket import yok |
| Game server | JWT doğrulama, oda üyeliği, seat yetkisi, sıra, seri işlem, deadline, gizli görünüm |
| Kalıcılık | Gizli snapshot, işlem kaydı, config sürümü, tamamlanan el/maç sonuçları |
| Supabase mevcutsa | Kullanıcı/oda/veri erişimi; servis rolü sunucuda; istemci gizli oyun tablolarını okuyamaz |

Oyun otoritesini LiveKit data messages veya istemci Supabase row update'i yapmaz. LiveKit presence ile oyun üyeliği farklı tutulur. Kullanıcı sesi açık tutarken masada hamle yapar; video düşerse oyun devam eder, oyun socket'i düşerse video devam eder.

## Oda ve koltuk

Vibely odası daha fazla kişiyi desteklese bile bu oyun 4 seat gerektirir. İlk sürüm tam dört oyuncu, spectators=false. Host seat seçimini başlatır; dört üye sunucuda doğrulanır, herkes ready olur, config kilitlenir. Host oyunun motor otoritesi değildir. userId -> seat mapping maç boyunca değişmez. Kişi videoda görünüyor diye seat verilmez.

Video provider oda ekranının üstünde yaşamaya devam eder. Okey masası oda içine açılan alt panel/fullscreen modal olabilir; oyun ekranına geçiş kamera bağlantısını yeniden başlatmaz. Dört kamera küçük kutularda, masa ve eldeki taşlar altta. Telefon ekranında 21/22 taş iki sıra/scroll ile erişilebilir; rakiplerde yalnızca taş sayısı. Dokunma hedefi en az 44pt; drag'e ek seç-taşı/yer-seç desteği. Mikrofon/kamera, masayı büyüt/küçült, bağlantı uyarısı ve oyun çıkışı görünür.

## Otorite, gizlilik ve atomiklik

Her oda için tek actor/serialized command queue. Yatay büyümede tek process ownership lease + fencing token gerekir; iki sunucu aynı odayı commit edemez. Deadline işleri room ownership ile çalışır, süreç başında tekrar yüklenir.

Client komutu `{gameId, requestId, expectedVersion, action}`. userId JWT'den çıkar; payload actorId'ye güvenilmez. Önce auth + üyelik, sonra dedupe, sonra version, sonra motor doğrulaması. Aynı kullanıcı ve gameId altında requestId, canonical payload hash ve cevap saklanır. Aynı ID/aynı payload eski sonucu döndürür; aynı ID/farklı payload REQUEST_ID_REUSE. Retry sırasında expectedVersion eski olsa da dedupe önce çalışır. Başkasının aynı requestId'si sonucu açığa çıkarmaz.

Persistent transaction içinde state version compare-and-swap, gizli event/snapshot, idempotency cevabı ve outbox yazılır; yalnız commit sonrası publish edilir. Transaction başarısızsa ACK_SUCCESS yok. ACK kaybolup commit olduysa retry kayıtlı sonucu döndürür. Event log ile snapshot replay aynı state'i üretmeli. Rastgele deck üretimi bir kez olur; retry/restart'ta tekrar karıştırma yok.

Sunucu tam state'i broadcast etmez. Public: perler/assignment, gösterge, atılanlar, sıra, openingStatus, taş sayıları, stok sayısı, deadline, skor dökümü, version. Private: yalnız ilgili seat'in kendi tileId'leri, son çektiği taş ve kişisel hata sonucu. Diğer eller, stok sırası, seed, servis rolü, gizli event payload'u socket/debug/error/telemetry'de görünmez. Spectator view de private veri alamaz.

Sunucu tileId sahipliği, çift kullanım, aşama, masa geçerliliği, config hash, final discard şartı ve tüm conservation invariants'ı kontrol eder. Client'ın "101 açtım", "kazandım", "skorum" alanları hiçbir otorite taşımaz.

## Bağlantı ve zaman

WebSocket join token kısa ömürlü; refresh mevcut seat'i korur. Resync komutu son version ile gelir; güvenli full public+ownPrivate snapshot gönderilir. Eksik/out-of-order delta gelirse snapshot alınır. Aynı seat iki cihazdan açılırsa yeni doğrulanmış session eski kontrol socket'ini kapatır; eski sessionEpoch komutları reddedilir. Video session'ını bunun için otomatik sonlandırma.

Turn deadline UTC sunucu zamanı; client kalan süre görselidir. Sunucu tekrar başladığında deadline korunur. Timeout ile kullanıcı hamlesi actor kuyruğunda seri yürür, ikinci sonuç stale/phase changed olur. Socket disconnect 90s rezerve, normal tur süreleri devam. Kesin disconnect ABORTED_DISCONNECT ve skor yazmama R13'te. Geçerli önceki ellerin toplamı saklanır.

## Veri tabloları önerisi

`game_matches(id, room_id, rules_profile, rules_hash, status, created_at)`
`game_seats(match_id, seat, user_id, session_epoch, ready)`
`game_rounds(id, match_id, round_no, state_version, encrypted_or_access_restricted_snapshot, deadline, status)`
`game_commands(round_id, actor_user_id, request_id, payload_hash, result, committed_version)` UNIQUE(round_id, actor_user_id, request_id)
`game_events(round_id, sequence, private_payload)` UNIQUE(round_id, sequence)
`game_outbox(round_id, sequence, recipient_projection, delivered_at)`
`game_scores(round_id, user_id, score_breakdown)` UNIQUE(round_id, user_id)

İstemci için raw snapshot/event/command tablolarına SELECT yok. Public score erişimi yalnız üyelik üzerinden. RLS testleri anonim, üye ve oda dışı kullanıcıyı kapsar. Oturum/kredential loglama yok. Kaydı tutma süreleri mevcut ürün politikasıyla belirlenir.

## Uygulama ölçütleri

Dört ayrı kullanıcıyla tam el oynanır; kendi eli yalnız kendisine görünür. Video kesmeden oyun açılıp kapanır. Tek kullanıcı retry ile iki taş çekemez. Kesinti ve server restart aynı eli geri getirir. Bir ekran sadece yerel mock oynuyorsa multiplayer tamamlanmış sayılmaz. Kamera izni reddedilen kişi sesli/avatars ile oyun oynayabilir; mikrofon izni de zorunlu oyun şartı değildir.
