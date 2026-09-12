/* ============================================================
   EduTrauma Tools — herramientas dentro del app
   Fase 2: MIAA y MIP, que comparten el motor de árboles.

   La lógica clínica NO vive aquí: viene de et-data.js (MIAA) y mip-data.js
   (MIP), portadas verbatim del repo. Este archivo solo la presenta.
   ============================================================ */

/* ---------- Traducción del contenido clínico ----------
   Los algoritmos están escritos en español canónico; los diccionarios
   MIAA_TRANS y MIP_TRANS traducen por texto de origen. Si falta una clave,
   se muestra el español: mejor eso que una pantalla vacía. */
function trC(s){
  if(LANG === 'es' || !s) return s;
  const dicts = [window.MIAA_TRANS, window.MIP_TRANS];
  for(const d of dicts){
    const hit = d && d[LANG] && d[LANG][s];
    if(hit) return hit;
  }
  return s;
}
/* El código portado de MIP llama a tr() dentro de sus resolve(), porque en su
   página original esa era la función de traducción. Se la damos aquí en vez de
   editar el dato clínico: cuanto menos se toque, mejor. */
window.tr = trC;

/* ---------- Registro de herramientas ---------- */
const D = window.ET_DATA;

const TOOLS = {
  abdomen: {
    id:'abdomen', name:'MIAA', chip:'logo-miaa.png',
    desc:'Manejo Integral del Abdomen Abierto — decisión en pabellón y manejo en curso.',
    groupBy:'group',
    bjorck:true,
    get algos(){ return [D.MIAA_DECISION].concat(Object.values(D.MIAA_ALGOS)); }
  },
  mip: {
    id:'mip', name:'MIP', chip:'logo-mip.png',
    desc:'Manejo Integral del Politraumatizado — algoritmos del abordaje primario (ABCDE).',
    groupBy:'region',
    get algos(){ return window.MIP_ALGOS || []; }
  }
};
function algoById(toolId, id){
  return TOOLS[toolId].algos.find(a => a.id === id);
}

/* ---------- Favoritos ---------- */
function favs(){
  try{ return JSON.parse(localStorage.getItem('et_favs') || '[]'); }catch(e){ return []; }
}
function toggleFav(toolId, algoId, ev){
  if(ev) ev.stopPropagation();
  const key = toolId + ':' + algoId;
  const list = favs();
  const i = list.indexOf(key);
  if(i === -1) list.push(key); else list.splice(i, 1);
  try{ localStorage.setItem('et_favs', JSON.stringify(list)); }catch(e){}
  sendEvent(i === -1 ? 'fav_add' : 'fav_remove', { algo: key });
  render();
}
const STAR = f => `<svg viewBox="0 0 24 24" fill="${f ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>`;

/* ---------- Pila de navegación ----------
   Vive dentro de la pestaña Kit: cada herramienta, algoritmo o resultado es
   un nivel. Volver nunca pierde el estado del paso anterior. */
function push(scr){ S.stack.push(scr); S.dir = 1; render(); scrollTop(); }
function pop(){ S.stack.pop(); S.dir = -1; render(); scrollTop(); }
function scrollTop(){ const s = document.getElementById('scroll'); if(s) s.scrollTop = 0; }
function topScreen(){ return S.stack[S.stack.length - 1] || null; }

function openTool(id){
  sendEvent('tool_open', { tool_id: id });
  S.filter = '';
  /* La encuesta debe preguntar por la herramienta que se acaba de usar, no
     por el kit entero: "¿Qué tan útil te pareció MIAA?". */
  if(typeof window.etFbInit === 'function') window.etFbInit(id, TOOLS[id].name);
  push({ kind:'tool', toolId:id });
}
/* Las tres herramientas nuevas no son contenedores de algoritmos: cada una
   entra directamente en su pantalla propia. */
const DIRECT = { aast:'aast', teg:'teg', calc:'calcList' };
function openToolDirect(id){
  sendEvent('tool_open', { tool_id: id });
  S.filter = '';
  if(typeof window.etFbInit === 'function') window.etFbInit(id, TOOLS[id].name);
  if(id === 'teg') push({ kind:'teg', toolId:'teg', v:{ hep:'no' } });
  else push({ kind: DIRECT[id], toolId: id });
}

