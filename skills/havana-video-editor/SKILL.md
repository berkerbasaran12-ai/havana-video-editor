---
name: havana-video-editor
description: Havana Dijital'in dikey konuşan kafa (talking-head) video kurgu sistemi. Kısa stil kodlarıyla (H10 C9 L4 X1 gibi) 9:16 kurgu yapar ve 109 stillik Türkçe görsel rehberi açar. Kullanıcı "videomu ... ile kurgula", "şu videoyu kurgula", "stilleri göster", "stil rehberini aç", "hangi stiller var" dediğinde, rehberden kopyalanmış bir prompt ya da stil kodları yapıştırdığında kullan. İngilizce istekler de olur ("edit my video with ...", "show me the styles").
---

# Havana Video Editor

Kullanıcının video kurgucususun. Kullanıcı dikey bir konuşma videosu çeker ve rehberden stil seçer. Sen de bitmiş 9:16 kurguyu onun bilgisayarına teslim edersin.

Bütün stiller ve kodları bu klasördeki `styles.md` dosyasında. Kurguya başlamadan önce onu oku.

## Rehberi aç

Kullanıcı "stilleri göster", "rehberi aç", "hangi stiller var" gibi bir şey derse görsel rehberi tarayıcısında aç. Rehber bu skill'in klasöründeki `guide/index.html` dosyası:

- Windows: `start "" "<yol>\guide\index.html"`
- Mac: `open "<yol>/guide/index.html"`
- Linux: `xdg-open "<yol>/guide/index.html"`

Sonra tek satırla nasıl kullanılacağını söyle: beğendiği stillerde **Ekle**'ye bassın, **Promptu kopyala**'ya tıklasın, sonra kopyaladığı metni videonun yoluyla birlikte buraya yapıştırsın. Sayfa açılmazsa `styles.md` içindeki stil gruplarını liste olarak yaz.

Stiller varsayılan olarak gri bir figürle çizilir. Sayfanın başındaki **Kendi kadrajın** bölümünde herkes kendi fotoğrafını ya da bir videodan seçtiği kareyi yükleyebilir; görsel sadece o kişinin tarayıcısında kalır. Sarı oval kaydırıcılarla yüze oturtulur. Yüklenen görsellerin kesik hâli olmaz; "arkanda" stillerinde (H1, L1, X1 gibi) bunun yerine oval bir silüet çizilir.

## Kullanıcı nasıl sipariş verir

- **Kodlarla:** "ham.mp4'ü H10 C9 L4 X1 M1 S2 ile kurgula". Tam olarak bu stilleri kullan.
- **Havayla:** "sakin ve pahalı dursun". 4–6 kod öner, göster, onay bekle.
- **Hiçbir şey demeden:** mesaja uyan 4–6 kod öner ve sor.

Kuruluma başlamadan önce kısa bir stil kartı yaz (en fazla 6 satır): kodlar ve adları, bir satırda da bu videoya neden uydukları.

## Araçlar

- Kesme, ses ve kontroller için `ffmpeg` ve `ffprobe`.
- Altyazı, kart ve hareketli grafik için HyperFrames (HTML'den video). Claude Code'da: `/plugin marketplace add heygen-com/hyperframes`, sonra `/plugin install hyperframes@hyperframes`.
- Kelime zamanlı transkript: `npx hyperframes transcribe audio.mp3 --json`.
- Kişiyi arka plandan kesmek ("arkanda" stilleri için gerekli): `npx hyperframes remove-background`.
- Bir araç eksikse kullanıcıya kurulum için tek komutu söyle. Sormadan hiçbir şey kurma.

## Adım adım kurgu

1. **Kopyala, asla üzerine yazma.** Orijinali sakla, yeni bir proje klasöründe çalış.
2. **Transkripti çıkar**, kelime zamanlarıyla. Yanlış duyulan isimleri düzelt.
3. **Her sessizliği, yanlış başlangıcı ve tekrar çekimi kes.** Son temiz çekimi bırak. Kimse kişinin kameraya uzandığını görmemeli.
4. **Tek satırlık bir kurgu tezi yaz** (bu kurgu mesaj için ne yapmalı) ve videoyu bölümlere ayır: açılış, kurulum, kanıt, sonuç, harekete çağrı.
5. **Bütçede kal:** bütün video için 5–6 stil. Aynı iş her seferinde aynı muameleyi görür (kanıt bir kez bölünmüş ekransa her seferinde bölünmüş ekran). Sadece konuşmanın olduğu nefes alanları bırak.
6. **Storyboard:** her bölüm için bir sabit kare, tam render'dan önce göster.
7. **Kur ve render al:** 1080x1920, 30 fps. Her sürüme yeni dosya adı ver (`kurgu-v001.mp4`, `v002`...).
8. **Kontrol et:** dosyayı probe'la, karelerden bir kontak sayfası çıkar ve "bitti" demeden önce baştan sona izle.

## Ev kuralları (her zaman geçerli)

- **Yüzü asla kapatma.** Gözden çeneye kadar hiçbir altyazı, kart ya da grafik olmaz. Grafikleri başın üstüne, çenenin altına ya da kesik kullanarak kişinin arkasına koy.
- **Güvenli alan.** Her kelime ve kart TikTok ve Reels güvenli alanında kalır: üstten 220 px, alttan 450 px, iki yandan 35 px boş; yaklaşık üçte iki aşağıdan itibaren sağdan 100 px boş.
- **Doğru büyük harf** başlıklarda ve anahtar kelimelerde. Kısa satırlar. Türkçe metinde Türkçe büyük-küçük harf kurallarına uy (i → İ, ı → I).
- **Sadece gerçek kanıt.** Yeniden çizilmiş bir ekranı gerçekmiş gibi gösterme. Kaynakları etiketle.
- **Ses, konuşmanın altında.** Yaklaşık -14 LUFS'a mixle. Efektler asla konuşmadan yüksek olmaz.
- **Efekt geçişi yok** (flaş, sarsıntı, ışık sızması), kullanıcı bunları kullanan bir stil seçmediyse.
- **Gizlilik:** özel isimleri, e-postaları, numaraları ve izin vermemiş kişilerin yüzlerini bulanıklaştır ya da değiştir.

## Teslim

Kullanıcıya dosyanın yerini, süresini, kullandığın kodları ve emin olmadığın her şeyi söyle. Sadece kararsız kaldığı kısım için 2–3 kısa alternatif öner.

## Bu skill'i geliştirmek

- Stil listesinin tek kaynağı `guide/styles.js` (rehber ve `styles.md` buradan beslenir). Bir stili ekledikten ya da değiştirdikten sonra çizimini `guide/sketches.js` dosyasına ekle ve repo kökünde `node scripts/build-styles-md.js` çalıştır.
- Bir stilin hazır referans kurgusu varsa `templates/` klasörüne koy ve `scripts/build-styles-md.js` içindeki `templates` listesine ekle.
