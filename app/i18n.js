/* ============================================================
   EduTrauma Tools — textos de la app (es / en / pt)

   Regla: ningún texto de interfaz se escribe fuera de aquí. Si un string
   aparece suelto en app.js, tarde o temprano queda sin traducir.

   "EduTrauma Tools" NO está aquí a propósito: es nombre propio y la cinta
   lo muestra igual en los tres idiomas (design/DESIGN.md).
   ============================================================ */

/* Lista canónica de especialidades — las mismas 7 del hub, en el mismo orden.
   design/auditar.mjs comprueba que no diverja del resto de la serie. */
const SPECIALTIES = {
  es: ["Cirugía general","Cirugía de trauma","Residente de cirugía","Medicina de urgencia","Enfermería","Estudiante de medicina","Otra"],
  en: ["General surgery","Trauma surgery","Surgery resident","Emergency medicine","Nursing","Medical student","Other"],
  pt: ["Cirurgia geral","Cirurgia do trauma","Residente de cirurgia","Medicina de emergência","Enfermagem","Estudante de medicina","Outra"]
};

/* Países. El valor guardado es SIEMPRE la forma en español (clave canónica),
   para que el panel no vuelva a partir el conteo por idioma; lo que se muestra
   sale de COUNTRY_NAMES. "Otro" va siempre al final, nunca ordenado. */
const COUNTRIES = [
  "Chile","México","Colombia","Argentina","Perú","Ecuador","Bolivia","Uruguay",
  "Paraguay","Venezuela","Brasil","Panamá","Costa Rica","Guatemala",
  "República Dominicana","España","Estados Unidos"
];
/* Los cinco mercados principales: con ellos arriba, la mayoría acierta al primer toque. */
const COUNTRY_FREQ = ["Chile","México","Colombia","Argentina","Perú"];
const COUNTRY_OTHER = "Otro";
const COUNTRY_NAMES = {
  en: { "México":"Mexico", "Perú":"Peru", "Brasil":"Brazil", "Panamá":"Panama",
        "República Dominicana":"Dominican Republic", "España":"Spain",
        "Estados Unidos":"United States", "Otro":"Other" },
  pt: { "México":"México", "Perú":"Peru", "Panamá":"Panamá",
        "República Dominicana":"República Dominicana", "España":"Espanha",
        "Estados Unidos":"Estados Unidos", "Otro":"Outro" }
};

/* Canales de origen. El id es lo que viaja al panel; la etiqueta se traduce. */
const CHANNELS = ["correo","instagram","whatsapp","linkedin","amigo","otro"];

