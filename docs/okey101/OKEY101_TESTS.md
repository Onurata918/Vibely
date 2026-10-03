# 101 test kabul senaryoları

Bu senaryolar henüz çalışan test kodu değildir. Claude bunları otomatik testlere çevirmeli; MANUEL etiketliler cihaz kabul kontrolüdür. BASELINE sonuçları yalnız geliştirme profilini doğrular, Plus birebir uyumluluğunu kanıtlamaz.

R=RED, B=BLUE, K=BLACK, Y=YELLOW; J gerçek joker, F sahte okey. Özel fixture aksi demiyorsa gösterge Y12, gerçek joker Y13. #1/#2 fiziksel kopyalardır. Fixture kurucu bütün 106 taşı tutarlı bölgelerde üretmeli; 17/100/101 gibi soyut toplam testlerinde geçerli, tileId paylaşmayan perler açıkça kurulmalı. Puan testleri validator kapsamından bağımsız, geçerli round sonucu fixture ile çalıştırılır.

Her senaryo ayrı stabil testId ile raporlanır. Redlerde sadece hata kodunu değil el/masa/skor/version değişmezliğini de kontrol et. Başarıda conservation invariant kontrol et.

## Deck ve dağıtım — R01–R03

- T001: Yeni deste -> tam 106 benzersiz tileId.
- T002: Normal yüz sayımı -> 52 yüzün her birinden tam iki fiziksel kopya.
- T003: Sahte okey sayımı -> tam iki ayrı tileId.
- T004: Gösterge seçimi -> sahte okey seçilemez.
- T005: R6 gösterge -> iki R7 gerçek joker; sahte okeyin efektif yüzü R7.
- T006: B13 gösterge -> B1 gerçek joker.
- T007: R6 göstergede K7 -> normal taş; joker değil.
- T008: Dağıtım -> başlayan 22, diğerleri 21; gösterge 1, stok 20.
- T009: Dağıtım sonrası bütün bölgelerin tileId birleşimi -> 106; kesişimler boş.
- T010: Aynı deck ve aynı komutlar -> tamamen aynı engine state.
- T011: Sonraki el -> başlangıç seat bir artar, 3 sonrası 0.
- T012: Bozuk/değişik 106 tileId girdisi -> dağıtım başlamaz; invariant hatası.
- T013: Üretim shuffle -> deck istemci snapshot veya loglarında görünmez.

## Perler ve jokerler — R04

- T014: R4 R5 R6 -> RUN kabul; puan 15.
- T015: R1 R2 R3 -> RUN kabul; puan 6.
- T016: R11 R12 R13 -> RUN kabul; puan 36.
- T017: R12 R13 R1 -> RUN red.
- T018: R13 R1 R2 -> RUN red.
- T019: R4 R5 -> RUN red; minimum üç.
- T020: R4 R6 R7 -> RUN red; boşluk var.
- T021: R4 B5 R6 -> RUN red; renkler farklı.
- T022: R5#1 R5#2 R6 -> RUN red; sayı tekrarı.
- T023: R6 R4 R5 -> RUN kabul; fiziksel sıra zorunlu değil.
- T024: R1..R13 -> RUN kabul; puan 91.
- T025: R8 B8 K8 -> SET kabul; puan 24.
- T026: R8 B8 K8 Y8 -> SET kabul; puan 32.
- T027: R8#1 R8#2 B8 -> SET red; renk tekrarı.
- T028: R8 B8 K9 -> SET red.
- T029: R8 B8 -> SET red.
- T030: R8 B8 K8 Y8 R8#2 -> SET red; beş taş.
- T031: R8#1 R8#2 -> PAIR kabul.
- T032: R8 B8 -> PAIR red.
- T033: R8 R9 -> PAIR red.
- T034: Aynı tileId iki kez -> PAIR red; fiziksel iki kopya gerekir.
- T035: R4 J(R5) R6 -> RUN kabul; puan 15.
- T036: R4 J(B5) R6 -> RUN red.
- T037: R12 R13 J(R14) -> red; assignment 1..13.
- T038: R8 B8 J(K8) -> SET kabul; puan 24.
- T039: R8 B8 J(R8) -> SET red; joker rengi tekrar ediyor.
- T040: R8#1 J(R8) -> PAIR kabul; BASELINE.
- T041: J1(R8) J2(R8) -> PAIR kabul; BASELINE.
- T042: J1(R8) J2(B8) -> PAIR red.
- T043: Gerçek joker kullanılıp assignment verilmemiş -> red.
- T044: Normal taşa wildcard assignment verilmiş -> red.
- T045: Assignment başka pere ait tileId için -> red.
- T046: R6 gösterge; sahte okey R5/R6 yanında -> R5 R6 F RUN kabul; puan 18.
- T047: R6 gösterge; sahte okey B5/B6 yanında -> RUN red; sahte joker B7 olamaz.
- T048: R6 gösterge; F1 F2 -> R7 PAIR kabul.
- T049: R6 gösterge; F R8 -> PAIR red.
- T050: R6 göstergenin eldeki R6 eşini B8 ile çift yap -> red; gösterge ek özelliği kapalı.
- T051: İki farklı perde aynı tileId -> toplu validator red.

