# Vibely — Color Clash başlangıç paketi

Bu paket, Vibely görüntülü görüşme odasında 2–6 kişinin oynayacağı renk ve sembol eşleştirme kart oyununun şartnamesidir. Varsayılan hedef 4 oyuncudur. Oyun adı **Color Clash**; ürün metinlerinde, kod adlarında, kart arkalarında ve arayüzde başka bir oyunun markası kullanılmaz.

Paket çalışan uygulama kodu değildir. Claude Code için kurallar, TypeScript protokolü, test kabul senaryoları, multiplayer mimarisi ve uygulama promptu içerir.

## Kullanım

1. Klasörü Vibely repo'suna `docs/color-clash/` olarak koy.
2. Mevcut kök `CLAUDE.md` dosyasının üzerine yazma.
3. Claude Code'u repo kökünde açıp `docs/color-clash/MASTER_PROMPT.txt` içeriğini gönder.
4. Önce saf motor ve testler, sonra sunucu, ardından mobil masa ve mevcut video odası entegrasyonu yapılır.

## İlk sürüm

- 108 kartlık klasik deste
- Dört renk, 0–9 sayı kartları
- Skip, Reverse, Draw Two, Wild, Wild Draw Four
- 7 kartla başlangıç
- Tek kart oynama; kart yığma kapalı
- Draw Four itiraz sistemi
- Color Clash çağrısı ve yakalanırsa 2 kart cezası
- El puanı ve 500 puanlık maç
- Sunucu otoritesi, gizli eller, yeniden bağlanma ve süre

Oyunun görsel kimliği özgün hazırlanmalı: Color Clash logosu, kart arkası, ikon şekilleri, sesler, animasyonlar ve metinler Vibely'ye ait olmalı.
