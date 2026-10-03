# GAME_RULES — Vibely 101

Sürüm 1.0 / 2026-10-03. OFFICIAL/BASELINE/VERIFY anlamları SOURCES.md'de. İki farklı Plus masa türünün davranışlarını tek profile karıştırma. rules.config.json değerleri BASELINE geliştirme profilidir. Her maç başında profileId + config hash kaydedilir; maç sırasında değiştirilemez.

## R01 — Taşlar ve kimlik (BASELINE)

4 renk: RED, BLUE, BLACK, YELLOW; 1..13; her yüzün iki fiziksel kopyası; ayrıca iki sahte okey. Toplam 106. Her fiziksel taşın benzersiz tileId'si vardır. R7#1 ve R7#2 aynı yüzlü fakat farklı taşlardır. Bir taş aynı anda iki yerde veya aynı işlemde iki kere bulunamaz.

## R02 — Gösterge ve gerçek/sahte okey (BASELINE; VERIFY Q01-Q03)

Dağıtımdan önce normal taşlardan bir gösterge ayrılır. Gösterge herkesçe görülür, elde/çekme yığınında değildir. Aynı rengin sonraki sayısının iki fiziksel kopyası gerçek okeydir; 13 sonrası 1. Örn R6 gösterge -> R7#1 ve R7#2 joker. Sahte okey taşları bu tur R7 gibi **normal yüz** taşlarıdır; joker gibi her yere koyulmaz. Sahte okeyin normal taş değeri, gösterge + 1'in sayısıdır.

Gerçek okeyin per içindeki temsil ettiği renk/sayı explicit assignment ile gönderilir, sunucu doğrular ve masada sabitler. Joker kullanıldığı perin temsil edilen sayısı kadar açılış puanı getirir. Kendiliğinden en yüksek toplamı seçme.

Göstergeyi gösterme bonusu yok. Güncel Plus'ın göstergenin eldeki eşini çiftte joker gibi kullanma özelliği S19'da var, S04 eski bilgidir. Bu ek davranış geliştirme profilinde kapalı; Q01 çözülmeden Plus son sürüm uyumlu etiketi verme.

## R03 — Dağıtım (BASELINE)

Başlayan oyuncu 22, diğer üç oyuncu 21 taş alır. Gösterge 1, elde toplam 85, stok 20; toplam 106 korunur. Başlayan oyuncu ilk tur taş çekmez, doğrudan oynar/atar. Sonraki turlarda sıra sahibinin çekmesi gerekir. Oyuncu sırası seat 0 -> 1 -> 2 -> 3 -> 0; UI bunu yerel oyuncu altta, önceki solda, sonraki sağda olacak şekilde döndürür. Her yeni elde başlayan seat bir artar. Sunucu kriptografik rastgelelik ile Fisher-Yates karıştırır; motor yalnızca verilen shuffle/deck ile deterministik çalışır. Üretim seed'i/deck sırası istemciye verilmez.

## R04 — Seri/grup perleri (BASELINE; wrap OFFICIAL S03)

- RUN: aynı renk, ardışık sayılar, 3..13 taş. 1-2-3 ve 11-12-13 geçerli; 12-13-1 ve 13-1-2 geçersiz. Aralık 1..13 dışında temsil olamaz.
- SET: aynı sayı, her renk en fazla bir kez, 3 veya 4 taş. R8/B8/K8 geçerli; R8/R8/B8 geçersiz. Joker temsilinde de farklı renk şartı korunur.
- PAIR: tam 2 taş, aynı efektif renk/sayı. İki gerçek fiziksel kopya kullanılır. Bir gerçek joker + normal taş, normal taşın yüzüne atanırsa geçerli; iki joker explicit aynı yüze atanırsa geliştirme profilinde geçerli. Q02 ile Plus kontrolü gerekir.
- Sahte okey normal yüz gibi değerlendirilir. Per doğrulaması sıralamadan bağımsızdır; RUN'da assignment değerlerine göre sıralanır.
- Bir perin değeri temsil edilen sayılar toplamıdır. RUN R10/R11/R12 = 33; SET 8/8/8 = 24. Çift açılışında sayı toplamı değil çift sayısı kullanılır.
- Birden fazla per tileId dizileriyle açıkça ayrılır. Istakadaki boşluk/ekran koordinatı tek başına mantıksal sınır değildir.
- En az bir normal taş içermeyen RUN/SET reddedilir; mevcut iki gerçek jokerle minimum 3'e zaten ulaşılamaz. PAIR istisnası yukarıdadır.

