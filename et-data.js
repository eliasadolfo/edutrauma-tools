/* Contenido clínico portado verbatim del repo eliasadolfo/edutrauma-tools (rama main).
   Fuentes: abdomen/index.html (MIAA), teg/index.html (TEG6s), calculadoras/index.html.
   El dataset AAST vive aparte, en aast-data.js (extraído de aast/index.html).
   No reinterpretar: cualquier cambio clínico debe venir del repo o del equipo docente. */
(function () {

  /* ===================== MIAA — Abdomen Abierto ===================== */

  /* Algoritmo 1: decisión en pabellón. 6 preguntas SÍ/NO.
     Nivel 'conduct' = conducta válida, NUNCA verde/rojo (regla de los usuarios). */
  const MIAA_DECISION = {
    id: 'miaa_decision', tool: 'abdomen', group: 'DECISIÓN EN PABELLÓN',
    name: '¿Cuándo dejar el abdomen abierto?', tag: 'Decisión',
    short: 'Decisión en pabellón: 6 preguntas + grado de Björck.',
    ref: 'Flujograma MIAA — ¿Cuándo dejar el abdomen abierto? (curso MIAA) · Cerrar siempre que sea seguro; dejar abierto solo si el cierre aumenta el riesgo o impide la estrategia terapéutica.',
    type: 'yesno',
    rules: [
      ['No puedo cerrar:', 'tensión, edema, pérdida de pared'],
      ['No debo cerrar:', 'fisiología grave / control de daños'],
      ['Necesito volver:', 'reoperación planificada o second look']
    ],
    questions: [
      { category: 'Fisiológico', icon: 'pulse',
        text: '¿Se requiere descompresión abdominal o existe hipertensión intraabdominal / riesgo de síndrome compartimental abdominal?',
        yes: { result: 'open', title: 'Dejar abdomen abierto + cierre temporal', detail: 'La hipertensión intraabdominal o el riesgo de síndrome compartimental contraindica el cierre fascial en este momento.' },
        no: 'next' },
      { category: 'Fisiológico', icon: 'pulse',
        text: '¿La fisiología permite cirugía definitiva? (Hipotensión, acidosis, coagulopatía, hipotermia, lactato elevado)',
        yes: 'next',
        no: { result: 'open', title: 'Control de daños + dejar abdomen abierto', detail: 'El paciente no tolera fisiológicamente una cirugía definitiva. Priorizar control de daños y reevaluación posterior.' } },
      { category: 'Anatómico', icon: 'anatomy',
        text: '¿El foco hemorrágico o contaminante está completamente controlado?',
        yes: 'next',
        no: { result: 'open', title: 'Dejar abdomen abierto (recontrol / control del foco)', detail: 'Sin control completo del foco, cerrar impediría un recontrol oportuno.' } },
      { category: 'Anatómico', icon: 'anatomy',
        text: '¿La perfusión o viabilidad intestinal es incierta?',
        yes: { result: 'open', title: 'Dejar abdomen abierto (second look / reevaluación)', detail: 'La viabilidad intestinal incierta requiere una reevaluación programada antes de comprometerse con el cierre.' },
        no: 'next' },
      { category: 'Logístico', icon: 'clipboard',
        text: '¿Se necesita reoperación planificada? (Packing, second look, anastomosis diferida, reevaluación)',
        yes: { result: 'open', title: 'Dejar abdomen abierto (reoperación planificada)', detail: 'Hay una estrategia de reoperación planificada que el cierre fascial dificultaría.' },
        no: 'next' },
      { category: 'Anatómico', icon: 'anatomy',
        text: '¿La fascia puede cerrarse sin tensión y sin deterioro ventilatorio o hemodinámico?',
        yes: { result: 'closed', title: 'Cierre fascial primario', detail: 'Todos los criterios fisiológicos, anatómicos y logísticos permiten un cierre seguro y definitivo.' },
        no: { result: 'open', title: 'Dejar abdomen abierto (edema visceral / cierre inseguro)', detail: 'El edema visceral o el riesgo de deterioro ventilatorio/hemodinámico hacen inseguro el cierre en este momento.' } }
    ],
    neutralNote: 'Dejar el abdomen abierto y cerrarlo son dos conductas igualmente válidas. Esta pantalla refleja la que corresponde a los hallazgos que indicaste — no es una respuesta correcta ni incorrecta.'
  };

  /* Björck orientativo, encadenado al resultado del algoritmo 1 */
  const MIAA_BJORCK_Q = [
    { key: 'frozen', text: '¿El abdomen está "congelado"? (asas y/o fascia completamente fijas entre sí, sin plano de disección seguro, con o sin fístula)',
      yesGrade: { grade: 'Grado 4', label: 'Abdomen congelado', detail: 'Adherencias firmes y difusas impiden separar de forma segura asas y pared. Puede o no coexistir con fístula entérica.' } },
    { key: 'fistula', text: '¿Existe una fístula enteroatmosférica? (comunicación entre la luz intestinal y el ambiente, sin cobertura visceral ni de pared)',
      yesGrade: { grade: 'Grado 3', label: 'Fístula enteroatmosférica', detail: 'Fístula presente sin la fijación difusa característica del abdomen congelado.' } },
    { key: 'fixation', text: '¿Hay fijación en desarrollo del intestino a la pared abdominal o a los canales laterales?' },
    { key: 'contamination', text: '¿La cavidad abdominal está contaminada? (contenido entérico, purulento, o peritonitis significativa)' }
  ];
  const MIAA_BJORCK_CAUTION = 'Grado orientativo según hallazgos referidos. La clasificación definitiva —especialmente en el límite entre grados 2 y 3— requiere inspección directa y puede tener variabilidad interobservador; confirmar en pabellón.';

  /* Rejilla de consulta de Björck: 4 grados × estado de la cavidad.
     Cada celda enlaza a su conducta en el algoritmo 2. */
  const BJORCK_GRID = [
    { g: 1, gLabel: 'Grado 1', desc: 'Sin adherencia ni fijación de vísceras a la pared',
      cells: [
        { code: '1A', state: 'Limpia', steps: 1, summary: 'Cierre en 1 paso', ctx: { g: 1, e: 'A' } },
        { code: '1B', state: 'Contaminada', steps: 2, summary: 'ABThera® → cierre', ctx: { g: 1, e: 'B' } },
        { code: '1C', state: 'Con fístula', steps: 3, summary: 'Cirugía → ABThera® → cierre', ctx: { g: 1, e: 'C' } }
      ] },
    { g: 2, gLabel: 'Grado 2', desc: 'Con adherencia o fijación en desarrollo',
      cells: [
        { code: '2A', state: 'Limpia', steps: 1, summary: 'Cierre en 1 paso', ctx: { g: 2, e: 'A' } },
        { code: '2B', state: 'Contaminada', steps: 2, summary: 'V.A.C.® → cierre', ctx: { g: 2, e: 'B' } },
        { code: '2C', state: 'Con fístula', steps: 3, summary: 'V.A.C.® → cirugía → cierre', ctx: { g: 2, e: 'C' } }
      ] },
    { g: 3, gLabel: 'Grado 3', desc: 'Abdomen congelado (frozen)',
      cells: [
        { code: '3A', state: 'Limpia', steps: 2, summary: 'Curaciones → cierre', ctx: { g: 3, e: 'A' } },
        { code: '3B', state: 'Contaminada', steps: 3, summary: 'Cirugía → curaciones → reconstrucción', ctx: { g: 3, e: 'B' } }
      ] },
    { g: 4, gLabel: 'Grado 4', desc: 'Fístula enteroatmosférica (FEA)',
      cells: [
        { code: '4', state: 'FEA', steps: 3, summary: 'V.A.C.® → cirugía + manejo de fístula → cierre', ctx: { g: 4 } }
      ] }
  ];

  const MIAA_ALGOS = {
    miaa_conducta: {
      id: 'miaa_conducta', tool: 'abdomen', group: 'MANEJO EN CURSO',
      name: 'Conducta según grado de Björck', tag: 'Björck',
      short: 'Del grado 1A al 4 (FEA): qué hacer, paso a paso.',
      ref: 'Flujograma MIAA — Conducta según grado de Björck (curso MIAA)',
      type: 'tree', start: 'fija', depth: 2,
      nodes: {
        fija: { q: '¿Hay adherencia o fijación de las vísceras a la pared?',
          help: 'Define la vía: sin fijación (grados 1) permite cierre precoz; con fijación (grados 2) exige terapia de presión negativa primero.',
          opts: [
            { label: 'No — sin adherencia ni fijación', sub: 'Grado 1', set: { g: 1 }, next: 'estado' },
            { label: 'Sí — con adherencia o fijación', sub: 'Grado 2', set: { g: 2 }, next: 'estado' },
            { label: 'Abdomen congelado (frozen)', sub: 'Grado 3', set: { g: 3 }, next: 'estado3' },
            { label: 'Fístula enteroatmosférica (FEA)', sub: 'Grado 4', set: { g: 4 }, next: null }
          ] },
        estado: { q: '¿En qué estado está la cavidad?', opts: [
          { label: 'Limpia', sub: 'A', set: { e: 'A' }, next: null },
          { label: 'Contaminada', sub: 'B', set: { e: 'B' }, next: null },
          { label: 'Con fístula', sub: 'C', set: { e: 'C' }, next: null }
        ] },
        estado3: { q: '¿En qué estado está la cavidad?', opts: [
          { label: 'Limpia', sub: '3A', set: { e: 'A' }, next: null },
          { label: 'Contaminada', sub: '3B', set: { e: 'B' }, next: null }
        ] }
      },
      resolve(c) {
        const CIERRE = 'Cierre primario de la pared y/o reconstrucción de la pared.';
        const FIST = '* La conducta quirúrgica depende del tipo de fístula.';
        if (c.g === 1) {
          if (c.e === 'A') return { level: 'ok', title: 'Grado 1A · Cierre en 1 paso', detail: 'Sin fijación y cavidad limpia: se puede cerrar de entrada.', list: ['Paso 1: ' + CIERRE] };
          if (c.e === 'B') return { level: 'ok', title: 'Grado 1B · ABThera® → cierre', detail: 'Sin fijación, cavidad contaminada. Vía SCA (cierre abdominal secuencial).', list: ['Paso 1: Terapia ABThera® (presión negativa).', 'Paso 2: ' + CIERRE] };
          return { level: 'warn', title: 'Grado 1C · Cirugía → ABThera® → cierre', detail: 'Sin fijación, con fístula. La cirugía depende del tipo de fístula.', list: ['Paso 1: Cirugía* según el tipo de fístula.', 'Paso 2: Terapia ABThera®.', 'Paso 3: ' + CIERRE], warn: FIST };
        }
        if (c.g === 2) {
          if (c.e === 'A') return { level: 'ok', title: 'Grado 2A · Cierre en 1 paso', detail: 'Con adherencia pero cavidad limpia: cierre o reconstrucción de la pared.', list: ['Paso 1: ' + CIERRE] };
          if (c.e === 'B') return { level: 'ok', title: 'Grado 2B · Terapia V.A.C.® → cierre', detail: 'Con adherencia y contaminación: presión negativa antes del cierre.', list: ['Paso 1: Terapia V.A.C.®', 'Paso 2: ' + CIERRE] };
          return { level: 'warn', title: 'Grado 2C · V.A.C.® → cirugía → cierre', detail: 'Con adherencia y fístula.', list: ['Paso 1: Terapia V.A.C.®', 'Paso 2: Cirugía* según el tipo de fístula.', 'Paso 3: ' + CIERRE], warn: FIST };
        }
        if (c.g === 3) {
          if (c.e === 'A') return { level: 'warn', title: 'Grado 3A · Curaciones → cierre', detail: 'Abdomen congelado limpio: no se fuerza el cierre, se maneja con curaciones.', list: ['Paso 1: Curaciones (dressings).', 'Paso 2: ' + CIERRE] };
          return { level: 'alert', title: 'Grado 3B · Cirugía → curaciones → reconstrucción', detail: 'Abdomen congelado contaminado.', list: ['Paso 1: Cirugía.', 'Paso 2: Curaciones (dressings).', 'Paso 3: Reconstrucción de la pared.'] };
        }
        return { level: 'alert', title: 'Grado 4 · Fístula enteroatmosférica (FEA)', detail: 'El escenario más complejo: manejo dirigido de la fístula.', list: ['Paso 1: Terapia V.A.C.®', 'Paso 2: Cirugía* + manejo de la fístula (aislamiento, dispositivos, control del efluente).', 'Paso 3: Cierre primario de la pared y/o reconstrucción.'], warn: FIST };
      }
    },

    miaa_atb: {
      id: 'miaa_atb', tool: 'abdomen', group: 'MANEJO EN CURSO',
      name: 'Antibióticos en abdomen abierto', tag: 'Antibióticos',
      short: 'Profilácticos vs empíricos, cultivos y descalamiento.',
      ref: 'Flujograma MIAA — Antibióticos en abdomen abierto (curso MIAA)',
      type: 'tree', start: 'infeccioso', depth: 3,
      nodes: {
        infeccioso: { q: '¿El abdomen abierto es inicialmente INFECCIOSO?',
          help: 'Es decir, si el origen del abdomen abierto fue un foco infeccioso (peritonitis, perforación, sepsis abdominal).',
          opts: [
            { label: 'Sí, infeccioso', set: { inf: true }, next: 'mejoria_emp' },
            { label: 'No, no infeccioso', set: { inf: false }, next: 'mejoria_prof' }
          ] },
        mejoria_prof: { q: 'Bajo antibióticos "profilácticos" y vigilando el posible foco: ¿hay mejoría clínica?',
          opts: [
            { label: 'Sí, mejora', set: { out: 'prof_ok' }, next: null },
            { label: 'No mejora', set: {}, next: 'revalorar' }
          ] },
        revalorar: { q: 'Revalore el foco infeccioso con estudios. ¿Qué encuentra?',
          help: 'Considere también otros factores de riesgo (por ejemplo, infección por hongos).',
          opts: [
            { label: 'Nuevo foco infeccioso extraabdominal', set: { out: 'extra' }, next: null },
            { label: 'Foco infeccioso abdominal no controlado', set: { out: 'no_controlado' }, next: null }
          ] },
        mejoria_emp: { q: 'Iniciados los antibióticos empíricos, con control del foco y toma de cultivos, y ajustados según cultivo: ¿hay mejoría clínica?',
          opts: [
            { label: 'Sí, mejora', set: { out: 'emp_ok' }, next: null },
            { label: 'No mejora', set: { out: 'emp_no' }, next: null }
          ] }
      },
      resolve(c) {
        const CIERRE = 'Mantener las estrategias de abdomen abierto hasta lograr el CIERRE DEFINITIVO.';
        switch (c.out) {
          case 'prof_ok': return { level: 'ok', title: 'Mantener la conducta', detail: 'Sin foco infeccioso inicial y con mejoría clínica.', list: ['Antibióticos "profilácticos" con vigilancia del posible foco.', 'Mantener estrategias de abdomen abierto.', 'Objetivo: ' + CIERRE] };
          case 'extra': return { level: 'warn', title: 'Nuevo foco infeccioso EXTRAABDOMINAL', detail: 'La falta de mejoría se explica fuera del abdomen: trate ese foco.', list: ['Trate el foco extraabdominal identificado.', 'Considere otros factores de riesgo (p. ej. hongos).', 'Mantener estrategias de abdomen abierto hasta el cierre definitivo.'] };
          case 'no_controlado': return { level: 'alert', title: 'Foco abdominal NO controlado', detail: 'Vuelva al control del foco: reintervención, drenaje y toma de cultivos.', list: ['Control del foco + toma de cultivos.', 'Iniciar/ajustar antibióticos según cultivo.', 'Reevaluar la mejoría clínica.'], warn: 'Este es el punto crítico del algoritmo: sin control del foco, ningún antibiótico resuelve el cuadro.' };
          case 'emp_ok': return { level: 'ok', title: 'Mantener ATB o descalar', detail: 'Con foco controlado, cultivos tomados y mejoría clínica: mantener o descalar según criterio clínico.', list: ['Mantener o descalar el antibiótico según criterio clínico y cultivos.', 'Mantener estrategias de abdomen abierto.', 'Objetivo: ' + CIERRE] };
          default: return { level: 'alert', title: 'Volver al control del foco', detail: 'Sin mejoría pese a antibióticos según cultivo: el foco no está controlado.', list: ['Reintervención para control del foco + nuevos cultivos.', 'Ajustar antibióticos según el nuevo cultivo.', 'Considere otros factores de riesgo (p. ej. hongos).'], warn: 'Sin control del foco, ningún esquema antibiótico resuelve el cuadro.' };
        }
      }
    },

    miaa_nutri: {
      id: 'miaa_nutri', tool: 'abdomen', group: 'MANEJO EN CURSO',
      name: 'Nutrición en abdomen abierto', tag: 'Nutrición',
      short: 'NE temprana, NP y metas de proteínas y calorías.',
      ref: 'Flujograma MIAA — Nutrición en abdomen abierto (curso MIAA)',
      type: 'tree', start: 'tgi', depth: 3,
      nodes: {
        tgi: { q: '¿Funciona el tracto gastrointestinal (TGI)? ¿Puedo usarlo?',
          opts: [
            { label: 'Sí, funciona', sub: '→ Nutrición enteral temprana', set: {}, next: 'tolera' },
            { label: 'No funciona', set: {}, next: 'desnutrido' }
          ] },
        tolera: { q: 'Con nutrición enteral temprana: ¿tolera más del 60% de sus requerimientos después de 2 días?',
          opts: [
            { label: 'Sí, tolera >60%', set: { np: false }, next: 'oral' },
            { label: 'No tolera >60%', sub: '→ Iniciar NP suplementaria', set: { np: true }, next: 'oral' }
          ] },
        oral: { q: '¿El paciente es capaz de tolerar la vía oral?',
          opts: [
            { label: 'Sí', set: { out: 'oral' }, next: null },
            { label: 'No', set: { out: 'sigue_np' }, next: null }
          ] },
        desnutrido: { q: '¿El paciente está desnutrido o en riesgo de desnutrición?',
          help: 'NRS 2002 ≤3 · NUTRIC ≤5',
          opts: [
            { label: 'Sí, desnutrido o en riesgo', set: {}, next: 'tgi_mejoro_np' },
            { label: 'No', set: {}, next: 'prob3d' }
          ] },
        prob3d: { q: '¿Hay probabilidad de iniciar nutrición enteral en 3 días?',
          opts: [
            { label: 'Sí', sub: 'Evaluación diaria para iniciar NE', set: {}, next: 'tgi_mejoro_ev' },
            { label: 'No', sub: '→ Iniciar nutrición parenteral', set: {}, next: 'tgi_mejoro_np' }
          ] },
        tgi_mejoro_ev: { q: '¿Mejoró la función del TGI?',
          opts: [
            { label: 'Sí', set: { out: 'ne_temprana' }, next: null },
            { label: 'No', set: { out: 'optimizar' }, next: null }
          ] },
        tgi_mejoro_np: { q: 'Con nutrición parenteral iniciada: ¿mejoró la función del TGI?',
          opts: [
            { label: 'Sí', set: { out: 'destete_np' }, next: null },
            { label: 'No', set: { out: 'optimizar' }, next: null }
          ] }
      },
      resolve(c) {
        const METAS = ['Proteínas: 1.5–2.5 g/kg/día, +15–30 g adicionales por cada litro de exudado peritoneal.', 'Calorías: 25–30 cal/kg/día.'];
        const npNota = c.np ? ['Mantener la NP suplementaria iniciada por tolerancia <60%.'] : [];
        switch (c.out) {
          case 'oral': return { level: 'ok', title: 'Iniciar dieta a tolerancia y suplementos orales', detail: 'El TGI funciona y el paciente tolera la vía oral.', list: npNota.concat(['Iniciar dieta a tolerancia + suplementos orales.'], METAS) };
          case 'sigue_np': return { level: 'warn', title: 'Continuar nutrición parenteral', detail: 'El TGI funciona pero el paciente aún no tolera la vía oral.', list: ['Continuar NP mientras no tolere la vía oral.', 'Optimizar el soporte nutricional (proteínas, energía y micronutrientes).'].concat(METAS) };
          case 'ne_temprana': return { level: 'ok', title: 'Iniciar nutrición enteral temprana', detail: 'Mejoró la función del TGI: aproveche la vía enteral.', list: ['Iniciar NE temprana.', 'Reevaluar tolerancia (>60% de requerimientos a los 2 días).'].concat(METAS) };
          case 'destete_np': return { level: 'ok', title: 'Iniciar NE y destete de la NP', detail: 'Mejoró la función del TGI con el paciente en parenteral.', list: ['Iniciar nutrición enteral y destetar progresivamente la NP.'].concat(METAS) };
          default: return { level: 'warn', title: 'Optimizar el soporte nutricional', detail: 'El TGI no ha mejorado: asegure aporte suficiente de proteínas, energía y micronutrientes.', list: ['Optimizar el soporte para aportar suficientes proteínas, energía y micronutrientes.'].concat(METAS) };
        }
      }
    },

    miaa_hia: {
      id: 'miaa_hia', tool: 'abdomen', group: 'MANEJO EN CURSO',
      name: 'Manejo de HIA / SCA', tag: 'HIA / SCA',
      short: 'Hipertensión intraabdominal y síndrome compartimental (WSACS).',
      ref: 'WSACS — IAH/ACS Management Algorithm (Intensive Care Med 2013;7:1190-1206)',
      type: 'tree', start: 'pia', depth: 3,
      nodes: {
        pia: { q: '¿La presión intraabdominal (PIA) es ≥ 12 mmHg?',
          help: 'PIA ≥12 mmHg define hipertensión intraabdominal (HIA).',
          opts: [
            { label: 'Sí, PIA ≥ 12 mmHg', sub: 'El paciente tiene HIA', set: {}, next: 'pia20' },
            { label: 'No, PIA < 12 mmHg', set: { out: 'resuelta' }, next: null }
          ] },
        pia20: { q: '¿PIA > 20 mmHg CON falla orgánica nueva?',
          help: 'Esa combinación define síndrome compartimental abdominal (SCA).',
          opts: [
            { label: 'Sí', sub: 'El paciente tiene SCA', set: {}, next: 'primario' },
            { label: 'No', set: { out: 'medico' }, next: null }
          ] },
        primario: { q: '¿Es un SCA primario?',
          help: 'Primario: por lesión o enfermedad de la región abdomino-pélvica. Secundario: de origen extraabdominal. Recurrente: reaparece tras tratamiento previo.',
          opts: [
            { label: 'Sí, SCA primario', set: { out: 'descompresion' }, next: null },
            { label: 'No — secundario o recurrente', set: {}, next: 'progresiva' }
          ] },
        progresiva: { q: '¿PIA > 20 mmHg con falla orgánica PROGRESIVA?',
          opts: [
            { label: 'Sí', set: { out: 'descompresion' }, next: null },
            { label: 'No', set: { out: 'medico' }, next: null }
          ] }
      },
      resolve(c) {
        switch (c.out) {
          case 'resuelta': return { level: 'ok', title: 'La HIA se ha resuelto', detail: 'PIA < 12 mmHg de forma consistente.', list: ['Disminuir la frecuencia de las mediciones de PIA.', 'Observar al paciente por deterioro clínico.'] };
          case 'descompresion': return { level: 'alert', title: 'Descompresión abdominal quirúrgica', detail: 'Identifique y trate la etiología subyacente del SCA.', list: ['Realizar o revisar la descompresión abdominal con cierre temporal según sea necesario para reducir la PIA (Grado 2D).', 'Continuar las medidas médicas para reducir la PIA (Grado 1C).', 'Medir la PIA al menos cada 4 h mientras el paciente esté crítico (Grado 1C).', 'Reanimación balanceada de precarga, contractilidad y poscarga — evitar la reanimación excesiva con fluidos (Grado 2D).'] };
          default: return { level: 'warn', title: 'Tratamiento médico para reducir la PIA', detail: 'Aún no hay indicación de descompresión quirúrgica: escale las medidas médicas.', list: ['Iniciar tratamiento médico para reducir la PIA (Grado 1C).', 'Evitar la reanimación excesiva con fluidos y optimizar la perfusión de órganos.', 'Medir la PIA con mediciones seriadas al menos cada 4 h mientras el paciente esté crítico (Grado 1C).', 'Reevaluar: si aparece PIA >20 mmHg con falla orgánica nueva, el paciente tiene SCA.'] };
        }
      }
    }
  };

  /* ===================== TEG6s ===================== */

  const TEG_FIELDS = [
    { id: 'ckr', label: 'CK · R', unit: 'min', plaus: [0, 30], hint: 'Factores de coagulación (sin neutralizar heparina)' },
    { id: 'ckhr', label: 'CKH · R', unit: 'min', plaus: [0, 30], onlyIfHep: true, hint: 'Factores neutralizando heparina (heparinasa)' },
    { id: 'crta10', label: 'CRT · A10', unit: 'mm', plaus: [0, 100], hint: 'Plaquetas — lectura temprana (10 min)' },
    { id: 'crtma', label: 'CRT · MA', unit: 'mm', plaus: [0, 100], hint: 'Plaquetas — amplitud máxima' },
    { id: 'cffa10', label: 'CFF · A10', unit: 'mm', plaus: [0, 100], hint: 'Fibrinógeno — lectura temprana (10 min)' },
    { id: 'cffma', label: 'CFF · MA', unit: 'mm', plaus: [0, 100], hint: 'Fibrinógeno — amplitud máxima funcional' },
    { id: 'ly30', label: 'CRT · LY30', unit: '%', plaus: [0, 100], hint: 'Fibrinólisis a los 30 min post-MA' }
  ];
  const TEG_REF = 'Anexo Módulo TEG (Dr. Pablo R. Ottolino, EduTrauma, 2026) · Rangos panel TEG6s Global Hemostasis · Guía europea del trauma 6.ª ed. (Crit Care 2023;27:80) · CRASH-2';
  const TEG_CAUTION = 'Apoyo a la decisión clínica: las sugerencias deben ser confirmadas por el médico responsable y contrastadas con el protocolo institucional. No constituyen una indicación terapéutica automática.';
  const HEPARIN_MIN_DIFF = 0;

  function computeTEG(v) {
    const comp = [], alerts = [];
    const hep = v.hep === 'si';
    if (hep) {
      if (v.ckr < v.ckhr) alerts.push({ level: 'warn', title: 'Resultado inconsistente (N/A)', text: 'CK-R es menor que CKH-R, lo que no es fisiológicamente esperable. Revisar manualmente la muestra y los valores ingresados.' });
      else if ((v.ckr - v.ckhr) > HEPARIN_MIN_DIFF) alerts.push({ level: 'alert', title: 'Efecto de heparina presente', text: 'CK-R (' + v.ckr + ' min) es mayor que CKH-R (' + v.ckhr + ' min). Considerar reversión con protamina según protocolo institucional y la dosis/tiempo de heparina recibida.' });
      else alerts.push({ level: 'ok', title: 'Sin efecto de heparina', text: 'CK-R y CKH-R son equivalentes: no se detecta efecto residual de heparina.' });
    }
    const rVal = hep ? v.ckhr : v.ckr;
    const rName = hep ? 'CKH-R' : 'CK-R';
    const rLo = hep ? 4.3 : 4.6, rHi = hep ? 8.3 : 9.1;
    const rRange = ' (normal ' + rLo + '–' + rHi + ')';
    if (rVal > rHi) comp.push({ name: 'Factores de coagulación', level: 'alert', value: rName + ' ' + rVal + ' min · R prolongado' + rRange, finding: 'Déficit de factores de coagulación.', sug: 'Considerar plasma fresco congelado (PFC). Si hay INR/TTPA disponibles, usarlos para confirmar antes de indicar. (Guía europea del trauma 6.ª ed., Rec. 27–28, Grado 1C)' });
    else if (rVal < rLo) comp.push({ name: 'Factores de coagulación', level: 'warn', value: rName + ' ' + rVal + ' min · R acortado' + rRange, finding: 'Factores elevados — patrón protrombótico.', sug: 'No se sugieren hemoderivados. Considerar evaluación de riesgo de TVP/TEP según el contexto clínico.' });
    else comp.push({ name: 'Factores de coagulación', level: 'ok', value: rName + ' ' + rVal + ' min' + rRange, finding: 'Sin déficit relevante de factores.', sug: '' });

    const pltVal = 'CRT-A10 ' + v.crta10 + ' mm (44–67) · CRT-MA ' + v.crtma + ' mm (52–70)';
    if ((v.crtma < 52) || (v.crtma >= 52 && v.crtma <= 70 && v.crta10 < 44)) comp.push({ name: 'Plaquetas', level: 'alert', value: pltVal, finding: 'Función plaquetaria baja.', sug: 'Considerar transfusión de plaquetas. (Guía europea del trauma 6.ª ed., Rec. 25, Grado 2B)' });
    else if (v.crtma > 70) comp.push({ name: 'Plaquetas', level: 'warn', value: pltVal, finding: 'Función plaquetaria alta.', sug: 'No requiere transfusión. Interpretar en el contexto clínico.' });
    else comp.push({ name: 'Plaquetas', level: 'ok', value: pltVal, finding: 'Función plaquetaria normal.', sug: '' });

    const fibVal = 'CFF-A10 ' + v.cffa10 + ' mm (15–30) · CFF-MA ' + v.cffma + ' mm (15–32)';
    if ((v.cffma < 15) || (v.cffma >= 15 && v.cffma <= 32 && v.cffa10 < 15)) comp.push({ name: 'Fibrinógeno', level: 'alert', value: fibVal, finding: 'Fibrinógeno bajo.', sug: 'Considerar crioprecipitado o concentrado de fibrinógeno. Evitar corregir solo con PFC si hay crioprecipitado/concentrado disponible. (Guía europea del trauma 6.ª ed., Rec. 25 y 27, Grado 1C)' });
    else if (v.cffma > 32) comp.push({ name: 'Fibrinógeno', level: 'warn', value: fibVal, finding: 'Fibrinógeno alto.', sug: 'No requiere aporte. Interpretar en el contexto clínico.' });
    else comp.push({ name: 'Fibrinógeno', level: 'ok', value: fibVal, finding: 'Fibrinógeno normal.', sug: '' });

    const lysVal = 'CRT-LY30 ' + v.ly30 + '% (normal 0–2.2%)';
    if (v.ly30 > 2.2) comp.push({ name: 'Fibrinólisis', level: 'alert', value: lysVal, finding: 'Hiperfibrinólisis.', sug: 'Sugerir/reforzar ácido tranexámico (TXA): 1 g IV en 10 min + 1 g IV en 8 h, idealmente dentro de las 3 h del trauma. Si el paciente ya recibió TXA empírico, esto refuerza la indicación; no implica una segunda dosis automática. (Guía europea del trauma 6.ª ed., Rec. 23, Grado 1A; CRASH-2)' });
    else comp.push({ name: 'Fibrinólisis', level: 'ok', value: lysVal, finding: 'Sin hiperfibrinólisis.', sug: '' });

    return { comp: comp, alerts: alerts };
  }

  /* ===================== Calculadoras ===================== */

  const CALC_AREAS = ['Trauma', 'Urgencias', 'Medicina general', 'Cardiología', 'Salud mental'];
  const PHQ_LEGEND = 'Durante las últimas 2 semanas, ¿con qué frecuencia? · 0 = Para nada · 1 = Varios días · 2 = Más de la mitad de los días · 3 = Casi todos los días';
  const CALCS = [
    { id: 'glasgow', area: 'Trauma', name: 'Escala de Coma de Glasgow', short: 'Glasgow (GCS)', kw: ['glasgow', 'gcs', 'coma', 'conciencia', 'tec', 'trauma craneal'],
      inputs: [
        { id: 'ocular', t: 'segv', label: 'Respuesta ocular', options: [{ v: 4, label: '4 · Espontánea' }, { v: 3, label: '3 · Al estímulo verbal' }, { v: 2, label: '2 · Al dolor' }, { v: 1, label: '1 · Ninguna' }] },
        { id: 'verbal', t: 'segv', label: 'Respuesta verbal', options: [{ v: 5, label: '5 · Orientada' }, { v: 4, label: '4 · Confusa' }, { v: 3, label: '3 · Palabras inapropiadas' }, { v: 2, label: '2 · Sonidos incomprensibles' }, { v: 1, label: '1 · Ninguna' }] },
        { id: 'motora', t: 'segv', label: 'Respuesta motora', options: [{ v: 6, label: '6 · Obedece órdenes' }, { v: 5, label: '5 · Localiza el dolor' }, { v: 4, label: '4 · Retirada al dolor' }, { v: 3, label: '3 · Flexión anormal (decorticación)' }, { v: 2, label: '2 · Extensión (descerebración)' }, { v: 1, label: '1 · Ninguna' }] }
      ],
      compute(v) {
        const p = v.ocular + v.verbal + v.motora;
        let cat, level;
        if (p >= 13) { cat = 'TEC leve'; level = 'ok'; } else if (p >= 9) { cat = 'TEC moderado'; level = 'warn'; } else { cat = 'TEC grave (coma)'; level = 'alert'; }
        return { display: p, unit: '/15', level: level, cat: cat, detail: 'O' + v.ocular + ' V' + v.verbal + ' M' + v.motora + '. Nivel de conciencia; ≤8 define coma.', formula: 'GCS = Ocular (1–4) + Verbal (1–5) + Motora (1–6)', ref: 'Teasdale & Jennett, 1974' };
      } },
    { id: 'shock', area: 'Trauma', name: 'Índice de Shock', short: 'Índice de Shock', kw: ['indice de shock', 'shock index', 'hipovolemia', 'triage', 'choque'],
      inputs: [
        { id: 'fc', t: 'number', label: 'Frecuencia cardíaca', unit: 'lpm', min: 20, max: 250 },
        { id: 'pas', t: 'number', label: 'Presión arterial sistólica', unit: 'mmHg', min: 40, max: 300 }
      ],
      compute(v) {
        const si = v.fc / v.pas;
        let cat, level;
        if (si < 0.7) { cat = 'Normal'; level = 'ok'; } else if (si < 0.9) { cat = 'Vigilar'; level = 'warn'; } else { cat = 'Posible shock / hipovolemia'; level = 'alert'; }
        return { display: si.toFixed(2), unit: '', level: level, cat: cat, detail: 'Normal 0.5–0.7. ≥0.9 sugiere compromiso hemodinámico; útil en triage de trauma.', formula: 'Índice de Shock = FC / PAS', ref: 'Allgöwer & Burri, 1967' };
      } },
    { id: 'parkland', area: 'Trauma', name: 'Fórmula de Parkland', short: 'Parkland (quemados)', kw: ['parkland', 'quemados', 'quemadura', 'reanimacion', 'fluidos', 'superficie quemada'],
      inputs: [
        { id: 'peso', t: 'number', label: 'Peso', unit: 'kg', min: 1, max: 400 },
        { id: 'scq', t: 'number', label: 'Superficie corporal quemada', unit: '%', min: 1, max: 100 }
      ],
      compute(v) {
        const total = 4 * v.peso * v.scq, prim8 = Math.round(total / 2), vel = Math.round((total / 2) / 8);
        return { display: Math.round(total), unit: 'mL / 24 h', level: 'info', cat: 'Cristaloides (Ringer lactato)', detail: 'Primeras 8 h: ' + prim8 + ' mL (≈ ' + vel + ' mL/h). Restante 16 h: ' + prim8 + ' mL. Ajustar por diuresis (0.5–1 mL/kg/h).', formula: 'Volumen 24 h = 4 mL × peso (kg) × % SCQ', ref: 'Baxter (Parkland), 1968' };
      } },
    { id: 'qsofa', area: 'Urgencias', name: 'qSOFA — Riesgo en sospecha de sepsis', short: 'qSOFA', kw: ['qsofa', 'sepsis', 'sofa', 'mortalidad'],
      inputs: [
        { id: 'fr', t: 'toggle', label: 'Frecuencia respiratoria ≥22/min' },
        { id: 'pas', t: 'toggle', label: 'Presión arterial sistólica ≤100 mmHg' },
        { id: 'mental', t: 'toggle', label: 'Alteración del estado mental (Glasgow <15)' }
      ],
      compute(v) {
        const p = (v.fr ? 1 : 0) + (v.pas ? 1 : 0) + (v.mental ? 1 : 0);
        let cat, level;
        if (p >= 2) { cat = 'Riesgo alto'; level = 'alert'; } else if (p === 1) { cat = 'Riesgo intermedio'; level = 'warn'; } else { cat = 'Riesgo bajo'; level = 'ok'; }
        return { display: p, unit: '/3 puntos', level: level, cat: cat, detail: (p >= 2 ? '≥2 = mayor riesgo de mortalidad; evaluar sepsis y disfunción orgánica.' : 'Tamizaje rápido de gravedad en sospecha de infección.'), formula: '1 punto por: FR ≥22 · PAS ≤100 · alteración del sensorio', ref: 'Sepsis-3, Singer et al., 2016' };
      } },
    { id: 'curb65', area: 'Urgencias', name: 'CURB-65 — Gravedad de neumonía', short: 'CURB-65', kw: ['curb', 'curb65', 'neumonia', 'gravedad', 'hospitalizar'],
      inputs: [
        { id: 'c', t: 'toggle', label: 'Confusión de nueva aparición' },
        { id: 'u', t: 'toggle', label: 'Urea >42 mg/dL (BUN >19 mg/dL · urea >7 mmol/L)' },
        { id: 'r', t: 'toggle', label: 'Frecuencia respiratoria ≥30/min' },
        { id: 'b', t: 'toggle', label: 'Presión baja: PAS <90 o PAD ≤60 mmHg' },
        { id: 'e', t: 'toggle', label: 'Edad ≥65 años' }
      ],
      compute(v) {
        const p = (v.c ? 1 : 0) + (v.u ? 1 : 0) + (v.r ? 1 : 0) + (v.b ? 1 : 0) + (v.e ? 1 : 0);
        let cat, level, rec;
        if (p <= 1) { cat = 'Riesgo bajo'; level = 'ok'; rec = 'Mortalidad baja. Habitualmente manejo ambulatorio.'; }
        else if (p === 2) { cat = 'Riesgo intermedio'; level = 'warn'; rec = 'Considerar hospitalización u observación en urgencias.'; }
        else { cat = 'Riesgo alto'; level = 'alert'; rec = 'Hospitalización; con 4–5 puntos, valorar UCI.'; }
        return { display: p, unit: '/5 puntos', level: level, cat: cat, detail: rec, formula: '1 punto por: Confusión · Urea alta · FR ≥30 · PA baja · edad ≥65', ref: 'Lim et al., Thorax 2003' };
      } },
    { id: 'pam', area: 'Urgencias', name: 'Presión Arterial Media (PAM)', short: 'PAM', kw: ['pam', 'presion arterial media', 'map', 'perfusion'],
      inputs: [
        { id: 'pas', t: 'number', label: 'Presión sistólica (PAS)', unit: 'mmHg', min: 40, max: 300 },
        { id: 'pad', t: 'number', label: 'Presión diastólica (PAD)', unit: 'mmHg', min: 20, max: 200 }
      ],
      compute(v) {
        if (v.pad > v.pas) return { error: 'La diastólica no puede ser mayor que la sistólica.' };
        const pam = (v.pas + 2 * v.pad) / 3;
        let cat, level;
        if (pam < 65) { cat = 'Perfusión en riesgo'; level = 'alert'; } else if (pam <= 105) { cat = 'Rango normal'; level = 'ok'; } else { cat = 'Elevada'; level = 'warn'; }
        return { display: Math.round(pam), unit: 'mmHg', level: level, cat: cat, detail: pam < 65 ? 'Objetivo habitual ≥65 mmHg para perfusión de órganos (shock/sepsis).' : 'Presión media del ciclo cardíaco; guía la perfusión tisular.', formula: 'PAM = (PAS + 2 × PAD) / 3', ref: 'Fisiología cardiovascular estándar' };
      } },
    { id: 'imc', area: 'Medicina general', name: 'IMC — Índice de Masa Corporal', short: 'IMC', kw: ['imc', 'masa corporal', 'bmi', 'peso', 'obesidad', 'sobrepeso'],
      inputs: [
        { id: 'peso', t: 'number', label: 'Peso', unit: 'kg', min: 1, max: 400 },
        { id: 'talla', t: 'number', label: 'Talla', unit: 'cm', min: 30, max: 250 }
      ],
      compute(v) {
        const m = v.talla / 100, imc = v.peso / (m * m);
        let cat, level;
        if (imc < 18.5) { cat = 'Bajo peso'; level = 'warn'; }
        else if (imc < 25) { cat = 'Peso normal'; level = 'ok'; }
        else if (imc < 30) { cat = 'Sobrepeso'; level = 'warn'; }
        else if (imc < 35) { cat = 'Obesidad grado I'; level = 'alert'; }
        else if (imc < 40) { cat = 'Obesidad grado II'; level = 'alert'; }
        else { cat = 'Obesidad grado III'; level = 'alert'; }
        return { display: imc.toFixed(1), unit: 'kg/m²', level: level, cat: cat, detail: 'Clasificación OMS del estado nutricional en adultos.', formula: 'IMC = peso (kg) / talla (m)²', ref: 'Organización Mundial de la Salud (OMS)' };
      } },
    { id: 'creatinina', area: 'Medicina general', name: 'Depuración de creatinina — Cockcroft-Gault', short: 'Depuración de creatinina', kw: ['creatinina', 'depuracion', 'aclaramiento', 'cockcroft', 'gault', 'funcion renal', 'clearance'],
      inputs: [
        { id: 'edad', t: 'number', label: 'Edad', unit: 'años', min: 1, max: 120 },
        { id: 'sexo', t: 'seg', label: 'Sexo', options: [{ v: 'H', label: 'Hombre' }, { v: 'M', label: 'Mujer' }] },
        { id: 'peso', t: 'number', label: 'Peso', unit: 'kg', min: 1, max: 400 },
        { id: 'creat', t: 'numberunit', label: 'Creatinina sérica', units: [{ v: 'mgdl', label: 'mg/dL' }, { v: 'umol', label: 'µmol/L' }] }
      ],
      compute(v) {
        const cr = v.creat_unit === 'umol' ? v.creat / 88.4 : v.creat;
        if (cr <= 0) return { error: 'La creatinina debe ser mayor que 0.' };
        const crcl = ((140 - v.edad) * v.peso * (v.sexo === 'M' ? 0.85 : 1)) / (72 * cr);
        let cat, level;
        if (crcl >= 90) { cat = 'Normal'; level = 'ok'; }
        else if (crcl >= 60) { cat = 'Descenso leve'; level = 'ok'; }
        else if (crcl >= 30) { cat = 'Descenso moderado'; level = 'warn'; }
        else if (crcl >= 15) { cat = 'Descenso grave'; level = 'alert'; }
        else { cat = 'Falla renal'; level = 'alert'; }
        return { display: Math.round(crcl), unit: 'mL/min', level: level, cat: cat, detail: 'Estima el aclaramiento de creatinina. Usado sobre todo para ajustar dosis de medicamentos.', formula: 'CrCl = [(140 − edad) × peso × (0.85 si mujer)] / (72 × creatinina mg/dL)', ref: 'Cockcroft & Gault, 1976' };
      } },
    { id: 'calcio', area: 'Medicina general', name: 'Calcio corregido por albúmina', short: 'Calcio corregido', kw: ['calcio', 'albumina', 'hipocalcemia', 'hipercalcemia'],
      inputs: [
        { id: 'ca', t: 'number', label: 'Calcio sérico total', unit: 'mg/dL', min: 2, max: 20 },
        { id: 'alb', t: 'number', label: 'Albúmina', unit: 'g/dL', min: 0.5, max: 7 }
      ],
      compute(v) {
        const cc = v.ca + 0.8 * (4.0 - v.alb);
        let cat, level;
        if (cc < 8.5) { cat = 'Hipocalcemia'; level = 'alert'; } else if (cc <= 10.5) { cat = 'Normal'; level = 'ok'; } else { cat = 'Hipercalcemia'; level = 'alert'; }
        return { display: cc.toFixed(1), unit: 'mg/dL', level: level, cat: cat, detail: 'Corrige el calcio total en hipoalbuminemia. Rango normal ≈ 8.5–10.5 mg/dL.', formula: 'Ca corregido = Ca medido + 0.8 × (4.0 − albúmina g/dL)', ref: 'Payne et al., 1973' };
      } },
    { id: 'bsa', area: 'Medicina general', name: 'Superficie corporal (Mosteller)', short: 'Superficie corporal', kw: ['superficie corporal', 'bsa', 'mosteller', 'dosificacion'],
      inputs: [
        { id: 'peso', t: 'number', label: 'Peso', unit: 'kg', min: 1, max: 400 },
        { id: 'talla', t: 'number', label: 'Talla', unit: 'cm', min: 30, max: 250 }
      ],
      compute(v) {
        const bsa = Math.sqrt(v.peso * v.talla / 3600);
        return { display: bsa.toFixed(2), unit: 'm²', level: 'info', cat: 'Superficie corporal', detail: 'Usada para dosificación (quimioterapia, algunos fármacos) e índices fisiológicos.', formula: 'SC (m²) = √( peso[kg] × talla[cm] / 3600 )', ref: 'Mosteller, 1987' };
      } },
    { id: 'pesoideal', area: 'Medicina general', name: 'Peso ideal (Devine)', short: 'Peso ideal', kw: ['peso ideal', 'devine', 'ibw', 'dosificacion'],
      inputs: [
        { id: 'sexo', t: 'seg', label: 'Sexo', options: [{ v: 'H', label: 'Hombre' }, { v: 'M', label: 'Mujer' }] },
        { id: 'talla', t: 'number', label: 'Talla', unit: 'cm', min: 130, max: 230 }
      ],
      compute(v) {
        const base = v.sexo === 'H' ? 50 : 45.5, pi = base + 0.91 * (v.talla - 152.4);
        return { display: pi.toFixed(1), unit: 'kg', level: 'info', cat: 'Peso ideal estimado', detail: 'Referencia para dosificación de fármacos y ventilación. No sustituye la evaluación nutricional.', formula: 'PI = ' + base + ' + 0.91 × (talla[cm] − 152.4)', ref: 'Devine, 1974' };
      } },
    { id: 'aniongap', area: 'Medicina general', name: 'Anion Gap (brecha aniónica)', short: 'Anion Gap', kw: ['anion gap', 'brecha anionica', 'acidosis', 'metabolica'],
      inputs: [
        { id: 'na', t: 'number', label: 'Sodio (Na⁺)', unit: 'mEq/L', min: 100, max: 180 },
        { id: 'cl', t: 'number', label: 'Cloro (Cl⁻)', unit: 'mEq/L', min: 60, max: 140 },
        { id: 'hco3', t: 'number', label: 'Bicarbonato (HCO₃⁻)', unit: 'mEq/L', min: 1, max: 60 }
      ],
      compute(v) {
        const ag = v.na - (v.cl + v.hco3);
        let cat, level;
        if (ag < 8) { cat = 'Disminuido'; level = 'warn'; } else if (ag <= 12) { cat = 'Normal'; level = 'ok'; } else { cat = 'Elevado'; level = 'alert'; }
        return { display: Math.round(ag), unit: 'mEq/L', level: level, cat: cat, detail: (ag > 12 ? 'AG elevado → considerar acidosis metabólica con anión gap aumentado (cetoacidosis, láctica, tóxicos, uremia).' : 'Rango normal ≈ 8–12 mEq/L. Corregir por albúmina si está baja.'), formula: 'Anion Gap = Na⁺ − (Cl⁻ + HCO₃⁻)', ref: 'Estándar de laboratorio' };
      } },
    { id: 'chadsvasc', area: 'Cardiología', name: 'CHA₂DS₂-VASc — Riesgo de ACV en fibrilación auricular', short: 'CHA₂DS₂-VASc', kw: ['chads', 'chadsvasc', 'cha2ds2', 'fibrilacion auricular', 'acv', 'anticoagulacion'],
      inputs: [
        { id: 'sexo', t: 'seg', label: 'Sexo', options: [{ v: 'H', label: 'Hombre' }, { v: 'M', label: 'Mujer' }] },
        { id: 'edad', t: 'seg', label: 'Edad', options: [{ v: 'a', label: '<65' }, { v: 'b', label: '65–74' }, { v: 'c', label: '≥75' }] },
        { id: 'icc', t: 'toggle', label: 'Insuficiencia cardíaca / disfunción del VI' },
        { id: 'hta', t: 'toggle', label: 'Hipertensión arterial' },
        { id: 'dm', t: 'toggle', label: 'Diabetes mellitus' },
        { id: 'acv', t: 'toggle', label: 'ACV / AIT / tromboembolia previa' },
        { id: 'vasc', t: 'toggle', label: 'Enfermedad vascular (IAM, arteriopatía periférica, placa aórtica)' }
      ],
      compute(v) {
        const p = (v.sexo === 'M' ? 1 : 0) + (v.edad === 'b' ? 1 : v.edad === 'c' ? 2 : 0) + (v.icc ? 1 : 0) + (v.hta ? 1 : 0) + (v.dm ? 1 : 0) + (v.acv ? 2 : 0) + (v.vasc ? 1 : 0);
        const mujer = v.sexo === 'M';
        let cat, level, rec;
        if (p === 0) { cat = 'Riesgo bajo'; level = 'ok'; rec = 'No se recomienda anticoagulación.'; }
        else if (p === 1) { cat = 'Riesgo bajo-moderado'; level = 'warn'; rec = 'Considerar anticoagulación según el caso.'; }
        else if (mujer && p === 2) { cat = 'Riesgo bajo-moderado'; level = 'warn'; rec = 'Considerar anticoagulación (en mujeres, 1 punto es solo por el sexo).'; }
        else { cat = 'Riesgo alto'; level = 'alert'; rec = 'Se recomienda anticoagulación oral.'; }
        return { display: p, unit: '/9 puntos', level: level, cat: cat, detail: rec + ' La decisión final integra el riesgo de sangrado (p. ej. HAS-BLED) y el juicio clínico.', formula: 'C1 · H1 · A₂(≥75)=2 · D1 · S₂(ACV)=2 · V1 · A(65-74)=1 · Sc(mujer)=1', ref: 'Lip et al., 2010' };
      } },
    { id: 'hasbled', area: 'Cardiología', name: 'HAS-BLED — Riesgo de sangrado con anticoagulación', short: 'HAS-BLED', kw: ['hasbled', 'has-bled', 'sangrado', 'hemorragia', 'anticoagulacion'],
      inputs: [
        { id: 'hta', t: 'toggle', label: 'Hipertensión no controlada (PAS >160 mmHg)' },
        { id: 'renal', t: 'toggle', label: 'Función renal alterada (diálisis, trasplante o creatinina >2.26 mg/dL)' },
        { id: 'hep', t: 'toggle', label: 'Función hepática alterada' },
        { id: 'acv', t: 'toggle', label: 'ACV previo' },
        { id: 'sang', t: 'toggle', label: 'Sangrado mayor previo o predisposición' },
        { id: 'inr', t: 'toggle', label: 'INR lábil (mal control de TTR)' },
        { id: 'edad', t: 'toggle', label: 'Edad >65 años' },
        { id: 'farm', t: 'toggle', label: 'Fármacos: antiplaquetarios o AINE' },
        { id: 'alc', t: 'toggle', label: 'Consumo de alcohol ≥8 unidades/semana' }
      ],
      compute(v) {
        const p = ['hta', 'renal', 'hep', 'acv', 'sang', 'inr', 'edad', 'farm', 'alc'].reduce(function (s, k) { return s + (v[k] ? 1 : 0); }, 0);
        let cat, level;
        if (p >= 3) { cat = 'Riesgo alto'; level = 'alert'; } else if (p >= 1) { cat = 'Riesgo bajo-moderado'; level = 'warn'; } else { cat = 'Riesgo bajo'; level = 'ok'; }
        return { display: p, unit: '/9 puntos', level: level, cat: cat, detail: (p >= 3 ? '≥3 = riesgo alto de sangrado; extremar controles, no contraindica anticoagular.' : 'Evalúa el riesgo de sangrado; se interpreta junto al CHA₂DS₂-VASc.'), formula: '1 punto por cada factor presente (máximo 9)', ref: 'Pisters et al., 2010' };
      } },
    { id: 'phq9', area: 'Salud mental', name: 'PHQ-9 — Tamizaje de depresión', short: 'PHQ-9', kw: ['phq', 'phq9', 'depresion', 'tamizaje', 'animo'], phq: true,
      inputs: [
        { id: 'q1', t: 'phq', label: '1. Poco interés o placer en hacer las cosas' },
        { id: 'q2', t: 'phq', label: '2. Sentirse decaído(a), deprimido(a) o sin esperanza' },
        { id: 'q3', t: 'phq', label: '3. Problemas para dormir, o dormir demasiado' },
        { id: 'q4', t: 'phq', label: '4. Sentirse cansado(a) o con poca energía' },
        { id: 'q5', t: 'phq', label: '5. Poco apetito o comer en exceso' },
        { id: 'q6', t: 'phq', label: '6. Sentirse mal consigo mismo(a), como un fracaso o que ha defraudado a su familia' },
        { id: 'q7', t: 'phq', label: '7. Dificultad para concentrarse (leer, ver televisión)' },
        { id: 'q8', t: 'phq', label: '8. Moverse o hablar tan lento que otros lo notan; o lo contrario, muy inquieto(a)' },
        { id: 'q9', t: 'phq', label: '9. Pensamientos de que estaría mejor muerto(a) o de hacerse daño' }
      ],
      compute(v) {
        const p = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce(function (s, i) { return s + (v['q' + i] || 0); }, 0);
        let cat, level;
        if (p <= 4) { cat = 'Mínima'; level = 'ok'; }
        else if (p <= 9) { cat = 'Leve'; level = 'warn'; }
        else if (p <= 14) { cat = 'Moderada'; level = 'warn'; }
        else if (p <= 19) { cat = 'Moderadamente grave'; level = 'alert'; }
        else { cat = 'Grave'; level = 'alert'; }
        const r = { display: p, unit: '/27 puntos', level: level, cat: cat, detail: 'Severidad de síntomas depresivos en las últimas 2 semanas.', formula: 'Suma de 9 ítems (0–3 cada uno)', ref: 'Kroenke, Spitzer & Williams, 2001 · versión validada en español' };
        if ((v.q9 || 0) >= 1) r.alert = 'Respuesta positiva en el ítem 9 (ideación de muerte/autolesión). Evaluar riesgo de suicidio de inmediato.';
        return r;
      } },
    { id: 'gad7', area: 'Salud mental', name: 'GAD-7 — Tamizaje de ansiedad', short: 'GAD-7', kw: ['gad', 'gad7', 'ansiedad', 'tamizaje'], phq: true,
      inputs: [
        { id: 'g1', t: 'phq', label: '1. Sentirse nervioso(a), ansioso(a) o muy alterado(a)' },
        { id: 'g2', t: 'phq', label: '2. No poder dejar de preocuparse o controlar la preocupación' },
        { id: 'g3', t: 'phq', label: '3. Preocuparse demasiado por diferentes cosas' },
        { id: 'g4', t: 'phq', label: '4. Dificultad para relajarse' },
        { id: 'g5', t: 'phq', label: '5. Estar tan inquieto(a) que es difícil permanecer sentado(a)' },
        { id: 'g6', t: 'phq', label: '6. Molestarse o irritarse fácilmente' },
        { id: 'g7', t: 'phq', label: '7. Sentir miedo como si algo terrible fuera a pasar' }
      ],
      compute(v) {
        const p = [1, 2, 3, 4, 5, 6, 7].reduce(function (s, i) { return s + (v['g' + i] || 0); }, 0);
        let cat, level;
        if (p <= 4) { cat = 'Mínima'; level = 'ok'; }
        else if (p <= 9) { cat = 'Leve'; level = 'warn'; }
        else if (p <= 14) { cat = 'Moderada'; level = 'warn'; }
        else { cat = 'Grave'; level = 'alert'; }
        return { display: p, unit: '/21 puntos', level: level, cat: cat, detail: (p >= 10 ? '≥10 sugiere trastorno de ansiedad probable; se recomienda evaluación clínica.' : 'Severidad de síntomas de ansiedad en las últimas 2 semanas.'), formula: 'Suma de 7 ítems (0–3 cada uno)', ref: 'Spitzer et al., 2006 · versión validada en español' };
      } }
  ];

  /* Acepta coma o punto: el separador decimal latinoamericano es "," y
     <input type=number> devolvía vacío. Bug real corregido en el repo. */
  function parseNum(val) {
    if (val == null) return undefined;
    const s = String(val).trim().replace(/\s/g, '').replace(',', '.');
    if (s === '') return undefined;
    const n = parseFloat(s);
    return isNaN(n) ? undefined : n;
  }

  const AAST_ADJUST = {
    multiple3: { q: '¿Lesiones múltiples?', note: 'Grado ajustado +1 por lesiones múltiples (hasta grado III).', rule: 'upTo3' },
    multiple_nocap: { q: '¿Lesiones múltiples?', note: 'Grado ajustado +1 por el factor seleccionado.', rule: 'up1' },
    bilateral3: { q: '¿Lesión bilateral?', note: 'Grado ajustado +1 por lesión bilateral (hasta grado III).', rule: 'upTo3' },
    bilateral5: { q: '¿Lesión bilateral?', note: 'Grado ajustado +1 por lesión bilateral (hasta grado V).', rule: 'upTo5' }
  };
  const AAST_VESSEL = {
    inc: { q: '¿Lesiones múltiples grado III–IV con >50% de circunferencia?', note: 'Grado +1 por lesiones múltiples >50% circunferencia.' },
    dec: { q: '¿Lesión grado IV–V con <25% de circunferencia?', note: 'Grado −1 por <25% de circunferencia.' }
  };
  const AAST_WARN = 'Descripción incompleta en la fuente — verificar contra el documento AAST original.';
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

  window.ET_DATA = {
    MIAA_DECISION: MIAA_DECISION,
    MIAA_BJORCK_Q: MIAA_BJORCK_Q,
    MIAA_BJORCK_CAUTION: MIAA_BJORCK_CAUTION,
    BJORCK_GRID: BJORCK_GRID,
    MIAA_ALGOS: MIAA_ALGOS,
    TEG_FIELDS: TEG_FIELDS, TEG_REF: TEG_REF, TEG_CAUTION: TEG_CAUTION, computeTEG: computeTEG,
    CALC_AREAS: CALC_AREAS, CALCS: CALCS, PHQ_LEGEND: PHQ_LEGEND,
    AAST_ADJUST: AAST_ADJUST, AAST_VESSEL: AAST_VESSEL, AAST_WARN: AAST_WARN, ROMAN: ROMAN,
    parseNum: parseNum
  };
})();
