# Havana

Havana Dijital'in ekip içi video sistemi (Claude Code plugin'i).

- **Kurgu (Havana Video Editor):** Dikey konuşma videolarını kısa stil kodlarıyla (H10 C9 L4 X1 gibi) 9:16 kurguya çevirir. 109 stilin Türkçe görsel rehberi içinde.
- **`/havana:analiz`:** Bir referans videoyu kare kare çözer: yapı, geçişler, grafikler, altyazı, font, konum. Bulguları stil kodlarına çevirir. Her şey yerelde çalışır.

## Kurulum (bir kere)

Claude Code'da:

```
/plugin marketplace add berkerbasaran12-ai/havana-video-editor
/plugin install havana@havana
```

GitHub hesabı gerekmez, repo herkese açık.

Gerekenler:
- **ffmpeg:** whisper filtreli bir build. Windows'ta `winget install Gyan.FFmpeg` ile kurulan tam sürümde var.
- **Whisper modeli:** `~/.cache/whisper/ggml-large-v3-turbo-q5_0.bin` (ya da `HAVANA_WHISPER_MODEL` ortam değişkeni).
- **Node.js 18+**
- **HyperFrames** (kurgu için):

```
/plugin marketplace add heygen-com/hyperframes
/plugin install hyperframes@hyperframes
```

## Güncelleme

Terminalde:

```
claude plugin marketplace update havana
claude plugin update havana@havana
```

Sonra Claude Code'u yeniden başlat. Claude Code içinden de `/plugin` menüsünden güncelleyebilirsin.

`/plugin` menüsünden **havana** için otomatik güncellemeyi açarsan Claude Code her açılışta yeni sürümü kendisi çeker.

## Kullanım

- **Stilleri göster:** rehber tarayıcıda açılır. Beğendiğin stillerde **Ekle**'ye bas, **Promptu kopyala**'ya tıkla.
- **Kurgu:** Kopyaladığın metni videonun yoluyla birlikte yapıştır: `~/Downloads/ham.mp4 videosunu H10 C9 L4 X1 M1 S2 ile kurgula`
- **`/havana:analiz ~/Downloads/referans.mp4`:** Rapor `analiz/<video-adı>/rapor.html` olarak çıkar.

## Geliştirenler için

| Ne | Nerede |
|---|---|
| Stiller (tek kaynak) | `skills/havana-video-editor/guide/styles.js` |
| Stil çizimleri | `guide/sketches.js` |
| Kurgu akışı ve ev kuralları | `skills/havana-video-editor/SKILL.md` |
| Analiz akışı | `skills/analiz/SKILL.md` |
| Analiz yardımcı script'i | `skills/analiz/scripts/hazirla.mjs` |
| Rapor şablonu | `skills/analiz/rapor-sablon.html` |

- Stil değiştirdikten sonra `node scripts/build-styles-md.js` çalıştır (styles.md yeniden üretilir).
- Yayınlamadan önce `.claude-plugin/plugin.json` içindeki `version` numarasını artır (1.1.0 → 1.2.0). Sürüm artmazsa ekip güncellemeyi almaz.
