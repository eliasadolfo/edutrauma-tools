/* ============================================================
   EduTrauma Tools — AAST, TEG6s y Calculadoras
   Fase 3. Cada una con el modelo de interacción que le toca:
     AAST  → obra de consulta (buscar y leer, no un flujo)
     TEG6s → formulario que produce un panel de 4 componentes
     CALC  → 16 formularios con un patrón de resultado común

   La lógica clínica viene de et-data.js y aast-data.js, portadas verbatim
   del repo. Aquí solo se presenta.
   ============================================================ */

/* ============================================================
   AAST — escalas de lesiones
   ============================================================ */
const AASTDB = window.AAST_DB;
const ROMAN = D.ROMAN;

TOOLS.aast = {
  id:'aast', name:'AAST', chip:'logo-dqt.png',
  desc:'Gradación de lesiones de órganos (Moore et al.). Busca el órgano y lee la tabla completa.'
};
TOOLS.teg = {
  id:'teg', name:'TEG6s', chip:'logo-dqt.png',
  desc:'Interpreta el panel viscoelástico: factores, plaquetas, fibrinógeno y fibrinólisis.'
};
TOOLS.calc = {
  id:'calc', name:'Calculadoras',
  desc:'16 calculadoras en 5 áreas.'
};

function aastScreenHTML(){
  const t = T(), f = S.filter.trim();
  const O = AASTDB.organs;

  const hits = Object.keys(O).filter(k =>
    !f || norm(O[k].name).includes(norm(f)) || norm(O[k].region).includes(norm(f)));

  const search = `<div class="et-sticky-search"><div>
      ${ICON.search}
      <input type="text" inputmode="search" autocomplete="off" placeholder="${esc(t.aast.search)}"
             value="${esc(S.filter)}" oninput="onAastFilter(this.value)">
      ${f ? `<button class="et-search-clear" onclick="onAastFilter('')" aria-label="✕">✕</button>` : ''}
    </div></div>`;

  if(!hits.length){
    return `<div class="et-pad">${search}
      <div class="et-empty">${ICON.search}
        <h3>${esc(t.tool.emptyTitle)}</h3><p>${esc(t.aast.emptyText)}</p></div></div>`;
  }

  const body = AASTDB.regionOrder.map(region => {
    const ids = hits.filter(k => O[k].region === region);
    if(!ids.length) return '';
    return `<div class="et-section">${esc(region)}</div>
      <div class="et-organ-grid">${ids.map(k => {
        const o = O[k];
        const range = 'I–' + ROMAN[o.maxGrade];
        return `<button class="et-organ" onclick="push({kind:'organ',toolId:'aast',organ:'${k}',sel:null,adj:{}})">
            <b>${esc(o.name)}</b><span>${esc(range)}</span>
          </button>`;
      }).join('')}</div>`;
  }).join('');

  return `<div class="et-pad">
    <p class="et-lede" style="margin:16px 0 0">${esc(TOOLS.aast.desc)}</p>
    ${search}${body}
  </div>`;
}
function onAastFilter(v){
  S.filter = v;
  const host = document.getElementById('scroll').firstElementChild;
  host.innerHTML = aastScreenHTML();
  const input = host.querySelector('.et-sticky-search input');
  if(input){ input.focus(); input.setSelectionRange(v.length, v.length); }
}

/* ---------- Tabla de grados de un órgano ----------
   Se lee completa: el caso real es "ya sé que es el bazo, quiero comparar". */
