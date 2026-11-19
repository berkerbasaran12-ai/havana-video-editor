// guide/styles.js → styles.md
// Stil listesinin tek kaynağı guide/styles.js. Onu düzenledikten sonra bunu çalıştır:
//   node scripts/build-styles-md.js
const fs = require('fs');
const path = require('path');

const skill = path.join(__dirname, '..', 'skills', 'havana-video-editor');
global.window = {};
require(path.join(skill, 'guide', 'styles.js'));
const { cats, updated } = window.STYLES;

// Bir stilin hazır referans kurgusu varsa satırın sonuna eklenir.
const templates = {
  V24: 'templates/V24-branch-notes.html',
  X20: 'templates/X20-insert-block-reference.html',
};

let md = '# Havana Video Editor · Stil Listesi\n\n';
md += `Güncelleme: ${updated}. Bu dosya \`guide/styles.js\` dosyasından üretilir; elle düzenleme.\n\n`;
md += 'Her stilin bir kodu var. Kodlar serbestçe birleştirilir, örneğin `H10 C9 L4 X1 M1 S2`.\n';
md += 'Her stilin çizimli hâli `guide/index.html` sayfasında.\n';

for (const c of cats) {
  md += `\n## ${c.id} · ${c.name}\n\n${c.blurb}\n\n`;
  for (const i of c.items) {
    const ref = templates[i.code] ? ` Referans kurgu: \`${templates[i.code]}\`.` : '';
    md += `- **${i.code} ${i.name}**: ${i.what}${ref}\n`;
  }
}

fs.writeFileSync(path.join(skill, 'styles.md'), md);
console.log(`styles.md yazıldı: ${cats.reduce((n, c) => n + c.items.length, 0)} stil`);
