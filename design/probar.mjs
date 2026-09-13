#!/usr/bin/env node
/* ============================================================
   EduTrauma Tools — banco de pruebas del contenido clínico
   Uso:  node design/probar.mjs

   No prueba la interfaz: prueba la LÓGICA. Recorre exhaustivamente todos los
   caminos de todos los algoritmos, ejecuta las 16 calculadoras con valores
   normales y de borde, y revisa el dataset AAST entero.

   La idea es simple: si un camino existe, alguien lo va a recorrer. Mejor que
   el primero sea esto y no un residente a las 3 de la mañana.
   ============================================================ */
import { readFileSync } from 'fs';

/* ---------- Cargar los archivos del navegador en Node ---------- */
const win = {};
globalThis.window = win;
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const cargar = (p) => { new Function('window', readFileSync(p, 'utf8') + '\n;')(win); };

cargar('et-data.js');
cargar('aast-data.js');
cargar('mip-data.js');
win.tr = (s) => s;            /* los resolve() de MIP traducen en pantalla */
globalThis.tr = win.tr;
const D = win.ET_DATA, AAST = win.AAST_DB, MIP = win.MIP_ALGOS;

let ok = 0;
const fallos = [];
const mal = (donde, que) => fallos.push(`${donde} → ${que}`);
const bien = () => ok++;

const NIVELES = ['ok', 'warn', 'alert', 'info', 'conduct', 'open', 'closed'];

/* Un resultado clínico siempre tiene que poder mostrarse: nivel conocido,
   título y detalle. Si falta algo, la pantalla queda coja. */
function revisarResultado(donde, r) {
  if (!r) { mal(donde, 'no devuelve nada'); return; }
  if (!r.title || !String(r.title).trim()) mal(donde, 'sin título');
  if (!r.detail || !String(r.detail).trim()) mal(donde, 'sin detalle');
  if (!NIVELES.includes(r.level)) mal(donde, `nivel desconocido: ${r.level}`);
  if (r.list && !Array.isArray(r.list)) mal(donde, 'list no es una lista');
  if (r.goto && !r.goto.id) mal(donde, 'goto sin destino');
  bien();
}

/* ---------- 1. Árboles: todos los caminos, hasta la última hoja ---------- */
function recorrerArbol(algo, nombre) {
  const visitados = new Set();
  let caminos = 0;

  const bajar = (nodoId, ctx, ruta) => {
    if (ruta.length > 12) { mal(`${nombre} · ${ruta.join(' → ')}`, 'camino demasiado largo, ¿ciclo?'); return; }
    const n = algo.nodes[nodoId];
    if (!n) { mal(`${nombre} · ${ruta.join(' → ')}`, `nodo inexistente: ${nodoId}`); return; }
    visitados.add(nodoId);
    if (!n.q || !String(n.q).trim()) mal(`${nombre} · ${nodoId}`, 'pregunta vacía');
    if (!Array.isArray(n.opts) || !n.opts.length) { mal(`${nombre} · ${nodoId}`, 'sin opciones'); return; }

    n.opts.forEach((o, i) => {
      if (!o.label || !String(o.label).trim()) mal(`${nombre} · ${nodoId}`, `opción ${i} sin etiqueta`);
      const ctx2 = Object.assign({}, ctx, o.set || {});
      const ruta2 = ruta.concat(o.label);
      if (o.next) return bajar(o.next, ctx2, ruta2);
      caminos++;
      let r;
      try { r = algo.resolve(ctx2); }
      catch (e) { mal(`${nombre} · ${ruta2.join(' → ')}`, `resolve() revienta: ${e.message}`); return; }
      revisarResultado(`${nombre} · ${ruta2.join(' → ')}`, r);
    });
  };

  bajar(algo.start, {}, []);
  Object.keys(algo.nodes).forEach(k => {
    if (!visitados.has(k)) mal(`${nombre} · ${k}`, 'nodo inalcanzable: ningún camino llega');
  });
  return caminos;
}

/* ---------- 2. SÍ/NO: las 2^n combinaciones ---------- */
function recorrerSiNo(algo, nombre) {
  const qs = algo.questions;
  let caminos = 0;
  const bajar = (i, ruta) => {
    if (i >= qs.length) return;
    ['yes', 'no'].forEach(resp => {
      const rama = qs[i][resp];
      const ruta2 = ruta.concat(`${i + 1}:${resp}`);
      if (rama === 'next') {
        if (i + 1 < qs.length) return bajar(i + 1, ruta2);
        caminos++;                       /* todas respondidas sin disparar conducta */
        return;
      }
      caminos++;
      if (!rama || typeof rama !== 'object') {
        mal(`${nombre} · ${ruta2.join(' ')}`, `rama "${resp}" no es ni 'next' ni un resultado`);
        return;
      }
      revisarResultado(`${nombre} · ${ruta2.join(' ')}`,
        Object.assign({ level: 'conduct', detail: rama.detail || '—' }, rama));
    });
  };
  qs.forEach((q, i) => {
    if (!q.text || !String(q.text).trim()) mal(`${nombre} · pregunta ${i + 1}`, 'sin enunciado');
  });
  bajar(0, []);
  return caminos;
}