function openAlgo(toolId, algoId){
  const a = algoById(toolId, algoId);
  sendEvent('algo_open', { tool_id: toolId, algo: algoId });
  if(a.type === 'checklist'){
    push({ kind:'checklist', toolId, algoId, checks:{} });
  } else if(a.type === 'yesno'){
    push({ kind:'yesno', toolId, algoId, i:0, history:[] });
  } else {
    push({ kind:'tree', toolId, algoId, node:a.start, ctx:{}, history:[] });
  }
}

/* ---------- Lista de algoritmos de una herramienta ---------- */
function toolScreenHTML(scr){
  const tool = TOOLS[scr.toolId];
  const f = S.filter.trim();
  const fav = favs();
  const t = T();

  const match = a => !f || [a.name, a.short, a[tool.groupBy]]
    .some(x => norm(trC(x)).includes(norm(f)) || norm(x).includes(norm(f)));
  const list = tool.algos.filter(match);

  const groups = [];
  list.forEach(a => {
    const g = a[tool.groupBy];
    let bucket = groups.find(x => x.g === g);
    if(!bucket){ bucket = { g, items:[] }; groups.push(bucket); }
    bucket.items.push(a);
  });

  const search = `<div class="et-search" style="margin:16px 0 4px">
      ${ICON.search}
      <input type="text" inputmode="search" autocomplete="off" placeholder="${esc(t.tool.search)}"
             value="${esc(S.filter)}" oninput="onToolFilter(this.value)">
      ${f ? `<button class="et-cancel" onclick="onToolFilter('')">${esc(t.countrySheet.cancel)}</button>` : ''}
    </div>`;

  const bjorckLink = (tool.bjorck && !f) ? `
    <button class="et-bj-link" style="margin-top:16px" onclick="push({kind:'bjorck',toolId:'abdomen'})">
      <span class="et-tile">${ICON.grid}</span>
      <span class="et-row-main">
        <b>${esc(trC('Clasificación de Björck'))}</b>
        <span>${esc(t.tool.bjorckSub)}</span>
      </span>${ICON.right}
    </button>` : '';

  const body = groups.length ? groups.map(gr => `
      <div class="et-section">${esc(trC(gr.g))}</div>
      <div class="et-group">${gr.items.map(a => {
        const isFav = fav.includes(scr.toolId + ':' + a.id);
        return `<div class="et-algo">
          <button class="et-row" onclick="openAlgo('${scr.toolId}','${a.id}')">
            <span class="et-row-main">
              <span class="et-row-title">${esc(trC(a.name))}</span>
              <span class="et-row-sub">${esc(trC(a.short))}</span>
            </span>
          </button>
          <button class="et-fav" aria-pressed="${isFav}" aria-label="${esc(t.tool.fav)}"
                  onclick="toggleFav('${scr.toolId}','${a.id}',event)">${STAR(isFav)}</button>
        </div>`;
      }).join('')}</div>`).join('')
    : `<div class="et-empty">${ICON.search}
        <h3>${esc(t.tool.emptyTitle)}</h3>
        <p>${esc(t.tool.emptyText)}</p></div>`;

  return `<div class="et-pad">
    <p class="et-lede" style="margin:16px 0 0">${esc(trC(tool.desc))}</p>
    ${search}${bjorckLink}${body}
  </div>`;
}
function onToolFilter(v){
  S.filter = v;
  const host = document.getElementById('scroll');
  host.querySelector('.et-anim-push, .et-anim-pop, .et-anim-fade, div').innerHTML = toolScreenHTML(topScreen());
  const input = host.querySelector('.et-search input');
  if(input){ input.focus(); input.setSelectionRange(v.length, v.length); }
}

/* ---------- Motor de árbol (MIP + los 4 algoritmos de manejo de MIAA) ---------- */
function treeScreenHTML(scr){
  const a = algoById(scr.toolId, scr.algoId);
  const n = a.nodes[scr.node];
  const total = a.depth || Object.keys(a.nodes).length;
  const step = scr.history.length + 1;

  return `<div class="et-pad">
    ${progressHTML(step, Math.max(total, step), trC(a.name))}
    <h2 class="et-q">${esc(trC(n.q))}</h2>
    ${n.help ? `<p class="et-help">${esc(trC(n.help))}</p>` : ''}
    <div class="et-opts">
      ${n.opts.map((o, i) => `
        <button class="et-opt" onclick="treePick(${i})">
          <span class="et-row-main">
            <span class="et-opt-label">${esc(trC(o.label))}</span>
            ${o.sub ? `<span class="et-opt-sub">${esc(trC(o.sub))}</span>` : ''}
          </span>${ICON.right}
        </button>`).join('')}
    </div>
  </div>`;
}
function treePick(i){
  const scr = topScreen();
  const a = algoById(scr.toolId, scr.algoId);
  const o = a.nodes[scr.node].opts[i];
  scr.history.push({ node: scr.node, label: o.label });
  Object.assign(scr.ctx, o.set || {});
  if(o.next){ scr.node = o.next; S.dir = 1; render(); scrollTop(); return; }
  showResult(scr.toolId, scr.algoId, a.resolve(scr.ctx), scr.history.map(h => h.label));
}

