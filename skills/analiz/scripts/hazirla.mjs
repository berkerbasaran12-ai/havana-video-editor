#!/usr/bin/env node
// /havana:analiz yardımcı script'i. Her şey yerelde, ffmpeg ile çalışır; hiçbir dosya dışarı gönderilmez.
//
//   node hazirla.mjs genel  <video> [çıktı-klasörü] [--dil tr|en|auto] [--adim 0.5] [--transkript yok]
//       Bilgi, kesme noktaları, transkript ve bütün videonun kontak sayfaları.
//   node hazirla.mjs yogun  <video> <çıktı-klasörü> <baş> <son> [adım=0.1]
//       Bir aralığın yoğun kare şeridi (geçişler, kısa efektler için).
//   node hazirla.mjs kare   <video> <çıktı-klasörü> <saniye> [saniye...]
//       Tam çözünürlükte tek kareler (font, konum, ölçü için).

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [, , cmd, ...rest] = process.argv;
const flags = {};
const args = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) flags[rest[i].slice(2)] = rest[++i];
  else args.push(rest[i]);
}

const die = (msg) => { console.error('HATA: ' + msg); process.exit(1); };
const run = (bin, a, cwd) => {
  const r = spawnSync(bin, a, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.error) die(`${bin} çalıştırılamadı (${r.error.code}). ffmpeg kurulu ve PATH'te mi?`);
  return r;
};
const ff = (a, cwd) => {
  const r = run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], cwd);
  if (r.status !== 0) die('ffmpeg: ' + (r.stderr || '').trim().split('\n').slice(-3).join(' | '));
  return r;
};
const fmt = (t) => (Math.round(t * 10) / 10).toFixed(1);
const slug = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'video';

function probe(video) {
  const r = run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', video]);
  if (r.status !== 0) die('ffprobe videoyu okuyamadı: ' + video);
  const j = JSON.parse(r.stdout);
  const v = j.streams.find((s) => s.codec_type === 'video');
  if (!v) die('Videoda görüntü akışı yok.');
  const [n, d] = (v.avg_frame_rate || '30/1').split('/').map(Number);
  // Telefon videolarında dönüş bilgisi: 90/270 ise genişlik ve yükseklik yer değiştirir.
  const rot = Math.abs(Number(v.tags?.rotate || v.side_data_list?.find((s) => s.rotation !== undefined)?.rotation || 0)) % 180;
  return {
    sure: Number(j.format.duration),
    genislik: rot ? v.height : v.width,
    yukseklik: rot ? v.width : v.height,
    fps: d ? Math.round((n / d) * 100) / 100 : 30,
    ses: j.streams.some((s) => s.codec_type === 'audio'),
  };
}

// Whisper modeli: önce $HAVANA_WHISPER_MODEL, sonra ~/.cache/whisper içindeki ilk ggml-*.bin.
function whisperModel() {
  if (process.env.HAVANA_WHISPER_MODEL && fs.existsSync(process.env.HAVANA_WHISPER_MODEL)) return process.env.HAVANA_WHISPER_MODEL;
  const dir = path.join(os.homedir(), '.cache', 'whisper');
  if (!fs.existsSync(dir)) return null;
  const bins = fs.readdirSync(dir).filter((f) => /^ggml-.*\.bin$/.test(f)).sort((a, b) => (/turbo|large/.test(b) ? 1 : 0) - (/turbo|large/.test(a) ? 1 : 0));
  return bins.length ? path.join(dir, bins[0]) : null;
}
const hasWhisperFilter = () => / whisper /.test(run('ffmpeg', ['-hide_banner', '-filters']).stdout || '');

function transcribe(video, out, dil) {
  const model = whisperModel();
  if (!hasWhisperFilter()) return 'ffmpeg bu kurulumda whisper filtresi içermiyor';
  if (!model) return 'Whisper modeli bulunamadı (~/.cache/whisper/ggml-*.bin ya da HAVANA_WHISPER_MODEL)';
  // Filtre yollarındaki ":" kaçış gerektirir; model klasöründe çalışıp göreli yol vererek bundan kaçınıyoruz.
  const mdir = path.dirname(model);
  const tmp = `havana-transkript-${process.pid}.srt`;
  ff(['-i', video, '-vn', '-af', `aresample=16000,whisper=model=${path.basename(model)}:language=${dil}:queue=8:destination=${tmp}:format=srt`, '-f', 'null', '-'], mdir);
  fs.renameSync(path.join(mdir, tmp), path.join(out, 'transkript.srt'));
  return null;
}

function cuts(video, out) {
  // Sahne skoru 0.25 üstü kareler: sert kesmeler ve büyük geçişler. Dosya göreli yazılır (yine ":" kaçışı yüzünden).
  ff(['-i', video, '-an', '-vf', "select='gt(scene,0.25)',metadata=print:file=kesimler.txt", '-f', 'null', '-'], out);
  const txt = fs.readFileSync(path.join(out, 'kesimler.txt'), 'utf8');
  fs.unlinkSync(path.join(out, 'kesimler.txt'));
  const list = [];
  let t = null;
  for (const line of txt.split('\n')) {
    const m = line.match(/pts_time:([\d.]+)/);
    if (m) t = Number(m[1]);
    const s = line.match(/lavfi\.scene_score=([\d.]+)/);
    if (s && t !== null) list.push({ t: Number(fmt(t)), skor: Math.round(Number(s[1]) * 100) / 100 });
  }
  // Bir geçiş birkaç ardışık kareyi tetikler (ışık sızması, blur). 0.5 s içindekileri tek kesme sayıp
  // aralığı ve en yüksek skoru tutuyoruz; aralık uzunsa bu sert kesme değil bir geçiştir.
  const merged = [];
  for (const c of list) {
    const last = merged[merged.length - 1];
    if (last && c.t - last.son <= 0.5) { last.son = c.t; if (c.skor > last.skor) { last.skor = c.skor; last.t = c.t; } }
    else merged.push({ t: c.t, bas: c.t, son: c.t, skor: c.skor });
  }
  return merged;
}