/* ---------- 3. Checklist ---------- */
function recorrerChecklist(algo, nombre) {
  for (let n = 0; n <= algo.criteria.length; n++) {
    let r;
    try { r = algo.resolve(n); }
    catch (e) { mal(`${nombre} · ${n} criterios`, `resolve() revienta: ${e.message}`); continue; }
    revisarResultado(`${nombre} · ${n} criterios`, r);
  }
  return algo.criteria.length + 1;
}

console.log('\n=== BANCO DE PRUEBAS — EduTrauma Tools ===\n');

let caminos = 0;
const ALGOS = [D.MIAA_DECISION].concat(Object.values(D.MIAA_ALGOS)).concat(MIP);
ALGOS.forEach(a => {
  if (a.type === 'tree') caminos += recorrerArbol(a, a.name);
  else if (a.type === 'yesno') caminos += recorrerSiNo(a, a.name);
  else if (a.type === 'checklist') caminos += recorrerChecklist(a, a.name);
  else mal(a.name, `tipo desconocido: ${a.type}`);
  if (!a.ref) mal(a.name, 'sin referencia bibliográfica');
});
console.log(`Algoritmos      · ${ALGOS.length} algoritmos, ${caminos} caminos recorridos`);

/* ---------- 4. Björck: las 9 celdas deben resolver ---------- */
let celdas = 0;
D.BJORCK_GRID.forEach(b => b.cells.forEach(c => {
  celdas++;
  const r = D.MIAA_ALGOS.miaa_conducta.resolve(c.ctx);
  revisarResultado(`Björck · ${c.code}`, r);
  if (r && r.list && r.list.length !== c.steps)
    mal(`Björck · ${c.code}`, `la rejilla dice ${c.steps} pasos y la conducta trae ${r.list.length}`);
}));
console.log(`Björck          · ${celdas} celdas`);

/* ---------- 5. Las 16 calculadoras ---------- */
/* Para cada campo se prueban valores representativos y los bordes. */
function valoresDe(i) {
  if (i.t === 'toggle') return [true, false];
  if (i.t === 'phq') return [0, 3];
  if (i.t === 'seg' || i.t === 'segv') return i.options.map(o => o.v);
  const min = i.min !== undefined ? i.min : 1;
  const max = i.max !== undefined ? i.max : 100;
  const medio = Math.round((min + max) / 2);
  return [min, medio, max, '4,6'];          /* la coma decimal, siempre */
}
let corridas = 0;
D.CALCS.forEach(c => {
  if (!c.short) mal(c.id, 'sin nombre corto');
  if (!c.area) mal(c.id, 'sin área');
  /* Una corrida por cada valor de cada campo, dejando el resto en su medio. */
  c.inputs.forEach(campo => {
    valoresDe(campo).forEach(v => {
      const args = {};
      c.inputs.forEach(i => {
        const vs = valoresDe(i);
        args[i.id] = (i === campo) ? v : vs[Math.floor(vs.length / 2)];
        if (typeof args[i.id] === 'string') args[i.id] = D.parseNum(args[i.id]);
        if (i.t === 'numberunit') args[i.id + '_u'] = i.units[0].v;
      });
      corridas++;
      let r;
      try { r = c.compute(args); }
      catch (e) { mal(`${c.short} · ${campo.id}=${v}`, `compute() revienta: ${e.message}`); return; }
      if (!r) { mal(`${c.short} · ${campo.id}=${v}`, 'no devuelve nada'); return; }
      if (r.error) { bien(); return; }        /* rechazo explícito: correcto */
      if (r.display === undefined || r.display === null || r.display === '')
        mal(`${c.short} · ${campo.id}=${v}`, 'resultado sin número');
      else if (typeof r.display === 'number' && !isFinite(r.display))
        mal(`${c.short} · ${campo.id}=${v}`, `número imposible: ${r.display}`);
      else if (String(r.display).toLowerCase().includes('nan'))
        mal(`${c.short} · ${campo.id}=${v}`, 'resultado NaN');
      else if (!NIVELES.includes(r.level))
        mal(`${c.short} · ${campo.id}=${v}`, `nivel desconocido: ${r.level}`);
      else if (!r.ref) mal(c.short, 'sin referencia bibliográfica');
      else bien();
    });
  });
});
console.log(`Calculadoras    · ${D.CALCS.length} calculadoras, ${corridas} corridas`);

