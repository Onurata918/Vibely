# Plus ile karşılaştırma

Standart bireysel ve katlamalı bireysel masayı ayrı kaydet. Tarih, uygulama sürümü,
platform, yardımlı ayarı görünür olsun. Rastgele canlı oyunlarda başkalarını rahatsız
etmeden, mümkünse kendi dört test oyuncunla özel masada gözlem yap.

1. 22/21 dağıtım ve ilk tur çekme durumunu doğrula.
2. Normal seri 100/101, çift 4/5; katlamalı 116/117 ve 5/6 farklarını kaydet.
3. Jokerli seri/grup/çift, sahte okey ve gösterge çift özelliğini ayrı dene.
4. Açmadan soldan alım; açmışken taşı elde tutma ve kullanma farkını kaydet.
5. Seri oyuncusunun çift işleme ve çift oyuncusunun seri işleme sınırını dene.
6. RUN, SET ve PAIR'dan joker alma, alternatif renk, tekrar kullanma durumlarını dene.
7. Normal, okey, elden, elden+okey ve çift açan kazanan skorlarını gözle.
8. Açmış/açmamış oyuncuda bir ve iki elde joker; çift/okey bitişiyle birleşimini kaydet.
9. İşler taş atma, okey atma, geçersiz açılış ve bitiş atış istisnasını dene.
10. Son stok taşı ve dört çift açan masa sonucunu gözle.

Her kayıt RULE_QUESTIONS.md şablonuna taşınır. Arayüz izin vermediği için bir hamle
denenemiyorsa motor kuralı sonucu çıkarmak yerine "gözlenemedi" yaz. Kontrollü durum
kurulamıyorsa resmî destek açıklaması gerekir. Her doğrulanan farklılık için fixture,
test ve profile sürümü değişsin; devam eden maçın config'i değişmesin.