## Açılış — R05

- T052: Geçerli yeni perlerin toplamı 100 -> OPENING_TOO_LOW.
- T053: Geçerli yeni perlerin toplamı 101 -> SERIES açılış kabul.
- T054: Geçerli yeni perlerin toplamı 102 -> SERIES açılış kabul.
- T055: Yeni per 90, eski masaya işleme 11 -> açılış red; toplam 101 sayılmaz.
- T056: 100 toplamın içinde joker R1 yerine R2 assignment -> geçerli perler gerçekten 101 olursa kabul.
- T057: 101 toplam ama bir per geçersiz -> tüm açılış red ve state aynı.
- T058: 4 geçerli çift -> açılış red.
- T059: 5 geçerli çift -> PAIRS açılış kabul.
- T060: 6 geçerli çift -> PAIRS açılış kabul.
- T061: Bir çift tileId paylaşırsa beş çift planı -> tüm plan red.
- T062: SERIES açmış oyuncu PAIRS açmayı dener -> OPENING_MODE_LOCKED.
- T063: PAIRS açmış oyuncu SERIES açmayı dener -> OPENING_MODE_LOCKED.
- T064: Katlamalı ilk seri -> eşik 101.
- T065: Katlamalı önceki seri 116, yeni 116 -> red.
- T066: Katlamalı önceki seri 116, yeni 117 -> kabul.
- T067: Katlamalı önceki çift 5, yeni 5 -> red.
- T068: Katlamalı önceki çift 5, yeni 6 -> kabul.
- T069: Katlamalı seri açılışı -> çift eşiğini değiştirmez.
- T070: Katlamalı çift açılışı -> seri eşiğini değiştirmez.
- T071: İlk açılış sonrası ekstra per 33 -> açılış eşiğini yükseltmez.
- T072: Standart masa önceki 116 -> yeni 101 kabul.
- T073: Açmış SERIES oyuncusu geçerli 15 puanlık yeni per -> tekrar 101 aranmaz.

## Tur ve masa — R06–R08

- T074: İlk seat 22 taş -> DRAW_STOCK INVALID_PHASE.
- T075: Sonraki seat çekmeden atış -> INVALID_PHASE.
- T076: Başkasının sırasında draw -> NOT_YOUR_TURN.
- T077: Bir kez stok çekip tekrar draw -> INVALID_PHASE; el sayısı değişmez.
- T078: Draw stok tepesini ele taşır -> stok -1, el +1, conservation aynı.
- T079: Elde olmayan taşı discard -> TILE_NOT_OWNED; state aynı.
- T080: Geçerli discard -> bir taş çıkar, sonraki seat AWAIT_DRAW.
- T081: Seat3 discard -> seat0 sırası.
- T082: Önceki seat tepesinden soldan alıp açılışta kullan -> atomik kabul.
- T083: Önceki seat tepesinden soldan alıp geçerli işleme -> açmış oyuncuda kabul.
- T084: Soldan alıp taşı elde tutma planı -> INVALID_DISCARD_PICKUP.
- T085: UNOPENED oyuncu soldan alıp sadece işleme -> red.
- T086: Eski discard veya başka seat tepesini alma -> red.
- T087: Soldan alma planında açılış yetersiz -> el, discard ve masa hiç değişmez.
- T088: UNOPENED oyuncu masaya işleme -> NOT_OPENED.
- T089: Aynı planda geçerli OPEN ardından EXTEND -> kabul.
- T090: R4 R5 R6 serisine R3 ekleme -> kabul.
- T091: R4 R5 R6 serisine R7 ekleme -> kabul.
- T092: R4 R5 R6 serisine R8 -> red.
- T093: R4 R5 R6 serisine B7 -> red.
- T094: R11 R12 R13 serisine R1 -> red.
- T095: R8 B8 K8 grubuna Y8 -> kabul.
- T096: R8 B8 K8 grubuna R8#2 -> red.
- T097: Dört renkli gruba beşinci taş -> red.
- T098: PAIR perine üçüncü taş -> red.
- T099: SERIES oyuncusu; hiç PAIRS açan yok; yeni çift -> red.
- T100: SERIES oyuncusu; başka PAIRS açmış; yeni çift -> kabul; kendi modu SERIES kalır.
- T101: PAIRS oyuncusu yeni RUN -> red.
- T102: PAIRS oyuncusu başka oyuncunun RUN ucuna taş -> kabul.
- T103: PAIRS oyuncusu aynı tur üç geçerli extension -> kabul; BASELINE sınır yok.
- T104: Peri bölüp başka per kurma isteği -> desteklenmez; red.
- T105: Açmış oyuncu R5 temsil eden J yerine R5 koyar -> joker ele gelir, per aynı yüzleri korur.
- T106: UNOPENED oyuncu yerden joker değiştirir -> red.
- T107: R5 temsil eden J yerine B5 koyma -> red.
- T108: Sahte okey efektif R5 ise R5 joker değişimine kullanma -> kabul.
- T109: SET jokerinin sabit K8 assignment yerine Y8 koyma -> red; Q08 BASELINE.
- T110: Geçerli joker değiştirme sonrası jokeri bu tur oynamama -> kabul.
- T111: Plan ilk extension doğru, ikincisi yanlış -> bütün plan rollback.
- T112: Draw daha önce commit, sonraki plan yanlış -> draw korunur; yalnız plan rollback.
- T113: COMMIT_TURN bütün taşları masaya koyup discard bırakmaz -> MUST_LEAVE_DISCARD.