function organScreenHTML(scr){
  const o = AASTDB.organs[scr.organ];
  const t = T();

  const lesionRow = (it, idx) => {
    const on = scr.sel === idx;
    return `<button class="et-lesion" aria-pressed="${on}" onclick="pickLesion(${idx})">
      <span class="et-grade">${ROMAN[it.grade]}</span>
      <span class="et-lesion-main">
        <span class="et-lesion-label">${esc(it.label)}</span>
        <span class="et-lesion-meta">${it.icd9 ? 'ICD-9 ' + esc(it.icd9) + ' · ' : ''}AIS ${esc(it.ais || '—')}</span>
        ${it.warn ? `<span class="et-lesion-warn">${esc(D.AAST_WARN)}</span>` : ''}
      </span>
      ${on ? ICON.check : ''}
    </button>`;
  };

  /* Un índice plano sobre todos los ítems: la selección no depende del modo. */
  const flat = organItems(o);
  let idx = -1;
  let body = '';

  if(o.mode === 'typed'){
    body = o.categories.map(cat => {
      const rows = cat.items.map(it => lesionRow(it, ++idx)).join('');
      return `<div class="et-section">${esc(cat.label)}</div><div class="et-group">${rows}</div>`;
    }).join('');
  } else {
    /* flat y vessel: agrupados por grado */
    const byGrade = {};
    flat.forEach(it => { (byGrade[it.grade] = byGrade[it.grade] || []).push(it); });
    body = Object.keys(byGrade).sort((a,b) => a - b).map(g => {
      const rows = byGrade[g].map(it => lesionRow(it, ++idx)).join('');
      return `<div class="et-section">${esc(t.aast.grade)} ${ROMAN[g]}</div><div class="et-group">${rows}</div>`;
    }).join('');
  }

  return `<div class="et-pad" style="padding-bottom:${scr.sel === null ? 26 : 110}px">
    <p class="et-lede" style="margin:16px 0 0">
      ${esc(o.region)} · ${esc(t.aast.upTo)} ${ROMAN[o.maxGrade]}
    </p>
    ${body}
    ${adjustHTML(o, scr)}
    <p class="et-note" style="margin-top:20px">${esc(t.aast.ref)}</p>
  </div>`;
}
function organItems(o){
  return o.mode === 'typed' ? o.categories.flatMap(c => c.items) : o.items;
}
function adjustHTML(o, scr){
  const t = T();
  if(o.adjust === 'none') return '';
  const rows = [];
  if(o.adjust === 'vessel'){
    rows.push(['inc', D.AAST_VESSEL.inc.q, t.aast.upOne]);
    rows.push(['dec', D.AAST_VESSEL.dec.q, t.aast.downOne]);
  } else {
    const a = D.AAST_ADJUST[o.adjust];
    if(!a) return '';
    rows.push(['a', o.adjustLabel || a.q, a.note]);
  }
  return `<div class="et-section">${esc(t.aast.adjust)}</div>
    <div class="et-group">${rows.map(([k, q, note]) => `
      <button class="et-checkrow" onclick="toggleAdjust('${k}')">
        <span>${esc(q)}<br><small style="color:var(--app-slate);font-size:12px">${esc(note)}</small></span>
        <span class="et-switch" role="switch" aria-checked="${!!scr.adj[k]}"></span>
      </button>`).join('')}</div>`;
}
function pickLesion(i){
  const scr = topScreen();
  scr.sel = (scr.sel === i) ? null : i;
  S.dir = 0; render();
}
function toggleAdjust(k){
  const scr = topScreen();
  scr.adj[k] = !scr.adj[k];
  S.dir = 0; render();
}
/* Grado ajustado, con sus topes: upTo3 → máx III, upTo5 → máx V,
   up1 y vessel → el maxGrade del órgano. */
