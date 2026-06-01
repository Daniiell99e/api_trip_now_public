/**
 * Gerador de hashes SRI (Subresource Integrity)
 * Uso: node gerar_sri.js
 *
 * Busca os arquivos CDN usados no TripNow,
 * calcula o hash SHA-384 e imprime as tags prontas.
 */

const https = require('https');
const crypto = require('crypto');

// ─────────────────────────────────────────────
//  Recursos externos encontrados no frontend
// ─────────────────────────────────────────────
const recursos = [
  {
    descricao: 'Font Awesome 6.5.2 (CSS) — usado em admin, cadastro, home, perfil etc.',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
    tag: 'link',
  },
  {
    descricao: 'Font Awesome 6.5.0 (CSS) — usado em index.html',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
    tag: 'link',
  },
  {
    descricao: 'Chart.js 4.5.1 (JS) — usado em admin.html  ⚠ versão fixada (era sem versão)',
    url: 'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js',
    tag: 'script',
  },
];

// Google Fonts é excluído propositalmente:
// a resposta CSS varia por user-agent (woff vs woff2),
// então o hash nunca bate — SRI não é aplicável para ela.

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Segue redirect
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} para ${url}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sha384base64(buffer) {
  return crypto.createHash('sha384').update(buffer).digest('base64');
}

function gerarTag(recurso, hash) {
  const integrity = `sha384-${hash}`;
  if (recurso.tag === 'link') {
    return `<link rel="stylesheet" href="${recurso.url}"\n      integrity="${integrity}"\n      crossorigin="anonymous">`;
  } else {
    return `<script src="${recurso.url}"\n        integrity="${integrity}"\n        crossorigin="anonymous"></script>`;
  }
}

async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  SRI Hash Generator — TripNow Frontend');
  console.log('══════════════════════════════════════════════════════\n');

  for (const recurso of recursos) {
    console.log(`📦 ${recurso.descricao}`);
    console.log(`   URL: ${recurso.url}`);
    try {
      const buffer = await fetchUrl(recurso.url);
      const hash = sha384base64(buffer);
      const tag = gerarTag(recurso, hash);
      console.log('\n   ✅ Tag pronta para colar no HTML:\n');
      console.log('   ' + tag.split('\n').join('\n   '));
      console.log('\n' + '─'.repeat(60) + '\n');
    } catch (err) {
      console.log(`   ❌ Erro ao buscar: ${err.message}\n`);
    }
  }

  console.log('📝 NOTA sobre Google Fonts:');
  console.log('   SRI não se aplica ao Google Fonts porque o CSS');
  console.log('   retornado varia por navegador (woff vs woff2).');
  console.log('   O risco é baixo — mantenha apenas o <link> normal.\n');

  console.log('⚠  PRÓXIMO PASSO:');
  console.log('   Substitua as tags antigas pelas geradas acima');
  console.log('   nos arquivos HTML do frontend.\n');
  console.log('   Lembre de corrigir também o admin.html para usar');
  console.log('   a URL com versão fixada do Chart.js (4.5.1).\n');
  console.log('══════════════════════════════════════════════════════\n');
}

main();