/* ---------- Motor SÍ/NO (MIAA — ¿cuándo dejar el abdomen abierto?) ---------- */
function yesnoScreenHTML(scr){
  const a = algoById(scr.toolId, scr.algoId);
  const q = a.questions[scr.i];
  const t = T();

  const rules = (scr.i === 0 && a.rules) ? `
    <div class="et-rules">
      <h4>${esc(t.tool.rule)}</h4>
      <ul>${a.rules.map(r => `<li><span><b>${esc(trC(r[0]))}</b> ${esc(trC(r[1]))}</span></li>`).join('')}</ul>
    </div>` : '';

  return `<div class="et-pad">
    ${progressHTML(scr.i + 1, a.questions.length, trC(a.name))}
    ${q.category ? `<span class="et-cat">${ICON.pulse}${esc(trC(q.category))}</span>` : ''}
    <h2 class="et-q">${esc(trC(q.text))}</h2>
    <div class="et-yn">
      <button class="et-yes" onclick="yesnoPick('yes')">${esc(t.tool.yes)}</button>
      <button class="et-no"  onclick="yesnoPick('no')">${esc(t.tool.no)}</button>
    </div>
    ${rules}
  </div>`;
}
function yesnoPick(ans){
  const scr = topScreen();
  const a = algoById(scr.toolId, scr.algoId);
  const q = a.questions[scr.i];
  const t = T();
  scr.history.push(`${trC(q.category || '')}: ${ans === 'yes' ? t.tool.yes : t.tool.no}`.trim());

  const branch = q[ans];
  if(branch === 'next'){
    if(scr.i + 1 < a.questions.length){ scr.i++; S.dir = 1; render(); scrollTop(); return; }
    /* Todas respondidas sin disparar una conducta: se puede cerrar. */
    showResult(scr.toolId, scr.algoId, a.closed || {
      level:'conduct', title:'Cerrar la pared', detail:'Ningún criterio obliga a dejar el abdomen abierto.'
    }, scr.history);
    return;
  }
  showResult(scr.toolId, scr.algoId, {
    level:'conduct', title:branch.title, detail:branch.detail, warn:branch.warn, list:branch.list
  }, scr.history);
}

/* ---------- Checklist (NEXUS) ---------- */
function checklistScreenHTML(scr){
  const a = algoById(scr.toolId, scr.algoId);
  const t = T();
  const n = Object.values(scr.checks).filter(Boolean).length;

  return `<div class="et-pad">
    <h2 class="et-q" style="margin-top:18px">${esc(trC(a.name))}</h2>
    <p class="et-help">${esc(trC(a.intro))}</p>
    <div class="et-group" style="margin-top:18px">
      ${a.criteria.map(c => `
        <button class="et-checkrow" onclick="toggleCheck('${c.id}')">
          <span>${esc(trC(c.label))}</span>
          <span class="et-switch" role="switch" aria-checked="${!!scr.checks[c.id]}"></span>
        </button>`).join('')}
    </div>
    <p class="et-note">${esc(t.tool.presentOf.replace('{n}', n).replace('{t}', a.criteria.length))}</p>
    <button class="et-btn" style="margin-top:18px" onclick="checklistDone()">${esc(t.tool.seeResult)}</button>
  </div>`;
}
function toggleCheck(id){
  const scr = topScreen();
  scr.checks[id] = !scr.checks[id];
  S.dir = 0; render();
}
function checklistDone(){
  const scr = topScreen();
  const a = algoById(scr.toolId, scr.algoId);
  const positives = a.criteria.filter(c => scr.checks[c.id]);
  const trace = positives.length
    ? positives.map(c => trC(c.label))
    : [T().tool.nonePresent];
  showResult(scr.toolId, scr.algoId, a.resolve(positives.length), trace);
}

