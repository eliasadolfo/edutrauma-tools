#!/usr/bin/env node
/* ============================================================
   EduTrauma Tools — Auditoría de coherencia
   Uso:  node design/auditar.mjs      (desde ~/Desktop/EduTrauma_Tools)

   Detecta mecánicamente que las tools no diverjan. Sin opiniones:
   o cumplen la regla o no. Correr ANTES de cada deploy.
   ============================================================ */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { createHash } from 'crypto';

const TOOLS = ['abdomen', 'aast', 'calculadoras'];
const problemas = [];
const ok = [];

const md5 = (p) => createHash('md5').update(readFileSync(p)).digest('hex');
const leer = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const check = (cond, bien, mal) => (cond ? ok.push(bien) : problemas.push(mal));

/* 1. Los archivos compartidos deben ser IDÉNTICOS en todas las copias */
for (const shared of ['edutrauma-ui.css', 'feedback.js']) {
  const base = `design/${shared}`;
  if (!existsSync(base)) { problemas.push(`Falta el canónico design/${shared}`); continue; }
  const hBase = md5(base);
  const desincronizadas = TOOLS.filter(t => {
    const p = `${t}/design/${shared}`;
    return !existsSync(p) || md5(p) !== hBase;
  });
  check(desincronizadas.length === 0,
    `${shared}: idéntico en las ${TOOLS.length} tools`,
    `⚠ ${shared} DESINCRONIZADO en: ${desincronizadas.join(', ')} → copiar design/${shared} a cada tool`);
}

/* 2. Reglas de coherencia por tool */
for (const t of TOOLS) {
  const h = leer(`${t}/index.html`);
  const sw = leer(`${t}/sw.js`);
  if (!h) { problemas.push(`${t}: falta index.html`); continue; }

  check(h.includes('etToolFooter'), `${t}: usa el pie compartido`,
    `⚠ ${t}: NO usa etToolFooter() → tendrá un pie distinto al resto`);
  check(!h.includes('lang-switch'), `${t}: sin selector de idioma (correcto)`,
    `⚠ ${t}: tiene selector de idioma → el idioma vive SOLO en el hub`);
  check(!h.includes('class="hub-link" href="../"'), `${t}: sin link suelto al hub`,
    `⚠ ${t}: tiene un <a class="hub-link"> suelto → debe ir dentro del pie compartido`);
  check(h.includes('etFbInit'), `${t}: feedback configurado`,
    `⚠ ${t}: no llama etFbInit() → no se sabrá de qué herramienta opinan`);
  check(h.includes('design/feedback.js') && !h.includes('feedback.js" defer'),
    `${t}: carga feedback.js sin defer`,
    `⚠ ${t}: feedback.js falta o usa defer → se carga tarde y no funciona`);
  check(h.includes('brand-strip') && h.includes('brand-ribbon'),
    `${t}: cabecera de marca correcta`,
    `⚠ ${t}: le falta brand-strip o brand-ribbon`);
  check(h.includes('Todos los derechos reservados'), `${t}: aviso legal presente`,
    `⚠ ${t}: FALTA el aviso legal en el footer`);
  check(/no reemplaza el juicio|does not replace|não substitui/.test(h),
    `${t}: disclaimer clínico presente`,
    `⚠ ${t}: FALTA el disclaimer clínico`);
  check(sw.includes('NETWORK-FIRST') || sw.includes('network-first'),
    `${t}: service worker network-first`,
    `⚠ ${t}: el SW no es network-first → los usuarios quedarán pegados en versión vieja`);
  check(/etFbAfterUse/.test(h), `${t}: pide opinión tras el primer resultado`,
    `⚠ ${t}: no llama etFbAfterUse() → nunca pedirá opinión`);
}

/* 3. El hub sí debe tener el idioma, y listar todas las tools */
const hub = leer('index.html');
check(hub.includes('lang-switch'), 'hub: conserva el selector de idioma',
  '⚠ hub: perdió el selector de idioma (es el único lugar donde debe estar)');
for (const t of TOOLS) {
  const href = t === 'calculadoras' ? 'calculadoras/' : `${t}/`;
  check(hub.includes(`href:"${href}"`), `hub: enlaza ${t}`,
    `⚠ hub: no enlaza la tool ${t} → nadie la encontrará`);
}

/* 4. Clases CSS usadas por las tools que no existen en el sistema de diseño */
const css = leer('design/edutrauma-ui.css');
const claves = ['tool-foot', 'brand-strip', 'brand-ribbon', 'result-card', 'fb-faces', 'calc-btn', 'organ-btn'];
const faltantes = claves.filter(c => !css.includes('.' + c));
check(faltantes.length === 0, 'CSS: todos los componentes clave definidos',
  `⚠ CSS: faltan componentes: ${faltantes.join(', ')}`);

/* ---------- Reporte ---------- */
console.log('\n=== AUDITORÍA DE COHERENCIA — EduTrauma Tools ===\n');
console.log(`✅ ${ok.length} comprobaciones OK`);
if (problemas.length === 0) {
  console.log('🎉 Sin divergencias. Las tools son coherentes entre sí.\n');
  process.exit(0);
} else {
  console.log(`\n❌ ${problemas.length} PROBLEMA(S):\n`);
  problemas.forEach(p => console.log('   ' + p));
  console.log('');
  process.exit(1);
}