## R05 — Açılış (OFFICIAL S01,S02,S06,S08; eşik ayrıntısı BASELINE)

openingStatus UNOPENED | SERIES | PAIRS. Tek elde ilk seçilen mod kalıcıdır.

Standart SERIES: tek açılış işlemindeki sadece eldeki yeni geçerli RUN/SET'lerin toplamı >=101. Masaya yapılan işleme puanı eşik hesabına girmez. Tam 101 geçer, 100 geçmez. Açılış sonrası ek perlere 101 şartı yok.

Standart PAIRS: tek işlemde >=5 geçerli PAIR; dört çift yetmez. Seri ve çift açılış aynı işlemde karıştırılmaz.

Katlamalı: seri eşiği max(101, önceki seri açılışlarının en yüksek toplamı +1); çift eşiği max(5, önceki çift açılışlarının en yüksek çift sayısı +1). İki eşik ayrı. Örn 116 -> 117; 5 çift -> 6. Eşik, ilk açılışta konan bütün yeni perlerin değeri/sayısıyla yükselir; sonraki işleme/ek per eşiği yükseltmez. Max mı son açılış mı ve eklerin etkisi Q04'te doğrulanır.

## R06 — Tur ve soldan alma (OFFICIAL S05; atomiklik BASELINE)

Tur aşamaları AWAIT_DRAW -> AWAIT_PLAY -> AWAIT_DRAW(next). İlk oyuncu AWAIT_PLAY başlar. Draw tam 1 taş, discard tam 1 taş. Çekmeden açılış/işleme/atış yok. Çektikten sonra tekrar çekme yok.

DRAW_STOCK stoktan tek taş getirir. DRAW_DISCARD yalnızca önceki seat'in son attığı ve hâlâ tepede bulunan taşı alabilir. Eski atılan taşlar çekme kaynağı değildir.

Soldan alım geliştirme profilinde `TAKE_DISCARD_AND_PLAY` ile atomiktir: alınan taş, aynı işlemde oyuncunun geçerli açılışına veya açmış oyuncunun geçerli per/işlemesine gerçekten katılmalıdır. Açmamış oyuncu sadece işleme için soldan alamaz. Taşı elinde tutup sıradan atışla devam edemez. Geçersiz plan, atık yığınını ve eli değiştirmez. S05 kullanım şartını genel söyler; alınan taşın bizzat kullanılması Q05 doğrulama konusudur.

## R07 — İşleme ve mod kısıtları (OFFICIAL S07-S10; ayrıntı BASELINE)

Açmamış oyuncu yerdeki pere taş ekleyemez; aynı atomik plan içinde önce geçerli açılış yapıp sonra işleme yapabilir. SERIES oyuncusu yeni RUN/SET açabilir. Başka bir oyuncu PAIRS açmışsa elindeki geçerli çiftleri pair bölümüne yeni PAIR olarak koyabilir; kendi modu SERIES kalır. PAIR'a üçüncü taş eklenmez.

PAIRS oyuncusu yeni PAIR koyabilir; yeni RUN/SET açamaz. Başkasının açtığı RUN/SET'i geçerli uç ekleme/eksik renk tamamlama ile uzatabilir. Bu profilde tur başına ekleme sınırı yok; Plus sınırı Q06'da kontrol edilir.

RUN yalnızca uçtan uzatılır; boşluk oluşturulamaz. SET'e sadece eksik renk eklenir, toplam en fazla dört. Mevcut perler bölünmez, yeniden dizilmez; Rummikub tarzı tüm masayı yeniden kurma yok. Jokerin assignment'ı sıradan işleme ile değişmez. Bir oyuncu kendi açtığı pere de işleyebilir.

