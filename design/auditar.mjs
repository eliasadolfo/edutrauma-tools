#!/usr/bin/env node
/* ============================================================
   EduTrauma Tools — Auditoría de coherencia
   Uso:  node design/auditar.mjs      (desde ~/Desktop/EduTrauma_Tools)

   Detecta mecánicamente que la app no se rompa ni se desalinee. Sin
   opiniones: o cumple la regla o no. Correr ANTES de cada deploy.

   v2 (2026-09): el producto dejó de ser cinco páginas sueltas y pasó a ser
   una sola app con pestañas. Lo que antes se comprobaba por tool ahora se
   comprueba sobre la app; las carpetas de herramienta quedaron como
   redirecciones y se auditan como tales.
   ============================================================ */
import { readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';

/* Carpetas que conservan su URL y ahora solo redirigen a la app. */
const REDIRECTS = {
  abdomen: 'abdomen', aast: 'aast', mip: 'mip', teg: 'teg', calculadoras: 'calc'
};
/* Los archivos que componen la app. */
const APP_JS = ['i18n.js','et-data.js','aast-data.js','mip-data.js',
                'tools.js','tools2.js','cases.js','guias.js','camas.js','app.js'];

const problemas = [];
const ok = [];
const md5 = (p) => createHash('md5').update(readFileSync(p)).digest('hex');
const leer = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const check = (cond, bien, mal) => (cond ? ok.push(bien) : problemas.push(mal));

/* 1. El sistema de diseño canónico debe existir y estar completo */
for (const shared of ['edutrauma-ui.css', 'et-app.css', 'feedback.js', 'DESIGN.md']) {
  check(existsSync(`design/${shared}`),
    `design/${shared} presente`,
    `⚠ Falta design/${shared}`);
}
/* Las copias que quedan dentro de las carpetas de herramienta ya no se usan,
   pero si existen no deben divergir: alguien las leerá creyendo que mandan. */
for (const t of Object.keys(REDIRECTS)) {
  const p = `${t}/design/edutrauma-ui.css`;
  if (!existsSync(p)) continue;
  check(md5(p) === md5('design/edutrauma-ui.css'),
    `${t}: su copia del CSS coincide con la canónica`,
    `⚠ ${t}/design/edutrauma-ui.css DIVERGE de la canónica → copiarla o borrarla`);
}

/* 2. La app: archivos presentes y enlazados en el orden correcto */
const hub = leer('index.html');
check(hub.includes('class="et-app"'), 'index.html es la app móvil',
  '⚠ index.html NO es la app → ¿se revirtió la migración?');
for (const f of APP_JS) {
  check(existsSync(f), `${f} presente`, `⚠ Falta ${f}`);
  check(hub.includes(`src="${f}"`), `index.html carga ${f}`,
    `⚠ index.html NO carga ${f} → la app fallará al arrancar`);
}
/* app.js va al final: usa lo que definen los demás. */
check(hub.lastIndexOf('src="app.js"') > hub.lastIndexOf('src="tools.js"'),
  'app.js se carga después de tools.js',
  '⚠ app.js se carga antes que tools.js → TOOLS no existirá al arrancar');

check(hub.includes('brand-strip') || hub.includes('et-strip'),
  'app: franja de marca presente', '⚠ app: falta la franja de marca');
check(hub.includes('EduTrauma Tools'), 'app: cinta con el nombre del producto',
  '⚠ app: la cinta perdió "EduTrauma Tools"');
check(hub.includes('design/feedback.js'), 'app: carga la encuesta',
  '⚠ app: no carga design/feedback.js → nadie podrá opinar');

/* 3. Las cuatro pestañas y las cinco herramientas siguen existiendo */
const i18n = leer('i18n.js');
const tools = leer('tools.js') + leer('tools2.js');
for (const tab of ['kit', 'casos', 'guias', 'perfil']) {
  check(i18n.includes(`${tab}:`), `i18n define la pestaña ${tab}`,
    `⚠ i18n perdió la pestaña ${tab}`);
}
for (const id of ['abdomen', 'aast', 'mip', 'teg', 'calc']) {
  check(tools.includes(`${id}:`) || tools.includes(`'${id}'`),
    `la app registra la herramienta ${id}`,
    `⚠ la app NO registra ${id} → desapareció del Kit`);
}

/* 4. Las URLs viejas siguen vivas y apuntan a su herramienta.
   Es lo que impide romper los QR y enlaces ya repartidos. */
for (const [dir, hash] of Object.entries(REDIRECTS)) {
  const h = leer(`${dir}/index.html`);
  check(h.includes(`#${hash}`),
    `${dir}/ redirige a #${hash}`,
    `⚠ ${dir}/ no redirige a #${hash} → se rompen los QR y enlaces repartidos`);
  check(/location\.replace|http-equiv="refresh"/.test(h),
    `${dir}/ redirige automáticamente`,
    `⚠ ${dir}/ no redirige solo → el usuario verá una página en blanco`);
}
check(leer('clasico.html').includes('tool-card') || leer('clasico.html').length > 1000,
  'el hub anterior sigue disponible en /clasico.html',
  '⚠ Falta clasico.html → no hay a dónde mandar a nadie si algo falla');

/* 5. Textos: los tres idiomas deben tener exactamente las mismas claves */
try {
  const I18N = new Function(i18n + '; return I18N;')();
  const rec = (a, b, ruta) => {
    for (const k of Object.keys(a)) {
      if (!(k in b)) { problemas.push(`⚠ i18n: falta "${ruta}${k}" en uno de los idiomas`); continue; }
      if (a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) rec(a[k], b[k], `${ruta}${k}.`);
    }
  };
  rec(I18N.es, I18N.en, ''); rec(I18N.es, I18N.pt, '');
  rec(I18N.en, I18N.es, ''); rec(I18N.pt, I18N.es, '');
  check(true, 'i18n: es/en/pt tienen las mismas claves', '');
} catch (e) {
  problemas.push(`⚠ i18n.js no se puede evaluar: ${e.message}`);
}

/* 6. Una sola lista de especialidades en toda la serie.
   La app es la fuente de verdad; si una página vieja ofrece opciones que la
   app no tiene, el panel cuenta esa profesión aparte y los números no cuadran. */
const ANCLAS = { es: 'Cirugía general', en: 'General surgery', pt: 'Cirurgia geral' };
function listasEspecialidad(src) {
  const out = {};
  for (const [lang, ancla] of Object.entries(ANCLAS)) {
    const re = new RegExp(`\\[[^\\[\\]]*"${ancla}"[^\\[\\]]*\\]`, 'g');
    const listas = [...src.matchAll(re)]
      .map(m => { try { return JSON.parse(m[0]); } catch { return null; } })
      .filter(Array.isArray);
    if (listas.length) out[lang] = listas;
  }
  return out;
}
const canon = listasEspecialidad(i18n);
check(Object.keys(canon).length === 3,
  'la app define las especialidades en los tres idiomas',
  '⚠ i18n.js: no encuentro las 3 listas de especialidades (es/en/pt)');

for (const t of Object.keys(REDIRECTS)) {
  const encontradas = listasEspecialidad(leer(`${t}/index.html`));
  const diverge = [];
  for (const [lang, listas] of Object.entries(encontradas)) {
    const ref = canon[lang] && JSON.stringify(canon[lang][0]);
    for (const l of listas) {
      if (JSON.stringify(l) !== ref) {
        const extra = l.filter(s => !(canon[lang] || [[]])[0].includes(s));
        diverge.push(`${lang}${extra.length ? ` sobra: ${extra.join(', ')}` : ''}`);
      }
    }
  }
  check(diverge.length === 0,
    `${t}: sin lista de especialidades propia`,
    `⚠ ${t}: tiene una lista de especialidades que DIVERGE (${diverge.join(' · ')})`);
}

/* 7. Service worker y manifiesto */
const sw = leer('sw.js');
check(/NETWORK-FIRST|network-first/.test(sw), 'service worker network-first',
  '⚠ el SW no es network-first → los usuarios quedarán pegados en versión vieja');
check(sw.includes('skipWaiting') && sw.includes('clients.claim'),
  'el SW se auto-activa', '⚠ el SW no se auto-activa → la actualización no llega sola');
for (const f of APP_JS) {
  check(sw.includes(`./${f}`), `el SW cachea ${f}`,
    `⚠ el SW no cachea ${f} → sin conexión la app no arrancará`);
}
const man = leer('manifest.json');
check(man.includes('"start_url"') && man.includes('"scope"'),
  'manifest con start_url y scope', '⚠ manifest incompleto');

/* 8. Lo legal y lo clínico no pueden desaparecer */
check(i18n.includes('Todos los derechos reservados') || hub.includes('Todos los derechos reservados')
      || i18n.includes('EduTrauma®'),
  'aviso de marca presente', '⚠ FALTA el aviso de marca');
check(/no reemplaza|no reemplazan|does not replace|não substitui/.test(i18n),
  'disclaimer clínico presente', '⚠ FALTA el disclaimer clínico');
check(/localStorage/.test(leer('cases.js')) && !/ET_EVENTS_URL/.test(leer('cases.js'))
      && !/supabase|sbClient/.test(leer('cases.js')),
  'los casos no se envían a ningún servidor',
  '⚠ cases.js habla con un servidor → los casos deben quedarse en el teléfono');
/* Camas SÍ habla con un servidor, a propósito. Lo que no puede es mezclarse
   con Casos: son promesas distintas al usuario. */
const camasJs = leer('camas.js');
check(!/et_cases|CASES_KEY/.test(camasJs),
  'Camas no toca el almacén de Casos',
  '⚠ camas.js toca los casos privados → Casos y Camas deben quedar separados');
check(/supabase\.co/.test(camasJs), 'Camas apunta a su propio proyecto',
  '⚠ camas.js perdió la dirección de su servidor');

/* ---------- Reporte ---------- */
console.log('\n=== AUDITORÍA DE COHERENCIA — EduTrauma Tools ===\n');
console.log(`✅ ${ok.length} comprobaciones OK`);
if (problemas.length === 0) {
  console.log('🎉 Sin divergencias. La app es coherente.\n');
  process.exit(0);
} else {
  console.log(`\n❌ ${problemas.length} PROBLEMA(S):\n`);
  problemas.forEach(p => console.log('   ' + p));
  console.log('');
  process.exit(1);
}
