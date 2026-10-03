# Plus uyumluluk soruları

Geliştirmeyi durdurma: GAME_RULES ve config'teki açık BASELINE kararını uygula. Bu maddeler çözülmeden referenceParityVerified=true yapma. Yeni belirsizlikte sadece ilgili davranışı bloke et, diğer işleri sürdür. Her cevapta uygulama sürümü, tarih, masa türü ve görülen sonucu kaydet.

| ID | Soru | Şimdiki geliştirme kararı |
|---|---|---|
| Q01 | 17.5.0 gösterge çift jokeri tam hangi fiziksel/eldeki taş için, hangi kombinasyonlarda? Sahte okeyle etkileşimi? | Ek özellik kapalı; son sürüm uyumu bekler |
| Q02 | Çiftte gerçek joker, iki gerçek joker, iki sahte okey, normal+joker hangi şekillerde kabul edilir? | Explicit eş yüz assignment ile kabul |
| Q03 | Gösterge seçimi/dağıtım, başlangıç seat ve toplam stok aynı mı? | 22/21/21/21 + 1 gösterge +20 stok |
| Q04 | Katlamalı eşik son açılış mı maksimum mu; ek perler yükseltir mi; modlar birbirini etkiler mi? | Maksimum ilk açılış, modlar ayrı |
| Q05 | Soldan alınan taş bizzat kullanılmalı mı? Açmış oyuncu yeni per için alabilir mi? Geri bırakma mümkün mü? | Alınan taş aynı atomik planda masaya konur |
| Q06 | Çift açanın seri işlemesinde tur/per başına sınır var mı? | Sınır yok |
| Q07 | Yerden okey, çift perinden de alınabilir mi; açılış turunda alınabilir mi; yeniden kullanma zorunlu mu? | Pair dahil; açılıştan sonra; tekrar oynama zorunlu değil |
| Q08 | Üçlü gruptaki joker hangi eksik rengi temsil eder; iki olası renkten herhangi biriyle alınır mı? | Açarken explicit seçilen renk sabit |
| Q09 | Elden bitiş için açılmış başka oyuncu bulunmaması yeterli mi? Aynı tur farklı komutla açıp bitmek ve okeyle birleşme? | Tek atomik plan, kimse açmamış; çarpanlar birleşir |
| Q10 | Stok son taşı çekenin turu tamamlanır mı; herkes çift açınca el iptal mi? | Son tur tamamlanır; dört çift açan oyuna devam |
| Q11 | Elde iki okey kalınca 101 mi 202 mi; basılı sayı da eklenir mi? | Her biri 101; basılı sayı eklenmez |
| Q12 | Açmamış oyuncunun elde okey cezası 202'ye eklenir mi? | Eklenmez |
| Q13 | Joker elde cezası çift/okey/elden çarpanından önce mi sonra mı? | Sonra, çarpılmaz |
| Q14 | Normal/çift/elden/elden+okey kazananın tam puanı ve çift kazananın rakiplere etkisi? | -101/-202/-202/-404; çift kazanana ek çarpan yok |
| Q15 | Geçersiz açılış, per geri toplama cezası ve UI hata davranışı? | Geçersiz plan değişikliksiz red, ceza 0 |
| Q16 | İşler taş atma: açmamış oyuncu, çift masası, kendi perleri ve bitiş istisnası? | R11 formülü |
| Q17 | Okey atma ve işler taş aynı anda cezalanır mı; önceki hamle cezaları çarpılır mı? | Tek joker atış cezası, hamle cezaları çarpılmaz |
| Q18 | Plus timeout/bot/reconnect/host/yerine oturma davranışları? | Vibely'ye özgü R13; Plus bağlantı politikası hedeflenmez |

## Kanıt kaydı şablonu

ID: Qxx
Sürüm / platform / tarih:
Masa: standart/katlamalı, yardımlı/yardımsız, bireysel/eşli
Önceki state: eldeki taşlar, açık perler, mod, sıra, skor
Hamle:
Gözlenen kabul/red ve skor:
Ekran kaydı veya resmî açıklama:
Sonuç: resolved / conflicting / unknown
Değişen ruleId, config değeri ve testId:

Kanıt yoksa resolved yazma. Bir masa çeşidinden görülen sonucu diğerine yayma.
