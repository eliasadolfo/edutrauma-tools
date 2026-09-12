/* Algoritmos MIP — portados verbatim de mip/index.html (rama main).
   Los tres del abordaje primario (A): vía aérea, restricción del movimiento
   espinal y criterios NEXUS. No reinterpretar: cualquier cambio clínico debe
   venir del repo o del equipo docente.

   Los textos van en español canónico; mip-trans.js los traduce en pantalla. */
window.MIP_ALGOS = [
  /* ---- Restricción del movimiento espinal (collarín) ---- */
  {
    id:'espinal', region:'Control de columna cervical (A)',
    name:'Restricción del movimiento espinal',
    short:'Collarín cervical: colocar, mantener o retirar según el mecanismo.',
    kw:['collarin','collar','columna','cervical','espinal','inmovilizacion','penetrante','cerrado','restriccion'],
    ref:'Algoritmo MIP — Restricción del movimiento espinal (Dr. Pablo Ottolino, curso MIP, 2026)',
    validado:true,
    type:'tree', start:'mecanismo',
    nodes:{
      mecanismo:{ q:'¿Cuál fue el mecanismo de trauma?', opts:[
        { label:'Penetrante', sub:'Arma blanca, proyectil', set:{mech:'pen'}, next:'collar' },
        { label:'Cerrado (contuso)', sub:'Caída, colisión, aplastamiento', set:{mech:'cer'}, next:null }
      ]},
      collar:{ q:'¿El paciente YA trae el collarín puesto?',
        help:'De esto depende si la conducta se enuncia como «colocar / mantener» o como «retirar / no colocar». La lógica es la misma.',
        opts:[
          { label:'Sí, ya lo trae', set:{collar:'trae'}, next:'zona' },
          { label:'No lo trae', set:{collar:'no'}, next:'zona' }
        ]},
      zona:{ q:'¿Dónde está la herida penetrante?', opts:[
        { label:'Cuello', set:{}, next:'lesion' },
        { label:'Cráneo / Torso / Extremidades', set:{base:'liberar'}, next:null }
      ]},
      lesion:{ q:'Abra la parte frontal del collarín y examine la herida. ¿Hay signos de lesión medular?',
        help:'Déficit motor o sensitivo, o dolor/deformidad en la línea media cervical.',
        opts:[
          { label:'Sí, hay lesión medular', set:{base:'inmov'}, next:null },
          { label:'No hay lesión medular', set:{base:'liberar'}, next:null }
        ]}
    },
    resolve(ctx){
      if(ctx.mech==='cer'){
        return { level:'ok', title:'Mantener el collarín',
          detail:'Mecanismo cerrado: dedíquese a las lesiones potencialmente mortales y espere a la evaluación secundaria.',
          warn:'Pendiente para la 2ª valoración: aplique los criterios NEXUS para decidir si la columna puede liberarse.',
          goto:{ id:'nexus', label:'Aplicar criterios NEXUS ›' } };
      }
      const inmov = ctx.base==='inmov';
      const trae = ctx.collar==='trae';
      if(inmov){
        return trae
          ? { level:'ok', title:'Mantener el collarín', detail:'Herida penetrante en cuello con signos de lesión medular: la columna debe permanecer inmovilizada.' }
          : { level:'ok', title:'Colocar el collarín', detail:'Herida penetrante en cuello con signos de lesión medular: inmovilice la columna cervical.' };
      }
      return trae
        ? { level:'info', title:'Retirar el collarín', detail:'Sin indicación de inmovilización por este mecanismo: el collarín puede retirarse.' }
        : { level:'info', title:'No colocar el collarín', detail:'Sin indicación de inmovilización por este mecanismo: no es necesario colocar collarín.' };
    }
  },

  /* ---- Criterios NEXUS ---- */
  {
    id:'nexus', region:'Control de columna cervical (A)',
    name:'Criterios NEXUS',
    short:'¿Se puede liberar la columna cervical? 5 criterios.',
    kw:['nexus','columna','cervical','liberar','criterios','inmovilizacion','collar'],
    ref:'NEXUS — Hoffman et al., NEJM 2000 · valoración secundaria, curso MIP',
    validado:true,
    type:'checklist',
    intro:'Marque los criterios PRESENTES en el paciente. La columna solo se libera si NINGUNO está presente.',
    criteria:[
      { id:'dolor', label:'Dolor en la línea media cervical' },
      { id:'deficit', label:'Déficit neurológico focal' },
      { id:'alerta', label:'Estado de alerta anormal (GCS < 14)' },
      { id:'intox', label:'Intoxicación' },
      { id:'distr', label:'Lesión distractora' }
    ],
    resolve(n){
      if(n>=1) return { level:'ok', title:'Mantener / colocar la inmovilización cervical',
        detail:tr('{n} de 5 criterios presentes. Con al menos uno positivo, la columna NO puede liberarse; mantenga la inmovilización.').replace('{n}', n) };
      return { level:'info', title:'Se puede liberar el collarín',
        detail:'0 de 5 criterios presentes: ningún criterio positivo, la columna cervical puede liberarse.' };
    }
  },

  /* ---- Evaluación de vía aérea (respuesta verbal) — POR VALIDAR ---- */
  {
    id:'viaaerea', region:'Vía aérea (A)',
    name:'Evaluación de vía aérea (respuesta verbal)',
    short:'Permeable, obstruida o en riesgo, según la respuesta verbal.',
    kw:['via aerea','airway','respuesta verbal','permeable','obstruida','proteger','voz','a'],
    ref:'Algoritmo MIP — Evaluación 1, Secuencia de Respuesta Verbal (curso MIP, 2026)',
    validado:true,
    type:'tree', start:'verbal',
    nodes:{
      verbal:{ q:'¿El paciente emite respuesta verbal?', opts:[
        { label:'Sí, responde', set:{}, next:'calidad' },
        { label:'No responde', set:{}, next:'obstr' }
      ]},
      calidad:{ q:'Calidad de la respuesta:', opts:[
        { label:'Coherente', set:{}, next:'voz' },
        { label:'Incoherente', set:{}, next:'neuro' }
      ]},
      voz:{ q:'Características de la voz: ¿hay alteración?',
        help:'Disfonía, estridor, voz «apagada» o gorgoteo sugieren lesión de la vía aérea.',
        opts:[
          { label:'Sí, voz alterada', set:{out:'lesionada'}, next:null },
          { label:'No, voz normal', set:{out:'permeable'}, next:null }
        ]},
      neuro:{ q:'¿Hay compromiso neurológico?', opts:[
        { label:'Sí', set:{out:'proteger'}, next:null },
        { label:'No', set:{}, next:'obstr' }
      ]},
      obstr:{ q:'¿Hay obstrucción mecánica de la vía aérea?',
        help:'Cuerpo extraño, sangre, secreciones, edema o compresión.',
        opts:[
          { label:'Sí', set:{out:'obstruida'}, next:null },
          { label:'No', set:{out:'permeable'}, next:null }
        ]}
    },
    resolve(ctx){
      switch(ctx.out){
        case 'permeable': return { level:'ok', title:'Vía aérea permeable', detail:'La vía aérea está permeable en este momento. Continúe con el abordaje primario (B).' };
        case 'lesionada': return { level:'warn', title:'Vía aérea permeable, pero LESIONADA', detail:'Permeable ahora, pero con signos de lesión.', warn:'⚠ Puede evolucionar a obstrucción de la vía aérea asociada a la lesión. REEVALÚE de forma periódica durante la reanimación.' };
        case 'proteger': return { level:'alert', title:'¡PROTEGER LA VÍA AÉREA!', detail:'Respuesta incoherente con compromiso neurológico: la vía aérea está en riesgo. Asegúrela de inmediato.' };
        case 'obstruida': return { level:'alert', title:'Vía aérea OBSTRUIDA', detail:'Obstrucción mecánica presente: intervención inmediata de la vía aérea.' };
        default: return { level:'info', title:'Sin resultado', detail:'Revise las respuestas.' };
      }
    }
  }
];