## R08 — Yerden okey alma (OFFICIAL S11; ayrıntı BASELINE)

Açmış oyuncu, masadaki gerçek okeyin tam olarak temsil ettiği efektif renk/sayıya sahip el taşını yerine koyarak okeyi alabilir. Sahte okey bu yüze eşitse normal taş olarak kullanılabilir. Yanlış yüz, açılmamış oyuncu, sıra dışı işlem reddedilir. Değiştirme atomik 1:1'dir ve per geçerli kalır. Joker ele gelir; bu profilde aynı tur tekrar oynama zorunluluğu yok. PAIR ve SET'te erişim/iki alternatif renk gibi ayrıntılar Q07/Q08'de doğrulanmalıdır; explicit locked assignment yalnızca kendi profilimizin çözümüdür.

## R09 — Bitiş ve stok sonu (OFFICIAL S12,S15; ayrıntı BASELINE)

Oyuncu, geçerli açılış ve per/işleme sonrası elinde son bir taş bırakıp onu atınca eli kazanır. Elin tümünü masaya koyup atacak taş bırakmayan hamle reddedilir. Gerçek okey son atılan taşsa JOKER finish; sahte okey normal finish.

CLEAN/elden: bu tur başlamadan önce hiçbir oyuncu açmamış ve kazanan tüm elini ilk açılışında aynı atomik COMMIT_TURN planında, son atış dahil bitirmiştir. Birisi daha önce açmışsa CLEAN yok. Aynı tur açılışını ayrı committed komutla yapıp sonradan biten oyuncu CLEAN sayılmaz; UI tüm elden bitişi tek planla yollamalı. CLEAN+JOKER geliştime profilinde çarpanlar birleşir, Q09.

Son stok taşı çekildikten sonra o oyuncunun turunu bitirmesine izin verilir. Biterse kazanan vardır; bitmezse STOCK_EXHAUSTED, kazanan yok. Stok atılanlardan yeniden karıştırılmaz. Dördü çift açarsa bu profilde oyun devam eder; Q10. İki bitiş olayı yarışırsa ilk sunucu commit'i kazanır; ikinci ROUND_ENDED.

## R10 — Skor (OFFICIAL S12-S16 kısmi; ayrıntılı formül BASELINE)

Puan birimi el cezasıdır; düşük toplam daha iyi. Beş el sonunda en düşük toplam kazanır. Eşitlik beraberlik; çip/para değişimi yok.

Normal taş ve sahte okey elde kendi efektif sayısıyla sayılır. Gerçek okey elde normal yüz toplamına katılmaz, her biri ayrı 101 ceza bileşenidir.

Geliştirme formülü:
`handBase = unopened ? 202 : sum(nonRealJokerHandValues) * (openedPairs ? 2 : 1)`
`finishMultiplier = (jokerFinish ? 2 : 1) * (cleanFinish ? 2 : 1)`
`heldJoker = unopened ? 0 : 101 * realJokersRemaining`
`loserScore = handBase * finishMultiplier + heldJoker + committedActionPenalties`

Kazanan: NORMAL -101; JOKER -202; CLEAN -202; CLEAN_JOKER -404. Kazananın daha önce kesinleşmiş hamle cezaları bu değere eklenir. Kazananın PAIRS olması ayrıca rakip çarpanı yaratmaz. STOCK_EXHAUSTED: winner=null, finishMultiplier=1, dört oyuncu kaybeden formülüyle sayılır.

| Durum | Geliştirme sonucu (hamle cezası/elde okey yok) |
|---|---|
| Açmamış, normal bitiş | 202 |
| Seri açmış, elde sayı toplamı 17 | 17 |
| Çift açmış, elde sayı toplamı 17 | 34 |
| Açmamış, okey bitiş | 404 |
| Seri açmış, sayı toplamı 17, okey bitiş | 34 |
| Çift açmış, sayı toplamı 17, okey bitiş | 68 |
| Elden bitiş, rakiplerin her biri açmamış | 404 |
| Elden+okey, rakiplerin her biri açmamış | 808 |

