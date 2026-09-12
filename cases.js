/* ============================================================
   EduTrauma Tools — Casos
   Agrupa los resultados por paciente.

   PROMESA DEL PRODUCTO: los casos no salen del telefono. Se guardan en
   localStorage y NUNCA se envian al servidor — ni siquiera el nombre.
   La analitica solo cuenta cuantos registros hay, jamas su contenido.
   ============================================================ */

const CASES_KEY = 'et_cases';
const CASE_ACTIVE = 'et_case_active';

function allCases(){
  try{ return JSON.parse(localStorage.getItem(CASES_KEY) || '[]'); }catch(e){ return []; }
}
function saveCases(list){
  try{ localStorage.setItem(CASES_KEY, JSON.stringify(list)); }catch(e){}
}
function activeCaseId(){
  try{ return localStorage.getItem(CASE_ACTIVE) || null; }catch(e){ return null; }
}
function activeCase(){
  const id = activeCaseId();
  return id ? allCases().find(c => c.id === id) || null : null;
}
function setActiveCase(id){
  try{ localStorage.setItem(CASE_ACTIVE, id); }catch(e){}
}
function caseById(id){ return allCases().find(c => c.id === id) || null; }

function newCase(label){
  const list = allCases();
  const c = {
    id: 'c' + Date.now().toString(36),
    label: (label || '').trim() || defaultCaseName(),
    created: Date.now(),
    entries: []
  };
  list.unshift(c);
  saveCases(list);
  setActiveCase(c.id);
  sendEvent('case_new');
  return c;
}
function defaultCaseName(){
  const n = allCases().length + 1;
  return T().casos.defaultName.replace('{n}', n);
}

/* Guardar es idempotente: el mismo resultado no se duplica aunque se toque
   dos veces el boton. */
function saveToCase(entry){
  let c = activeCase();
  if(!c) c = newCase('');
  const list = allCases();
  const target = list.find(x => x.id === c.id);
  const key = entry.tool + '|' + entry.title + '|' + entry.trace;
  if(target.entries.some(e => e.key === key)) return target;
  target.entries.unshift(Object.assign({ key, time: Date.now() }, entry));
  saveCases(list);
  sendEvent('case_save', { tool: entry.tool, n: target.entries.length });
  return target;
}
function isSaved(entry){
  const c = activeCase();
  if(!c) return false;
  const key = entry.tool + '|' + entry.title + '|' + entry.trace;
  return c.entries.some(e => e.key === key);
}

/* ---------- Fila de guardado, al pie de cada resultado ---------- */
function saveRowHTML(entry){
  const t = T();
  const c = activeCase();
  const saved = isSaved(entry);
  const label = saved
    ? t.casos.savedIn.replace('{v}', c.label)
    : c ? t.casos.saveIn.replace('{v}', c.label) : t.casos.saveNew;
  return `<div class="et-group" style="margin-top:18px">
    <button class="et-row" style="min-height:52px" ${saved ? 'disabled' : ''} onclick='doSave(${JSON.stringify(entry)})'>
      <span style="display:flex;color:${saved ? 'var(--app-green)' : 'var(--app-teal)'}">${saved ? ICON.checkBig : ICON.save}</span>
      <span class="et-row-main"><span class="et-row-title"
        style="color:${saved ? 'var(--app-green)' : 'var(--app-teal)'}">${esc(label)}</span></span>
    </button>
  </div>`;
}
function doSave(entry){
  const c = saveToCase(entry);
  render();
  showToast(T().casos.toast.replace('{v}', c.label));
}

