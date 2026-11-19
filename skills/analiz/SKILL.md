---
name: analiz
description: Bir referans videoyu kare kare analiz eder. Yapıyı, geçişleri, ekrandaki grafikleri, altyazıları, fontları ve konumları çözer, sonra bulguları Havana stil kodlarına çevirir. Kullanıcı /havana:analiz yazdığında, "şu referans videoyu analiz et", "bu videoda ne yapılmış", "bu kurguyu çöz" dediğinde kullan. Her şey yerelde çalışır.
argument-hint: <video yolu> [dil: tr|en]
---

# Referans video analizi

Kullanıcının verdiği referans videoyu bir kurgucunun gözüyle çözersin: nasıl kurulmuş, hangi tasarım kararları verilmiş, biz bunu hangi stil kodlarıyla yaparız.

İstek: `$ARGUMENTS`. Video yolu yoksa sor. Dil verilmediyse transkripti `auto` ile çıkar.

**Her şey yerelde.** Video hiçbir servise yüklenmez: Gemini yok, watch skill'inin bulut motoru yok. Sadece ffmpeg ve yerel Whisper. Videoyu sadece okursun, değiştirmezsin.

## 1. Hazırlık

```
node "<bu skill'in klasörü>/scripts/hazirla.mjs" genel "<video>" "analiz/<video-adı>" --dil tr
```

- Çıktı, kullanıcının çalıştığı klasörde `analiz/<video-adı>/` olur.
- Script şunları üretir:
  - `bilgi.json`: süre, çözünürlük, fps, 1080 ölçeği, kesme adayları.
  - `genel/sayfa-NN_<baş>-<son>s.jpg`: kontak sayfaları. 6 sütun × 4 satır, soldan sağa okunur. i. karenin zamanı = sayfa başı + i × adım (varsayılan 0.5 s).
  - `transkript.srt`: Whisper, cümle cümle.