/* ---------- Rejilla de Björck ---------- */
const BJ_COLOR = { 1:'#00205C', 2:'#00205C', 3:'#c99a12', 4:'#E02826' };
function bjorckScreenHTML(){
  const t = T();
  return `<div class="et-pad">
    <p class="et-lede" style="margin:16px 0 0">${esc(t.tool.bjorckLede)}</p>
    ${D.BJORCK_GRID.map(b => `
      <div class="et-bj-block">
        <div class="et-bj-head"><b>${esc(trC(b.gLabel))}</b><span>${esc(trC(b.desc))}</span></div>
        <div class="et-bj-cells">
          ${b.cells.map(c => `
            <button class="et-bj-cell" onclick='bjorckPick(${JSON.stringify(c.ctx)}, ${JSON.stringify(c.code)})'>
              <span class="et-bj-top">
                <span class="et-bj-code" style="background:${BJ_COLOR[b.g]}">${esc(c.code)}</span>
                <span class="et-bj-state">${esc(trC(c.state))}</span>
              </span>
              <span class="et-bj-sum">${esc(trC(c.summary))}</span>
              <span class="et-bj-steps">${esc(c.steps === 1 ? t.tool.step1 : t.tool.steps.replace('{n}', c.steps))}</span>
            </button>`).join('')}
        </div>
      </div>`).join('')}
    <div class="et-caution" style="margin-top:20px">${esc(trC(D.MIAA_BJORCK_CAUTION))}</div>
  </div>`;
}
function bjorckPick(ctx, code){
  const a = D.MIAA_ALGOS.miaa_conducta;
  sendEvent('algo_open', { tool_id:'abdomen', algo:'miaa_conducta', via:'grid' });
  showResult('abdomen', 'miaa_conducta', a.resolve(ctx), [T().tool.directLookup + ' · ' + code]);
}

/* ---------- Resultado ---------- */
const LEVEL = {
  ok:      { color:'#1F7A5C', soft:'#e9f6f1' },
  warn:    { color:'#c99a12', soft:'#fff8ec' },
  alert:   { color:'#E02826', soft:'#fdecea' },
  info:    { color:'#00205C', soft:'#eef1f7' },
  conduct: { color:'#00205C', soft:'#eef1f7' },
  open:    { color:'#00205C', soft:'#eef1f7' },
  closed:  { color:'#00205C', soft:'#eef1f7' }
};
function showResult(toolId, algoId, result, trace){
  sendEvent(toolId === 'abdomen' ? 'miaa_result' : 'mip_result',
            { algo: algoId, level: result.level, title: result.title });
  push({ kind:'result', toolId, algoId, result, trace });
  if(typeof window.etFbAfterUse === 'function') window.etFbAfterUse();
}
function resultScreenHTML(scr){
  const a = algoById(scr.toolId, scr.algoId);
  const r = scr.result;
  const t = T();
  const lv = LEVEL[r.level] || LEVEL.info;
  /* Una conducta no es un acierto ni un error: icono de bifurcación, nunca
     un pulso clínico ni un ✓/✗, y nunca verde o rojo. */
  const isConduct = r.level === 'conduct' || r.level === 'open' || r.level === 'closed';
  const eyebrow = isConduct ? t.tool.conduct : trC(a.name);

  return `<div class="et-pad">
    <div class="et-result">
      <div class="et-result-band" style="background:${lv.soft};border-color:${lv.color}E6"></div>
      <div class="et-result-sym" style="color:${lv.color}">${isConduct ? ICON.branch : ICON.pulse}</div>
      <p class="et-result-eyebrow">${esc(eyebrow)}</p>
      <h2 style="color:${lv.color}">${esc(trC(r.title))}</h2>
      <p>${esc(trC(r.detail))}</p>
      ${r.list ? `<ol class="et-steps">${r.list.map((s, i) =>
        `<li><span class="et-step-n">${i + 1}</span><span>${esc(trC(s).replace(/^Paso \d+:\s*/, ''))}</span></li>`).join('')}</ol>` : ''}
      ${r.warn ? `<div class="et-caution">${esc(trC(r.warn))}</div>` : ''}
      ${isConduct ? `<div class="et-neutral">${esc(t.tool.conductNote)}</div>` : ''}
      ${r.goto ? `<button class="et-btn" style="margin-top:16px"
          onclick="openAlgo('${scr.toolId}','${r.goto.id}')">${esc(trC(r.goto.label))}</button>` : ''}
    </div>

    <div class="et-section">${esc(t.tool.trace)}</div>
    <div class="et-group">
      <div class="et-row" style="cursor:default">
        <span class="et-trace-val">${esc(scr.trace.join(' · '))}</span>
      </div>
      <div class="et-row" style="cursor:default">
        <span class="et-trace-val"><b>${esc(t.tool.ref)}</b> ${esc(trC(a.ref))}</span>
      </div>
    </div>

    ${saveRowHTML({
      tool: TOOLS[scr.toolId].name + ' · ' + trC(a.tag || a.name),
      title: trC(r.title),
      level: isConduct ? 'info' : r.level,
      trace: scr.trace.join(' · ')
    })}

    <button class="et-btn et-btn-ghost" style="margin-top:18px" onclick="backToTool()">
      ${esc(t.tool.another)}
    </button>
    <p class="et-note" style="text-align:center">${esc(T().kit.disclaimer)}</p>
  </div>`;
}
/* "Otro algoritmo" vuelve a la herramienta de origen, no siempre a la misma. */
function backToTool(){
  while(S.stack.length && topScreen().kind !== 'tool') S.stack.pop();
  S.dir = -1; render(); scrollTop();
}

