# Color Clash test kabul listesi

Her ID otomatik teste çevrilir; M ile başlayanlar cihazda manuel kabul kontrolüdür.

## Deste ve başlangıç

- C001: Deste 108 benzersiz cardId içerir.
- C002: Her renkte bir 0, 1–9'dan ikişer bulunur.
- C003: Her renkte Block/Flip/Draw 2'den ikişer bulunur.
- C004: Dört Color Shift ve dört Clash 4 bulunur.
- C005: Dört oyuncuya yedişer kart; kalan 80 kart çekme destesindedir ve bir başlangıç atığı açılır.
- C006: Dağıtım boyunca her kart tam bir bölgede bulunur.
- C007: İlk Clash 4 desteye döner ve yeni kart açılır.
- C008: İlk Block ilk oyuncuyu atlar.
- C009: İlk Draw 2 ilk oyuncuya iki çektirip atlar.
- C010: İlk Flip yönü ters çevirir.
- C011: İlk Color Shift başlangıç oyuncusundan renk seçimi bekler.

## Eşleşme ve çekme

- C012: Crimson 7 üstüne Crimson 2 oynanır.
- C013: Crimson 7 üstüne Azure 7 oynanır.
- C014: Crimson Block üstüne Azure Block oynanır.
- C015: Crimson 7 üstüne Azure 6 reddedilir.
- C016: Color Shift her normal fazda oynanır ve renk zorunludur.
- C017: Sırası olmayan oyuncunun hamlesi reddedilir.
- C018: Elde olmayan cardId reddedilir ve state değişmez.
- C019: Oynanabilir kart varken isteğe bağlı bir kart çekilebilir.
- C020: Çekilen oynanabilir kart aynı tur oynanabilir.
- C021: Çekimden sonra elde önceden bulunan başka kart oynanamaz.
- C022: Çekilen kart oynanmazsa PASS turu ilerletir.
- C023: Bir komutta iki kart oynama reddedilir.
- C024: Draw 2 üstüne Draw 2 yığma reddedilir.
- C025: Çekme destesi boşsa üst atık hariç atıklar karıştırılır.
- C026: Yeniden karıştıracak kart yoksa PASS ile deadlock oluşmaz.

## Özel kartlar

- C027: Block sıradaki seat'i atlar.
- C028: Flip dört oyuncuda yönü değiştirir ve yeni yöndeki seat'e gider.
- C029: Flip iki oyuncuda oynayana tekrar sıra verir.
- C030: Draw 2 sıradaki oyuncuya tam iki kart verir ve atlar.
- C031: Draw 2 cezası sırasında normal kart oynanamaz.
- C032: Color Shift mevcut rengi yeniden seçebilir.
- C033: Seçilen aktif renk, sonraki eşleşmede kartın basılı wild renginden önce gelir.

## Clash 4

- C034: Önceki aktif renkle eşleşen kart yoksa Clash 4 yasaldır.
- C035: Aktif renk kartı varsa Clash 4 oynama kabul edilir fakat challenge kanıtı illegal kaydedilir.
- C036: Yalnız aynı sayı farklı renk varsa Clash 4 yasaldır.
- C037: Yalnız aynı sembol farklı renk varsa Clash 4 yasaldır.
- C038: Clash 4 renk seçmeden tamamlanmaz.
- C039: Yalnız cezayı alacak oyuncu challenge edebilir.
- C040: Doğru challenge: oynayan 4 çeker, challenger normal turuna geçer.
- C041: Yanlış challenge: challenger 6 çeker ve atlanır.
- C042: Accept: challenger 4 çeker ve atlanır.
- C043: Challenge sonucunda oynayanın eli public/private rakip state'ine sızmaz.
- C044: Challenge penceresinden sonra challenge reddedilir.
- C045: Aynı challenge retry ikinci kez kart çektirmez.
- C046: Son kart Clash 4 ise round challenge çözülmeden puanlanmaz.
- C047: Son kart legal Clash 4 ve accept sonrası rakibin çektiği 4 kart puana girer.

## Clash çağrısı

- C048: İki karttan bire `calledClash=true` cezasızdır.
- C049: İki karttan bire çağrısız düşüş catch penceresi açar.
- C050: Zamanında ilk catch hedefe 2 kart verir.
- C051: İkinci eşzamanlı catch ek ceza vermez.
- C052: Sonraki oyuncunun aksiyonu commit sonrası catch reddedilir.
- C053: Yanlış hedef veya çağrı yapılmış hedef catch'i state değiştirmez.
- C054: Kart çekerek elde bir karta düşmek çağrı gerektirmez.
- C055: Son kart oynanırken çağrı gerekmez.

## Skor ve tur

- C056: Sayı kartları yüz değeri kadar puandır.
- C057: Block/Flip/Draw 2 kartları 20 puandır.
- C058: Color Shift/Clash 4 kartları 50 puandır.
- C059: Rakip elleri 7 + Block + Color Shift ise kazanan 77 alır.
- C060: 499 puanlı oyuncu 1 puan alınca maçı kazanır.
- C061: El kazananı yokken skor yazılmaz.
- C062: Yeni elde dealer bir seat ilerler.
- C063: Timeout bir kart çeker ve oynamadan geçirir.
- C064: Timeout retry ikinci kartı çektirmez.

## Sunucu, gizlilik ve bağlantı

- C065: Aynı requestId/aynı payload aynı cevabı ve tek mutation döndürür.
- C066: Aynı requestId/farklı payload REQUEST_ID_REUSE döndürür.
- C067: Yeni komut eski expectedVersion ile reddedilir.
- C068: Eşzamanlı iki PLAY_CARD'dan yalnız biri commit olur.
- C069: JWT içindeki userId, payload'daki sahte actorId'den üstündür.
- C070: Oda dışı kullanıcı komut gönderemez.
- C071: Public snapshot yalnız rakip kart sayısını gösterir.
- C072: Private snapshot yalnız alıcının elini gösterir.
- C073: Deck sırası, challenge kanıtı ve rakip cardId log/telemetry'de yoktur.
- C074: Transaction başarısızsa ACK veya broadcast çıkmaz.
- C075: ACK kaybı sonrası retry ikinci hamle oluşturmaz.
- C076: Server restart event replay ile aynı state/version/deck'i getirir.
- C077: Reconnect aynı seat ve eli geri getirir; deadline sıfırlanmaz.
- C078: Yeni sessionEpoch eski cihaz komutunu reddeder.
- C079: Game socket kesilince LiveKit medya görüşmesi devam eder.
- C080: LiveKit kesilince oyun sırası ve deadline devam eder.
- C081: 90 saniye aşan disconnect eli abort eder ve skor yazmaz.
- C082: Host devri seat, el veya kuralları değiştirmez.

## Manuel kabul

- M001: Dört gerçek hesapta tam el oynanır; her kullanıcı yalnız kendi kartlarını görür.
- M002: Oyun paneli açılıp kapanırken dört kamera/mikrofon bağlantısı yeniden kurulmaz.
- M003: Küçük telefonda 7+ kart scroll ile erişilir; çekme/atma/renk seçme görünür.
- M004: Renk körlüğünde renkler şekil ve erişilebilirlik etiketiyle ayırt edilir.
- M005: Clash!, challenge ve Draw 4 sonucu dört cihazda aynı sırayla görünür.
- M006: Bağlantı kesilip dönünce el, aktif renk, sıra ve sayaç doğru yüklenir.