function adjustedGrade(o, scr){
  const flat = organItems(o);
  const it = flat[scr.sel];
  if(!it) return null;
  let g = it.grade, note = '';
  if(o.adjust === 'vessel'){
    if(scr.adj.inc){ g = Math.min(g + 1, o.maxGrade); note = D.AAST_VESSEL.inc.note; }
    if(scr.adj.dec){ g = Math.max(g - 1, 1); note = D.AAST_VESSEL.dec.note; }
  } else if(scr.adj.a){
    const a = D.AAST_ADJUST[o.adjust];
    if(a){
      const cap = a.rule === 'upTo3' ? 3 : a.rule === 'upTo5' ? 5 : o.maxGrade;
      g = Math.min(g + 1, cap, o.maxGrade);
      note = a.note;
    }
  }
  return { grade:g, note, label:it.label };
}
function gradeBarHTML(){
  const scr = topScreen();
  if(!scr || scr.kind !== 'organ' || scr.sel === null) return '';
  const o = AASTDB.organs[scr.organ];
  const g = adjustedGrade(o, scr);
  if(!g) return '';
  const t = T();
  return `<div class="et-gradebar">
    <span class="et-gradebar-box">${ROMAN[g.grade]}</span>
    <span class="et-gradebar-main">
      <span class="et-gradebar-eyebrow">${esc(t.aast.aastGrade)}</span>
      <span class="et-gradebar-name">${esc(o.name)}</span>
      ${g.note ? `<span class="et-gradebar-note">${esc(g.note)}</span>` : ''}
    </span>
    <button onclick="saveAast()">${esc(t.aast.save)}</button>
  </div>`;
}
function saveAast(){
  const scr = topScreen();
  const o = AASTDB.organs[scr.organ];
  const g = adjustedGrade(o, scr);
  const t = T();
  sendEvent('aast_result', { organ:o.name, grade:g.grade });
  doSave({
    tool: 'AAST · ' + o.name,
    title: t.aast.grade + ' ' + ROMAN[g.grade],
    level: 'info',
    trace: [o.name, g.label, g.note].filter(Boolean).join(' · ')
  });
  if(typeof window.etFbAfterUse === 'function') window.etFbAfterUse();
}

/* ============================================================
   TEG6s
   ============================================================ */