## Bitiş ve puan — R09–R11

- T114: Son normal taş atılıp el sıfır -> NORMAL, kazanan -101.
- T115: Son gerçek okey atılıp el sıfır -> JOKER, kazanan -202.
- T116: Son sahte okey atılıp el sıfır -> NORMAL.
- T117: Kimse açmamış, tek plan ilk açılış ve normal bitiş -> CLEAN; rakipler 404.
- T118: Başka oyuncu daha önce açmış -> ilk kez açıp biten CLEAN değildir.
- T119: Aynı tur ayrı committed OPEN sonra bitiş -> CLEAN değildir; BASELINE.
- T120: CLEAN + gerçek okey -> kazanan -404; açmamış rakipler 808.
- T121: Stok son draw sonrası bitiş -> normal kazanan; STOCK_EXHAUSTED değil.
- T122: Stok son draw sonrası bitmeyen discard -> STOCK_EXHAUSTED; kazanan null.
- T123: Stok bitişinde UNOPENED -> 202.
- T124: Normal bitiş, SERIES elde normal toplam 17 -> 17.
- T125: Normal bitiş, PAIRS elde normal toplam 17 -> 34.
- T126: Okey bitiş, SERIES normal toplam 17 -> 34.
- T127: Okey bitiş, PAIRS normal toplam 17 -> 68.
- T128: Okey bitiş, UNOPENED -> 404.
- T129: Normal bitiş, SERIES normal toplam 17 + elde bir gerçek joker -> 118.
- T130: Normal bitiş, SERIES normal toplam 17 + elde iki gerçek joker -> 219.
- T131: Okey bitiş, PAIRS normal toplam 17 + elde bir gerçek joker -> 169; joker cezası çarpılmaz.
- T132: UNOPENED elde bir joker -> normal bitişte 202; eklenmez BASELINE.
- T133: R6 gösterge, SERIES elde sadece bir sahte okey -> 7.
- T134: Kazananın daha önce 101 hamle cezası var -> NORMAL toplam 0.
- T135: Bitirmeden gerçek okey discard -> 101 hamle cezası.
- T136: Kazandıran gerçek okey discard -> ek discard cezası yok.
- T137: İşlenebilir normal taş atılır -> 101 hamle cezası.
- T138: UNOPENED oyuncu işlenebilir normal taş atar -> 101 hamle cezası.
- T139: Bitiş atışı işlenebilir -> 0 discard cezası.
- T140: Joker atışı hem wildcard işler görünür -> yalnız joker cezası 101.
- T141: Geçersiz açılış -> skor aynı, ceza 0 BASELINE.
- T142: Kaybeden handBase17, jokerFinish2, hamleceza101 -> toplam135; hamle cezası çarpılmaz.
- T143: Dört oyuncu PAIRS açmış -> el devam eder; BASELINE.
- T144: Beş el sonucu eşit en düşük toplam -> beraberlik.
- T145: ROUND_ENDED sonrası discard -> ROUND_ENDED, ikinci skor kaydı yok.

## Sunucu ve gizlilik — architecture