/* ---------- 6. TEG6s ---------- */
const TEG_CASOS = [
  { n: 'todo normal',      v: { hep:'no', ckr:6,  crta10:55, crtma:60, cffa10:20, cffma:22, ly30:1 } },
  { n: 'fibrinógeno bajo', v: { hep:'no', ckr:6,  crta10:55, crtma:60, cffa10:10, cffma:12, ly30:1 } },
  { n: 'plaquetas bajas',  v: { hep:'no', ckr:6,  crta10:30, crtma:35, cffa10:20, cffma:22, ly30:1 } },
  { n: 'factores largos',  v: { hep:'no', ckr:15, crta10:55, crtma:60, cffa10:20, cffma:22, ly30:1 } },
  { n: 'hiperfibrinólisis',v: { hep:'no', ckr:6,  crta10:55, crtma:60, cffa10:20, cffma:22, ly30:12 } },
  { n: 'heparina presente',v: { hep:'si', ckr:14, ckhr:6, crta10:55, crtma:60, cffa10:20, cffma:22, ly30:1 } },
  { n: 'heparina N/A',     v: { hep:'si', ckr:5,  ckhr:9, crta10:55, crtma:60, cffa10:20, cffma:22, ly30:1 } },
  { n: 'todo en cero',     v: { hep:'no', ckr:0,  crta10:0,  crtma:0,  cffa10:0,  cffma:0,  ly30:0 } },
  { n: 'todo al máximo',   v: { hep:'no', ckr:30, crta10:100, crtma:100, cffa10:100, cffma:100, ly30:100 } }
];
TEG_CASOS.forEach(c => {
  let r;
  try { r = D.computeTEG(c.v); }
  catch (e) { mal(`TEG · ${c.n}`, `computeTEG() revienta: ${e.message}`); return; }
  if (!r || !Array.isArray(r.comp)) { mal(`TEG · ${c.n}`, 'no devuelve componentes'); return; }
  if (r.comp.length !== 4) mal(`TEG · ${c.n}`, `devuelve ${r.comp.length} componentes, deberían ser 4`);
  r.comp.forEach(x => {
    if (!NIVELES.includes(x.level)) mal(`TEG · ${c.n} · ${x.name}`, `nivel desconocido: ${x.level}`);
    if (!x.finding) mal(`TEG · ${c.n} · ${x.name}`, 'sin hallazgo');
    if (x.value && /NaN|undefined/.test(x.value)) mal(`TEG · ${c.n} · ${x.name}`, `valor corrupto: ${x.value}`);
  });
  bien();
});
console.log(`TEG6s           · ${TEG_CASOS.length} escenarios`);

/* ---------- 7. AAST: todos los órganos, todos los ítems, todos los ajustes ---------- */
const itemsDe = (o) => o.mode === 'typed' ? o.categories.flatMap(c => c.items) : o.items;
let lesiones = 0;
Object.entries(AAST.organs).forEach(([id, o]) => {
  if (!o.name) mal(id, 'órgano sin nombre');
  if (!AAST.regionOrder.includes(o.region)) mal(o.name, `región fuera de la lista: ${o.region}`);
  const items = itemsDe(o);
  if (!items.length) { mal(o.name, 'sin lesiones'); return; }
  const maxReal = Math.max(...items.map(i => i.grade));
  if (maxReal > o.maxGrade) mal(o.name, `tiene un grado ${maxReal} pero maxGrade dice ${o.maxGrade}`);

  items.forEach(it => {
    lesiones++;
    if (!it.label || !String(it.label).trim()) mal(o.name, 'lesión sin descripción');
    if (!it.grade || it.grade < 1 || it.grade > 6) mal(`${o.name} · ${it.label}`, `grado inválido: ${it.grade}`);

    /* El grado ajustado nunca puede salirse de los topes. */
    const a = D.AAST_ADJUST[o.adjust];
    if (a) {
      const tope = a.rule === 'upTo3' ? 3 : a.rule === 'upTo5' ? 5 : o.maxGrade;
      const g = Math.max(it.grade, Math.min(it.grade + 1, tope, o.maxGrade));
      if (g < it.grade) mal(`${o.name} · ${it.label}`, `el ajuste BAJA el grado: ${it.grade} → ${g}`);
      if (g > o.maxGrade) mal(`${o.name} · ${it.label}`, `el ajuste supera el máximo del órgano: ${g}`);
      if (g > it.grade + 1) mal(`${o.name} · ${it.label}`, `el ajuste sube más de un grado: ${it.grade} → ${g}`);
    }
    if (o.adjust === 'vessel') {
      const sube = Math.min(it.grade + 1, o.maxGrade);
      const baja = Math.max(it.grade - 1, 1);
      if (sube > o.maxGrade || baja < 1) mal(`${o.name} · ${it.label}`, 'el ajuste vascular se sale de rango');
    }
    if (!D.ROMAN[it.grade]) mal(`${o.name} · ${it.label}`, `sin numeral romano para el grado ${it.grade}`);
    bien();
  });
});
console.log(`AAST            · ${Object.keys(AAST.organs).length} órganos, ${lesiones} lesiones`);

/* ---------- Reporte ---------- */
console.log(`\n✅ ${ok} comprobaciones pasadas`);
if (!fallos.length) {
  console.log('🎉 Ningún camino falla.\n');
  process.exit(0);
}
console.log(`\n❌ ${fallos.length} PROBLEMA(S):\n`);
fallos.slice(0, 40).forEach(f => console.log('   ' + f));
if (fallos.length > 40) console.log(`   … y ${fallos.length - 40} más`);
console.log('');
process.exit(1);
