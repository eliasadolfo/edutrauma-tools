/* ============================================================
   EduTrauma Tools — Guias
   Consulta rapida del material de los cursos. Sin flujo: solo referencia.

   REGLA: aqui no se inventa contenido clinico. Cada ficha se arma con datos
   que YA viven en el repo y que ya se le muestran al usuario dentro de las
   herramientas. Lo que no exista todavia se declara "en preparacion" en vez
   de rellenarlo.
   ============================================================ */

function guiasList(){
  const t = T();
  return [
    {
      id:'nexus',
      title: t.guias.nexusTitle,
      sub: 'Hoffman et al., NEJM 2000',
      ready: true,
      build: nexusGuide
    },
    {
      id:'teg',
      title: t.guias.tegTitle,
      sub: t.guias.tegSub,
      ready: true,
      build: tegGuide
    },
    {
      id:'bjorck',
      title: t.guias.bjorckTitle,
      sub: t.guias.bjorckSub,
      ready: true,
      build: bjorckGuide
    },
    {
      id:'abcde',
      title: t.guias.abcdeTitle,
      sub: t.guias.pending,
      ready: false
    }
  ];
}

function guiasScreenHTML(){
  const t = T();
  return `<div class="et-pad">
    <h1 class="et-h1">${esc(t.guias.title)}</h1>
    <p class="et-lede">${esc(t.guias.lede)}</p>
    <div class="et-group">
      ${guiasList().map(g => `
        <button class="et-row" ${g.ready ? '' : 'disabled'}
                onclick="${g.ready ? `push({kind:'guiaDetail',guiaId:'${g.id}'})` : ''}">
          <span class="et-tile et-tile-sm${g.ready ? ' et-tile-on' : ''}"
                style="background:${g.ready ? 'var(--app-navy)' : 'rgba(0,32,92,.08)'}">${ICON.guias}</span>
          <span class="et-row-main">
            <span class="et-row-title" style="${g.ready ? '' : 'color:var(--app-slate)'}">${esc(g.title)}</span>
            <span class="et-row-sub">${esc(g.sub)}</span>
          </span>
          ${g.ready ? ICON.right : ''}
        </button>`).join('')}
    </div>
    <p class="et-note">${esc(t.guias.note)}</p>
  </div>`;
}

function guiaDetailHTML(scr){
  const g = guiasList().find(x => x.id === scr.guiaId);
  if(!g || !g.ready) return `<div class="et-pad"><div class="et-empty">${ICON.guias}
    <h3>${esc(T().guias.emptyTitle)}</h3></div></div>`;
  return `<div class="et-pad">${g.build()}</div>`;
}

/* ---------- Ficha: criterios NEXUS ----------
   Los cinco criterios salen del algoritmo de MIP, sin reescribirlos. */
function nexusGuide(){
  const t = T();
  const algo = (window.MIP_ALGOS || []).find(a => a.id === 'nexus');
  if(!algo) return '';
  return `
    <h2 class="et-q" style="margin-top:16px">${esc(trC(algo.name))}</h2>
    <p class="et-help">${esc(trC(algo.intro))}</p>
    <div class="et-section">${esc(t.guias.criteria)}</div>
    <div class="et-group">
      ${algo.criteria.map((c, i) => `
        <div class="et-row" style="cursor:default">
          <span class="et-num">${i + 1}</span>
          <span class="et-row-main"><span class="et-row-title">${esc(trC(c.label))}</span></span>
        </div>`).join('')}
    </div>
    <div class="et-neutral" style="margin-top:16px">${esc(t.guias.nexusRule)}</div>
    <button class="et-btn" style="margin-top:18px" onclick="goToAlgo('mip','nexus')">
      ${esc(t.guias.useIt)}
    </button>
    <p class="et-note">${esc(t.guias.source)} ${esc(trC(algo.ref))}</p>`;
}

/* ---------- Ficha: parametros del panel TEG6s ----------
   Cada parametro con lo que mide, tomado de los mismos textos que el
   formulario ya muestra bajo cada campo. */
function tegGuide(){
  const t = T();
  return `
    <h2 class="et-q" style="margin-top:16px">${esc(t.guias.tegTitle)}</h2>
    <p class="et-help">${esc(t.guias.tegLede)}</p>
    <div class="et-section">${esc(t.guias.params)}</div>
    <div class="et-group">
      ${D.TEG_FIELDS.map(f => `
        <div class="et-row" style="cursor:default">
          <span class="et-code">${esc(f.label)}</span>
          <span class="et-row-main">
            <span class="et-row-title" style="font-size:15px">${esc(trC(f.hint))}</span>
            <span class="et-row-sub">${esc(t.guias.unit)}: ${esc(f.unit)}</span>
          </span>
        </div>`).join('')}
    </div>
    <div class="et-caution" style="margin-top:16px">${esc(trC(D.TEG_CAUTION))}</div>
    <button class="et-btn" style="margin-top:18px" onclick="goToTool('teg')">${esc(t.guias.useIt)}</button>
    <p class="et-note">${esc(t.guias.source)} ${esc(D.TEG_REF)}</p>`;
}

/* ---------- Ficha: clasificacion de Björck ----------
   Los nueve grados con su conducta, de la misma tabla que usa MIAA. */
function bjorckGuide(){
  const t = T();
  return `
    <h2 class="et-q" style="margin-top:16px">${esc(trC('Clasificación de Björck'))}</h2>
    <p class="et-help">${esc(t.guias.bjorckLede)}</p>
    ${D.BJORCK_GRID.map(b => `
      <div class="et-section">${esc(trC(b.gLabel))}</div>
      <p class="et-note" style="margin:0 0 8px">${esc(trC(b.desc))}</p>
      <div class="et-group">
        ${b.cells.map(c => `
          <div class="et-row" style="cursor:default">
            <span class="et-bj-code" style="background:${BJ_COLOR[b.g]}">${esc(c.code)}</span>
            <span class="et-row-main">
              <span class="et-row-title" style="font-size:15px">${esc(trC(c.summary))}</span>
              <span class="et-row-sub">${esc(trC(c.state))} · ${esc(c.steps === 1 ? t.tool.step1 : t.tool.steps.replace('{n}', c.steps))}</span>
            </span>
          </div>`).join('')}
      </div>`).join('')}
    <div class="et-caution" style="margin-top:16px">${esc(trC(D.MIAA_BJORCK_CAUTION))}</div>
    <button class="et-btn" style="margin-top:18px" onclick="goToTool('abdomen')">${esc(t.guias.useIt)}</button>
    <p class="et-note">${esc(t.guias.source)} ${esc(trC(D.MIAA_ALGOS.miaa_conducta.ref))}</p>`;
}

/* Saltar de una guia a la herramienta que la usa. */
function goToTool(id){
  S.stacks[S.tab] = S.stack;
  S.tab = 'kit';
  S.stack = [];
  S.stacks.kit = S.stack;
  S.dir = 0;
  render();
  if(DIRECT[id]) openToolDirect(id); else openTool(id);
}
function goToAlgo(toolId, algoId){
  goToTool(toolId);
  openAlgo(toolId, algoId);
}