- Transkript yavaştır (30 saniyelik video ≈ 2–3 dakika). Kullanıcıya bekleme süresini söyle. Acelesi varsa `--transkript yok` ile atla.
- Transkript çıkmazsa (ffmpeg'de whisper filtresi ya da model yoksa) yedek yol: `npx hyperframes transcribe <video> --json`. Bu da yereldir.

## 2. Kaba yapı

- Kontak sayfalarının hepsini oku. Kesme adaylarını ve transkripti yanına koy.
- Videoyu bölümlere ayır ve bir zaman çizelgesi yaz. Örnek: `0–3.2 s konuşan kafa açılış · 3.2–15.4 s tam ekran grafik bloğu · 15.4–38.6 s konuşma + altyazı, CTA altyazıda`.
- Script sadece büyük görüntü değişimlerini yakalar. Punch-in, jump cut ve küçük zoom'ların skoru düşüktür; onları kontak sayfalarında gözle bul.
- `bilgi.json` içinde `bas` ile `son` arası 0.2 s ve üstündeyse orası büyük ihtimalle sert kesme değil bir geçiştir.

## 3. Kare kare inceleme

Önemli anları yakından gör:
- **Yoğun şerit:** her kesme ve geçiş, grafiğin girdiği ya da kurulduğu her an ve altyazı stilinin değiştiği yerler için. Aralık genelde anın 0.4 s öncesinden 0.4 s sonrasına kadar.
  ```
  node "<skill klasörü>/scripts/hazirla.mjs" yogun "<video>" "analiz/<video-adı>" <baş> <son> [adım=0.1]
  ```
- **Tam çözünürlüklü kare:** font, konum ve ölçü için. Altyazı stili başına en az bir kare al.
  ```
  node "<skill klasörü>/scripts/hazirla.mjs" kare "<video>" "analiz/<video-adı>" <saniye> [saniye...]
  ```

Her katmanı şu sorularla çöz:

**Altyazı**
- Birim: kelime kelime mi, öbek mi, cümle mi?
- Satır sayısı. Harf düzeni: küçük harf, cümle düzeni ya da büyük harf.
- Boyut ve ağırlık hiyerarşisi: anahtar kısım ne kadar büyük ve kalın?
- Renk; gölge, kontur ya da kutu.
- Vurgular: italik, tırnak, renk, "..".
- Konum: dikeyde yüzde kaç, göğüs ya da çene hizası.
- Giriş ve çıkış animasyonu.

**Font**
- Kategori: grotesk, geometrik, condensed, serif, script.
- Ayırt edici harfler: a, g, R, ş, ğ, İ.
- 1–3 aday aile ve en yakın ücretsiz alternatif (Google Fonts). Emin değilsen **tahmin** diye işaretle.

**Konum ve ölçü**
- Ölçüleri 1080×1920'ye çevir: orijinal px × `olcek_1080`.
- Güvenli alana göre yorumla: üst 220 px, alt 450 px, yanlar 35 px.
- Yüzle ilişkisini de not et: yüzün üstünde mi, altında mı, arkasında mı?

**Grafikler**
- Tür: 3D nesne, ikon, fotoğraf, ekran görüntüsü, sticker, çizim.
- Palet ve nasıl kurulduğu: kelime kelime, sayaç, çizilen çizgi.
- Kamera: kayma, yakınlaşma, zoom-through. Süresi.

**Geçişler**
- Tür: sert kesme, ışık sızması, zoom-blur, whip, maske, match cut, renk dairesi.
- Süresi kare sayısıyla. Rengi.
- Hangi kelimeye denk geldiği (transkriptten).

**Konuşmacı kurgusu**
- Punch-in ve jump cut sıklığı, kadraj, vinyet, renk düzeni.

**Ses**
- Sesi duyamazsın. Müzik ve efekt için görsel olaylar ile transkript boşluklarından çıkarım yap ve "dinleyerek teyit edilmeli" diye işaretle.

Kurallar:
- Gördüğünü yaz, uydurma. Ölçemediğin her şey **tahmin**.
- Her bulgu bir kanıt dosyasına bağlanır: kontak sayfası, şerit ya da kare.
- Ekrandaki Türkçe metni harfi harfine aktar: büyük-küçük harf, noktalama, "..".

## 4. Stil kodlarına çeviri

`../havana-video-editor/styles.md` dosyasını oku. Bu skill'in yanındaki klasörde. Her bulguyu bir koda bağla:
- **Tam:** "Altyazı = C10".
- **Yakın:** "X20'ye yakın; fark: nesneler 3D değil, siyah-beyaz fotoğraf ikon".
- **Karşılığı yok:** yeni stil adayı. Aday için kategorideki sıradaki boş kodu öner (örneğin C11) ve `guide/styles.js` biçiminde bir ad ile bir "what" cümlesi yaz. Kullanıcı onaylamadan rehbere ekleme.

## 5. Rapor

`analiz/<video-adı>/` içine iki dosya yaz:

**`ANALIZ.md`** (Claude'un sonra okuyacağı, katmanlı)
- İlk 15 satır özet: yapı, en güçlü 3 karar, kodlar, adaylar, kurgu satırı.
- Sonra bölümler: zaman çizelgesi, katman katman bulgular (her biri kanıt dosyasıyla), stil eşlemesi, yeni stil adayları.

**`rapor.html`** (insan için)
- Bu skill'deki `rapor-sablon.html` dosyasını kopyala ve doldur.
- Görseller göreli yolla eklenir (`genel/...`, `yogun/...`, `kareler/...`), rapor klasörüyle birlikte taşınabilir.
- Raporu kullanıcının tarayıcısında aç. Windows: `start "" "<yol>"`, Mac: `open "<yol>"`.

Sohbette 5–8 satırlık bir özet ver:
- Yapı (tek satır).
- En güçlü 3 karar.
- Eşleşen kodlar.
- Yeni stil adayları.
- Hazır kurgu satırı: `ham.mp4 videosunu H… C… X… ile kurgula`.
- Rapor yolu.