function tegScreenHTML(scr){
  const t = T();
  const fields = D.TEG_FIELDS.filter(f => !f.onlyIfHep || scr.v.hep === 'si');
  const filled = fields.every(f => scr.v[f.id] !== undefined && scr.v[f.id] !== '');

  const hep = `<div class="et-field">
      <div class="et-field-row">
        <span class="et-field-label"><b>${esc(t.teg.heparinQ)}</b></span>
      </div>
      <div class="et-seg" style="margin-top:11px">
        <button aria-pressed="${scr.v.hep !== 'si'}" onclick="tegSet('hep','no')">${esc(t.tool.no)}</button>
        <button aria-pressed="${scr.v.hep === 'si'}" onclick="tegSet('hep','si')">${esc(t.tool.yes)}</button>
      </div>
    </div>`;

  const rows = fields.map(f => {
    const raw = scr.v[f.id];
    const n = raw === undefined || raw === '' ? null : D.parseNum(raw);
    const out = n !== null && !isNaN(n) && (n < f.plaus[0] || n > f.plaus[1]);
    return `<div class="et-field">
      <div class="et-field-row">
        <span class="et-field-label"><b>${esc(f.label)}</b><span>${esc(f.hint)}</span></span>
        <span class="et-cap">
          <input type="text" inputmode="decimal" autocomplete="off" value="${esc(raw === undefined ? '' : raw)}"
                 oninput="tegSet('${f.id}', this.value)">
          <span>${esc(f.unit)}</span>
        </span>
      </div>
      ${out ? `<div class="et-outrange">${esc(t.teg.outRange)}</div>` : ''}
    </div>`;
  }).join('');

  return `<div class="et-pad">
    <p class="et-lede" style="margin:16px 0 12px">${esc(TOOLS.teg.desc)}</p>
    <div class="et-section" style="margin-top:0">${esc(t.teg.heparin)}</div>
    ${hep}
    <div class="et-section">${esc(t.teg.values)}</div>
    ${rows}
    <button class="et-btn" style="margin-top:8px" ${filled ? '' : 'disabled'} onclick="tegRun()">
      ${esc(filled ? t.teg.interpret : t.teg.complete.replace('{n}', fields.length))}
    </button>
    <p class="et-note" style="text-align:center">${esc(t.teg.foot)}</p>
  </div>`;
}
function tegSet(k, v){
  const scr = topScreen();
  scr.v[k] = v;
  /* Repintar sin perder el foco ni la posición del cursor mientras se escribe. */
  const active = document.activeElement;
  const id = active && active.getAttribute('oninput');
  S.dir = 0; render();
  if(id){
    const again = [...document.querySelectorAll('.et-cap input')]
      .find(i => i.getAttribute('oninput') === id);
    if(again){ again.focus(); const l = again.value.length; again.setSelectionRange(l, l); }
  }
}
function tegRun(){
  const scr = topScreen();
  const v = { hep: scr.v.hep === 'si' ? 'si' : 'no' };
  D.TEG_FIELDS.forEach(f => { v[f.id] = D.parseNum(scr.v[f.id]); });
  const out = D.computeTEG(v);
  sendEvent('teg_result', { alterados: out.comp.filter(c => c.level !== 'ok').map(c => c.name) });
  push({ kind:'tegResult', toolId:'teg', out });
  if(typeof window.etFbAfterUse === 'function') window.etFbAfterUse();
}
const PILL = { ok:'NORMAL', warn:'VIGILAR', alert:'ACTUAR', info:'NORMAL' };
function tegResultHTML(scr){
  const t = T();
  const out = scr.out;
  const alerts = (out.alerts || []).map(a => {
    const lv = LEVEL[a.level] || LEVEL.info;
    return `<div class="et-alert-card" style="background:${lv.soft}">
      <b style="color:${lv.color}">${esc(trC(a.title))}</b><p>${esc(trC(a.text))}</p></div>`;
  }).join('');

  const comps = out.comp.map(c => {
    const lv = LEVEL[c.level] || LEVEL.info;
    return `<div class="et-comp">
      <span class="et-comp-rail" style="background:${lv.color}"></span>
      <div class="et-comp-body">
        <div class="et-comp-top">
          <span class="et-comp-name">${esc(trC(c.name))}</span>
          <span class="et-pill" style="background:${lv.soft};color:${lv.color}">${esc(t.teg.pill[c.level] || PILL[c.level])}</span>
        </div>
        <p class="et-comp-finding" style="color:${lv.color}">${esc(trC(c.finding))}</p>
        <p class="et-comp-value">${esc(c.value)}</p>
        ${c.sug ? `<p class="et-comp-sug">${esc(trC(c.sug))}</p>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<div class="et-pad">
    <div class="et-section" style="margin-top:16px">${esc(t.teg.panel)}</div>
    ${alerts}${comps}
    <div class="et-caution" style="margin-top:14px">${esc(trC(D.TEG_CAUTION))}</div>
    <div class="et-section">${esc(t.tool.trace)}</div>
    <div class="et-group"><div class="et-row" style="cursor:default">
      <span class="et-trace-val"><b>${esc(t.tool.ref)}</b> ${esc(D.TEG_REF)}</span>
    </div></div>
    ${saveRowHTML({
      tool: 'TEG6s',
      title: tegSummary(out),
      level: tegLevel(out),
      trace: tegTrace(scr)
    })}

    <button class="et-btn et-btn-ghost" style="margin-top:18px" onclick="goBack()">${esc(t.teg.fix)}</button>
    <button class="et-btn-text" onclick="tegReset()">${esc(t.teg.newCase)}</button>
  </div>`;
}
/* "Corregir" conserva los valores; "evaluar otro caso" es lo que sí los borra. */
function tegReset(){
  S.stack = S.stack.filter(s => s.kind !== 'tegResult');
  const form = topScreen();
  if(form && form.kind === 'teg') form.v = { hep:'no' };
  S.dir = -1; render(); scrollTop();
}

/* ============================================================
   CALCULADORAS
   ============================================================ */
const INPUT_KIND = {
  number:'Entrada numérica', numberunit:'Entrada numérica',
  toggle:'Lista de sí/no', phq:'Cuestionario 0–3',
  seg:'Selección por categoría', segv:'Selección por categoría'
};
function calcKind(c){
  const kinds = [...new Set(c.inputs.map(i => INPUT_KIND[i.t]))];
  return kinds.length === 1 ? kinds[0] : 'Mixto';
}
function recents(){
  try{ return JSON.parse(localStorage.getItem('calc_recent') || '[]'); }catch(e){ return []; }
}
function pushRecent(id){
  const list = recents().filter(x => x !== id);
  list.unshift(id);
  try{ localStorage.setItem('calc_recent', JSON.stringify(list.slice(0, 4))); }catch(e){}
}

function calcListHTML(){
  const t = T(), f = S.filter.trim();
  const hits = D.CALCS.filter(c => !f ||
    [c.name, c.short, c.area].some(x => norm(x).includes(norm(f))) ||
    (c.kw || []).some(k => norm(k).includes(norm(f))));

  const search = `<div class="et-sticky-search sm"><div>
      ${ICON.search}
      <input type="text" inputmode="search" autocomplete="off" placeholder="${esc(t.calc.search)}"
             value="${esc(S.filter)}" oninput="onCalcFilter(this.value)">
      ${f ? `<button class="et-search-clear" onclick="onCalcFilter('')" aria-label="✕">✕</button>` : ''}
    </div></div>`;

  const rec = recents().map(id => D.CALCS.find(c => c.id === id)).filter(Boolean);
  const recHTML = (!f && rec.length) ? `
    <div class="et-section" style="margin-top:4px">${esc(t.calc.recent)}</div>
    <div class="et-recent">${rec.map(c =>
      `<button onclick="openCalc('${c.id}')">${esc(trC(c.short))}</button>`).join('')}</div>` : '';

  if(!hits.length){
    return `<div class="et-pad">${search}
      <div class="et-empty">${ICON.search}
        <h3>${esc(t.tool.emptyTitle)}</h3><p>${esc(t.calc.emptyText)}</p></div></div>`;
  }

  const body = D.CALC_AREAS.map(area => {
    const items = hits.filter(c => c.area === area);
    if(!items.length) return '';
    return `<div class="et-section">${esc(area)}</div>
      <div class="et-group">${items.map(c => `
        <button class="et-row" onclick="openCalc('${c.id}')">
          <span class="et-row-main">
            <span class="et-row-title">${esc(trC(c.short))}</span>
            <span class="et-row-sub">${esc(calcKind(c))}</span>
          </span>${ICON.right}
        </button>`).join('')}</div>`;
  }).join('');

  return `<div class="et-pad">${search}${recHTML}${body}</div>`;
}
function onCalcFilter(v){
  S.filter = v;
  const host = document.getElementById('scroll').firstElementChild;
  host.innerHTML = calcListHTML();
  const input = host.querySelector('.et-sticky-search input');
  if(input){ input.focus(); input.setSelectionRange(v.length, v.length); }
}
function openCalc(id){
  const c = D.CALCS.find(x => x.id === id);
  pushRecent(id);
  sendEvent('algo_open', { tool_id:'calc', algo:id });
  push({ kind:'calc', toolId:'calc', calcId:id, v:defaultCalcValues(c) });
}
function defaultCalcValues(c){
  const v = {};
  c.inputs.forEach(i => {
    if(i.t === 'toggle') v[i.id] = false;
    if(i.t === 'phq') v[i.id] = null;
    if(i.t === 'seg' || i.t === 'segv') v[i.id] = null;
    if(i.t === 'numberunit') v[i.id + '_u'] = i.units[0].v;
  });
  return v;
}

function calcFormHTML(scr){
  const c = D.CALCS.find(x => x.id === scr.calcId);
  const t = T();

  const done = c.inputs.every(i => {
    const val = scr.v[i.id];
    if(i.t === 'toggle') return true;              /* un no marcado ya es respuesta */
    if(i.t === 'phq' || i.t === 'seg' || i.t === 'segv') return val !== null && val !== undefined;
    const n = D.parseNum(val);
    return val !== undefined && val !== '' && !isNaN(n);
  });

  const field = i => {
    const val = scr.v[i.id];
    if(i.t === 'toggle'){
      return `<div class="et-field"><div class="et-field-row">
        <span class="et-field-label et-field-plain"><b>${esc(trC(i.label))}</b></span>
        <button class="et-switch" role="switch" aria-checked="${!!val}" onclick="calcSet('${i.id}', !${!!val})"></button>
      </div></div>`;
    }
    if(i.t === 'seg' || i.t === 'segv'){
      const long = i.options.some(o => String(o.label).length > 14);
      const btns = i.options.map(o =>
        `<button aria-pressed="${val === o.v}" onclick="calcSet('${i.id}', ${JSON.stringify(o.v)})">${esc(trC(o.label))}</button>`).join('');
      return `<div class="et-field">
        <span class="et-field-label et-field-plain"><b>${esc(trC(i.label))}</b></span>
        <div class="${long ? 'et-segstack' : 'et-seg'}" style="margin-top:11px">${btns}</div>
      </div>`;
    }
    if(i.t === 'phq'){
      return `<div class="et-field">
        <span class="et-field-label et-field-plain"><b>${esc(trC(i.label))}</b></span>
        <div class="et-seg-num">${[0,1,2,3].map(n =>
          `<button aria-pressed="${val === n}" onclick="calcSet('${i.id}', ${n})">${n}</button>`).join('')}</div>
      </div>`;
    }
    const n = val === undefined || val === '' ? null : D.parseNum(val);
    const out = n !== null && !isNaN(n) &&
      ((i.min !== undefined && n < i.min) || (i.max !== undefined && n > i.max));
    const units = i.t === 'numberunit' ? `<div class="et-seg" style="margin-top:11px">${
      i.units.map(u => `<button aria-pressed="${scr.v[i.id + '_u'] === u.v}"
        onclick="calcSet('${i.id}_u','${u.v}')">${esc(u.label)}</button>`).join('')}</div>` : '';
    return `<div class="et-field">
      <div class="et-field-row">
        <span class="et-field-label et-field-plain"><b>${esc(trC(i.label))}</b></span>
        <span class="et-cap">
          <input type="text" inputmode="decimal" autocomplete="off" value="${esc(val === undefined ? '' : val)}"
                 oninput="calcSet('${i.id}', this.value)">
          ${i.unit ? `<span>${esc(i.unit)}</span>` : ''}
        </span>
      </div>
      ${units}
      ${out ? `<div class="et-outrange">${esc(t.calc.outRange)}</div>` : ''}
    </div>`;
  };

  return `<div class="et-pad">
    <span class="et-area-pill">${esc(c.area)}</span>
    <p class="et-lede" style="margin:0 0 14px;font-size:13px">${esc(trC(c.name))}</p>
    ${c.phq ? `<div class="et-legend">${esc(trC(D.PHQ_LEGEND))}</div>` : ''}
    ${c.inputs.map(field).join('')}
    <button class="et-btn" style="margin-top:8px" ${done ? '' : 'disabled'} onclick="calcRun()">
      ${esc(done ? t.calc.run : t.calc.complete)}
    </button>
  </div>`;
}
function calcSet(k, v){
  const scr = topScreen();
  scr.v[k] = v;
  const active = document.activeElement;
  const sig = active && active.getAttribute('oninput');
  S.dir = 0; render();
  if(sig){
    const again = [...document.querySelectorAll('.et-cap input')]
      .find(i => i.getAttribute('oninput') === sig);
    if(again){ again.focus(); const l = again.value.length; again.setSelectionRange(l, l); }
  }
}
function calcRun(){
  const scr = topScreen();
  const c = D.CALCS.find(x => x.id === scr.calcId);
  const v = {};
  c.inputs.forEach(i => {
    if(i.t === 'toggle'){ v[i.id] = !!scr.v[i.id]; return; }
    if(i.t === 'phq' || i.t === 'segv'){ v[i.id] = Number(scr.v[i.id]); return; }
    if(i.t === 'seg'){ v[i.id] = scr.v[i.id]; return; }
    v[i.id] = D.parseNum(scr.v[i.id]);
    if(i.t === 'numberunit') v[i.id + '_u'] = scr.v[i.id + '_u'];
  });
  let out;
  try{ out = c.compute(v); }catch(e){ showToast(T().calc.error); return; }
  if(!out || out.error){ showToast(trC((out && out.error) || T().calc.error)); return; }
  sendEvent('calc_result', { calc: c.id, level: out.level });
  push({ kind:'calcResult', toolId:'calc', calcId:c.id, out });
  if(typeof window.etFbAfterUse === 'function') window.etFbAfterUse();
}
function calcResultHTML(scr){
  const c = D.CALCS.find(x => x.id === scr.calcId);
  const o = scr.out, t = T();
  const lv = LEVEL[o.level] || LEVEL.info;

  return `<div class="et-pad">
    <div class="et-calc-result">
      <div class="et-calc-band" style="background:${lv.color}"></div>
      <p class="et-result-eyebrow" style="margin-top:0">${esc(trC(c.short))}</p>
      <div class="et-bignum">
        <b style="color:${lv.color}">${esc(o.display)}</b>
        ${o.unit ? `<span>${esc(o.unit)}</span>` : ''}
      </div>
      ${o.cat ? `<span class="et-calc-cat" style="background:${lv.soft};color:${lv.color}">${esc(trC(o.cat))}</span>` : ''}
      ${o.detail ? `<p class="et-calc-detail">${esc(trC(o.detail))}</p>` : ''}
      ${o.critical ? `<div class="et-crit">${esc(trC(o.critical))}</div>` : ''}
    </div>

    <div class="et-group" style="margin-top:18px">
      ${o.formula ? `<div class="et-row" style="cursor:default">
        <span class="et-trace-val"><b>${esc(t.calc.formula)}</b> ${esc(o.formula)}</span></div>` : ''}
      ${o.ref ? `<div class="et-row" style="cursor:default">
        <span class="et-trace-val"><b>${esc(t.tool.ref)}</b> ${esc(o.ref)}</span></div>` : ''}
    </div>

    ${saveRowHTML({
      tool: trC(c.short),
      title: o.display + (o.unit ? ' ' + o.unit : '') + (o.cat ? ' · ' + trC(o.cat) : ''),
      level: o.level,
      trace: calcTrace(c, scr)
    })}

    <button class="et-btn et-btn-ghost" style="margin-top:18px" onclick="goBack()">${esc(t.calc.fix)}</button>
    <button class="et-btn-text" onclick="backToTool()">${esc(t.calc.another)}</button>
    <p class="et-note" style="text-align:center">${esc(t.kit.disclaimer)}</p>
  </div>`;
}


/* ---------- Resumen de un resultado para el registro del caso ---------- */
function tegSummary(out){
  const bad = out.comp.filter(c => c.level !== 'ok').map(c => trC(c.name));
  return bad.length ? T().teg.altered.replace('{v}', bad.join(', ')) : T().teg.normal;
}
function tegLevel(out){
  if(out.comp.some(c => c.level === 'alert')) return 'alert';
  if(out.comp.some(c => c.level === 'warn')) return 'warn';
  return 'ok';
}
function tegTrace(scr){
  /* El formulario esta un nivel por debajo del resultado en la pila. */
  const form = S.stack.find(s => s.kind === 'teg');
  if(!form) return '';
  const v = form.v;
  const t = T();
  const hep = t.teg.heparin + ': ' + (v.hep === 'si' ? t.tool.yes : t.tool.no);
  const vals = D.TEG_FIELDS
    .filter(f => !f.onlyIfHep || v.hep === 'si')
    .map(f => f.label + ' ' + v[f.id] + ' ' + f.unit);
  return [hep].concat(vals).join(' · ');
}
function calcTrace(c, scr){
  const form = S.stack.find(s => s.kind === 'calc' && s.calcId === c.id);
  if(!form) return '';
  const v = form.v, t = T();
  return c.inputs.map(i => {
    const val = v[i.id];
    if(i.t === 'toggle') return trC(i.label) + ': ' + (val ? t.tool.yes : t.tool.no);
    if(i.t === 'seg' || i.t === 'segv'){
      const o = i.options.find(o => o.v === val);
      return trC(i.label) + ': ' + (o ? trC(o.label) : '—');
    }
    return trC(i.label) + ': ' + val + (i.unit ? ' ' + i.unit : '');
  }).join(' · ');
}