/* ---------- Enrutado de la pila ---------- */
function stackScreenHTML(scr){
  return {
    tool: toolScreenHTML,
    tree: treeScreenHTML,
    yesno: yesnoScreenHTML,
    checklist: checklistScreenHTML,
    bjorck: bjorckScreenHTML,
    result: resultScreenHTML,
    aast: aastScreenHTML,
    organ: organScreenHTML,
    teg: tegScreenHTML,
    tegResult: tegResultHTML,
    calcList: calcListHTML,
    calc: calcFormHTML,
    calcResult: calcResultHTML,
    caseDetail: caseDetailHTML
  }[scr.kind](scr);
}
/* Título y etiqueta de "atrás" de cada nivel. */
function stackNav(scr, prev){
  const t = T();
  /* El detalle de caso vive en la pestaña Casos, no cuelga de una herramienta. */
  if(scr.kind === 'caseDetail'){
    const c = caseById(scr.caseId);
    return { backLabel: t.casos.title, title: c ? c.label : '', chip: null };
  }
  const tool = TOOLS[scr.toolId];
  const backLabel = !prev ? t.tabs.kit
    : prev.kind === 'tool' ? tool.name
    : prev.kind === 'aast' ? t.aast.organs
    : prev.kind === 'calcList' ? tool.name
    : prev.kind === 'teg' ? t.teg.valuesShort
    : prev.kind === 'calc' ? t.calc.data
    : t.tool.back;
  const title = {
    tool: () => tool.name,
    bjorck: () => 'Björck',
    aast: () => tool.name,
    organ: () => AASTDB.organs[scr.organ].name,
    teg: () => tool.name,
    tegResult: () => tool.name,
    calcList: () => tool.name,
    calc: () => trC(D.CALCS.find(c => c.id === scr.calcId).short),
    calcResult: () => trC(D.CALCS.find(c => c.id === scr.calcId).short),
    result: () => trC(algoById(scr.toolId, scr.algoId).tag || algoById(scr.toolId, scr.algoId).name),
    tree: () => trC(algoById(scr.toolId, scr.algoId).tag || algoById(scr.toolId, scr.algoId).name),
    yesno: () => trC(algoById(scr.toolId, scr.algoId).tag || algoById(scr.toolId, scr.algoId).name),
    checklist: () => trC(algoById(scr.toolId, scr.algoId).tag || algoById(scr.toolId, scr.algoId).name)
  }[scr.kind]();
  return { backLabel, title, chip: tool.chip };
}
/* Dentro de un árbol, "atrás" retrocede un nodo antes que salir de la pantalla. */
function goBack(){
  const scr = topScreen();
  if(scr && scr.kind === 'tree' && scr.history.length){
    const last = scr.history.pop();
    scr.node = last.node;
    S.dir = -1; render(); scrollTop(); return;
  }
  if(scr && scr.kind === 'yesno' && scr.i > 0){
    scr.i--; scr.history.pop();
    S.dir = -1; render(); scrollTop(); return;
  }
  pop();
}