- T146: Aynı requestId aynı payload retry -> aynı ACK; tek draw.
- T147: Aynı requestId farklı payload -> REQUEST_ID_REUSE.
- T148: Başka kullanıcı aynı requestId -> ilk kullanıcının cevabını/private verisini alamaz.
- T149: Retry eski expectedVersion ile -> dedupe önce, eski başarılı ACK.
- T150: Yeni komut eski expectedVersion -> STALE_VERSION, hamle yok.
- T151: Eşzamanlı iki draw -> yalnız biri commit.
- T152: Eşzamanlı iki finish -> yalnız biri score yazar.
- T153: JWT yok/geçersiz -> UNAUTHORIZED.
- T154: Oda dışı JWT -> NOT_ROOM_MEMBER.
- T155: Payload actorId başka kişi -> sunucu kimliği JWTden kullanır; impersonation yok.
- T156: Client skoru/kazananı/deck alanı -> şema red veya yok sayma; otorite değiştirmez.
- T157: Public snapshot -> rakip tileId/elleri yok; sadece taş sayısı.
- T158: Her private snapshot -> sadece alıcı eli.
- T159: Error/debug/telemetry -> stok sırası/seed/private el sızmaz.
- T160: Raw snapshot/event tabloları -> anonim/normal client SELECT engelli.
- T161: Transaction fail -> başarı ACK/broadcast yok.
- T162: Commit sonrası ACK kaybı -> retry başarılı sonuç, ikinci mutation yok.
- T163: Commit sonrası process crash -> snapshot/event/outbox ile aynı version kurtarılır.
- T164: İki server ownership lease -> yalnız fencing token sahibi commit.
- T165: Aynı gizli event dizisi replay -> birebir aynı FullState.
- T166: Seed yeniden üretilmeden restart -> deck sırası korunur.

## Bağlantı/video/UI — R12–R13

- T167: Turn deadline dolunca AWAIT_DRAW -> stok draw ve aynı taşı discard.
- T168: Deadline AWAIT_PLAY stok çekilmiş -> çekilen taş discard.
- T169: İlk 22 taşlı tur timeout -> en küçük tileId discard.
- T170: Timeout ile oyuncu hamlesi yarışır -> actor tek geçerli sonuç üretir.
- T171: Reconnect 90 saniye içinde -> aynı seat/elde snapshot; deadline uzamaz.
- T172: Disconnect 90 saniye aşar -> ABORTED_DISCONNECT; yeni skor yok.
- T173: Game socket düşer -> kamera/mikrofon görüşmesi devam eder.
- T174: LiveKit düşer -> oyun state/sıra devam eder; game disconnect sayılmaz.
- T175: Host disconnect -> host rolü devredilir, kurallar/seat değişmez.
- T176: Aynı seat yeni session -> eski epoch komutları SESSION_REPLACED.
- T177: Out-of-order delta -> client resync ister, yanlış state üzerine hamle kurmaz.
- T178: Server restart -> orijinal deadline yüklenir, süre sıfırlanmaz.
- T179: Yalnız üç oyuncu ready -> oyun başlamaz.
- T180: Sıralama ve drag taslağı -> server state version değişmez.
- T181: Yanlış drag -> ceza yok; taslak hata görünür.
- T182: Joker yardım hesabı -> yalnız kendi el/açık masa; rakip el verisi istemez.
- T183: MANUEL: dört gerçek oturumda 21/22 taş erişilebilir, rakipte sayı görünür.
- T184: MANUEL: oyun paneli aç/kapa -> video provider remount edilmez; görüşme sürer.
- T185: MANUEL: drag yapamayan kullanıcı tap-select ile aynı hamleyi yapabilir.
- T186: MANUEL: kamera izni reddi -> avatar/ses ve oyun çalışır.
- T187: MANUEL: dört kullanıcı tam el ve beş ellik maç tamamlar; skor dökümü doğru.
- T188: MANUEL: düşük ekran boyutunda taşlar/atma butonu erişilebilir; kamera kontrolü kaybolmaz.

## Property / fuzz testleri

- P01: Rastgele legal komut dizisinde her fiziksel taş tam bir bölgede; birleşim her zaman 106.
- P02: Rastgele invalid planlarda state derin eşitliği ve version korunur.
- P03: Aynı state/komut/time girişleri daima aynı sonucu verir.
- P04: Projection bütün oyuncular için taranır; başka seat elindeki fiziksel tileId veya seed alanları bulunamaz.
- P05: Legal replay ve snapshot recovery hash eşitliği.
- P06: RUN/SET giriş sırası permütasyonu kabul/puanı değiştirmez; explicit joker assignment korunur.
- P07: Her config varyantı için eşik sınırı n-1/n/n+1 testleri.
- P08: Komut retry, socket reorder ve process crash fuzz: hiçbir taş/puan iki kez üretilmez.

Toplam: 188 senaryo + 8 property test başlığı. Manuel maddeler otomatik geçti diye işaretlenmez.
