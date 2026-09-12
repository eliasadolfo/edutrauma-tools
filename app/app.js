/* ============================================================
   EduTrauma Tools — app móvil
   Según design/handoff-v2/README.md

   Fase 1: armazón (pestañas + pila), primer arranque, Kit y Perfil.
   Las cinco herramientas todavía viven en sus páginas actuales; el Kit
   enlaza a ellas mientras se portan hacia dentro, así nada se rompe.

   Claves de almacenamiento — son LAS MISMAS del resto de la serie. No
   renombrar: el panel interno depende de ellas y hay 800+ usuarios con
   datos ya guardados.
     et_anon    identificador anónimo
     et_profile { specialty, country, source }
     et_queue   eventos pendientes de enviar
     lang       idioma elegido
   ============================================================ */

/* ============ Analítica (anónima → n8n) ============ */
const ET_EVENTS_URL = 'https://devn8n.tuescuelademarcas.cl/webhook/et-tools-event';

function etEnqueue(p){
  try{
    const q = JSON.parse(localStorage.getItem('et_queue') || '[]');
    q.push(p);
    while (q.length > 200) q.shift();
    localStorage.setItem('et_queue', JSON.stringify(q));
  }catch(e){}
}
function etPost(p){
  return fetch(ET_EVENTS_URL, {
    method:'POST', keepalive:true,
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(p)
  }).then(r => { if(!r.ok) throw new Error('http'); });
}
function etFlushQueue(){
  let q = [];
  try{ q = JSON.parse(localStorage.getItem('et_queue') || '[]'); }catch(e){}
  if(!q.length) return;
  try{ localStorage.setItem('et_queue', '[]'); }catch(e){}
  q.forEach(p => etPost(p).catch(() => etEnqueue(p)));
}
window.addEventListener('online', etFlushQueue);

function etAnonId(){
  let id = localStorage.getItem('et_anon');
  if(!id){
    id = (crypto.randomUUID ? crypto.randomUUID()
                            : 'a-' + Date.now() + '-' + Math.random().toString(36).slice(2));
    localStorage.setItem('et_anon', id);
  }
  return id;
}
function etProfile(){
  try{ return JSON.parse(localStorage.getItem('et_profile') || '{}'); }catch(e){ return {}; }
}
/* MERGE, nunca reemplazo: el gate del hub sobrescribía el objeto entero y
   borraba el país al guardar la especialidad. */
function etSaveProfile(patch){
  const p = Object.assign(etProfile(), patch);
  try{ localStorage.setItem('et_profile', JSON.stringify(p)); }catch(e){}
  return p;
}
function sendEvent(event, extra){
  try{
    const p = etProfile();
    const payload = {
      ts: new Date().toISOString(),
      anon_id: etAnonId(),
      event,
      tool: 'hub',
      lang: LANG,
      country: p.country || '',
      specialty: p.specialty || '',
      source: p.source || '',
      tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || ''),
      ua: navigator.userAgent.slice(0, 180),
      extra: extra || {}
    };
    etPost(payload).catch(() => etEnqueue(payload));
  }catch(e){}
}

/* ============ Idioma ============ */
const LANGS = ['es','en','pt'];
const LANG_NAMES = { es:'Español', en:'English', pt:'Português' };
function detectLang(){
  try{
    const saved = localStorage.getItem('lang');
    if(saved && I18N[saved]) return saved;
  }catch(e){}
  const nav = (navigator.language || 'es').toLowerCase();
  if(nav.startsWith('pt')) return 'pt';
  if(nav.startsWith('en')) return 'en';
  return 'es';
}
let LANG = detectLang();
function T(){ return I18N[LANG]; }
function setLang(lang){
  if(lang === LANG) return;
  LANG = lang;
  try{ localStorage.setItem('lang', lang); }catch(e){}
  document.documentElement.lang = T().htmlLang;
  sendEvent('lang_change');
  render();
}
/* El país se guarda en su forma española (clave canónica) y se muestra traducido. */
function countryLabel(c){
  if(!c) return '';
  const map = COUNTRY_NAMES[LANG];
  return (map && map[c]) || c;
}
/* La especialidad se guarda también en su forma española (clave canónica).
   Si se guardara la etiqueta traducida, el mismo cirujano contaría como
   "Trauma surgery" o "Cirurgia do trauma" según el idioma en que abrió la app,
   y el panel volvería a necesitar un mapa de normalización a mano. */
