/* ============================================================
   EduTrauma — Feedback por herramienta (compartido)
   v2.0 · 2026-07

   Diseño:
   - UNA encuesta por herramienta, tras el primer resultado.
     (nunca en cada uso: no debe estorbar en pabellón)
   - 3 pasos cortos, cada respuesta se envía al momento
     (si abandona en el paso 1, igual tienes la nota).
   - Botón permanente "Opinar" para quien quiera hablar cuando quiera.
   - Siempre cerrable. Nunca bloquea la herramienta.

   Uso desde cada tool:
     etFbInit('calc', 'Calculadoras')   → configurar
     etFbAfterUse()                     → tras mostrar un resultado
     etFbOpen()                         → botón manual "Opinar"
     etFbButton()                       → HTML del botón permanente

   Requiere: sendEvent(evento, extra) definido por la tool.
   ============================================================ */
(function(){
  const KEY = 'et_fb3';
  let TOOL = '', TOOL_NAME = '', step = 0, answers = {}, shownThisSession = false;

  function st(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{}'); }catch(e){ return {}; } }
  function save(s){ try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch(e){} }
  function ev(name, extra){ if (typeof window.sendEvent === 'function') window.sendEvent(name, extra); }

  window.etFbInit = function(tool, name){ TOOL = tool; TOOL_NAME = name; };

  /* Llamar tras mostrar un resultado. Pregunta solo si nunca respondió esta tool. */
  window.etFbAfterUse = function(){
    const s = st();
    if (s[TOOL] && s[TOOL].done) return;   // ya opinó de esta herramienta
    if (shownThisSession) return;
    setTimeout(() => { if (!shownThisSession) open(false); }, 700);
  };

  /* Botón manual: siempre disponible, permite volver a opinar */
  window.etFbOpen = function(){ open(true); };

  /* Pie compartido: MISMA estructura en todas las tools.
     El idioma no va aquí — es preferencia global del hub. */
  window.etToolFooter = function(hubLabel, fbLabel){
    return `<div class="tool-foot">
      <a href="../">${hubLabel || 'Todas las herramientas'}</a>
      <button onclick="etFbOpen()">💬 ${fbLabel || 'Danos tu opinión'}</button>
    </div>`;
  };

  function open(manual){
    shownThisSession = true;
    step = 1; answers = {};
    ev('fb_shown', { tool: TOOL, manual: !!manual });
    render();
  }

  function overlay(){
    let ov = document.getElementById('fbOv');
    if (!ov){
      ov = document.createElement('div');
      ov.id = 'fbOv';
      ov.className = 'overlay';
      ov.onclick = (e) => { if (e.target === ov) close(); };
      document.body.appendChild(ov);
    }
    return ov;
  }
  function close(){ const ov = document.getElementById('fbOv'); if (ov) ov.classList.remove('show'); }

  function markDone(){
    const s = st();
    s[TOOL] = Object.assign({}, s[TOOL], answers, { done: true, ts: new Date().toISOString() });
    save(s);
  }

  const FACES = [
    { v:1, e:'😞' }, { v:2, e:'🙁' }, { v:3, e:'😐' }, { v:4, e:'🙂' }, { v:5, e:'🤩' }
  ];

  function render(){
    const ov = overlay();
    let html = '';

    if (step === 1){
      html = `
        <div class="fb-step">Paso 1 de 3</div>
        <h2>¿Qué tan útil te pareció <b>${TOOL_NAME}</b>?</h2>
        <div class="fb-faces">
          ${FACES.map(f=>`<button onclick="__fbRate(${f.v})" aria-label="${f.v} de 5">${f.e}</button>`).join('')}
        </div>
        <div class="fb-scale"><span>Nada útil</span><span>Muy útil</span></div>
        <button class="fb-skip" onclick="__fbClose()">Ahora no</button>`;
    }

    else if (step === 2){
      html = `
        <div class="fb-step">Paso 2 de 3</div>
        <h2>¿Le agregarías algo para mejorar <b>${TOOL_NAME}</b>?</h2>
        <div class="fb-choices">
          <button onclick="__fbMejora(true)">Sí, le agregaría algo</button>
          <button onclick="__fbMejora(false)">No, está bien así</button>
        </div>`;
    }

    else if (step === 2.5){
      html = `
        <div class="fb-step">Paso 2 de 3</div>
        <h2>¿Qué le agregarías a <b>${TOOL_NAME}</b>?</h2>
        <textarea class="fb-comment" id="fbTxt" maxlength="400" placeholder="Escribe aquí…" autofocus></textarea>
        <button class="fb-send" onclick="__fbMejoraTxt()">Continuar ›</button>`;
    }

    else if (step === 3){
      html = `
        <div class="fb-step">Paso 3 de 3 · opcional</div>
        <h2>¿Qué otra herramienta te gustaría que agregáramos?</h2>
        <p class="fb-note">Lo que pidas entra a la lista de lo que construimos.</p>
        <textarea class="fb-comment" id="fbTxt2" maxlength="400" placeholder="Ej: calculadora de…, algoritmo de…"></textarea>
        <button class="fb-send" onclick="__fbOtra()">Enviar</button>
        <button class="fb-skip" onclick="__fbFinish()">Omitir y cerrar</button>`;
    }

    else {
      html = `<div class="fb-thanks">¡Gracias! Tu opinión construye las próximas herramientas.</div>`;
    }

    ov.innerHTML = `<div class="sheet">${html}</div>`;
    ov.classList.add('show');
  }

  window.__fbRate = function(v){
    answers.rating = v;
    ev('fb_rating', { tool: TOOL, rating: v });
    markDone();                 // ya tenemos la nota aunque abandone aquí
    step = 2; render();
  };

  window.__fbMejora = function(yes){
    answers.mejora = yes ? 'si' : 'no';
    ev('fb_mejora', { tool: TOOL, mejora: answers.mejora, texto: '' });
    markDone();
    if (yes){ step = 2.5; render(); setTimeout(()=>{ const t=document.getElementById('fbTxt'); if(t) t.focus(); }, 100); }
    else { step = 3; render(); }
  };

  window.__fbMejoraTxt = function(){
    const t = document.getElementById('fbTxt');
    const val = (t && t.value || '').trim().slice(0,400);
    answers.mejoraTxt = val;
    if (val) ev('fb_mejora', { tool: TOOL, mejora: 'si', texto: val });
    markDone();
    step = 3; render();
  };

  window.__fbOtra = function(){
    const t = document.getElementById('fbTxt2');
    const val = (t && t.value || '').trim().slice(0,400);
    answers.otra = val;
    if (val) ev('fb_otra', { tool: TOOL, texto: val });
    __fbFinish();
  };

  window.__fbFinish = function(){
    markDone();
    step = 4; render();
    setTimeout(close, 1400);
  };

  window.__fbClose = function(){ ev('fb_skipped', { tool: TOOL }); close(); };
})();
