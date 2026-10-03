# Vibely — 4 kişilik 101 Okey başlangıç paketi

Hazırlanma: 3 Ekim 2026. Bu paket çalışan oyun kodu değil; Claude Code'a verilecek uygulama şartnamesi, protokol sözleşmesi ve test kabul paketidir.

Hedef: 101 Okey Plus'ta alıştığın temel oyun davranışını Vibely odasında, dört kişinin kamera/mikrofon görüşmesi devam ederken uygulamak. Plus'ın kaynak koduna veya bütün güncel masa davranışlarına erişilmedi. Bu yüzden **birebir uyumluluk henüz doğrulanmış değildir**. Resmî yardım sayfalarıyla doğrulanan kurallar ve geliştirme için seçilmiş davranışlar dosyalarda ayrı etiketlenmiştir.

## Dosyalar

- GAME_RULES.md: taş, per, çift, sıra, açılış, işleme, bitiş, puan ve ceza.
- rules.config.json: geliştirme profilinin makine tarafından okunabilir değerleri; Plus uyumluluk bayrağı false.
- RULE_QUESTIONS.md: birebir uyum için uygulamada karşılaştırılacak ayrıntılar.
- SOURCES.md: resmî kaynaklar, kanıt kapsamı ve çelişkiler.
- VIBELY_GAME_ARCHITECTURE.md: video/oyun ayrımı, sunucu, gizli eller, reconnect, zaman aşımı ve kalıcılık.
- protocol.ts: başlangıç TypeScript sözleşmeleri; uygulanmış motor değildir.
- OKEY101_TESTS.md: ID'li, beklenen sonuçlu test senaryoları.
- fixtures/melds.json: küçük, makine tarafından okunabilir per doğrulama örnekleri.
- CLAUDE.md: repo keşfi ve uygulama talimatı.
- MASTER_PROMPT.txt: Claude Code'a ilk yapıştırılacak prompt.
- IMPLEMENTATION_PLAN.md: aşamalar ve tamamlanma ölçütleri.
- REFERENCE_CHECKLIST.md: Plus içinde yapılacak davranış karşılaştırması.

## Kullanım

1. ZIP'i aç. İçindeki klasörü Vibely repo'na `docs/okey101/` olarak koy.
2. Mevcut CLAUDE.md varsa üzerine yazma. Paketteki talimatları proje talimatlarıyla birleştir veya mevcut dosyaya `docs/okey101/CLAUDE.md` dosyasını okuma talimatı ekle.
3. Claude Code'u Vibely repo kökünde aç. MASTER_PROMPT.txt içeriğini yapıştır.
4. İlk aşamada motor ve testler yapılır. Sonra sunucu, ardından mobil masa ve görüntülü görüşme entegrasyonu yapılır. Sahte multiplayer ile tamamlanmış sayılmaz.
5. Plus'la aynı olmasını istediğin belirsiz ayrıntıları REFERENCE_CHECKLIST.md ile karşılaştır. Sonuç, sürüm/masa türü ve beklenen davranışı RULE_QUESTIONS.md'ye kaydet; config ve testleri beraber güncelle.

Paket, mevcut Vibely repo'su görülmediği için yeni bir stack dayatmaz. React Native/Expo, LiveKit ve Supabase mevcutsa kullanılır. Kamera/mikrofon için native bağımlılık gerekiyorsa Expo development build kullanımı ayrıca doğrulanır; Expo Go uyumluluğu varsayılmaz.

## İlk sürüm kapsamı

Dört sabit oyuncu; bireysel puan; standart veya katlamalı açılış; seri/grup ve çift; okey ve sahte okey; işleme; yerden okey değiştirme; normal/okey/elden bitiş; skor dökümü; süre; tekrar bağlanma; dört kamera ile oynanabilir masa. Eşli oyun, çip ekonomisi, turnuva, rizikolu 51 ve oyuncu değiştirme ayrı kapsamdır. Dört oyuncunun temel oyunu tamamlanmadan bunlar yapılmaz.

## Düzeltilmesi gereken önceki örnek

101'de rakibin başlangıç eli 14 taş değildir: bu profilde başlayan oyuncu 22, diğerleri 21 taş alır. Normal okey ile 101 motoru aynı kuralları kullanmamalıdır.

## Kabul

OKEY101_TESTS.md senaryoları otomatik teste çevrilip çalıştırılmalı. Bu belgelerde testlerin geçtiği iddia edilmez. Geliştirme profilinin tamamlanması ile Plus uyumluluğunun doğrulanması iki ayrı teslim ölçütüdür.