S16 elde okey için 101 söyler ama adet, çarpan sırası, açmamışta 202'ye eklenip eklenmediği açıklanmaz. Bu formül bunları seçer; Plus ile eşdeğerliği Q11-Q14 çözülmeden iddia etme. Tüm skorlar `{handBase, finishMultiplier, heldJoker, actionPenalties, total}` olarak açıklanabilir olmalı.

## R11 — Hamle cezaları (BASELINE; VERIFY Q15-Q17)

Geçersiz komut reddedilir, el/masa/skor değişmez. Geçersiz açılış için bu profilde 101 ceza yok; UI taslakları cezalandırılmaz. Aynı request retry ceza üretmez.

Bitirmeden gerçek okey atma 101; bitişte bu atış cezası yok. Atılan taş, atış öncesindeki committed masada herhangi bir RUN/SET'e normal yüzüyle geçerli işlenebiliyorsa 101; oyuncu açmamış olsa da. PAIR bölümüne tek taşı işlemek mümkün değildir. Aynı atışta joker ve işler-taş cezası geliştime profilinde yalnızca joker cezası üretir. Gerçek okeyi wildcard olarak her pere işleyebilir kabul ederek ikinci ceza ekleme. Bitiş atışında işler-taş cezası yok. Sahte okey normal yüzle değerlendirilir.

Atış öncesi oyuncunun aynı tur işlemesiyle değişen committed masa esas alınır. Bu cezaların Plus'a eşitliği doğrulanmadı; config üzerinden değiştirilebilir.

## R12 — Yardım/istaka/hamle atomikliği (BASELINE; yardım OFFICIAL S18)

Renk/sayı/çift sıralama sadece yerel düzeni değiştirir. Yardımlı mod oyuncunun kendi eli ve açık masa ile açılış toplamını/işlenebilir taşları hesaplar; rakip eli/deck bilgisi kullanmaz. Joker yerleri ve per sınırları kullanıcıya görünür. Geçersiz drag bırakma taslaktır; sunucuya geçerli plan commit edilmedikçe oyun değişmez.

COMMIT_TURN: opsiyonel açılış, yeni perler, işleme ve joker değiştirme adımları sıralı doğrulanır; son discard zorunlu. Planın tamamı başarılıysa tek state version artırımı; herhangi bir adım yanlışsa tümü rollback. Drawing ayrı commit olabilir; bu durumda başarısız turn planı çekilmiş taşı geri almaz. TAKE_DISCARD_AND_PLAY ise draw dahil atomik. Preview istemcide gösterilir ama sunucu otoritedir.

## R13 — Süre, bağlantı ve oda (BASELINE)

45 saniye sunucu tur süresi; deadline uzamaz. Timeout çekmesi gerekiyorsa stok çeker ve çektiğini atar; zaten stok çekmişse aynı taşı atar; 22 taşlı ilk turda veya discard pickup planı sonrası belirlenmiş çekilen taş yoksa eldeki en küçük tileId'yi atar. Timeout normal atış cezalarına tabidir, akıllı bot değildir. Kazanmayı otomatik seçmez. Kısmen başarıyla commit edilmiş adımlar geri alınmaz. Süre ile kullanıcı komutu yarışında room actor sırası tek sonuç verir.

Disconnect seat'i 90 saniye rezerve eder; tur zamanlayıcısı devam eder. 90 saniye sonrası round ABORTED_DISCONNECT, skor yazılmaz; önceki tamamlanmış eller korunur, maç durur. Oyuncu değişimi yok. Uygulamanın tekrar bağlanması oyun socket'iyle kendi elini geri alır. LiveKit koptu diye oyun disconnect sayılmaz. Host çıkması sadece host rolünü değiştirir; seat ve kurallar sabit. Dört ready olmadan oyun başlamaz.