const I18N = {

/* ------------------------------------------------------------------ es */
es: {
  htmlLang: "es",
  tabs: { kit:"Kit", casos:"Casos", guias:"Guías", perfil:"Perfil" },

  onb: {
    eyebrow: "Herramientas clínicas de trauma",
    title: "Tres toques y estás dentro.",
    sub: "Sin cuenta, sin correo, sin contraseña. Solo queremos saber para quién estamos construyendo.",
    privacy: "Anónimo de principio a fin. Nunca pedimos nombre ni identificador, y tus casos clínicos no salen de este teléfono.",
    start: "Empecemos",
    stepOf: "Paso {n} de {t}",
    foot: "Anónimo y agregado. Sin nombre, sin correo, sin identificador.",
    q1: "¿Cuál es tu especialidad?",  w1: "Para mostrarte primero lo que usas.",
    q2: "¿En qué país ejerces?",      w2: "Para adaptar protocolos y disponibilidad.",
    q3: "¿Cómo nos conociste?",       w3: "Es la única forma de saber qué canal funciona.",
    doneTitle: "Listo",
    doneText: "Las cinco herramientas ya están en tu teléfono y funcionan sin conexión."
  },

  aast: {
    search: "Buscar órgano o región…",
    emptyText: "Prueba con «bazo», «hígado» o «tórax».",
    grade: "Grado", upTo: "hasta grado", organs: "Órganos",
    adjust: "Ajustes",
    upOne: "Sube 1 grado.", downOne: "Baja 1 grado.",
    aastGrade: "Grado AAST",
    save: "Guardar",
    saved: "Guardado: {v}",
    ref: "Gradación de lesiones de órganos — Moore et al. (AAST) · curso DQT, EduTrauma."
  },
  teg: {
    heparin: "Heparina", heparinQ: "¿El paciente recibió heparina?",
    values: "Valores del panel", valuesShort: "Valores",
    outRange: "Valor fuera del rango habitual — revisa que no sea un error de digitación.",
    interpret: "Interpretar", complete: "Completa los {n} valores",
    foot: "Acepta coma o punto decimal. Ningún valor fuera de rango bloquea la interpretación.",
    panel: "Interpretación del panel",
    pill: { ok:"Normal", warn:"Vigilar", alert:"Actuar", info:"Normal" },
    fix: "Corregir un valor", newCase: "Evaluar otro caso"
  },
  calc: {
    search: "Buscar calculadora…",
    emptyText: "Prueba con «Glasgow», «shock» o «sepsis».",
    recent: "Recientes", data: "Datos",
    run: "Calcular", complete: "Completa los datos",
    outRange: "Valor fuera del rango habitual — revisa que no sea un error de digitación.",
    formula: "Fórmula:",
    fix: "Corregir datos", another: "Otra calculadora",
    error: "Revisa los datos: hay un valor incoherente."
  },

  tool: {
    search: "Buscar algoritmo…",
    stepOf: "Paso {n} de {t}",
    back: "Atrás",
    yes: "SÍ", no: "NO",
    rule: "Regla práctica",
    fav: "Marcar como favorito",
    emptyTitle: "Sin resultados",
    emptyText: "Prueba con «Björck», «antibióticos» o «NEXUS».",
    presentOf: "{n} de {t} presentes",
    seeResult: "Ver resultado",
    nonePresent: "Ningún criterio presente",
    bjorckSub: "Los 9 grados de un vistazo, sin recorrer el árbol",
    bjorckLede: "Los nueve grados con su conducta. Toca uno para ver los pasos.",
    steps: "{n} pasos", step1: "1 paso",
    directLookup: "Consulta directa",
    conduct: "Conducta",
    conductNote: "Dejar el abdomen abierto y cerrarlo son dos conductas igualmente válidas. Esta pantalla refleja la que corresponde a los hallazgos que indicaste — no es una respuesta correcta ni incorrecta.",
    trace: "Trazabilidad",
    ref: "Referencia:",
    another: "Otro algoritmo"
  },

  kit: {
    coverTitle: "¿Qué necesitas decidir?",
    coverSub: "Elige una herramienta y te acompaño paso a paso.",
    offline: "Listo para usar sin conexión",
    continueCase: "Continuar caso",
    noCase: "Sin caso abierto. Lo que calcules puede quedar guardado en uno.",
    favorites: "Favoritos",
    yourTools: "Tus herramientas",
    disclaimer: "Apoyo a la decisión clínica — no reemplazan el juicio quirúrgico.",
    feedback: "Danos tu opinión"
  },

  tools: [
    { id:"abdomen", href:"../abdomen/", chip:"logo-miaa.png", tile:"#e7f4f7",
      title:"Abdomen Abierto — MIAA",
      desc:"5 algoritmos: cuándo dejarlo abierto, Björck, antibióticos, nutrición e HIA/SCA." },
    { id:"aast", href:"../aast/", chip:"logo-dqt.png", tile:"#eef1f7",
      title:"Escalas AAST de lesiones",
      desc:"32 órganos en 6 regiones, con grado, ICD-9 y AIS. Busca y lee en pabellón." },
    { id:"mip", href:"../mip/", chip:"logo-mip.png", tile:"#fdecea",
      title:"MIP — Politraumatizado",
      desc:"Abordaje primario ABCDE: espinal, NEXUS y vía aérea." },
    { id:"teg", href:"../teg/", mono:"TEG", tile:"#E02826",
      title:"TEG6s — Tromboelastografía",
      desc:"8 valores del panel → interpretación de 4 componentes con hemoderivados y TXA." },
    { id:"calc", href:"../calculadoras/", mono:"16", tile:"#00205C",
      title:"Calculadoras médicas",
      desc:"16 calculadoras en 5 áreas: Glasgow, Shock, Parkland, qSOFA y más." }
  ],

  casos: {
    title: "Tus casos",
    lede: "Los cálculos quedan agrupados por paciente, solo en tu teléfono y sin identificadores.",
    emptyTitle: "Todavía no hay casos",
    emptyText: "Cuando guardes el resultado de una herramienta, aparecerá aquí agrupado por paciente."
  },

  guias: {
    title: "Material de los cursos",
    lede: "Consulta rápida del material de los cursos. Sin flujo: solo referencia.",
    emptyTitle: "En preparación",
    emptyText: "Las fichas de consulta las está redactando el equipo docente. Llegarán en una próxima actualización."
  },

  perfil: {
    title: "Tu perfil",
    promise: "Anónimo. Nos dice qué herramientas construir, nunca quién eres.",
    detail: "Nunca pedimos nombre, correo ni identificador. Estos tres datos se usan agregados, para decidir qué construir. <b>Tus casos clínicos no salen de este teléfono.</b>",
    specialty: "Especialidad",
    country: "País",
    countryRow: "País de práctica",
    unset: "Sin definir",
    channel: "Cómo nos conociste",
    channelRow: "Canal",
    channelNote: "Es la única forma que tenemos de saber qué canal funciona.",
    language: "Idioma",
    offline: "Disponibilidad offline",
    offlineCount: "5 de 5 herramientas",
    offlineState: "Descargadas",
    offlineNote: "Funcionan sin conexión. Los cálculos se sincronizan al recuperar red.",
    courses: "Cursos EduTrauma",
    footer: "© 2026 EduTrauma® — Enseñando a salvar vidas."
  },

  countrySheet: {
    title: "País",
    cancel: "Cancelar",
    search: "Buscar país…",
    frequent: "Frecuentes",
    az: "A – Z",
    results: "Resultados",
    emptyTitle: "Sin resultados",
    emptyText: "Si tu país no aparece, elige «Otro»."
  },
  channelSheet: {
    title: "¿Cómo nos conociste?",
    sub: "Anónimo. Nos dice qué canal funciona."
  },
  channels: {
    correo:"Correo EduTrauma", instagram:"Instagram", whatsapp:"WhatsApp",
    linkedin:"LinkedIn", amigo:"Un amigo / colega", otro:"Otro"
  },
  courses: [
    { logo:"logo-dqt.png",  name:"DQT",  full:"Destrezas Quirúrgicas en Trauma" },
    { logo:"logo-mip.png",  name:"MIP",  full:"Manejo Integral del Politraumatizado" },
    { logo:"logo-miaa.png", name:"MIAA", full:"Manejo Integral del Abdomen Abierto" }
  ],
  toast: { country:"País actualizado: {v}", channel:"Gracias — nos ayuda a saber qué canal funciona" }
},

/* ------------------------------------------------------------------ en */
en: {
  htmlLang: "en",
  tabs: { kit:"Kit", casos:"Cases", guias:"Guides", perfil:"Profile" },

  onb: {
    eyebrow: "Clinical trauma tools",
    title: "Three taps and you're in.",
    sub: "No account, no email, no password. We just want to know who we're building for.",
    privacy: "Anonymous from start to finish. We never ask for your name or any identifier, and your clinical cases never leave this phone.",
    start: "Let's start",
    stepOf: "Step {n} of {t}",
    foot: "Anonymous and aggregated. No name, no email, no identifier.",
    q1: "What is your specialty?", w1: "So we show what you use, first.",
    q2: "Which country do you practise in?", w2: "To adapt protocols and availability.",
    q3: "How did you hear about us?", w3: "It's the only way we know which channel works.",
    doneTitle: "Done",
    doneText: "All five tools are on your phone now, and they work offline."
  },

  aast: {
    search: "Search organ or region…",
    emptyText: "Try “spleen”, “liver” or “chest”.",
    grade: "Grade", upTo: "up to grade", organs: "Organs",
    adjust: "Adjustments",
    upOne: "Raises 1 grade.", downOne: "Lowers 1 grade.",
    aastGrade: "AAST grade",
    save: "Save",
    saved: "Saved: {v}",
    ref: "Organ injury scaling — Moore et al. (AAST) · DQT course, EduTrauma."
  },
  teg: {
    heparin: "Heparin", heparinQ: "Did the patient receive heparin?",
    values: "Panel values", valuesShort: "Values",
    outRange: "Value outside the usual range — check it isn't a typing error.",
    interpret: "Interpret", complete: "Fill in the {n} values",
    foot: "Accepts comma or decimal point. No out-of-range value blocks the interpretation.",
    panel: "Panel interpretation",
    pill: { ok:"Normal", warn:"Watch", alert:"Act", info:"Normal" },
    fix: "Correct a value", newCase: "Assess another case"
  },
  calc: {
    search: "Search calculator…",
    emptyText: "Try “Glasgow”, “shock” or “sepsis”.",
    recent: "Recent", data: "Data",
    run: "Calculate", complete: "Fill in the data",
    outRange: "Value outside the usual range — check it isn't a typing error.",
    formula: "Formula:",
    fix: "Correct data", another: "Another calculator",
    error: "Check the data: there is an inconsistent value."
  },

  tool: {
    search: "Search algorithm…",
    stepOf: "Step {n} of {t}",
    back: "Back",
    yes: "YES", no: "NO",
    rule: "Rule of thumb",
    fav: "Mark as favourite",
    emptyTitle: "No results",
    emptyText: "Try “Björck”, “antibiotics” or “NEXUS”.",
    presentOf: "{n} of {t} present",
    seeResult: "See result",
    nonePresent: "No criteria present",
    bjorckSub: "All 9 grades at a glance, no tree to walk",
    bjorckLede: "The nine grades with their management. Tap one to see the steps.",
    steps: "{n} steps", step1: "1 step",
    directLookup: "Direct lookup",
    conduct: "Management",
    conductNote: "Leaving the abdomen open and closing it are two equally valid courses of action. This screen shows the one matching the findings you entered — it is not a right or wrong answer.",
    trace: "Traceability",
    ref: "Reference:",
    another: "Another algorithm"
  },

  kit: {
    coverTitle: "What do you need to decide?",
    coverSub: "Pick a tool and I'll walk you through it.",
    offline: "Ready to use offline",
    continueCase: "Continue case",
    noCase: "No case open. What you calculate can be saved into one.",
    favorites: "Favourites",
    yourTools: "Your tools",
    disclaimer: "Clinical decision support — it does not replace surgical judgement.",
    feedback: "Give us your feedback"
  },

  tools: [
    { id:"abdomen", href:"../abdomen/", chip:"logo-miaa.png", tile:"#e7f4f7",
      title:"Open Abdomen — MIAA",
      desc:"5 algorithms: when to leave it open, Björck, antibiotics, nutrition and IAH/ACS." },
    { id:"aast", href:"../aast/", chip:"logo-dqt.png", tile:"#eef1f7",
      title:"AAST injury scales",
      desc:"32 organs across 6 regions, with grade, ICD-9 and AIS. Search and read in theatre." },
    { id:"mip", href:"../mip/", chip:"logo-mip.png", tile:"#fdecea",
      title:"MIP — Polytrauma",
      desc:"Primary ABCDE survey: spinal, NEXUS and airway." },
    { id:"teg", href:"../teg/", mono:"TEG", tile:"#E02826",
      title:"TEG6s — Thromboelastography",
      desc:"8 panel values → four-component interpretation with blood products and TXA." },
    { id:"calc", href:"../calculadoras/", mono:"16", tile:"#00205C",
      title:"Medical calculators",
      desc:"16 calculators across 5 areas: Glasgow, Shock Index, Parkland, qSOFA and more." }
  ],

  casos: {
    title: "Your cases",
    lede: "Calculations are grouped by patient, only on your phone and with no identifiers.",
    emptyTitle: "No cases yet",
    emptyText: "When you save a tool's result, it will show up here grouped by patient."
  },

  guias: {
    title: "Course material",
    lede: "Quick reference from the course material. No flow: reference only.",
    emptyTitle: "In preparation",
    emptyText: "The teaching team is writing these reference sheets. They'll arrive in an upcoming update."
  },

  perfil: {
    title: "Your profile",
    promise: "Anonymous. It tells us what to build, never who you are.",
    detail: "We never ask for your name, email or any identifier. These three answers are used in aggregate, to decide what to build. <b>Your clinical cases never leave this phone.</b>",
    specialty: "Specialty",
    country: "Country",
    countryRow: "Country of practice",
    unset: "Not set",
    channel: "How you found us",
    channelRow: "Channel",
    channelNote: "It's the only way we know which channel works.",
    language: "Language",
    offline: "Offline availability",
    offlineCount: "5 of 5 tools",
    offlineState: "Downloaded",
    offlineNote: "They work without a connection. Calculations sync when the network returns.",
    courses: "EduTrauma courses",
    footer: "© 2026 EduTrauma® — Teaching how to save lives."
  },

  countrySheet: {
    title: "Country",
    cancel: "Cancel",
    search: "Search country…",
    frequent: "Frequent",
    az: "A – Z",
    results: "Results",
    emptyTitle: "No results",
    emptyText: "If your country isn't listed, choose “Other”."
  },
  channelSheet: {
    title: "How did you hear about us?",
    sub: "Anonymous. It tells us which channel works."
  },
  channels: {
    correo:"EduTrauma email", instagram:"Instagram", whatsapp:"WhatsApp",
    linkedin:"LinkedIn", amigo:"A friend / colleague", otro:"Other"
  },
  courses: [
    { logo:"logo-dqt.png",  name:"DQT",  full:"Surgical Skills in Trauma" },
    { logo:"logo-mip.png",  name:"MIP",  full:"Integrated Polytrauma Management" },
    { logo:"logo-miaa.png", name:"MIAA", full:"Integrated Open Abdomen Management" }
  ],
  toast: { country:"Country updated: {v}", channel:"Thank you — it helps us know which channel works" }
},

/* ------------------------------------------------------------------ pt */
pt: {
  htmlLang: "pt-BR",
  tabs: { kit:"Kit", casos:"Casos", guias:"Guias", perfil:"Perfil" },

  onb: {
    eyebrow: "Ferramentas clínicas de trauma",
    title: "Três toques e você está dentro.",
    sub: "Sem conta, sem e-mail, sem senha. Só queremos saber para quem estamos construindo.",
    privacy: "Anônimo do começo ao fim. Nunca pedimos nome nem identificador, e seus casos clínicos não saem deste telefone.",
    start: "Vamos começar",
    stepOf: "Passo {n} de {t}",
    foot: "Anônimo e agregado. Sem nome, sem e-mail, sem identificador.",
    q1: "Qual é a sua especialidade?", w1: "Para mostrar primeiro o que você usa.",
    q2: "Em que país você atua?", w2: "Para adaptar protocolos e disponibilidade.",
    q3: "Como você nos conheceu?", w3: "É a única forma de saber qual canal funciona.",
    doneTitle: "Pronto",
    doneText: "As cinco ferramentas já estão no seu telefone e funcionam sem conexão."
  },

  aast: {
    search: "Buscar órgão ou região…",
    emptyText: "Tente «baço», «fígado» ou «tórax».",
    grade: "Grau", upTo: "até grau", organs: "Órgãos",
    adjust: "Ajustes",
    upOne: "Sobe 1 grau.", downOne: "Baixa 1 grau.",
    aastGrade: "Grau AAST",
    save: "Salvar",
    saved: "Salvo: {v}",
    ref: "Graduação de lesões de órgãos — Moore et al. (AAST) · curso DQT, EduTrauma."
  },
  teg: {
    heparin: "Heparina", heparinQ: "O paciente recebeu heparina?",
    values: "Valores do painel", valuesShort: "Valores",
    outRange: "Valor fora da faixa habitual — confira se não é erro de digitação.",
    interpret: "Interpretar", complete: "Complete os {n} valores",
    foot: "Aceita vírgula ou ponto decimal. Nenhum valor fora da faixa bloqueia a interpretação.",
    panel: "Interpretação do painel",
    pill: { ok:"Normal", warn:"Vigiar", alert:"Agir", info:"Normal" },
    fix: "Corrigir um valor", newCase: "Avaliar outro caso"
  },
  calc: {
    search: "Buscar calculadora…",
    emptyText: "Tente «Glasgow», «choque» ou «sepse».",
    recent: "Recentes", data: "Dados",
    run: "Calcular", complete: "Complete os dados",
    outRange: "Valor fora da faixa habitual — confira se não é erro de digitação.",
    formula: "Fórmula:",
    fix: "Corrigir dados", another: "Outra calculadora",
    error: "Revise os dados: há um valor incoerente."
  },

  tool: {
    search: "Buscar algoritmo…",
    stepOf: "Passo {n} de {t}",
    back: "Voltar",
    yes: "SIM", no: "NÃO",
    rule: "Regra prática",
    fav: "Marcar como favorito",
    emptyTitle: "Sem resultados",
    emptyText: "Tente «Björck», «antibióticos» ou «NEXUS».",
    presentOf: "{n} de {t} presentes",
    seeResult: "Ver resultado",
    nonePresent: "Nenhum critério presente",
    bjorckSub: "Os 9 graus de uma vez, sem percorrer a árvore",
    bjorckLede: "Os nove graus com sua conduta. Toque em um para ver os passos.",
    steps: "{n} passos", step1: "1 passo",
    directLookup: "Consulta direta",
    conduct: "Conduta",
    conductNote: "Deixar o abdome aberto e fechá-lo são duas condutas igualmente válidas. Esta tela reflete a que corresponde aos achados que você indicou — não é uma resposta certa nem errada.",
    trace: "Rastreabilidade",
    ref: "Referência:",
    another: "Outro algoritmo"
  },

  kit: {
    coverTitle: "O que você precisa decidir?",
    coverSub: "Escolha uma ferramenta e eu te acompanho passo a passo.",
    offline: "Pronto para usar sem conexão",
    continueCase: "Continuar caso",
    noCase: "Sem caso aberto. O que você calcular pode ficar salvo em um.",
    favorites: "Favoritos",
    yourTools: "Suas ferramentas",
    disclaimer: "Apoio à decisão clínica — não substitui o julgamento cirúrgico.",
    feedback: "Dê sua opinião"
  },

  tools: [
    { id:"abdomen", href:"../abdomen/", chip:"logo-miaa.png", tile:"#e7f4f7",
      title:"Abdome Aberto — MIAA",
      desc:"5 algoritmos: quando deixá-lo aberto, Björck, antibióticos, nutrição e HIA/SCA." },
    { id:"aast", href:"../aast/", chip:"logo-dqt.png", tile:"#eef1f7",
      title:"Escalas AAST de lesões",
      desc:"32 órgãos em 6 regiões, com grau, ICD-9 e AIS. Busque e leia no centro cirúrgico." },
    { id:"mip", href:"../mip/", chip:"logo-mip.png", tile:"#fdecea",
      title:"MIP — Politraumatizado",
      desc:"Abordagem primária ABCDE: espinal, NEXUS e via aérea." },
    { id:"teg", href:"../teg/", mono:"TEG", tile:"#E02826",
      title:"TEG6s — Tromboelastografia",
      desc:"8 valores do painel → interpretação de 4 componentes com hemoderivados e TXA." },
    { id:"calc", href:"../calculadoras/", mono:"16", tile:"#00205C",
      title:"Calculadoras médicas",
      desc:"16 calculadoras em 5 áreas: Glasgow, Choque, Parkland, qSOFA e mais." }
  ],

  casos: {
    title: "Seus casos",
    lede: "Os cálculos ficam agrupados por paciente, só no seu telefone e sem identificadores.",
    emptyTitle: "Ainda não há casos",
    emptyText: "Quando você salvar o resultado de uma ferramenta, ele aparecerá aqui agrupado por paciente."
  },

  guias: {
    title: "Material dos cursos",
    lede: "Consulta rápida do material dos cursos. Sem fluxo: apenas referência.",
    emptyTitle: "Em preparação",
    emptyText: "A equipe docente está redigindo estas fichas de consulta. Chegarão em uma próxima atualização."
  },

  perfil: {
    title: "Seu perfil",
    promise: "Anônimo. Nos diz quais ferramentas construir, nunca quem você é.",
    detail: "Nunca pedimos nome, e-mail nem identificador. Estes três dados são usados de forma agregada, para decidir o que construir. <b>Seus casos clínicos não saem deste telefone.</b>",
    specialty: "Especialidade",
    country: "País",
    countryRow: "País de atuação",
    unset: "Não definido",
    channel: "Como você nos conheceu",
    channelRow: "Canal",
    channelNote: "É a única forma que temos de saber qual canal funciona.",
    language: "Idioma",
    offline: "Disponibilidade offline",
    offlineCount: "5 de 5 ferramentas",
    offlineState: "Baixadas",
    offlineNote: "Funcionam sem conexão. Os cálculos sincronizam ao recuperar a rede.",
    courses: "Cursos EduTrauma",
    footer: "© 2026 EduTrauma® — Ensinando a salvar vidas."
  },

  countrySheet: {
    title: "País",
    cancel: "Cancelar",
    search: "Buscar país…",
    frequent: "Frequentes",
    az: "A – Z",
    results: "Resultados",
    emptyTitle: "Sem resultados",
    emptyText: "Se o seu país não aparecer, escolha «Outro»."
  },
  channelSheet: {
    title: "Como você nos conheceu?",
    sub: "Anônimo. Nos diz qual canal funciona."
  },
  channels: {
    correo:"E-mail EduTrauma", instagram:"Instagram", whatsapp:"WhatsApp",
    linkedin:"LinkedIn", amigo:"Um amigo / colega", otro:"Outro"
  },
  courses: [
    { logo:"logo-dqt.png",  name:"DQT",  full:"Destrezas Cirúrgicas em Trauma" },
    { logo:"logo-mip.png",  name:"MIP",  full:"Manejo Integral do Politraumatizado" },
    { logo:"logo-miaa.png", name:"MIAA", full:"Manejo Integral do Abdome Aberto" }
  ],
  toast: { country:"País atualizado: {v}", channel:"Obrigado — nos ajuda a saber qual canal funciona" }
}

};
