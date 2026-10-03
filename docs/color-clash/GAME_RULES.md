# Color Clash oyun kuralları

`rules.config.json` bu sürümün kilitli profilidir. Her maç config hash'iyle başlar; maç sırasında kural değişmez.

## Deste ve dağıtım

Dört renk: CRIMSON, AZURE, LIME, GOLD. Her renkte bir adet 0; 1–9 sayılarından ikişer; Block, Flip ve Draw 2 kartlarından ikişer bulunur. Ayrıca 4 Color Shift ve 4 Clash 4 vardır. Toplam 108 benzersiz cardId. Her oyuncuya 7 kart verilir. Kalan kartlar kapalı çekme destesidir; üst kart açık atık destesini başlatır.

Başlangıç kartı Number ise normal başla. Block ise ilk oyuncu atlanır. Flip ise yön tersine döner ve yeni yöndeki ilk oyuncu başlar. Draw 2 ise ilk oyuncu iki çeker ve atlanır. Color Shift ise ilk oyuncu başlangıç rengini seçer. Clash 4 ise tekrar desteye karıştırılır ve yeni başlangıç kartı açılır.

## Normal tur

Oyuncu, üst atık kartının aktif rengi, sayısı veya sembolüyle eşleşen tek kartı oynayabilir. Color Shift her zaman oynanabilir. Clash 4 için ayrıca kendi kuralı uygulanır.

Oyuncu oynanabilir kartı olsa bile çekmeyi seçebilir. Tam bir kart çeker. Çekilen kart oynanabiliyorsa aynı tur yalnızca o kartı oynayabilir; elindeki başka karta dönemez. Çekilen kartı oynamazsa tur biter. Tek turda birden fazla kart oynamak ve ceza kartlarını yığmak kapalıdır.

Çekme destesi biterse atık destesinin üst kartı yerinde kalır; diğer atıklar sunucuda karıştırılarak yeni çekme destesi olur. Tekrar karıştırılacak kart yoksa tur PASS olur; motor kilitlenmez.

## Kart etkileri

- Block: sıradaki oyuncu atlanır.
- Flip: yön CLOCKWISE ↔ COUNTERCLOCKWISE değişir. İki oyuncuda Block gibi çalışır; kartı oynayan tekrar oynar.
- Draw 2: sıradaki oyuncu iki kart çeker ve turu geçer. Draw 2 ile karşılık veremez.
- Color Shift: oynayan oyuncu dört renkten birini seçmeden hamle tamamlanmaz. Mevcut renk de seçilebilir.
- Clash 4: renk seçilir; sıradaki oyuncu itiraz etmezse dört kart çeker ve atlanır.

## Clash 4 yasallığı ve itiraz

Clash 4, oynandığı anda oyuncunun elinde **önceki aktif renkle eşleşen kart yoksa** yasaldır. Aynı sayı veya sembolün farklı renkli kartının bulunması yasak oluşturmaz. Önceki üst kart wild ise seçilmiş aktif renk esas alınır.

Sunucu, kart oynanmadan önceki elin `hadPreviousColorMatch` sonucunu gizlice kaydeder. Yalnız cezayı alacak sıradaki oyuncu, başka bir oyun aksiyonu commit edilmeden `CHALLENGE_DRAW_FOUR` gönderebilir.

- İtiraz doğruysa Clash 4 oynayan kişi 4 kart çeker; itiraz eden kart çekmez ve normal sırası başlar.
- İtiraz yanlışsa itiraz eden 6 kart çeker ve atlanır.
- İtiraz edilmezse itiraz eden 4 kart çeker ve atlanır.

Elin kartları rakibe veya public state'e açıklanmaz; sadece itiraz sonucu yayınlanır. Clash 4 ile el bitirilirse bile itiraz penceresi ve ceza sonucu tamamlandıktan sonra el puanlanır.

## Clash! çağrısı

Oyuncu iki karttan bire inerken `calledClash=true` göndermelidir. Çağrı, kart oynama komutuyla atomiktir. Çağrı yapılmadıysa diğer oyuncular, sıradaki oyuncunun ilk oyun aksiyonu commit edilmeden `CATCH_MISSED_CLASH` gönderebilir. İlk geçerli yakalama sonucu oyuncu 2 kart çeker. Geç, yinelenen veya yanlış yakalama state'i değiştirmez.

Oyuncu bir karta çekerek düştüğünde çağrı gerekmez; çağrı yalnız kart oynayarak iki karttan bire düşüşte gerekir. Son kart oynanırken çağrı aranmaz.

## El ve maç sonu

Bir oyuncunun eli sıfıra indiğinde bekleyen Draw 2/Clash 4 etkisi ve varsa Clash 4 itirazı çözülür. Sonra el biter. Kazanan, diğer ellerde kalan kartların toplam değerini alır:

- Number: yüz değeri
- Block, Flip, Draw 2: 20
- Color Shift, Clash 4: 50

Toplam skoru 500 veya üzeri olan ilk oyuncu maçı kazanır. Aynı el sonunda yalnız el kazananı puan aldığı için tek maç kazananı oluşur. Yeni elin dealer seat'i bir ilerler.

## Sunucu ve süre

Sunucu kart sahipliğini, sıralamayı, aktif rengi, kart etkisini, çağrı penceresini, itirazı ve puanı belirler. İstemci yalnız niyet gönderir. Her komut `requestId` ve `expectedVersion` taşır; retry aynı hamleyi ikinci kez yapmaz.

Tur süresi 30 saniyedir. Süre dolunca sunucu bir kart çeker ve turu geçirir; otomatik olarak oynamaz. İtiraz süresi sıradaki oyuncunun aynı deadline'ı içindedir. Bağlantı 90 saniye ayrılmış seat ile bekler, tur zamanı devam eder. Süre aşılırsa el `ABORTED_DISCONNECT` olur; o el puan yazmaz.