function specialtyLabel(stored){
  if(!stored) return '';
  const i = SPECIALTIES.es.indexOf(stored);
  return i === -1 ? stored : SPECIALTIES[LANG][i];   /* -1 = texto libre antiguo */
}

/* Búsqueda insensible a acentos y mayúsculas. */
function norm(s){
  return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ============ Iconos (Lucide-like, stroke 1.7, heredan currentColor) ============ */
const SVG = (d, extra) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra||''}>${d}</svg>`;
const ICON = {
  kit:    SVG('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  casos:  SVG('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
  guias:  SVG('<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>'),
  perfil: SVG('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>'),
  right:  `<svg class="et-chev" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1l6 6-6 6"/></svg>`,
  left:   `<svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2L2 10l8 8"/></svg>`,
  check:  `<svg class="et-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`,
  checkBig: SVG('<path d="M20 6L9 17l-5-5"/>', ' stroke-width="2.6"'),
  search: SVG('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  shield: SVG('<path d="M12 3l8 3v6c0 4.5-3.2 7.9-8 9-4.8-1.1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  chat:   SVG('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.5-4.4A8.4 8.4 0 0 1 3.6 11.5a8.4 8.4 0 0 1 8.4-8.4 8.4 8.4 0 0 1 9 8.4z"/>'),
  pulse:  SVG('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
  /* Bifurcación: el símbolo de una conducta. Nunca un ✓ ni una ✗ — una
     conducta válida no es una respuesta correcta. */
  branch: SVG('<circle cx="6" cy="4.5" r="2.2"/><circle cx="17.5" cy="13" r="2.2"/><circle cx="6" cy="19.5" r="2.2"/><path d="M6 6.7v10.6"/><path d="M8.2 5.5h4.3a3 3 0 0 1 3 3v2.3"/>'),
  save:   SVG('<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h7V3"/><rect x="8" y="13" width="8" height="6"/>'),
  grid:   SVG('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.5h18M3 15h18M9 4v16"/>'),
  /* Canales */
  correo:    SVG('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2.5 6.5l9.5 6.5 9.5-6.5"/>'),
  instagram: SVG('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>'),
  whatsapp:  SVG('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.5-4.4A8.4 8.4 0 0 1 3.6 11.5a8.4 8.4 0 0 1 8.4-8.4 8.4 8.4 0 0 1 9 8.4z"/>'),
  linkedin:  SVG('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7"/><circle cx="7" cy="7" r="1"/><path d="M12 17v-4a2 2 0 0 1 4 0v4"/><path d="M12 17v-7"/>'),
  amigo:     SVG('<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.3 2.9-5 6.5-5s6.5 1.7 6.5 5"/><path d="M17 5.5a3 3 0 0 1 0 5.8"/><path d="M18.5 20c0-2.2-.8-3.7-2.2-4.6"/>'),
  otro:      SVG('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>')
};

/* ============ Estado ============ */
const S = {
  tab: 'kit',
  stack: [],       /* pila de la pestaña activa */
  stacks: { kit:[], casos:[], guias:[], perfil:[] },  /* una pila por pestaña */
  dir: 0,          /* 1 push · -1 pop · 0 cambio de pestaña */
  sheet: null,     /* 'country' | 'channel' */
  filter: '',
  onb: null,       /* { steps:[...], i:0 } mientras el arranque está activo */
  confirm: null,   /* {text, ok, run} de la hoja de confirmación */
  toast: null,
  toastTimer: null
};

/* ============ Primer arranque ============ */
/* Se pregunta SOLO lo que falta: un usuario antiguo que ya declaró su
   especialidad no vuelve a responderla, pero sí completa el país, que el hub
   dejó de preguntar en algún momento y por eso el panel se quedó sin datos. */
function pendingSteps(){
  const p = etProfile();
  const steps = [];
  if(!p.specialty) steps.push('spec');
  if(!p.country)   steps.push('country');
  if(!p.source)    steps.push('source');
  return steps;
}
function startOnboarding(){
  const steps = pendingSteps();
  if(!steps.length) return false;
  /* La bienvenida ("Tres toques y estás dentro") es para quien llega por
     primera vez. A quien ya usa la app y solo le falta un dato se le pregunta
     directamente: presentarle la app de nuevo sería absurdo. */
  const nuevo = steps.length === 3;
  S.onb = { steps, i: nuevo ? -1 : 0 };
  return true;
}
function onbAdvance(){
  S.onb.i++;
  if(S.onb.i >= S.onb.steps.length){
    S.onb.i = 'done';
    render();
    sendEvent('onboarding_done');
    setTimeout(() => {
      S.onb = null; S.dir = 0; render();
      if(typeof openDeepLink === 'function') openDeepLink();
    }, 1400);
    return;
  }
  render();
}
function onbPick(field, value){
  if(!value) return;
  etSaveProfile({ [field]: value });
  sendEvent('profile_saved', { [field]: value });
  onbAdvance();
}

function onboardingHTML(){
  const t = T(), o = t.onb, st = S.onb;

  if(st.i === -1){
    return `<div class="et-onb">
      <div class="et-onb-welcome">
        <img src="../logo-blanco-trim.png" alt="EduTrauma">
        <div class="et-onb-fill"></div>
        <p class="et-onb-eyebrow">${esc(o.eyebrow)}</p>
        <h1>${esc(o.title)}</h1>
        <p class="et-onb-sub">${esc(o.sub)}</p>
        <div class="et-onb-privacy">${ICON.shield}<p>${esc(o.privacy)}</p></div>
        <button class="et-btn et-btn-red" onclick="onbAdvance()">${esc(o.start)}</button>
      </div>
    </div>`;
  }

  if(st.i === 'done'){
    return `<div class="et-onb">
      <div class="et-onb-done">
        <div class="et-onb-ring">${ICON.checkBig}</div>
        <h2>${esc(o.doneTitle)}</h2>
        <p>${esc(o.doneText)}</p>
      </div>
    </div>`;
  }

  const kind = st.steps[st.i];
  const total = st.steps.length;
  const dots = total > 1
    ? st.steps.map((_, i) => `<i class="${i < st.i ? 'done' : i === st.i ? 'now' : ''}"></i>`).join('')
    : '';
  const Q = { spec:[o.q1,o.w1], country:[o.q2,o.w2], source:[o.q3,o.w3] }[kind];

  let body = '';
  if(kind === 'spec'){
    body = `<div class="et-pad"><div class="et-group">${
      SPECIALTIES[LANG].map((s, i) =>
        `<button class="et-row" style="min-height:56px" onclick="onbPick('specialty', this.dataset.v)" data-v="${esc(SPECIALTIES.es[i])}">
           <span class="et-row-main"><span class="et-row-title">${esc(s)}</span></span>${ICON.right}
         </button>`).join('')
    }</div></div>`;
  } else if(kind === 'country'){
    body = `<div class="et-pad">${countryPickerHTML('onbPick(\'country\', THIS)')}</div>`;
  } else {
    body = `<div class="et-pad"><div class="et-group">${channelRowsHTML('onbPick(\'source\', THIS)')}</div>
      <p class="et-note">${esc(t.perfil.channelNote)}</p></div>`;
  }

  return `<div class="et-onb">
    <div class="et-onb-head">
      ${total > 1 ? `<div class="et-onb-prog">
        <span class="et-onb-dots">${dots}</span>
        <span class="et-onb-step">${esc(o.stepOf.replace('{n}', st.i + 1).replace('{t}', total))}</span>
      </div>` : ''}
      <h2>${esc(Q[0])}</h2>
      <p>${esc(Q[1])}</p>
    </div>
    <div class="et-scroll">${body}</div>
    <div class="et-onb-foot">${esc(o.foot)}</div>
  </div>`;
}

/* ============ Selector de país (compartido: arranque y Perfil) ============ */
/* `action` lleva el marcador THIS, que se sustituye por el valor de cada fila. */
function countryPickerHTML(action){
  const t = T().countrySheet;
  const f = S.filter.trim();
  const call = v => action.replace('THIS', `'${v.replace(/'/g, "\\'")}'`);
  const all = COUNTRIES.slice().sort((a,b) => a.localeCompare(b, 'es')).concat([COUNTRY_OTHER]);
  const current = etProfile().country || '';

  const row = c => `<button class="et-row" style="min-height:52px" onclick="${call(c)}">
      <span class="et-row-main"><span class="et-row-title">${esc(countryLabel(c))}</span></span>
      ${c === current ? ICON.check : ICON.right}
    </button>`;

  const search = `<div class="et-search" style="margin-bottom:14px">
      ${ICON.search}
      <input type="text" inputmode="search" autocomplete="off" placeholder="${esc(t.search)}"
             value="${esc(S.filter)}" oninput="onCountryFilter(this.value)">
      ${f ? `<button class="et-search-clear" onclick="onCountryFilter('')" aria-label="${esc(t.cancel)}">✕</button>` : ''}
    </div>`;

  if(f){
    const hits = all.filter(c => norm(countryLabel(c)).includes(norm(f)) || norm(c).includes(norm(f)));
    if(!hits.length){
      return search + `<div class="et-empty">${ICON.search}
        <h3>${esc(t.emptyTitle)}</h3><p>${esc(t.emptyText)}</p></div>`;
    }
    return search + `<div class="et-section" style="margin-top:0">${esc(t.results)}</div>
      <div class="et-group">${hits.map(row).join('')}</div>`;
  }

  const rest = all.filter(c => !COUNTRY_FREQ.includes(c));
  return search +
    `<div class="et-section" style="margin-top:0">${esc(t.frequent)}</div>
     <div class="et-group">${COUNTRY_FREQ.map(row).join('')}</div>
     <div class="et-section">${esc(t.az)}</div>
     <div class="et-group">${rest.map(row).join('')}</div>`;
}
function onCountryFilter(v){
  S.filter = v;
  const host = document.getElementById('countryHost');
  if(host) host.innerHTML = countryPickerHTML(host.dataset.action);
  const input = host && host.querySelector('input');
  if(input){ input.focus(); input.setSelectionRange(v.length, v.length); }
}

function channelRowsHTML(action){
  const t = T();
  const current = etProfile().source || '';
  return CHANNELS.map(id => `
    <button class="et-row" style="min-height:54px" onclick="${action.replace('THIS', `'${id}'`)}">
      <span class="et-tile et-tile-sm">${ICON[id]}</span>
      <span class="et-row-main"><span class="et-row-title">${esc(t.channels[id])}</span></span>
      ${id === current ? ICON.check : ''}
    </button>`).join('');
}

/* ============ Hojas modales (Perfil) ============ */
function openSheet(kind){ S.sheet = kind; S.filter = ''; render(); }
function closeSheet(){ S.sheet = null; S.filter = ''; render(); }

function sheetHTML(){
  const t = T();
  if(S.sheet === 'newcase') return newCaseSheetHTML();
  if(S.sheet === 'country'){
    const c = t.countrySheet;
    return `<div class="et-overlay" onclick="if(event.target===this)closeSheet()">
      <div class="et-sheet et-sheet-tall">
        <div class="et-grabber"></div>
        <div class="et-sheet-bar">
          <h2>${esc(c.title)}</h2>
          <button class="et-cancel" onclick="closeSheet()">${esc(c.cancel)}</button>
        </div>
        <div class="et-sheet-body" id="countryHost" data-action="setCountry(THIS)">
          ${countryPickerHTML('setCountry(THIS)')}
        </div>
      </div></div>`;
  }
  if(S.sheet === 'channel'){
    const c = t.channelSheet;
    return `<div class="et-overlay" onclick="if(event.target===this)closeSheet()">
      <div class="et-sheet">
        <div class="et-grabber"></div>
        <div class="et-sheet-head">
          <h2>${esc(c.title)}</h2>
          <p>${esc(c.sub)}</p>
        </div>
        <div class="et-sheet-body" style="flex:0 1 auto;padding-bottom:6px">
          <div class="et-group">${channelRowsHTML('setChannel(THIS)')}</div>
        </div>
      </div></div>`;
  }
  return '';
}
function setCountry(c){
  etSaveProfile({ country: c });
  sendEvent('profile_saved', { country: c });
  S.sheet = null; S.filter = '';
  render();
  showToast(T().toast.country.replace('{v}', countryLabel(c)));
}
function setChannel(id){
  etSaveProfile({ source: id });
  sendEvent('profile_saved', { source: id });
  S.sheet = null;
  render();
  showToast(T().toast.channel);
}

/* ============ Toast ============ */
function showToast(msg){
  S.toast = msg;
  clearTimeout(S.toastTimer);
  renderLayers();
  S.toastTimer = setTimeout(() => { S.toast = null; renderLayers(); }, 2300);
}

/* ============ Pantallas ============ */
/* Cabecera de progreso, compartida por los dos motores de algoritmo. */
function progressHTML(step, total, name){
  const pct = Math.round((step / total) * 100);
  return `<div class="et-prog-top">
      <span>${esc(T().tool.stepOf.replace('{n}', step).replace('{t}', total))}</span>
      <span class="et-prog-name">${esc(name)}</span>
    </div>
    <div class="et-prog"><i style="width:${pct}%"></i></div>`;
}

function kitHTML(){
  const t = T(), k = t.kit;
  const tools = t.tools.map(tool => {
    /* Las portadas ya viven dentro del app; las demás siguen abriendo su
       página actual hasta que se porten. */
    /* TOOLS y DIRECT se declaran con const en tools.js, así que NO cuelgan de
       window: hay que preguntar por el identificador, no por la propiedad. */
    const inside = typeof TOOLS !== 'undefined' && !!TOOLS[tool.id];
    const direct = inside && typeof DIRECT !== 'undefined' && !!DIRECT[tool.id];
    const open = inside
      ? `<button class="et-row" onclick="${direct ? 'openToolDirect' : 'openTool'}('${tool.id}')">`
      : `<a class="et-row" href="${tool.href}" onclick="sendEvent('tool_open',{tool_id:'${tool.id}'})">`;
    return `${open}
      <span class="et-tile" style="background:${tool.tile}">
        ${tool.chip ? `<img src="../${tool.chip}" alt="">`
                    : `<span class="et-tile-mono">${esc(tool.mono)}</span>`}
      </span>
      <span class="et-row-main">
        <span class="et-row-title">${esc(tool.title)}</span>
        <span class="et-row-sub">${esc(tool.desc)}</span>
      </span>${ICON.right}
    ${inside ? '</button>' : '</a>'}`;
  }).join('');

  return `
    <div class="et-sticky-wrap">
      <div class="et-sticky-bar"><i class="et-sticky-dot"></i>${esc(k.offline)}</div>
    </div>
    <div class="et-cover">
      <h1>${esc(k.coverTitle)}</h1>
      <p>${esc(k.coverSub)}</p>
      <div class="et-cover-sep"></div>
      ${coverCaseHTML()}
    </div>
    <div class="et-pad">
      ${favCarouselHTML()}
      <div class="et-section">${esc(k.yourTools)}</div>
      <div class="et-group">${tools}</div>
      <p class="et-note">${esc(k.disclaimer)}</p>
      <div class="et-gap"></div>
      <div class="et-group">
        <button class="et-row" onclick="openFeedback()">
          <span style="color:var(--app-teal);display:flex">${ICON.chat}</span>
          <span class="et-row-main"><span class="et-row-title" style="color:var(--app-teal)">${esc(k.feedback)}</span></span>
        </button>
      </div>
    </div>`;
}

/* Favoritos: se ocultan del todo si no hay ninguno. */
function favCarouselHTML(){
  if(typeof favs !== 'function' || typeof TOOLS === 'undefined') return '';
  const list = favs();
  if(!list.length) return '';
  const cards = list.map(key => {
    const [toolId, algoId] = key.split(':');
    const a = TOOLS[toolId] && algoById(toolId, algoId);
    if(!a) return '';
    return `<button class="et-fav-card" onclick="openTool('${toolId}');openAlgo('${toolId}','${algoId}')">
        ${STAR(true)}
        <span class="et-fav-name">${esc(trC(a.name))}</span>
        <span class="et-fav-tool">${esc(TOOLS[toolId].name)}</span>
      </button>`;
  }).filter(Boolean).join('');
  if(!cards) return '';
  return `<div class="et-section">${esc(T().kit.favorites)}</div>
          <div class="et-carousel">${cards}</div>`;
}

function emptyScreenHTML(block){
  return `<div class="et-pad">
    <h1 class="et-h1">${esc(block.title)}</h1>
    <p class="et-lede">${esc(block.lede)}</p>
    <div class="et-empty">${ICON.pulse}
      <h3>${esc(block.emptyTitle)}</h3>
      <p>${esc(block.emptyText)}</p>
    </div>
  </div>`;
}

function perfilHTML(){
  const t = T(), pf = t.perfil, p = etProfile();

  const specs = SPECIALTIES[LANG].map((s, i) => `
    <button class="et-row" onclick="setSpecialty(this.dataset.v)" data-v="${esc(SPECIALTIES.es[i])}">
      <span class="et-row-main"><span class="et-row-title">${esc(s)}</span></span>
      ${SPECIALTIES.es[i] === p.specialty ? ICON.check : ''}
    </button>`).join('');

  const langs = LANGS.map(l =>
    `<button aria-pressed="${l === LANG}" onclick="setLang('${l}')">${esc(LANG_NAMES[l])}</button>`).join('');

  const courses = t.courses.map(c => `
    <div class="et-row" style="cursor:default">
      <span class="et-tile" style="background:#fff;box-shadow:none;border:.5px solid var(--app-sep)">
        <img src="../${c.logo}" alt="" style="height:26px">
      </span>
      <span class="et-row-main">
        <span class="et-row-title">${esc(c.name)}</span>
        <span class="et-row-sub">${esc(c.full)}</span>
      </span>
    </div>`).join('');

  return `<div class="et-pad">
    <h1 class="et-h1">${esc(pf.title)}</h1>
    <p style="margin:0 0 8px;font:600 15px/1.45 var(--et-font);color:var(--app-navy)">${esc(pf.promise)}</p>
    <p style="margin:0 0 4px;font:400 13px/1.5 var(--et-font);color:var(--app-slate)">${pf.detail}</p>

    <div class="et-section">${esc(pf.specialty)}</div>
    <div class="et-group">${specs}</div>

    <div class="et-section">${esc(pf.country)}</div>
    <div class="et-group">
      <button class="et-row" style="min-height:54px" onclick="openSheet('country')">
        <span class="et-row-main"><span class="et-row-title">${esc(pf.countryRow)}</span></span>
        <span class="et-row-value">${esc(p.country ? countryLabel(p.country) : pf.unset)}</span>
        ${ICON.right}
      </button>
    </div>

    <div class="et-section">${esc(pf.channel)}</div>
    <div class="et-group">
      <button class="et-row" style="min-height:54px" onclick="openSheet('channel')">
        <span class="et-row-main"><span class="et-row-title">${esc(pf.channelRow)}</span></span>
        <span class="et-row-value">${esc(p.source ? t.channels[p.source] : pf.unset)}</span>
        ${ICON.right}
      </button>
    </div>
    <p class="et-note">${esc(pf.channelNote)}</p>

    <div class="et-section">${esc(pf.language)}</div>
    <div class="et-seg">${langs}</div>

    <div class="et-section">${esc(pf.offline)}</div>
    <div class="et-card">
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:9px">
        <span style="font:600 17px/1.2 var(--et-font)">${esc(pf.offlineCount)}</span>
        <span style="font:600 13px/1.2 var(--et-font);color:var(--app-green)">${esc(pf.offlineState)}</span>
      </div>
      <div class="et-meter"><i style="width:100%"></i></div>
      <p style="margin:9px 0 0;font:400 12px/1.45 var(--et-font);color:var(--app-slate)">${esc(pf.offlineNote)}</p>
    </div>

    <div class="et-section">${esc(pf.courses)}</div>
    <div class="et-group">${courses}</div>

    <p class="et-note" style="text-align:center;margin-top:22px">${esc(pf.footer)}</p>
  </div>`;
}
function setSpecialty(s){
  etSaveProfile({ specialty: s });
  sendEvent('profile_saved', { specialty: s });
  render();
}

function openFeedback(){
  if(typeof window.etFbOpen === 'function') window.etFbOpen();
  else sendEvent('feedback_open');
}

/* ============ Render ============ */
function tabsHTML(){
  const t = T().tabs;
  return ['kit','casos','guias','perfil'].map(id => `
    <button class="et-tab" role="tab" aria-selected="${S.tab === id}" onclick="setTab('${id}')">
      ${ICON[id]}<span>${esc(t[id])}</span>
    </button>`).join('');
}
function setTab(id){
  if(S.tab === id) return;
  /* Cada pestaña conserva dónde estabas: volver a Kit no te devuelve al
     principio si estabas dentro de una herramienta. */
  S.stacks[S.tab] = S.stack;
  S.tab = id;
  S.stack = S.stacks[id] || [];
  S.dir = 0; S.filter = '';
  render();
  document.getElementById('scroll').scrollTop = 0;
}

function renderLayers(){
  /* Capas que flotan sobre la app: hojas, barra de grado de AAST y toast.
     Van todas aquí porque este nodo se reescribe entero en cada render. */
  const bar = typeof gradeBarHTML === 'function' ? gradeBarHTML() : '';
  const conf = typeof confirmHTML === 'function' ? confirmHTML() : '';
  document.getElementById('layers').innerHTML =
    sheetHTML() + conf + bar + (S.toast ? `<div class="et-toast">${esc(S.toast)}</div>` : '');
}

function render(){
  const t = T();
  document.documentElement.lang = t.htmlLang;

  /* El arranque tapa la app entera: sin pestañas, sin nav bar, sin salida. */
  if(S.onb){
    document.getElementById('navbar').innerHTML = '';
    document.getElementById('scroll').innerHTML = '';
    document.getElementById('tabs').style.display = 'none';
    document.getElementById('layers').innerHTML = onboardingHTML();
    wireOnbCountryHost();
    return;
  }
  document.getElementById('tabs').style.display = '';

  const scr = S.stack.length ? S.stack[S.stack.length - 1] : null;

  const screen = scr ? stackScreenHTML(scr) : {
    kit:    kitHTML,
    casos:  casosScreenHTML,
    guias:  guiasScreenHTML,
    perfil: perfilHTML
  }[S.tab]();

  const anim = S.dir === 1 ? 'et-anim-push' : S.dir === -1 ? 'et-anim-pop' : 'et-anim-fade';
  const scroll = document.getElementById('scroll');
  scroll.innerHTML = `<div class="${anim}">${screen}</div>`;

  if(scr){
    const nav = stackNav(scr, S.stack[S.stack.length - 2]);
    document.getElementById('navbar').innerHTML = `
      <div class="et-nav">
        <button class="et-nav-back" onclick="goBack()">${ICON.left}<span>${esc(nav.backLabel)}</span></button>
        <div class="et-nav-title"><span>${esc(nav.title)}</span></div>
      </div>`;
    document.getElementById('courseChip').innerHTML = nav.chip
      ? `<span class="et-course-chip"><img src="../${nav.chip}" alt=""></span>` : '';
  } else {
    document.getElementById('navbar').innerHTML = '';
    document.getElementById('courseChip').innerHTML = '';
  }
  document.getElementById('tabs').innerHTML = tabsHTML();
  renderLayers();
}

/* En el arranque, el paso de país necesita su contenedor identificado para
   que el buscador pueda repintarse sin rehacer la pantalla entera. */
function wireOnbCountryHost(){
  const pad = document.querySelector('.et-onb .et-scroll .et-pad');
  if(pad && S.onb && S.onb.steps[S.onb.i] === 'country' && !pad.id){
    pad.id = 'countryHost';
    pad.dataset.action = "onbPick('country', THIS)";
  }
}
/* ============ Arranque ============ */

/* El hub guardaba el canal de origen en su propia clave suelta. Lo traemos
   al perfil para no volver a preguntárselo a quien ya respondió. */
function migrateLegacyProfile(){
  try{
    const legacy = localStorage.getItem('et_source');
    if(legacy && !etProfile().source) etSaveProfile({ source: legacy });
  }catch(e){}
}

/* ---------- Enlaces profundos ----------
   tools.edutrauma.net/app/#aast abre directamente esa herramienta. Es lo que
   permite que los QR y los enlaces que ya circulan sigan llevando al sitio
   correcto cuando las paginas viejas redirijan aqui. */
const DEEP_TABS = ['casos','guias','perfil'];
function openDeepLink(){
  const h = (location.hash || '').replace('#','').split('?')[0].trim();
  if(!h) return;
  if(DEEP_TABS.includes(h)){ setTab(h); return; }
  const alias = { calculadoras:'calc', abdomen:'abdomen', miaa:'abdomen',
                  aast:'aast', mip:'mip', teg:'teg', teg6s:'teg', calc:'calc' };
  const id = alias[h];
  if(!id || typeof TOOLS === 'undefined' || !TOOLS[id]) return;
  if(DIRECT[id]) openToolDirect(id); else openTool(id);
}

(function boot(){
  migrateLegacyProfile();
  etFlushQueue();
  etAnonId();
  if(typeof window.etFbInit === 'function') window.etFbInit('hub', 'EduTrauma Tools');
  startOnboarding();
  render();
  /* El enlace profundo espera a que termine el primer arranque: los tres
     datos son obligatorios y no se saltan por llegar con un #. */
  if(!S.onb) openDeepLink();
  window.addEventListener('hashchange', () => { if(!S.onb) openDeepLink(); });
  sendEvent('app_open');

  /* Service worker de la serie (ámbito raíz): es el que da el uso sin conexión
     y el que hace que las apps instaladas se actualicen solas. */
  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('../sw.js', { updateViaCache:'imports' }).catch(() => {});
    });
  }
})();
