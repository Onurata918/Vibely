# Kaynak ve kanıt kaydı

Erişim tarihi 2026-10-03. Metinler özetlenmiştir; uygulamanın tüm davranışı bu kısa SSS yazılarında açıklanmıyor.

Kaynak adreslerinde artikel ID yeterlidir; yönlendirme ile güncel başlık açılır.

| ID | Resmî kaynak | Doğruladığı bilgi |
|---|---|---|
| S01 | https://www.zynga.com/games/101-okey-plus/ | 101 açılış eşiği, per ve çift ile oynama |
| S02 | https://zyngasupport.zendesk.com/hc/tr/articles/115003520111 | Katlamalı seri önceki açılıştan en az 1 fazla; çift de 1 fazla |
| S03 | https://zyngasupport.zendesk.com/hc/tr/articles/115003520151 | 12-13-1 kabul edilmez |
| S04 | https://zyngasupport.zendesk.com/hc/tr/articles/115003520191 | Eski SSS göstergenin işlevi olmadığını söylüyor; son sürümle çelişme ihtimali |
| S05 | https://zyngasupport.zendesk.com/hc/tr/articles/115003520231 | Soldan alma, açılış veya işleme yapmaya bağlı |
| S06 | https://zyngasupport.zendesk.com/hc/tr/articles/115003521191 | En az 5 çiftle açılış |
| S07 | https://zyngasupport.zendesk.com/hc/tr/articles/115003521251 | Seri açan, başkası çift açmışsa çift işleyebilir |
| S08 | https://zyngasupport.zendesk.com/hc/tr/articles/115003521371 | Oyuncu hem seri hem çift açamaz |
| S09 | https://zyngasupport.zendesk.com/hc/tr/articles/115003521391 | Çift açan, başkasının açılmış serisine işleyebilir |
| S10 | https://zyngasupport.zendesk.com/hc/tr/articles/115003521411 | El açmadan işleme yok |
| S11 | https://zyngasupport.zendesk.com/hc/tr/articles/115003539012 | Açmış oyuncu temsil edilen taşı koyarak yerdeki okeyi alabilir |
| S12 | https://zyngasupport.zendesk.com/hc/tr/articles/115003521431 | Açmamış oyuncu, biri bitince veya taş bitince 202 ceza alır |
| S13 | https://zyngasupport.zendesk.com/hc/tr/articles/115003539052 | Okeyle bitişte ceza katlanır; açmayan 404; çift açan eldeki sayıların 4 katı; kazanan -202 |
| S14 | https://zyngasupport.zendesk.com/hc/tr/articles/115003539072 | Çift açmış oyuncunun cezası iki kat |
| S15 | https://zyngasupport.zendesk.com/hc/tr/articles/115003521471 | Kimse açmamışken bütün eli tek seferde açıp bitme: rakipler 404 |
| S16 | https://zyngasupport.zendesk.com/hc/tr/articles/115003539092 | Elde okey kalması 101 ceza; adet ve çarpan ayrıntısı açıklanmıyor |
| S17 | https://zyngasupport.zendesk.com/hc/tr/articles/115003539492 | Katlamalı eşik ve perlerin ayrı gruplandırılması |
| S18 | https://zyngasupport.zendesk.com/hc/tr/articles/115003537992 | Yardımlı oyun per toplamını ve işlenebilir taşları gösterir |
| S19 | https://apps.apple.com/us/app/101-okey-plus-rummy-board-game/id649260774 | Erişimde görünen 17.5.0 notu: çift açarken gösterge taşının okey gibi kullanılabilmesi |
| S20 | https://zyngasupport.zendesk.com/hc/tr/articles/115003519991 | Yarım oyunda gelen oyuncunun puan koruması; ilk Vibely sürümünde oyuncu değiştirme yok |

## Güven düzeyleri

**OFFICIAL**: Resmî kaynak doğrudan söyler; sadece kapsadığı davranış doğrulanmıştır.
**BASELINE**: Bu paketin kesin geliştirme kararı. Tam uygulanır fakat Plus eşdeğerliği kanıtlanmamıştır.
**VERIFY**: Açık uyumluluk sorusu. BASELINE seçeneğiyle geliştirilebilir; birebir Plus teslimini bloke eder.

SSS güncellik tarihleri tek başına tüm uygulama sürümlerine uyum kanıtı değildir. S04 ile S19 nedeniyle gösterge çift joker özelliği kapalı geliştirme varsayılanıdır; Plus güncel sürüm profili doğrulama bekler. Fiziksel gösterge, eldeki aynı yüzlü taş ve sahte okey birbirine karıştırılmamalı.

Motor, multiplayer ve API önerileri bu paketin tasarım kararlarıdır; Zynga'nın iç mimarisi olduğu iddia edilmez. Kullanılan SDK sürümlerinin resmî dokümantasyonu uygulama aşamasında kontrol edilmeli.
