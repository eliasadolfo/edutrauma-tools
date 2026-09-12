# Prompts para Claude Design — continuación del rediseño móvil

Contexto: el handoff `design_handoff_mobile_app` rediseñó el hub y MIP.
Faltan las otras 4 herramientas y completar el Perfil.

Pégalos **en la misma conversación donde salió el primer paquete** (la titulada
"Edutrauma mobile app design"): ya tiene el contexto, los tokens y las decisiones
tomadas, así que no hay que volver a explicárselo ni adjuntar nada.

Uno a la vez, y espera el paquete antes de pedir el siguiente. Empieza por el 1,
que es el grande.

Si por lo que sea tienes que empezar en una conversación nueva, adjunta ahí el
paquete anterior (`design_handoff_mobile_app`) para que mantenga la coherencia.

---

## PROMPT 1 — Rediseñar las 4 herramientas restantes

```
Continúa el rediseño móvil de EduTrauma Tools (tools.edutrauma.net, repo
eliasadolfo/edutrauma-tools). Te adjunto el handoff anterior: mantén EXACTAMENTE
sus tokens, tipografía, espaciado, navegación por pestañas, transiciones y
gramática de interfaz. No reinventes el sistema: extiéndelo.

En ese handoff solo MIP quedó rediseñado a fondo; las otras cuatro herramientas
aparecen como fichas que dicen "aún no rediseñada". Eso no se puede publicar:
hoy las cinco funcionan en producción. Necesito las cuatro al mismo nivel de
profundidad que MIP, reusando los mismos patrones (pregunta con barra de
progreso, tarjeta de resultado con nivel y trazabilidad, guardado en caso,
grupos de lista inset, hoja modal de ayuda).

Las cuatro tienen formas de interacción DISTINTAS entre sí. No fuerces el patrón
de árbol de decisión donde no corresponde — esa es la parte difícil de este
encargo y donde quiero que pienses.

────────────────────────────────────────
1. MIAA — Abdomen Abierto  (contenedor de 5 algoritmos, curso MIAA)
────────────────────────────────────────
Es un contenedor, igual que MIP: una lista de algoritmos y dentro de cada uno un
árbol de decisión. Los cinco:

  1. ¿Dejar el abdomen abierto o cerrado? — árbol; el resultado desemboca en la
     clasificación de Björck y enlaza al algoritmo 2.
  2. Conducta según grado de Björck — árbol.
  3. Antibióticos en abdomen abierto — árbol.
  4. Nutrición en abdomen abierto — árbol.
  5. Manejo de hipertensión intraabdominal (HIA) / síndrome compartimental (SCA)
     — árbol.

REGLA DURA, aprendida de los usuarios: los resultados "dejar abierto" y "dejar
cerrado" son DOS CONDUCTAS VÁLIDAS, no una respuesta correcta y una errada. Nunca
las pintes en verde/rojo ni las acompañes de ✓/✗. Rojo, ámbar y verde quedan
reservados para GRAVEDAD CLÍNICA (nivel del resultado). Para conductas usa navy
neutro con un icono descriptivo de la acción. Dos usuarios reportaron esta
confusión en la encuesta; es el error de diseño que más nos costó.

Björck necesita tratamiento visual propio: es una clasificación de grados (1A,
1B, 1C, 2A…4) y el usuario la consulta tanto como la calcula. Propón cómo verla
de un vistazo sin recorrer el árbol.

────────────────────────────────────────
2. Escalas AAST de lesiones  (curso DQT)
────────────────────────────────────────
NO es un flujo: es una obra de consulta que se usa de pie en pabellón, con
guantes, buscando rápido. 32 órganos en 6 regiones (Cuello, Tórax, Abdomen,
Retroperitoneo y vía urinaria, Aparato reproductor, Vascular periférico). Cada
órgano tiene ítems agrupados por grado (I–V; el corazón llega a VI), y cada ítem
lleva descripción, código ICD-9 y rango AIS.

Hay dos modos de órgano: "typed" (lesión descrita por grado) y "vessel" (lista de
vasos, cada uno con su grado). Algunos órganos admiten un ajuste de grado
(p. ej. lesiones múltiples).

Diseña para: buscar un órgano en menos de 3 segundos, leer el grado a un brazo de
distancia, y volver atrás sin perder el sitio. El buscador es la pieza central,
no un accesorio. Piensa también en el caso "ya sé el órgano, quiero comparar
grados" — la tabla de grados debe leerse completa, no de a un grado por pantalla.

Dos ítems están marcados internamente como "verificar contra el documento
fuente". Dales un tratamiento visual de advertencia discreta, no de error.

────────────────────────────────────────
3. TEG6s — Tromboelastografía  (curso DQT)
────────────────────────────────────────
Es un FORMULARIO que produce una interpretación. El usuario copia números desde
la pantalla del equipo TEG6s mientras el paciente sangra: velocidad y cero
errores de tipeo son todo.

Entradas (8):
  · ¿Hay heparina? (sí/no)
  · CK · R (min)         · CKH · R (min) — solo si hay heparina
  · CRT · A10 (mm)       · CRT · MA (mm)
  · CFF · A10 (mm)       · CFF · MA (mm)
  · CRT · LY30 (%)

Salida: interpretación en cuatro componentes — factores de coagulación, función
plaquetaria, fibrinógeno y fibrinólisis — cada uno con su estado y su sugerencia
de hemoderivado; más alertas (efecto heparina, hiperfibrinólisis → TXA).

Requisitos de entrada que ya nos costaron un bug en producción:
  · Los números vienen con COMA decimal en Latinoamérica ("4,6"). El campo debe
    aceptar coma y punto indistintamente. Diseña el teclado numérico decimal.
  · Cada campo tiene un rango plausible; fuera de rango se avisa sin bloquear.
  · Debe poder llenarse de arriba abajo sin levantar el pulgar.

Diseña el resultado como un PANEL que se lee de un vistazo (cuatro componentes a
la vez), no como una tarjeta única de un solo veredicto. Y un modo de corregir un
valor sin rehacer el formulario entero.

────────────────────────────────────────
4. Calculadoras médicas
────────────────────────────────────────
16 calculadoras agrupadas en 5 áreas: Trauma, Urgencias, Medicina general,
Cardiología, Salud mental.

  Trauma/Urgencias: Escala de Coma de Glasgow · Índice de Shock · Fórmula de
  Parkland · qSOFA · CURB-65
  General: IMC · Presión Arterial Media · Depuración de creatinina
  (Cockcroft-Gault) · Calcio corregido por albúmina · Superficie corporal
  (Mosteller) · Peso ideal (Devine) · Anion Gap
  Cardiología: CHA₂DS₂-VASc · HAS-BLED
  Salud mental: PHQ-9 · GAD-7

Tipos de campo que existen hoy: número con unidad, selector segmentado, y toggle
sí/no (los scores tipo CHA₂DS₂-VASc son una lista de toggles).

Aquí el reto es la ESCALA: 16 herramientas no caben en una lista plana cómoda.
Propón cómo llegar a la calculadora correcta rápido — favoritos, recientes,
búsqueda, agrupación por área. Y un patrón de resultado común: número grande +
interpretación + rango de referencia + referencia bibliográfica.

Mismo bug de la coma decimal: aplica a las 16.

Aviso: esta es la ÚNICA herramienta que hoy está solo en español — no tiene
archivo de traducción, así que un usuario en portugués ve las 16 calculadoras
en español. Vamos a traducirla, así que diseña contando con los tres idiomas
desde el principio (los nombres de las calculadoras y sus unidades son los que
más crecen al traducirse).

────────────────────────────────────────
REQUISITOS TRANSVERSALES (aplican a las cuatro)
────────────────────────────────────────
· Trilingüe es/en/pt. Todo texto de interfaz debe tener cabida en los tres
  idiomas — el alemán no nos preocupa, pero el portugués es ~20% más largo que
  el español. No diseñes cajas que revienten.
· Funciona sin conexión. Nada de estados que dependan de red.
· Cada resultado debe poder guardarse en el "caso" activo, como en MIP.
· Cada resultado lleva su referencia bibliográfica visible.
· Descargo legal en el pie: herramienta de apoyo, no reemplaza el juicio médico.
· Respeta prefers-reduced-motion.

ENTREGA
Mismo formato que el handoff anterior: README con tokens y especificación
pantalla por pantalla, prototipo HTML navegable, y screenshots. Importante:
al capturar los screenshots, cierra la hoja de encuesta — en el paquete anterior
tapó tres capturas y quedaron inservibles como referencia.
```

