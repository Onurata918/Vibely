# Vibely entegrasyonu

LiveKit kamera/mikrofon bağlantısı oda ekranında yaşamaya devam eder. Color Clash paneli açıldığında video provider yeniden oluşturulmaz. Dört kamera küçük kutularda, ortada atık/çekme destesi, altta oyuncunun eli bulunur. Rakiplerde yalnız kart sayısı görünür.

Saf TypeScript motoru React Native, Expo, LiveKit, Supabase, socket, veritabanı, sistem saati ve üretim rastgeleliğini import etmez. `state + action + injected time/deck -> result` olarak çalışır.

Oyun servisi JWT ile kullanıcıyı ve oda üyeliğini doğrular. Her oda tek sıralı komut kuyruğunda işlenir. State, idempotency cevabı ve outbox aynı transaction içinde kaydedilir. ACK kaybolup komut retry edilirse eski sonuç döner. Public projection açık alan listesidir; tam state spread edilmez. Rakip elleri, çekme destesi sırası ve Clash 4 kanıt eli hiçbir client loguna veya telemetry'ye yazılmaz.

Public yayın: sıra, yön, aktif renk, üst kart, kart sayıları, skor, deadline ve efekt sonucu. Private yayın: sadece ilgili oyuncunun eli ve o tur çektiği kart. Clash 4 itirazında sunucu boolean yasal/yasadışı sonucunu açıklar; eli açıklamaz.

Reconnect son version ile yapılır. Client delta kaçırırsa public + ownPrivate snapshot alır. Aynı seat yeni cihazdan bağlanırsa sessionEpoch artar ve eski kontrol socket'i kapanır. Game socket düşmesi görüntülü görüşmeyi; LiveKit düşmesi oyun state'ini durdurmaz.

Mobil erişilebilirlik: kartlar yatay fan/scroll, dokun-seç + oynat butonu ve drag desteği; renk yalnız renk tonu ile anlatılmaz, şekil/etiket de bulunur. `Clash!`, itiraz ve renk seçimi ekran okuyucuyla çalışır.