/* ---------- Pestana Casos ---------- */
function casosScreenHTML(){
  const t = T();
  const list = allCases();
  const act = activeCaseId();

  const header = `<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px">
      <h1 class="et-h1" style="margin-bottom:0">${esc(t.casos.title)}</h1>
      <button class="et-cancel" style="padding-bottom:6px;font-weight:600" onclick="openSheet('newcase')">${esc(t.casos.new)}</button>
    </div>
    <p class="et-lede" style="margin-top:6px">${esc(t.casos.lede)}</p>`;

  if(!list.length){
    return `<div class="et-pad">${header}
      <div class="et-empty">${ICON.pulse}
        <h3>${esc(t.casos.emptyTitle)}</h3>
        <p>${esc(t.casos.emptyText)}</p>
      </div></div>`;
  }

  const rows = list.map(c => {
    const last = c.entries[0];
    return `<button class="et-row" onclick="push({kind:'caseDetail',caseId:'${c.id}'})">
      <span class="et-row-main">
        <span class="et-case-top">
          <span class="et-row-title">${esc(c.label)}</span>
          ${c.id === act ? `<span class="et-pill-active">${esc(t.casos.active)}</span>` : ''}
        </span>
        <span class="et-row-sub">${esc(caseMeta(c))}</span>
        ${last ? `<span class="et-case-prev">${esc(last.title)}</span>` : ''}
      </span>${ICON.right}
    </button>`;
  }).join('');

  return `<div class="et-pad">${header}
    <div class="et-group">${rows}</div>
    <p class="et-note">${esc(t.casos.privacy)}</p>
  </div>`;
}
function caseMeta(c){
  const t = T();
  const n = c.entries.length;
  const count = n === 1 ? t.casos.one : t.casos.many.replace('{n}', n);
  return `${fmtDate(c.created)} · ${count}`;
}
function fmtDate(ts){
  const d = new Date(ts), now = new Date();
  const hh = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const sameDay = d.toDateString() === now.toDateString();
  if(sameDay) return T().casos.today + ' ' + hh;
  return d.toLocaleDateString(T().htmlLang, { day:'numeric', month:'short' }) + ' ' + hh;
}
function fmtTime(ts){
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/* ---------- Detalle de un caso ---------- */
function caseDetailHTML(scr){
  const t = T();
  const c = caseById(scr.caseId);
  if(!c) return `<div class="et-pad"><div class="et-empty">${ICON.pulse}
    <h3>${esc(t.casos.gone)}</h3></div></div>`;

  const body = c.entries.length ? `
    <div class="et-section">${esc(t.casos.log)}</div>
    <div class="et-group">${c.entries.map(e => {
      const lv = LEVEL[e.level] || LEVEL.info;
      return `<div class="et-row" style="cursor:default;align-items:flex-start">
        <span class="et-dot" style="background:${lv.color}"></span>
        <span class="et-row-main">
          <span class="et-case-top">
            <span class="et-entry-tool">${esc(e.tool)}</span>
            <span class="et-entry-time">${esc(fmtTime(e.time))}</span>
          </span>
          <span class="et-entry-title" style="color:${lv.color}">${esc(e.title)}</span>
          ${e.trace ? `<span class="et-row-sub">${esc(e.trace)}</span>` : ''}
        </span>
      </div>`;
    }).join('')}</div>`
    : `<div class="et-empty">${ICON.pulse}
        <h3>${esc(t.casos.noEntriesTitle)}</h3>
        <p>${esc(t.casos.noEntriesText)}</p></div>`;

  return `<div class="et-pad">
    <p class="et-lede" style="margin:16px 0 0">${esc(caseMeta(c))}</p>
    ${c.id !== activeCaseId() ? `<button class="et-btn et-btn-ghost" style="margin-top:14px"
        onclick="makeActive('${c.id}')">${esc(t.casos.makeActive)}</button>` : ''}
    ${body}
    <button class="et-btn" style="margin-top:18px" onclick="addAlgo('${c.id}')">${esc(t.casos.addAlgo)}</button>
    <button class="et-btn-text" onclick="deleteCase('${c.id}')"
      style="color:var(--app-red)">${esc(t.casos.delete)}</button>
  </div>`;
}
function makeActive(id){
  setActiveCase(id);
  render();
  showToast(T().casos.nowActive.replace('{v}', caseById(id).label));
}
function addAlgo(id){
  setActiveCase(id);
  S.stacks[S.tab] = S.stack;
  S.tab = 'kit';
  S.stack = [];
  S.stacks.kit = S.stack;
  S.dir = 0;
  render();
}
function deleteCase(id){
  const c = caseById(id);
  if(!c) return;
  S.confirm = {
    text: T().casos.confirmDelete.replace('{v}', c.label),
    ok: T().casos.delete,
    run: () => {
      saveCases(allCases().filter(x => x.id !== id));
      if(activeCaseId() === id){
        const rest = allCases();
        if(rest.length) setActiveCase(rest[0].id);
        else { try{ localStorage.removeItem(CASE_ACTIVE); }catch(e){} }
      }
      sendEvent('case_delete');
      S.confirm = null;
      S.stack = [];
      S.stacks.casos = S.stack;
      render();
    }
  };
  render();
}

/* ---------- Hoja de caso nuevo ---------- */
function newCaseSheetHTML(){
  const t = T();
  return `<div class="et-overlay" onclick="if(event.target===this)closeSheet()">
    <div class="et-sheet">
      <div class="et-grabber"></div>
      <div class="et-sheet-head">
        <h2>${esc(t.casos.newTitle)}</h2>
        <p>${esc(t.casos.newSub)}</p>
      </div>
      <div class="et-sheet-body" style="flex:0 1 auto">
        <input class="et-input" id="caseName" maxlength="40" autocomplete="off"
               placeholder="${esc(t.casos.namePh)}"
               onkeydown="if(event.key==='Enter')createCase()">
        <button class="et-btn" style="margin-top:14px" onclick="createCase()">${esc(t.casos.create)}</button>
      </div>
    </div></div>`;
}
function createCase(){
  const el = document.getElementById('caseName');
  const c = newCase(el ? el.value : '');
  S.sheet = null;
  S.stacks[S.tab] = S.stack;
  S.tab = 'casos';
  S.stack = [{ kind:'caseDetail', caseId:c.id }];
  S.stacks.casos = S.stack;
  S.dir = 1;
  render();
}

/* ---------- Confirmacion ---------- */
function confirmHTML(){
  if(!S.confirm) return '';
  const t = T();
  return `<div class="et-overlay" onclick="if(event.target===this){S.confirm=null;render()}">
    <div class="et-sheet">
      <div class="et-grabber"></div>
      <div class="et-sheet-head"><h2>${esc(S.confirm.text)}</h2></div>
      <div class="et-sheet-body" style="flex:0 1 auto">
        <button class="et-btn" style="background:var(--app-red)" onclick="S.confirm.run()">${esc(S.confirm.ok)}</button>
        <button class="et-btn-text" onclick="S.confirm=null;render()">${esc(t.countrySheet.cancel)}</button>
      </div>
    </div></div>`;
}

/* ---------- Bloque de caso en la portada del Kit ----------
   Con registros invita a continuar; sin caso o vacio explica la funcion
   sin exigir nada. */
function coverCaseHTML(){
  const t = T();
  const c = activeCase();
  if(c && c.entries.length){
    return `<button class="et-cover-row" onclick="goToCase('${c.id}')">
      <span class="et-cover-tile" style="background:var(--app-red)">${ICON.pulse}</span>
      <span class="et-row-main">
        <span class="et-cover-eyebrow">${esc(t.kit.continueCase)}</span>
        <span class="et-cover-name">${esc(c.label)}</span>
      </span>
      <span class="et-cover-count">${c.entries.length}</span>
      ${ICON.right}
    </button>`;
  }
  return `<div class="et-cover-row">
    <span class="et-cover-tile" style="background:rgba(255,255,255,.12)">${ICON.pulse}</span>
    <span class="et-row-main"><span class="et-cover-text">${esc(t.kit.noCase)}</span></span>
  </div>`;
}

function goToCase(id){
  S.stacks[S.tab] = S.stack;
  S.tab = 'casos';
  S.stack = [{ kind:'caseDetail', caseId:id }];
  S.stacks.casos = S.stack;
  S.dir = 1;
  render();
}