---

## PROMPT 2 — Completar el Perfil (país y origen)

```
En el handoff de EduTrauma Tools que te adjunto, la pantalla de Perfil tiene
ESPECIALIDAD, IDIOMA, DISPONIBILIDAD OFFLINE y CURSOS. Faltan dos campos que la
app ya recoge en producción y de los que dependen nuestras decisiones de
producto. Rediséñala incluyéndolos, con la misma gramática.

1) PAÍS — obligatorio.
   Lista actual (18 opciones): Chile, México, Colombia, Argentina, Perú,
   Ecuador, Bolivia, Uruguay, Paraguay, Venezuela, Brasil, Panamá, Costa Rica,
   Guatemala, República Dominicana, España, Estados Unidos, Otro.
   Hoy tenemos usuarios en 25 países, así que la lista crecerá: diseña el
   selector para ~30 opciones, no para 7. Un grupo de lista con 18 filas es
   demasiado largo; propón el patrón iOS correcto (hoja de selección con
   búsqueda, o picker), no una lista suelta en la pantalla.

2) ¿CÓMO NOS CONOCISTE? — obligatorio, se pregunta UNA sola vez.
   Opciones: Correo EduTrauma · Instagram · WhatsApp · LinkedIn ·
   Un amigo / colega · Otro.
   Es la única forma que tenemos de saber qué canal de distribución funciona.

PRIMER ARRANQUE
Hoy, al abrir la app por primera vez, aparece una hoja modal OBLIGATORIA que
pregunta especialidad y país, y luego el origen. No se puede omitir. Diseña ese
primer arranque como parte del encargo: es la primera impresión de la app y hoy
es lo más feo que tenemos. Debe sentirse como una bienvenida de 15 segundos, no
como un formulario de registro. Tres datos, sin cuenta, sin correo, sin
contraseña — y dejar clarísimo que es anónimo.

Después del primer arranque, los tres campos se editan desde Perfil.

CORRECCIÓN DE DATO
La lista de especialidades del handoff tiene 7 opciones y coincide con la del
hub, pero hay una segunda lista en el código con 9 (añade "Medicina interna" y
"Medicina general"). Diseña sobre la de 7; yo unifico el código.

PRIVACIDAD — no lo suavices, es nuestra promesa
Nunca pedimos nombre, correo ni identificador. Los tres datos son anónimos y
agregados. Los casos clínicos NO salen del teléfono. El copy del Perfil debe
decirlo de frente: "Anónimo. Nos dice qué herramientas construir, nunca quién
eres."

ENTREGA
Perfil rediseñado + flujo de primer arranque, en el mismo formato del handoff
anterior (README + prototipo HTML + screenshots).
```

---

## Nota sobre el prompt 3 (la cinta)

No hace falta pedírselo al diseñador. La cinta ya decía "EduTrauma Tools" en el
handoff; lo que faltaba era alinear el código. Hecho el 2026-09-11: las 5 tools,
el hub, `DESIGN.md` y el CSS. Al ser nombre propio se dejó de traducir
(antes: "Clinical Tools" / "Ferramentas Clínicas"). Auditoría 59/59 OK.
