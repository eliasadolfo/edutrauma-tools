/* ============================================================
   EduTrauma Tools — Camas (capa compartida)

   OJO: esto NO es Casos. Casos vive en el telefono y no sale de ahi; eso se
   le prometio a los usuarios con esas palabras. Camas es lo contrario: datos
   de un paciente real, en un servidor, visibles para el equipo que lo atiende.
   Las dos cosas tienen que verse distintas y no mezclarse nunca.

   Modelo y decisiones: design/CAMAS.md
   ============================================================ */

const SB_URL = 'https://waiyebnzegnpaqdbyxmc.supabase.co';
const SB_KEY = 'sb_publishable_4dLoBUvBpM6CBftBCg0PqQ_9kKacT5h';

let sb = null;
function sbClient(){
  if(sb) return sb;
  if(!window.supabase) return null;
  sb = window.supabase.createClient(SB_URL, SB_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return sb;
}

/* Estado de la capa compartida, aparte del estado del resto de la app. */
const C = {
  sesion: null,      /* usuario autenticado */
  unidad: null,      /* { id, nombre, codigo, rol } */
  camas: [],
  pacientes: [],     /* con su asignacion actual */
  cargando: false,
  error: null
};

/* ---------- Cola para cuando no hay senal ----------
   La app funciona en pabellon sin cobertura. Lo que se escriba sin red se
   guarda con su hora del telefono y se sube despues; el local_id hace que
   subirlo dos veces no duplique. */
const COLA = 'et_camas_cola';
function encolar(op){
  try{
    const q = JSON.parse(localStorage.getItem(COLA) || '[]');
    q.push(op);
    localStorage.setItem(COLA, JSON.stringify(q));
  }catch(e){}
}
function colaPendiente(){
  try{ return JSON.parse(localStorage.getItem(COLA) || '[]').length; }catch(e){ return 0; }
}
async function vaciarCola(){
  const c = sbClient();
  if(!c || !C.sesion) return;
  let q = [];
  try{ q = JSON.parse(localStorage.getItem(COLA) || '[]'); }catch(e){}
  if(!q.length) return;
  const quedan = [];
  for(const op of q){
    try{
      const { error } = await c.from(op.tabla).insert(op.fila);
      /* 23505 = clave duplicada: ya estaba subido. No es un fallo. */
      if(error && error.code !== '23505') quedan.push(op);
    }catch(e){ quedan.push(op); }
  }
  try{ localStorage.setItem(COLA, JSON.stringify(quedan)); }catch(e){}
}
window.addEventListener('online', () => { vaciarCola().then(() => { if(S.tab === 'camas') cargarUnidad(); }); });

function localId(){
  return (crypto.randomUUID ? crypto.randomUUID() : 'l-' + Date.now() + '-' + Math.random().toString(36).slice(2));
}

/* ---------- Sesion ---------- */
async function camasInit(){
  const c = sbClient();
  if(!c) return;
  const { data } = await c.auth.getSession();
  C.sesion = data.session ? data.session.user : null;
  c.auth.onAuthStateChange((_e, s) => {
    C.sesion = s ? s.user : null;
    if(C.sesion) vaciarCola();
    render();
  });
  if(C.sesion){ await vaciarCola(); await cargarUnidad(); }
}
/* Código de 6 dígitos, no enlace.
   Un enlace en un correo SIEMPRE abre el navegador, nunca la app instalada, y
   en iPhone la app del icono tiene su propio almacenamiento: la sesión se
   quedaría en Safari y no donde el usuario va a trabajar. Con un código que se
   escribe dentro de la app, la sesión nace en el sitio correcto. */
async function enviarCodigo(){
  const el = document.getElementById('camasEmail');
  const email = (el ? el.value : '').trim();
  if(!email) return;
  const c = sbClient();
  C.cargando = true; C.error = null; render();
  const { error } = await c.auth.signInWithOtp({
    email, options: { emailRedirectTo: location.origin + '/#camas' }
  });
  C.cargando = false;
  C.error = error ? error.message : null;
  if(!error) C.esperandoCodigo = email;
  render();
  setTimeout(() => { const i = document.getElementById('camasCodigoOtp'); if(i) i.focus(); }, 120);
}
async function verificarCodigo(){
  const el = document.getElementById('camasCodigoOtp');
  const token = (el ? el.value : '').replace(/\D/g, '');
  if(token.length < 6) return;
  const c = sbClient();
  C.cargando = true; C.error = null; render();
  const { error } = await c.auth.verifyOtp({ email: C.esperandoCodigo, token, type: 'email' });
  C.cargando = false;
  if(error){ C.error = T().camas.codigoOtpMalo; render(); return; }
  C.esperandoCodigo = null;
  await cargarUnidad();
}
async function camasSalir(){
  await sbClient().auth.signOut();
  C.unidad = null; C.camas = []; C.pacientes = [];
  render();
}

/* ---------- Unidad ---------- */
async function cargarUnidad(){
  const c = sbClient();
  if(!c || !C.sesion) return;
  C.cargando = true; render();
  try{
    const { data: mis } = await c.from('miembro')
      .select('unidad_id, rol, estado, nombre, unidad(id, nombre, codigo)')
      .eq('user_id', C.sesion.id);
    const activa = (mis || []).find(m => m.estado === 'activo');
    if(!activa){
      C.unidad = (mis || [])[0] ? { pendiente: true } : null;
      C.cargando = false; render(); return;
    }
    C.unidad = { id: activa.unidad_id, nombre: activa.unidad.nombre,
                 codigo: activa.unidad.codigo, rol: activa.rol, nombre_propio: activa.nombre };
    const { data: camas } = await c.from('cama')
      .select('id, etiqueta, orden').eq('unidad_id', C.unidad.id).order('orden');
    C.camas = camas || [];
    const { data: pac } = await c.from('paciente')
      .select('id, alias, ingreso, egreso, asignacion(id, cama_id, hasta)')
      .eq('unidad_id', C.unidad.id).is('egreso', null);
    C.pacientes = pac || [];
  }catch(e){ C.error = String(e); }
  C.cargando = false; render();
}
async function unirseAUnidad(){
  const el = document.getElementById('camasCodigo');
  const nombreEl = document.getElementById('camasNombre');
  const codigo = (el ? el.value : '').trim().toUpperCase();
  const nombre = (nombreEl ? nombreEl.value : '').trim();
  if(!codigo || !nombre) return;
  const c = sbClient();
  C.cargando = true; C.error = null; render();
  /* El codigo no se puede buscar con RLS puesto (aun no eres miembro), asi que
     la busqueda la hace una funcion del servidor. */
  const { data, error } = await c.rpc('entrar_con_codigo', { p_codigo: codigo, p_nombre: nombre });
  C.cargando = false;
  if(error || !data){ C.error = T().camas.codigoMalo; render(); return; }
  await cargarUnidad();
}
async function crearUnidad(){
  const nEl = document.getElementById('camasUnidadNombre');
  const yoEl = document.getElementById('camasMiNombre');
  const nombre = (nEl ? nEl.value : '').trim();
  const yo = (yoEl ? yoEl.value : '').trim();
  if(!nombre || !yo) return;
  const c = sbClient();
  C.cargando = true; C.error = null; render();
  const { data, error } = await c.rpc('crear_unidad', { p_nombre: nombre, p_nombre_organizador: yo });
  C.cargando = false;
  if(error){ C.error = error.message; render(); return; }
  await cargarUnidad();
}

/* ---------- Camas y pacientes ---------- */
function pacienteEnCama(camaId){
  return C.pacientes.find(p => (p.asignacion || []).some(a => a.cama_id === camaId && !a.hasta));
}
async function crearCama(){
  const el = document.getElementById('camaEtiqueta');
  const etiqueta = (el ? el.value : '').trim();
  if(!etiqueta) return;
  const c = sbClient();
  await c.from('cama').insert({ unidad_id: C.unidad.id, etiqueta, orden: C.camas.length });
  S.sheet = null;
  await cargarUnidad();
}
async function ingresarPaciente(camaId){
  const el = document.getElementById('pacienteAlias');
  const alias = (el ? el.value : '').trim();
  if(!alias) return;
  const c = sbClient();
  const { data, error } = await c.from('paciente')
    .insert({ unidad_id: C.unidad.id, alias, creado_por: C.sesion.id })
    .select('id').single();
  if(error){ showToast(error.message); return; }
  await c.from('asignacion').insert({ paciente_id: data.id, cama_id: camaId, movido_por: C.sesion.id });
  S.sheet = null;
  await cargarUnidad();
}
/* Mover = cerrar la asignacion anterior y abrir otra. La evolucion no se
   entera porque cuelga del paciente, no de la cama. */
async function moverPaciente(pacienteId, camaDestino){
  const c = sbClient();
  const ahora = new Date().toISOString();
  await c.from('asignacion').update({ hasta: ahora })
    .eq('paciente_id', pacienteId).is('hasta', null);
  await c.from('asignacion').insert({ paciente_id: pacienteId, cama_id: camaDestino, movido_por: C.sesion.id });
  S.sheet = null;
  await cargarUnidad();
  showToast(T().camas.movido);
}
async function darEgreso(pacienteId){
  const c = sbClient();
  const ahora = new Date().toISOString();
  await c.from('paciente').update({ egreso: ahora, actualizado: ahora, actualizado_por: C.sesion.id })
    .eq('id', pacienteId);
  await c.from('asignacion').update({ hasta: ahora }).eq('paciente_id', pacienteId).is('hasta', null);
  S.confirm = null;
  S.stack = []; S.stacks.camas = S.stack;
  await cargarUnidad();
  showToast(T().camas.egresado);
}

/* ---------- Evolucion e indicaciones ---------- */
async function cargarPaciente(id){
  const c = sbClient();
  const [{ data: ev }, { data: ind }] = await Promise.all([
    c.from('evolucion').select('*').eq('paciente_id', id).order('cliente_ts', { ascending: true }),
    c.from('indicacion').select('*').eq('paciente_id', id).order('cliente_ts', { ascending: true })
  ]);
  const scr = topScreen();
  if(scr && scr.kind === 'camaPaciente'){ scr.evolucion = ev || []; scr.indicaciones = ind || []; render(); }
}
async function escribirEvolucion(pacienteId){
  const el = document.getElementById('evoTexto');
  const texto = (el ? el.value : '').trim();
  if(!texto) return;
  const fila = {
    paciente_id: pacienteId, autor_id: C.sesion.id, autor_nombre: C.unidad.nombre_propio,
    tipo: 'texto', texto, cliente_ts: new Date().toISOString(), local_id: localId()
  };
  const c = sbClient();
  const { error } = await c.from('evolucion').insert(fila);
  if(error){ encolar({ tabla:'evolucion', fila }); showToast(T().camas.sinRed); }
  el.value = '';
  await cargarPaciente(pacienteId);
}
async function dejarIndicacion(pacienteId){
  const el = document.getElementById('indTexto');
  const texto = (el ? el.value : '').trim();
  if(!texto) return;
  const fila = {
    paciente_id: pacienteId, texto, autor_id: C.sesion.id, autor_nombre: C.unidad.nombre_propio,
    cliente_ts: new Date().toISOString(), local_id: localId()
  };
  const c = sbClient();
  const { error } = await c.from('indicacion').insert(fila);
  if(error){ encolar({ tabla:'indicacion', fila }); showToast(T().camas.sinRed); }
  el.value = '';
  await cargarPaciente(pacienteId);
}
async function marcarIndicacion(id, pacienteId){
  const c = sbClient();
  await c.from('indicacion').update({
    hecha_ts: new Date().toISOString(), hecha_por: C.sesion.id, hecha_nombre: C.unidad.nombre_propio
  }).eq('id', id);
  await cargarPaciente(pacienteId);
}

/* ============================================================
   PANTALLAS
   ============================================================ */

/* Raiz de la pestana: sesion -> unidad -> camas. */
function camasScreenHTML(){
  const t = T().camas;
  if(!window.supabase) return avisoHTML(t.sinLibreria);
  if(!C.sesion)        return camasAuthHTML();
  if(C.cargando && !C.unidad) return avisoHTML(T().camas.cargando);
  if(C.unidad && C.unidad.pendiente) return avisoHTML(t.pendiente);
  if(!C.unidad)        return camasUnirseHTML();
  return camasUnidadHTML();
}
function avisoHTML(txt){
  return `<div class="et-pad"><div class="et-empty">${ICON.beds}<p>${esc(txt)}</p></div></div>`;
}

function camasAuthHTML(){
  const t = T().camas;
  if(C.esperandoCodigo){
    return `<div class="et-pad">
      <h1 class="et-h1">${esc(t.revisaCorreo)}</h1>
      <p class="et-lede">${esc(t.enviadoA.replace('{v}', C.esperandoCodigo))}</p>
      <input class="et-input" id="camasCodigoOtp" inputmode="numeric" autocomplete="one-time-code"
             maxlength="6" placeholder="000000"
             style="text-align:center;letter-spacing:.5em;font-weight:800;font-size:26px"
             oninput="if(this.value.replace(/\\D/g,'').length===6) verificarCodigo()">
      <button class="et-btn" style="margin-top:12px" ${C.cargando?'disabled':''}
              onclick="verificarCodigo()">${esc(C.cargando ? t.verificando : t.verificar)}</button>
      ${C.error ? `<p class="et-note" style="color:var(--app-red)">${esc(C.error)}</p>` : ''}
      <p class="et-note">${esc(t.codigoNoEnlace)}</p>
      <p class="et-note">${esc(t.oUsaElEnlace)}</p>
      <button class="et-btn-text" onclick="C.esperandoCodigo=null;C.error=null;render()">${esc(t.otroCorreo)}</button>
    </div>`;
  }
  return `<div class="et-pad">
    <h1 class="et-h1">${esc(t.entrar)}</h1>
    <p class="et-lede">${esc(t.entrarSub)}</p>
    <div class="et-aviso">${esc(t.avisoCompartido)}</div>
    <input class="et-input" id="camasEmail" type="email" inputmode="email" autocomplete="email"
           placeholder="${esc(t.tuCorreo)}" style="margin-top:16px">
    <button class="et-btn" style="margin-top:12px" ${C.cargando?'disabled':''}
            onclick="enviarCodigo()">${esc(C.cargando ? t.enviando : t.enviarEnlace)}</button>
    ${C.error ? `<p class="et-note" style="color:var(--app-red)">${esc(C.error)}</p>` : ''}
    <p class="et-note">${esc(t.sinContrasena)}</p>
  </div>`;
}

function camasUnirseHTML(){
  const t = T().camas;
  return `<div class="et-pad">
    <h1 class="et-h1">${esc(t.unirseTitulo)}</h1>
    <p class="et-lede">${esc(t.unirseSub)}</p>

    <div class="et-section">${esc(t.conCodigo)}</div>
    <input class="et-input" id="camasCodigo" maxlength="8" autocapitalize="characters"
           placeholder="${esc(t.codigoPh)}" style="text-transform:uppercase;letter-spacing:.12em;font-weight:700">
    <input class="et-input" id="camasNombre" maxlength="40" style="margin-top:9px"
           placeholder="${esc(t.comoFirmas)}">
    <button class="et-btn" style="margin-top:12px" ${C.cargando?'disabled':''}
            onclick="unirseAUnidad()">${esc(t.entrarUnidad)}</button>
    <p class="et-note">${esc(t.firmaNota)}</p>
    ${C.error ? `<p class="et-note" style="color:var(--app-red)">${esc(C.error)}</p>` : ''}

    <div class="et-section">${esc(t.crearTitulo)}</div>
    <input class="et-input" id="camasUnidadNombre" maxlength="60" placeholder="${esc(t.unidadPh)}">
    <input class="et-input" id="camasMiNombre" maxlength="40" style="margin-top:9px"
           placeholder="${esc(t.comoFirmas)}">
    <button class="et-btn et-btn-ghost" style="margin-top:12px" ${C.cargando?'disabled':''}
            onclick="crearUnidad()">${esc(t.crearUnidad)}</button>
    <p class="et-note">${esc(t.crearNota)}</p>

    <button class="et-btn-text" style="margin-top:20px" onclick="camasSalir()">${esc(t.salir)}</button>
  </div>`;
}

function camasUnidadHTML(){
  const t = T().camas;
  const pend = colaPendiente();
  const camas = C.camas.map(cm => {
    const p = pacienteEnCama(cm.id);
    return `<button class="et-cama ${p ? 'ocupada' : ''}"
              onclick="${p ? `abrirPaciente('${p.id}','${cm.id}')` : `S.sheet='ingreso:${cm.id}';render()`}">
      <span class="et-cama-et">${esc(cm.etiqueta)}</span>
      <span class="et-cama-p">${p ? esc(p.alias) : esc(t.libre)}</span>
    </button>`;
  }).join('');

  return `<div class="et-pad">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px">
      <h1 class="et-h1" style="margin-bottom:0">${esc(C.unidad.nombre)}</h1>
      <button class="et-cancel" style="padding-bottom:6px;font-weight:600"
              onclick="S.sheet='nuevaCama';render()">${esc(t.nuevaCama)}</button>
    </div>
    <p class="et-lede" style="margin-top:6px">${esc(t.compartida)}</p>
    ${pend ? `<div class="et-aviso amber">${esc(t.porSubir.replace('{n}', pend))}</div>` : ''}

    ${C.camas.length
      ? `<div class="et-camas">${camas}</div>`
      : `<div class="et-empty">${ICON.beds}<h3>${esc(t.sinCamas)}</h3>
           <p>${esc(t.sinCamasSub)}</p></div>`}

    ${C.unidad.rol === 'organizador' ? `
      <div class="et-section">${esc(t.codigoUnidad)}</div>
      <div class="et-card" style="text-align:center">
        <div class="et-codigo">${esc(C.unidad.codigo)}</div>
        <p class="et-note" style="margin-top:8px">${esc(t.codigoNota)}</p>
      </div>
      <button class="et-btn et-btn-ghost" style="margin-top:12px"
              onclick="push({kind:'camaEquipo'})">${esc(t.verEquipo)}</button>` : ''}

    <button class="et-btn-text" style="margin-top:20px" onclick="camasSalir()">${esc(t.salir)}</button>
  </div>`;
}

function abrirPaciente(pacienteId, camaId){
  push({ kind:'camaPaciente', pacienteId, camaId, evolucion:null, indicaciones:null });
  cargarPaciente(pacienteId);
}

/* ---------- La evolucion de un paciente ---------- */
function camaPacienteHTML(scr){
  const t = T().camas;
  const p = C.pacientes.find(x => x.id === scr.pacienteId);
  const cama = C.camas.find(c => c.id === scr.camaId);
  if(!p) return avisoHTML(t.pacienteIdo);

  const pendientes = (scr.indicaciones || []).filter(i => !i.hecha_ts);
  const hechas     = (scr.indicaciones || []).filter(i => i.hecha_ts);

  const indHTML = i => `<div class="et-ind ${i.hecha_ts ? 'hecha' : ''}">
      <button class="et-ind-check" ${i.hecha_ts ? 'disabled' : ''}
              onclick="marcarIndicacion('${i.id}','${p.id}')"
              aria-label="${esc(t.marcarHecha)}">${i.hecha_ts ? ICON.checkBig : ''}</button>
      <span class="et-ind-main">
        <span class="et-ind-txt">${esc(i.texto)}</span>
        <span class="et-ind-meta">${esc(i.autor_nombre)} · ${esc(fmtTime(new Date(i.cliente_ts).getTime()))}${
          i.hecha_ts ? ` · ${esc(t.hechaPor.replace('{v}', i.hecha_nombre || ''))}` : ''}</span>
      </span>
    </div>`;

  /* La evolucion se lee de arriba abajo, como una evolucion de papel. */
  const evo = (scr.evolucion || []).map(e => `
    <div class="et-evo ${e.tipo === 'resultado' ? 'calc' : ''}">
      <span class="et-evo-hora">${esc(fmtTime(new Date(e.cliente_ts).getTime()))}</span>
      <span class="et-evo-main">
        ${e.tipo === 'resultado'
          ? `<span class="et-evo-tool">${esc(e.herramienta || '')}</span>
             <span class="et-evo-txt">${esc(e.titulo || '')}</span>
             ${e.detalle ? `<span class="et-evo-det">${esc(e.detalle)}</span>` : ''}`
          : `<span class="et-evo-txt">${esc(e.texto || '')}</span>`}
        <span class="et-evo-firma">${esc(e.autor_nombre)}</span>
      </span>
    </div>`).join('');

  return `<div class="et-pad">
    <p class="et-lede" style="margin:16px 0 0">
      ${cama ? esc(cama.etiqueta) + ' · ' : ''}${esc(t.desde.replace('{v}', fmtDate(new Date(p.ingreso).getTime())))}
    </p>

    <div class="et-section">${esc(t.indicaciones)}${pendientes.length ? ` · ${pendientes.length}` : ''}</div>
    <div class="et-group" style="padding:4px 0">
      ${pendientes.length || hechas.length
        ? pendientes.map(indHTML).join('') + hechas.map(indHTML).join('')
        : `<p class="et-note" style="padding:10px 14px;margin:0">${esc(t.sinIndicaciones)}</p>`}
    </div>
    <div class="et-escribir">
      <input class="et-input" id="indTexto" maxlength="200" placeholder="${esc(t.indPh)}"
             onkeydown="if(event.key==='Enter')dejarIndicacion('${p.id}')">
      <button onclick="dejarIndicacion('${p.id}')">${ICON.right}</button>
    </div>

    <div class="et-section">${esc(t.evolucion)}</div>
    ${scr.evolucion === null
      ? `<p class="et-note">${esc(T().camas.cargando)}</p>`
      : evo || `<p class="et-note">${esc(t.sinEvolucion)}</p>`}

    <div class="et-escribir" style="margin-top:12px">
      <input class="et-input" id="evoTexto" maxlength="500" placeholder="${esc(t.evoPh)}"
             onkeydown="if(event.key==='Enter')escribirEvolucion('${p.id}')">
      <button onclick="escribirEvolucion('${p.id}')">${ICON.right}</button>
    </div>

    <div class="et-share" style="margin-top:20px">
      <button onclick="S.sheet='mover:${p.id}';render()">${ICON.beds}${esc(t.mover)}</button>
      <button onclick="pedirEgreso('${p.id}','${esc(p.alias)}')">${ICON.share}${esc(t.egreso)}</button>
    </div>
    <p class="et-note">${esc(t.egresoNota)}</p>
  </div>`;
}
function pedirEgreso(id, alias){
  S.confirm = {
    text: T().camas.confirmEgreso.replace('{v}', alias),
    ok: T().camas.egreso,
    run: () => darEgreso(id)
  };
  render();
}

/* ---------- Equipo de la unidad (solo el organizador) ---------- */
function camaEquipoHTML(){
  const t = T().camas;
  const scr = topScreen();
  if(!scr.miembros){
    sbClient().from('miembro').select('user_id, nombre, email, rol, estado, unido')
      .eq('unidad_id', C.unidad.id).then(({ data }) => {
        const s = topScreen();
        if(s && s.kind === 'camaEquipo'){ s.miembros = data || []; render(); }
      });
    return `<div class="et-pad"><p class="et-note">${esc(t.cargando)}</p></div>`;
  }
  return `<div class="et-pad">
    <p class="et-lede" style="margin:16px 0 0">${esc(t.equipoSub)}</p>
    <div class="et-group" style="margin-top:14px">
      ${scr.miembros.map(m => `
        <div class="et-row" style="cursor:default">
          <span class="et-row-main">
            <span class="et-row-title">${esc(m.nombre)}${m.rol === 'organizador' ? ` · ${esc(t.organizador)}` : ''}</span>
            <span class="et-row-sub">${esc(m.email || '—')}</span>
          </span>
          ${m.user_id !== C.sesion.id
            ? `<button class="et-cancel" style="color:var(--app-red)"
                 onclick="sacarMiembro('${m.user_id}')">${esc(t.sacar)}</button>` : ''}
        </div>`).join('')}
    </div>
    <p class="et-note">${esc(t.equipoNota)}</p>
  </div>`;
}
async function sacarMiembro(userId){
  await sbClient().from('miembro').delete().eq('unidad_id', C.unidad.id).eq('user_id', userId);
  const s = topScreen();
  if(s) s.miembros = null;
  render();
}


/* ---------- Hojas: nueva cama, ingresar paciente, mover ---------- */
function camaSheetHTML(modo, arg){
  const t = T().camas;
  if(modo === 'nueva'){
    return hojaSimple(t.nuevaCama, t.camaPh, 'camaEtiqueta', t.crearCama, 'crearCama()');
  }
  if(modo === 'ingreso'){
    return hojaSimple(t.ingresar, t.aliasPh, 'pacienteAlias', t.ingresar,
                      `ingresarPaciente('${arg}')`, t.aliasNota);
  }
  /* mover */
  const p = C.pacientes.find(x => x.id === arg);
  const ocupadas = C.camas.filter(cm => !pacienteEnCama(cm.id));
  return `<div class="et-overlay" onclick="if(event.target===this)closeSheet()">
    <div class="et-sheet">
      <div class="et-grabber"></div>
      <div class="et-sheet-head"><h2>${esc(t.moverTitulo)}</h2><p>${esc(p ? p.alias : '')}</p></div>
      <div class="et-sheet-body" style="flex:0 1 auto;padding-bottom:6px">
        ${ocupadas.length ? `<div class="et-group">${ocupadas.map(cm => `
          <button class="et-row" onclick="moverPaciente('${arg}','${cm.id}')">
            <span class="et-row-main"><span class="et-row-title">${esc(cm.etiqueta)}</span></span>
            ${ICON.right}
          </button>`).join('')}</div>`
          : `<p class="et-note">${esc(t.sinCamas)}</p>`}
      </div>
    </div></div>`;
}
function hojaSimple(titulo, ph, id, accion, fn, nota){
  return `<div class="et-overlay" onclick="if(event.target===this)closeSheet()">
    <div class="et-sheet">
      <div class="et-grabber"></div>
      <div class="et-sheet-head"><h2>${esc(titulo)}</h2>${nota ? `<p>${esc(nota)}</p>` : ''}</div>
      <div class="et-sheet-body" style="flex:0 1 auto">
        <input class="et-input" id="${id}" maxlength="40" autocomplete="off"
               placeholder="${esc(ph)}" onkeydown="if(event.key==='Enter'){${fn}}">
        <button class="et-btn" style="margin-top:14px" onclick="${fn}">${esc(accion)}</button>
      </div>
    </div></div>`;
}

function irACamas(){
  S.stacks[S.tab] = S.stack;
  S.tab = 'camas';
  S.stack = S.stacks.camas || [];
  S.dir = 0;
  render();
}


/* ============================================================
   Guardar un resultado de herramienta en la evolución de un paciente.

   Este es el circulo completo del producto: la herramienta alimenta la
   evolucion, y la evolucion es lo que permite decidir lo siguiente. La linea
   aparece con la hora REAL en que se calculo, no cuando alguien se acordo de
   escribirla — que es justo el trabajo administrativo que queremos quitar.
   ============================================================ */

/* ¿Hay a dónde guardar? Solo si perteneces a una unidad y hay pacientes. */
function hayPacientes(){
  return hayCamas() && C.pacientes.length > 0;
}

function guardarEnCamaHTML(entry){
  if(!hayPacientes()) return '';
  const t = T().camas;
  return `<div class="et-group" style="margin-top:10px">
    <button class="et-row" style="min-height:52px" onclick='S.sheet="aCama:" + encodeURIComponent(JSON.stringify(${JSON.stringify(entry)}));render()'>
      <span style="display:flex;color:var(--app-teal)">${ICON.beds}</span>
      <span class="et-row-main">
        <span class="et-row-title" style="color:var(--app-teal)">${esc(t.guardarEnCama)}</span>
        <span class="et-row-sub">${esc(t.guardarEnCamaSub)}</span>
      </span>${ICON.right}
    </button>
  </div>`;
}

function elegirPacienteHTML(entryJson){
  const t = T().camas;
  let entry = {};
  try{ entry = JSON.parse(decodeURIComponent(entryJson)); }catch(e){}
  const filas = C.pacientes.map(p => {
    const a = (p.asignacion || []).find(x => !x.hasta);
    const cm = a && C.camas.find(c => c.id === a.cama_id);
    return `<button class="et-row" onclick='guardarEnEvolucion("${p.id}", ${JSON.stringify(entry)})'>
      <span class="et-row-main">
        <span class="et-row-title">${esc(p.alias)}</span>
        ${cm ? `<span class="et-row-sub">${esc(cm.etiqueta)}</span>` : ''}
      </span>${ICON.right}
    </button>`;
  }).join('');
  return `<div class="et-overlay" onclick="if(event.target===this)closeSheet()">
    <div class="et-sheet">
      <div class="et-grabber"></div>
      <div class="et-sheet-head">
        <h2>${esc(t.aQuePaciente)}</h2>
        <p>${esc(t.aQuePacienteSub)}</p>
      </div>
      <div class="et-sheet-body" style="flex:0 1 auto;padding-bottom:6px">
        <div class="et-group">${filas}</div>
      </div>
    </div></div>`;
}

async function guardarEnEvolucion(pacienteId, entry){
  const fila = {
    paciente_id: pacienteId,
    autor_id: C.sesion.id,
    autor_nombre: C.unidad.nombre_propio,
    tipo: 'resultado',
    herramienta: entry.tool || '',
    titulo: entry.title || '',
    detalle: entry.trace || '',
    nivel: entry.level || 'info',
    cliente_ts: new Date().toISOString(),
    local_id: localId()
  };
  const c = sbClient();
  const { error } = await c.from('evolucion').insert(fila);
  S.sheet = null;
  if(error){ encolar({ tabla:'evolucion', fila }); showToast(T().camas.sinRed); }
  else showToast(T().camas.guardadoEn.replace('{v}',
    (C.pacientes.find(p => p.id === pacienteId) || {}).alias || ''));
  render();
}