// Kontak sayfası: her sayfa 6 sütun × 4 satır, soldan sağa ve yukarıdan aşağıya okunur.
// Sayfa adı aralığı verir; her karenin zamanı = sayfa başı + sıra × adım.
function sheets(video, out, info, adim) {
  const dir = path.join(out, 'genel');
  fs.mkdirSync(dir, { recursive: true });
  const per = 24;
  const total = Math.ceil(info.sure / adim);
  const w = 240;
  const files = [];
  for (let p = 0; p * per < total; p++) {
    const bas = p * per * adim;
    const son = Math.min(info.sure, (p + 1) * per * adim) - adim;
    const name = `sayfa-${String(p + 1).padStart(2, '0')}_${fmt(bas)}-${fmt(son)}s.jpg`;
    ff(['-ss', fmt(bas), '-t', fmt(per * adim), '-i', video, '-an', '-vf', `fps=1/${adim},scale=${w}:-2,tile=6x4:padding=4:color=white`, '-frames:v', '1', '-q:v', '3', path.join(dir, name)]);
    files.push(name);
  }
  return files;
}

function genel() {
  const video = args[0];
  if (!video || !fs.existsSync(video)) die('Video bulunamadı: ' + video);
  const out = path.resolve(args[1] || path.join('analiz', slug(path.parse(video).name)));
  fs.mkdirSync(out, { recursive: true });
  const adim = Number(flags.adim || 0.5);
  const info = probe(video);
  const kesimler = cuts(video, out);
  const sayfalar = sheets(video, out, info, adim);
  console.log(`Kesme ve kontak sayfaları hazır: ${out}`);
  const tErr = !info.ses ? 'videoda ses yok'
    : flags.transkript === 'yok' ? 'kullanıcı atladı (--transkript yok)'
    : (console.log('Transkript çıkarılıyor (Whisper işlemcide çalışır; 30 sn video ≈ 2–3 dk)...'), transcribe(video, out, flags.dil || 'auto'));
  const bilgi = { video: path.resolve(video), ...info, olcek_1080: Math.round((1080 / info.genislik) * 1000) / 1000, kontak: { adim, sutun: 6, satir: 4, sayfalar }, kesimler, transkript: tErr ? null : 'transkript.srt', transkript_hatasi: tErr };
  fs.writeFileSync(path.join(out, 'bilgi.json'), JSON.stringify(bilgi, null, 2));
  console.log(`Çıktı: ${out}`);
  console.log(`Süre ${fmt(info.sure)} s · ${info.genislik}×${info.yukseklik} · ${info.fps} fps · ses ${info.ses ? 'var' : 'yok'}`);
  console.log(`Kesme adayları (${kesimler.length}): ${kesimler.map((k) => (k.son - k.bas >= 0.2 ? `${k.bas}–${k.son} (geçiş?)` : k.t)).join(', ') || '-'}`);
  console.log(`Kontak sayfaları (her kare ${adim} s, 6×4): ${sayfalar.join(', ')}`);
  console.log(tErr ? `Transkript YOK: ${tErr}` : 'Transkript: transkript.srt');
}

function yogun() {
  const [video, outArg, a, b, s] = args;
  if (!video || !outArg || a === undefined || b === undefined) die('kullanım: yogun <video> <çıktı> <baş> <son> [adım]');
  const adim = Number(s || 0.1), bas = Number(a), son = Number(b);
  const n = Math.max(1, Math.round((son - bas) / adim));
  const cols = Math.min(n, 8), rows = Math.ceil(n / cols);
  const dir = path.join(path.resolve(outArg), 'yogun');
  fs.mkdirSync(dir, { recursive: true });
  const name = `${fmt(bas)}-${fmt(son)}s_${adim}.jpg`;
  ff(['-ss', fmt(bas), '-t', String(n * adim), '-i', video, '-an', '-vf', `fps=1/${adim},scale=200:-2,tile=${cols}x${rows}:padding=3:color=white`, '-frames:v', '1', '-q:v', '3', path.join(dir, name)]);
  console.log(`${path.join(dir, name)}  (${n} kare, ${cols} sütun, kare i = ${fmt(bas)} + i×${adim} s)`);
}

function kare() {
  const [video, outArg, ...times] = args;
  if (!video || !outArg || !times.length) die('kullanım: kare <video> <çıktı> <saniye> [saniye...]');
  const dir = path.join(path.resolve(outArg), 'kareler');
  fs.mkdirSync(dir, { recursive: true });
  for (const t of times) {
    const f = path.join(dir, `t${fmt(Number(t))}.png`);
    ff(['-ss', String(t), '-i', video, '-frames:v', '1', f]);
    console.log(f);
  }
}

({ genel, yogun, kare }[cmd] || (() => die('komut: genel | yogun | kare')))();
