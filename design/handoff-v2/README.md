# Handoff v2: EduTrauma Tools — app móvil, las 5 herramientas

## Overview
Rediseño de **tools.edutrauma.net** (repo `eliasadolfo/edutrauma-tools`) como app móvil en español con gramática de interfaz iOS. Reorganiza las **cinco** herramientas de producción bajo una navegación por pestañas y añade tres capas de producto nuevas: **Casos** (registro de cálculos por paciente), **Guías** (consulta del material de los cursos) y **Perfil** (especialidad, idioma, estado offline, cursos).

**Qué cambia respecto al handoff v2.0:** el **Perfil** incorpora los dos campos que la app ya recoge en producción — **país** (obligatorio, selector diseñado para ~30 opciones) y **cómo nos conociste** (obligatorio, una sola vez) — y se añade el **flujo de primer arranque** que los pide, rediseñado como bienvenida de tres toques. Ver §17 y §18.

**Qué cambió respecto al handoff v1:** en v1 solo MIP estaba rediseñado a fondo y las otras cuatro herramientas aparecían como fichas de "aún no rediseñada". Esta versión lleva las cuatro al mismo nivel de profundidad — **MIAA**, **Escalas AAST**, **TEG6s** y **Calculadoras** — cada una con el modelo de interacción que le corresponde, no con el patrón de árbol forzado. Todo lo demás (tokens, navegación, transiciones, encuesta, Casos/Guías/Perfil) se mantiene **exactamente** como en v1.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** — prototipos que muestran el aspecto y el comportamiento buscados, **no código de producción para copiar tal cual**. La tarea es **recrear estos diseños en el entorno del codebase destino** (PWA sobre el stack actual del repo, o nativo: Swift/SwiftUI, Kotlin/Compose, React Native) usando sus patrones y librerías establecidas.

El repo actual es una **PWA de HTML/CSS/JS estático sin build step**, con un sistema propio en `design/edutrauma-ui.css`. Si la app se implementa como PWA, el camino natural es extender ese CSS. Si se implementa nativa, tradúzcanse los valores de este documento a los primitivos de la plataforma.

`EduTrauma Tools App.dc.html` se abre directamente en un navegador (necesita `support.js`, `ios-frame.jsx`, `et-data.js`, `aast-data.js` y los cuatro PNG de logo en la misma carpeta). El marco de iPhone es solo andamiaje de presentación: **no forma parte del diseño**.

## Fidelity
**Alta fidelidad.** Colores, tipografía, espaciado, transiciones y copys son definitivos y deben reproducirse con exactitud.

**La lógica clínica es definitiva y está portada verbatim del repo** — no reinterpretar, no reescribir de memoria:
- `et-data.js` — los 5 algoritmos MIAA (de `abdomen/index.html`), los campos y `computeTEG` de TEG6s (de `teg/index.html`), las 16 calculadoras con sus `compute()` (de `calculadoras/index.html`).
- `aast-data.js` — el dataset AAST completo: 32 órganos en 6 regiones con sus ítems, grados, ICD-9 y AIS, extraído del `const DB` de `aast/index.html`.
- Los 3 algoritmos MIP viven en la clase lógica del prototipo (de `mip/index.html`).

Cualquier cambio clínico debe venir del repo o del equipo docente, nunca del diseño.

---

## Design Tokens

Todos provienen de `design/edutrauma-ui.css` (incluido en `reference/`). El sistema institucional EduTrauma (Poppins, `#06205C`, `#E2201B`) **no** gobierna aquí: decisión explícita del cliente de mantener los tokens del repo de tools.

### Color
| Token | Hex | Uso |
|---|---|---|
| Navy institucional | `#00205C` | Franja de marca, texto principal, botones primarios, panel de portada, **conductas válidas** |
| Navy oscuro | `#001845` | Cinta de producto, barra condensada, barra de grado AAST |
| Navy claro | `#062b6f` | Extremo inferior del degradado del panel |
| Rojo EduTrauma | `#E02826` | Cinta superior de 2px, icono de caso, favoritos, nivel crítico, botón Guardar de la barra AAST |
| Teal enlace | `#16829e` | Enlaces, acciones secundarias, botón atrás, badges de área |
| Gris azulado | `#5b6b8c` | Texto secundario, encabezados de sección, iconos inactivos |
| Fondo app | `#f2f4f9` | Fondo de todas las pantallas |
| Superficie | `#ffffff` | Tarjetas y filas de lista |
| Verde éxito | `#1F7A5C` | Resultado seguro, switches activos, estado offline |
| Verde brillante | `#4ad196` | Punto de estado sobre azul |
| Ámbar aviso | `#c99a12` | Resultado de precaución, punto de advertencia discreta |
| Ámbar texto | `#7a5b13` | Texto sobre fondo ámbar |
| Separador | `rgba(0,32,92,.1)` | Líneas de 0.5px entre filas |
| Fila presionada | `rgba(0,32,92,.055)` | Realce al tocar una fila de lista |
| Fila seleccionada | `#eef4fb` | Fila de lesión AAST activa |
| Tab inactivo | `rgba(0,32,92,.38)` | Iconos de la tab bar sin seleccionar |

**Fondos suaves por nivel**: éxito `#e9f6f1` · aviso `#fff8ec` · crítico `#fdecea` · informativo/conducta `#eef1f7`.

**Tiles de herramienta** (Kit): MIAA `#e7f4f7` · AAST `#eef1f7` · MIP `#fdecea` · TEG6s `#E02826` (monograma blanco) · Calculadoras `#00205C` (monograma blanco).

**Chips de grado Björck**: grados 1–2 `#00205C` · grado 3 `#c99a12` · grado 4 `#E02826`, siempre con texto blanco.

### Semántica del color — regla dura
**Verde, ámbar y rojo están reservados para GRAVEDAD CLÍNICA** (el `level` del resultado: `ok` / `warn` / `alert`).

Las **conductas válidas** — señaladamente "dejar el abdomen abierto" vs "cerrar" — usan un nivel aparte, `conduct`, que se pinta en **navy neutro `#00205C`** con un icono descriptivo de la acción (nodos de bifurcación, no un pulso clínico), eyebrow "CONDUCTA" en lugar del nombre del algoritmo, y un recuadro neutro con el texto:

> Dejar el abdomen abierto y cerrarlo son dos conductas igualmente válidas. Esta pantalla refleja la que corresponde a los hallazgos que indicaste — no es una respuesta correcta ni incorrecta.

**Nunca** ✓/✗, nunca verde/rojo, nunca un icono de acierto o error para una conducta. Dos usuarios reportaron esta confusión en la encuesta; es el error de diseño más costoso del producto y la implementación debe preservar la distinción a nivel de tipo de dato, no de estilo suelto.

### Tipografía
Fuente del sistema (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`). `letter-spacing: -0.01em` global.

| Rol | Tamaño / peso / interlineado | Tracking |
|---|---|---|
| Número de resultado (calculadoras) | 56px / 800 / 1 | −0.04em |
| Título de portada (panel azul) | 31px / 800 / 36px | −0.035em |
| Título de pantalla raíz | 30px / 800 / 36px | −0.03em |
| SÍ / NO (MIAA decisión) | 24px / 800 | +0.04em |
| Grado AAST (badge de fila) | 22px / 800 | −0.02em |
| Título de pregunta | 26px / 800 / 1.22 | −0.03em |
| Título de resultado | 24px / 800 / 1.22 | −0.03em |
| Valor numérico de campo | 22px / 700, alineado a la derecha | — |
| Título de hoja modal | 22px / 800 / 1.25 | −0.03em |
| Buscador AAST | 19px / 600 | — |
| Buscador de calculadoras | 18px / 600 | — |
| Título de nav bar | 17px / 600 | — |
| Fila de lista (principal) | 17px / 600 / 1.25 | −0.02em |
| Opción de algoritmo | 18px / 600 / 1.3 | — |
| Ítem de lesión AAST | 16px / 500 / 1.4 | — |
| Etiqueta de campo | 16px / 400–700 / 1.35 | — |
| Cuerpo / descripción | 15px / 400 / 1.5 | — |
| Fila de lista (secundaria), meta | 12–13px / 400 / 1.4 | — |
| Encabezado de sección | 13px / 600, MAYÚSCULAS | — |
| Eyebrow | 11–12px / 700, MAYÚSCULAS | 0.1–0.22em |
| Cinta de producto | 0.58rem / 700, MAYÚSCULAS | 0.24em |
| Etiqueta de tab | 10px / 600 | — |

### Radios
Tarjetas y grupos de lista 14px · tarjeta de resultado 16px · botones SÍ/NO 16px · badge de grado AAST 11px · panel de portada `0 0 24px 24px` · hoja modal `20px 20px 0 0` · botones 13px · barra de grado AAST 12–13px · tiles de icono 10px · campos y segmented 10px · píldoras 999px.

### Sombras
Tarjeta / grupo de lista `0 6px 18px rgba(0,32,92,.07)` · tarjeta de resultado `0 10px 28px rgba(0,32,92,.1)` · buscador sticky `0 4px 14px rgba(0,32,92,.09)` · tile de icono `0 3px 8px rgba(0,32,92,.14)` · símbolo de resultado `0 4px 14px rgba(0,32,92,.16)` · hoja modal `0 -12px 40px rgba(0,32,92,.22)` · barra de grado AAST `0 -8px 26px rgba(0,32,92,.28)` · barra condensada `0 6px 16px rgba(0,24,69,.28)` · toast `0 12px 30px rgba(0,32,92,.32)` · pulgar de switch `0 2px 5px rgba(0,32,92,.28)` · segmento activo `0 1px 3px rgba(0,32,92,.18)`.

### Espaciado y tamaños táctiles
Margen lateral **16px** en todo. Padding de fila 12–13px vertical / 14px horizontal. Hueco entre secciones 18–22px. Padding inferior de scroll 26px. Altura de tab bar 46px + 26px de safe area. Nav bar 44px. Franja de marca `58px 16px 8px` (incluye status bar).

**Ningún objetivo táctil baja de 44px.** Chips de órgano AAST 58px de alto, filas de ajuste 56px, opciones de algoritmo 62px, botones SÍ/NO 78px, badge de grado 44×44, botones primarios 50–52px, píldoras de recientes 44px.

---

## Screens / Views

### Marco global (todas las pantallas)
1. **Franja de marca** — `#00205C`, padding `58px 16px 8px`. Logo `logo-blanco-trim.png` a 22px, a la izquierda. A la derecha, **solo dentro de una herramienta o su flujo**, un chip blanco (radio 8px, padding `3px 8px`) con el logo del curso a 24px: MIP → `logo-mip.png`, MIAA → `logo-miaa.png`, AAST y TEG6s → `logo-dqt.png`, Calculadoras → sin chip. En las cuatro pestañas raíz nunca hay chip.
2. **Cinta de producto** — `#001845`, borde superior `2px solid #E02826`, texto centrado **"EduTrauma Tools"** en `rgba(255,255,255,.78)`, 0.58rem/700, mayúsculas, tracking 0.24em, padding `5px 16px 6px`. *(Coincide con el repo: las cinco tools ya emiten "EduTrauma Tools" en `.brand-ribbon`.)*
3. **Nav bar** — *solo en pantallas empujadas*. 44px, `rgba(242,244,249,.9)` + `backdrop-filter: blur(18px)`, borde inferior `.5px solid rgba(0,32,92,.14)`. Izquierda: chevron 12×20 + etiqueta del destino en `#16829e` 17px (opacidad 0.4 al presionar). Centro: título absoluto 17px/600, 96px de padding lateral, elipsis.
4. **Área de scroll** — `flex:1; overflow:auto`.
5. **Tab bar** — `rgba(255,255,255,.86)` + `blur(22px)`, borde superior `.5px solid rgba(0,32,92,.16)`, padding `7px 6px 26px`. Cuatro pestañas: Kit, Casos, Guías, Perfil. Icono de 25px, stroke 1.7, + etiqueta 10px/600. Activo `#00205C`, inactivo `rgba(0,32,92,.38)`. **La pestaña Kit permanece activa en todas las pantallas de herramienta** (incluidos flujos, resultados y consultas).

**Reparto comunicacional** (decisión de diseño, respetar): franja = *quién* (marca y curso) · cinta = *qué es* (nombre del producto) · panel de portada = *qué hacer ahora* · barra condensada = *estado*. Ninguna repite a otra.

**Etiquetas de nav bar por pantalla**: Kit → (sin nav bar) · lista de herramienta → "‹ Kit" · Björck → "‹ MIAA" · órgano AAST → "‹ Órganos" · interpretación TEG → "‹ Valores" · calculadora → "‹ Calculadoras" · resultado de calculadora → "‹ Datos" · pregunta/resultado de algoritmo → "‹ Atrás" (o el nombre de la herramienta en el primer paso).

---

### 1. Kit (pestaña raíz)
Sin cambios respecto a v1, salvo las descripciones de las cinco herramientas.

**Barra condensada al hacer scroll.** Contenedor `position:sticky; top:0; height:0; z-index:6` antes del panel; dentro, barra de 42px en `#001845` centrada con punto verde `#4ad196` de 7px y "Listo para usar sin conexión" (14px/600). Revelada con animación ligada al scroll:
```css
animation: etBarIn linear both;
animation-timeline: scroll(nearest);
animation-range: 60px 130px;
```
En plataformas sin scroll-timeline, interpolar la opacidad entre 60px y 130px con un listener — no un salto binario.

**Panel de portada.** `border-radius: 0 0 24px 24px`, padding `20px 16px`, `linear-gradient(180deg, #001845 0%, #00205C 55%, #062b6f 100%)` (arranca en el color de la cinta para leerse como un solo bloque). Dos círculos decorativos con `overflow:hidden`: arriba-derecha (`top:-42px; right:-52px; 190px; border:26px solid rgba(255,255,255,.05); border-radius:999px`) y abajo-izquierda (`bottom:-70px; left:-40px; 150px; background:rgba(224,40,38,.14)`).
- Título **"¿Qué necesitas decidir?"** — 31px/800/36px, `#fff`, `text-wrap: balance`.
- Subtítulo **"Elige una herramienta y te acompaño paso a paso."** — 15px/1.45, `rgba(255,255,255,.72)`.
- Separador `1px` en `rgba(255,255,255,.15)`.
- **Con caso que tenga registros** → fila pulsable: tile rojo de 32px con icono de pulso, eyebrow "CONTINUAR CASO", nombre del caso (16px/600), contador y chevron.
- **Sin caso o caso vacío** → misma estructura no pulsable, tile `rgba(255,255,255,.12)` y texto "Sin caso abierto. Lo que calcules puede quedar guardado en uno."

**FAVORITOS.** Carrusel horizontal de tarjetas de 172px: estrella rellena `#E02826` de 19px, nombre del algoritmo (15px/600) y la herramienta de origen ("MIP" o "MIAA", 12px). Se oculta si no hay favoritos.

**TUS HERRAMIENTAS.** Grupo de lista inset; fila con tile de 38px (logo del curso a 28px, o monograma blanco 11px/800 para TEG6s y Calculadoras), título 17px/600, descripción 13px/1.4, chevron.

| Título | Descripción |
|---|---|
| Abdomen Abierto — MIAA | 5 algoritmos: cuándo dejarlo abierto, Björck, antibióticos, nutrición e HIA/SCA. |
| Escalas AAST de lesiones | 32 órganos en 6 regiones, con grado, ICD-9 y AIS. Busca y lee en pabellón. |
| MIP — Politraumatizado | Abordaje primario ABCDE: espinal, NEXUS y vía aérea. |
| TEG6s — Tromboelastografía | 8 valores del panel → interpretación de 4 componentes con hemoderivados y TXA. |
| Calculadoras médicas | 16 calculadoras en 5 áreas: Glasgow, Shock, Parkland, qSOFA y más. |

Bajo la lista: "Apoyo a la decisión clínica — no reemplazan el juicio quirúrgico." (12px). Al final, fila **"Danos tu opinión"** que abre la encuesta.

---

### 2. Lista de algoritmos — MIP y MIAA (misma pantalla)
MIP y MIAA son **contenedores de algoritmos** y comparten pantalla: descripción, buscador, y secciones de grupo como grupos de lista inset. Cada fila se divide en dos zonas táctiles — el cuerpo abre el algoritmo; un botón de 46px a la derecha alterna el favorito (estrella de 18px, stroke `#E02826`, rellena si activa).

**Agrupación:** MIP por región del ABCDE ("VÍA AÉREA (A)", "CONTROL DE COLUMNA CERVICAL (A)"). MIAA por fase: **"DECISIÓN EN PABELLÓN"** primero (el algoritmo de decisión), luego **"MANEJO EN CURSO"** (Björck, antibióticos, nutrición, HIA/SCA). El orden importa: primero se decide, después se maneja.

**Buscador:** campo `rgba(0,32,92,.07)` radio 10px, lupa de 15px, input 17px, con "Cancelar" en `#16829e` cuando hay texto. Busca sin distinguir acentos ni mayúsculas sobre nombre, descripción y grupo.

**MIAA añade, sobre las secciones, una tarjeta de acceso a la referencia de Björck:** botón navy de ancho completo, radio 14px, tile `rgba(255,255,255,.14)` con icono de tabla, título "Clasificación de Björck" (16px/700) y subtítulo "Los 9 grados de un vistazo, sin recorrer el árbol". Responde al hallazgo de que Björck se **consulta** tanto como se calcula.

Descripciones (de `menuAlgos` del repo): *¿Cuándo dejar el abdomen abierto?* — "Decisión en pabellón: 6 preguntas + grado de Björck." · *Conducta según grado de Björck* — "Del grado 1A al 4 (FEA): qué hacer, paso a paso." · *Antibióticos en abdomen abierto* — "Profilácticos vs empíricos, cultivos y descalamiento." · *Nutrición en abdomen abierto* — "NE temprana, NP y metas de proteínas y calorías." · *Manejo de HIA / SCA* — "Hipertensión intraabdominal y síndrome compartimental (WSACS)."

**Estado vacío del buscador**: lupa de 44px en `rgba(0,32,92,.25)`, "Sin resultados" (19px/700) y una sugerencia de término concreta.

---

### 3. MIAA — ¿Cuándo dejar el abdomen abierto? (6 preguntas SÍ/NO)
Interacción propia: **no** es una lista de opciones, son seis preguntas binarias que cualquier respuesta puede terminar. Diseñada para responderse con el pulgar, de pie en pabellón.

- Cabecera de progreso igual que en MIP: "Paso N de 6" + nombre del algoritmo, barra de 4px con relleno `linear-gradient(90deg, #00205C, #E02826)` y `transition: width .3s ease`. **El paso se cuenta por índice de pregunta, no por respuestas dadas** (importa al corregir hacia atrás).
- **Badge de categoría** — píldora `#e7f4f7` con icono de pulso y la categoría en `#16829e` 12px/700 mayúsculas: "FISIOLÓGICO", "ANATÓMICO" o "LOGÍSTICO". Le dice al cirujano en qué eje está decidiendo.
- Pregunta 26px/800, `text-wrap: pretty`.
- **SÍ / NO**: dos botones lado a lado, 78px de alto, radio 16px, 24px/800 con tracking +0.04em. SÍ navy relleno; NO blanco con borde `1.5px solid #00205C`. Al presionar: `scale(.955)` (+ `brightness(.9)` en el relleno).
- **Solo en el paso 1**, tarjeta "REGLA PRÁCTICA" con los tres criterios del repo, cada uno con punto rojo de 7px: *No puedo cerrar* — tensión, edema, pérdida de pared · *No debo cerrar* — fisiología grave / control de daños · *Necesito volver* — reoperación planificada o second look.
- El resultado es siempre de nivel `conduct` (ver Semántica del color).

Las seis preguntas y sus ramas están en `et-data.js` → `MIAA_DECISION.questions`, portadas de `abdomen/index.html`.

> **Pendiente de v2:** el repo encadena, tras la recomendación, una clasificación orientativa de Björck de 4 preguntas (`MIAA_BJORCK_Q` en `et-data.js`, con su advertencia de variabilidad interobservador). En este prototipo ese encadenamiento se sustituyó por la rejilla de consulta de Björck, que cubre el mismo contenido de forma directa. Si se quiere conservar además el flujo de 4 preguntas, reusar el patrón de árbol de MIP sin cambios.

### 4. MIAA — Rejilla de consulta de Björck
Los **9 grados en una sola pantalla**, sin recorrer ningún árbol. Cuatro bloques (Grado 1 a 4); cada bloque lleva su etiqueta (13px/700) y una descripción corta al lado (12px, `#5b6b8c`), y debajo sus celdas en una fila que envuelve (`flex: 1 1 44%`, mínimo 132px, 86px de alto).

Cada celda: chip de código (`1A`, `2C`, `4`…) de 26px de alto con el color del grado, el estado de la cavidad al lado (12px/600, `#5b6b8c`), el resumen de la conducta (13px/600) y el número de pasos (12px). Tocar una celda **salta directo a su conducta** en el algoritmo 2, con la trazabilidad marcada como "Consulta directa · grado 2C".

| Grado | Descripción | Celdas |
|---|---|---|
| 1 | Sin adherencia ni fijación de vísceras a la pared | 1A limpia (1 paso) · 1B contaminada (2) · 1C con fístula (3) |
| 2 | Con adherencia o fijación en desarrollo | 2A limpia (1) · 2B contaminada (2) · 2C con fístula (3) |
| 3 | Abdomen congelado (frozen) | 3A limpia (2) · 3B contaminada (3) |
| 4 | Fístula enteroatmosférica (FEA) | 4 (3) |

Al pie, la advertencia del repo en caja ámbar: grado orientativo, la clasificación definitiva —especialmente en el límite 2/3— requiere inspección directa y tiene variabilidad interobservador.

### 5. MIAA — Árboles de manejo (Björck, antibióticos, nutrición, HIA/SCA)
Usan **el mismo patrón de árbol que MIP sin ninguna modificación**: cabecera de progreso, pregunta, texto de ayuda opcional, y tarjetas de opción de 62px con subtexto y chevron.

La diferencia está en el resultado: estos algoritmos devuelven una **conducta por pasos**. La tarjeta de resultado añade, bajo el detalle, una lista numerada — cada paso en una fila `#eef1f7` radio 12px con un cuadro navy de 22px con el número y el texto en 14px/1.5. El prefijo "Paso N:" del dato original se elimina al renderizar, porque el cuadro ya numera.

---

### 6. Escalas AAST — buscador (obra de consulta, no flujo)
**El buscador es la pieza central, no un accesorio.** Va en un contenedor `position:sticky; top:0; z-index:6` con fondo `#f2f4f9`: tarjeta blanca radio 13px con sombra `0 4px 14px rgba(0,32,92,.09)`, lupa de 19px, input de **19px/600** (grande para leerse y escribirse con prisa) y un botón circular de borrado de 26px cuando hay texto. Busca por nombre de órgano y por región, sin distinguir acentos.

Debajo, las 6 regiones en el orden del repo — Cuello, Tórax, Abdomen, Retroperitoneo y vía urinaria, Aparato reproductor, Vascular periférico — cada una con sus órganos en una **rejilla de dos columnas** (`flex: 1 1 44%`, mínimo 140px, **58px de alto**): nombre 16px/600 y, a la derecha, el rango de grados del órgano ("I–V", "I–VI") en 11px/700 `#16829e`. Objetivo: llegar a cualquiera de los 32 órganos en menos de 3 segundos, con guantes.

### 7. Escalas AAST — tabla de grados de un órgano
**La tabla se lee completa, no un grado por pantalla** — es el requisito central del caso "ya sé el órgano, quiero comparar grados".

- Cabecera: región del órgano + "· hasta grado V/VI" (13px). El nombre lo lleva la nav bar.
- El contenido se agrupa según el modo del órgano:
  - **`typed`** (14 órganos: bazo, hígado, pulmón, páncreas, riñón, colon…) → un grupo de lista por **categoría de lesión** ("Hematoma", "Laceración", "Vascular"), con el título de la categoría como encabezado de sección.
  - **`flat`** (corazón, diafragma, útero, testículo…) → un grupo por grado, con encabezado "Grado III".
  - **`vessel`** (los 4 vasculares) → lista de vasos agrupados por grado.
- **Fila de lesión**: badge de grado de **44×44** con el numeral romano en **22px/800** (legible a un brazo de distancia), descripción 16px/1.4 y una línea meta 12px con "ICD-9 865.02/865.12 · AIS 3" (o "—" si la fuente no trae códigos). Tocar la fila la selecciona: fondo `#eef4fb`, badge invertido a navy relleno con numeral blanco, y check rojo de 17px a la derecha. Tocar de nuevo deselecciona.
- **Advertencia discreta, no error**: dos ítems del dataset vienen marcados `warn: true` (vascular cervical grado V y corazón grado VI). Se muestran con un punto ámbar de 6px y el texto "Descripción incompleta en la fuente — verificar contra el documento AAST original." en 12px `#7a5b13`, dentro de la misma fila. Sin caja roja, sin icono de error: el ítem sigue siendo consultable.
- **AJUSTES** — grupo de lista al final, filas de 56px con switch iOS (51×31). El ajuste depende del órgano: `multiple3` / `multiple_nocap` → "¿Lesiones múltiples?"; `bilateral3` / `bilateral5` → "¿Lesión bilateral?"; `vessel` → dos switches, "¿Lesiones múltiples grado III–IV con >50% de circunferencia?" (sube 1) y "¿Lesión grado IV–V con <25% de circunferencia?" (baja 1). Bajo cada pregunta, la regla en 12px ("Sube 1 grado (hasta grado III)"). Los órganos con `adjust: 'none'` no muestran la sección.
- **Barra de grado** — cuando hay una lesión seleccionada aparece una barra `position:absolute; bottom:79px` (justo sobre la tab bar) en `rgba(0,24,69,.96)` con blur: cuadro blanco de 50px con el numeral en 24px/800, eyebrow "GRADO AAST", nombre del órgano, la nota del ajuste aplicado en `#ffd9d8` si corresponde, y el botón **Guardar** en `#E02826` (44px de alto). El grado mostrado es el **ajustado**, calculado con topes: `upTo3` → máx. III, `upTo5` → máx. V, `up1` y vessel → `maxGrade` del órgano.
- Al pie, la referencia: "Gradación de lesiones de órganos — Moore et al. (AAST) · curso DQT, EduTrauma".

---

### 8. TEG6s — formulario
Un formulario que se llena **de arriba abajo sin levantar el pulgar**, mientras el paciente sangra.

- **HEPARINA** — tarjeta con la pregunta "¿El paciente recibió heparina?" (16px) y un segmented control No/Sí de 40px. Con "No", el campo `CKH · R` **desaparece** del formulario (7 campos en vez de 8); con "Sí", reaparece en su posición.
- **VALORES DEL PANEL** — una tarjeta por campo: a la izquierda el código del panel en 16px/700 (`CK · R`, `CRT · A10`, `CFF · MA`, `CRT · LY30`…) y debajo qué significa en 12px `#5b6b8c` ("Plaquetas — amplitud máxima"); a la derecha una cápsula `rgba(0,32,92,.06)` radio 10px con un input de 66px, **22px/700 alineado a la derecha**, y la unidad en 13px/600. Los códigos del panel a la izquierda permiten copiar mirando la pantalla del equipo sin leer prosa.
- **Teclado decimal**: `inputmode="decimal"`, `autocomplete="off"`, `type="text"`. **El parser acepta coma y punto indistintamente** (`String(v).trim().replace(/\s/g,'').replace(',', '.')` → `parseFloat`). Es un bug real corregido en el repo: `<input type="number">` devolvía vacío con el separador latinoamericano. No usar `type="number"`.
- **Fuera de rango avisa sin bloquear**: cada campo tiene su rango plausible (`CK · R` 0–30 min, amplitudes 0–100 mm, LY30 0–100 %). Fuera de él aparece, dentro de la tarjeta, una caja `#fff8ec` radio 9px con punto ámbar y "Valor fuera del rango habitual — revisa que no sea un error de digitación." El botón sigue habilitado.
- **CTA de estado**: con campos incompletos, `rgba(0,32,92,.3)` y la etiqueta "Completa los 7 valores" (el número se actualiza con la heparina); completo, navy y "Interpretar".
- Nota al pie: "Acepta coma o punto decimal. Ningún valor fuera de rango bloquea la interpretación."

### 9. TEG6s — panel de interpretación
**Un panel que se lee de un vistazo, no un veredicto único.**

- Eyebrow "INTERPRETACIÓN DEL PANEL".
- **Alertas primero** (solo si hubo heparina): tarjeta de ancho completo con el fondo suave del nivel, título 16px/800 en el color del nivel y texto 14px/1.5. Tres casos del repo: "Efecto de heparina presente" (alert, sugiere protamina), "Sin efecto de heparina" (ok), "Resultado inconsistente (N/A)" cuando CK-R < CKH-R (warn, revisar manualmente).
- **Cuatro componentes a la vez**, uno por tarjeta, en orden fijo: Factores de coagulación · Plaquetas · Fibrinógeno · Fibrinólisis. Cada tarjeta lleva un **riel de color de 5px** a la izquierda con el nivel, y dentro: nombre del componente en eyebrow 12px/700, píldora de estado a la derecha — **"NORMAL" / "VIGILAR" / "ACTUAR"** (11px/700, fondo suave del nivel) —, el hallazgo en 17px/700 en el color del nivel, los valores y sus rangos en 12px `#5b6b8c`, y la sugerencia de hemoderivado en 14px/1.5 separada por una línea de 0.5px. Los componentes normales no muestran sugerencia.
- Caja ámbar con el descargo de TEG del repo (las sugerencias deben confirmarse y contrastarse con el protocolo institucional; no son indicación terapéutica automática).
- Referencia completa en tarjeta aparte.
- **Corregir un valor sin rehacer el formulario**: botón secundario "Corregir un valor" (y "‹ Valores" en la nav bar) devuelve al formulario **con todos los valores intactos**. "Evaluar otro caso" es la acción destructiva, en texto plano teal, y sí limpia el formulario.

Umbrales y lógica: `computeTEG` en `et-data.js`, portada verbatim (incluida la constante `HEPARIN_MIN_DIFF = 0` y la regla de que MA prima sobre A10).

---

### 10. Calculadoras — 16 en 5 áreas
El reto es la escala. Tres caminos hasta la calculadora correcta:

1. **Buscador sticky** igual al de AAST (input 18px/600), que busca por nombre, área y palabras clave del repo (`kw`) — "choque" encuentra Índice de Shock, "fa" encuentra CHA₂DS₂-VASc.
2. **RECIENTES** — hasta 4 píldoras navy de 44px en carrusel horizontal, con el nombre corto. Se alimentan de los cálculos hechos (patrón `calc_recent` del repo) y se ocultan cuando hay filtro activo.
3. **Cinco áreas** como grupos de lista inset, en el orden del repo: Trauma, Urgencias, Medicina general, Cardiología, Salud mental. Cada fila: **nombre corto** en 17px/600 y, debajo, el **tipo de entrada** en 12px — "Entrada numérica", "Lista de sí/no", "Cuestionario 0–3", "Selección por categoría", "Mixto". Ese subtítulo dice cuánto va a costar llenarla antes de abrirla.

El nombre corto es lo que se lista; el nombre completo aparece en la pantalla de la calculadora. Es también la defensa para el trilingüe: los nombres largos ("Depuración de creatinina — Cockcroft-Gault") crecen ~20% en portugués y no caben en una fila de lista.

### 11. Calculadoras — formulario
- Cabecera: píldora de área `#e7f4f7` / `#16829e` (11px/700 mayúsculas) y el nombre completo en 13px `#5b6b8c`.
- En PHQ-9 y GAD-7, una caja `#e7f4f7` con la leyenda de frecuencia ("Durante las últimas 2 semanas… 0 = Para nada · 1 = Varios días · 2 = Más de la mitad de los días · 3 = Casi todos los días").
- Una tarjeta por campo, con cuatro tipos:
  - **Numérico** — etiqueta a la izquierda, cápsula con input de 66px (22px/700, `inputmode="decimal"`) y unidad. **Misma regla de coma decimal que TEG6s, en las 16.**
  - **Numérico con unidad** — añade debajo un segmented control de unidades (mg/dL ↔ µmol/L en creatinina), 36px de alto.
  - **Segmentado** — dos variantes: en línea para 2–3 opciones cortas (Hombre/Mujer, <65 / 65–74 / ≥75) sobre pista `rgba(0,32,92,.07)`; **apilado** para las opciones largas de Glasgow, con filas de 46px alineadas a la izquierda, fondo `rgba(0,32,92,.05)` y `inset 0 0 0 1.5px #00205C` en la activa. Los textos de Glasgow ("3 · Flexión anormal (decorticación)") no caben en línea en ningún idioma.
  - **Toggle sí/no** — etiqueta + switch iOS de 51×31. Los scores tipo CHA₂DS₂-VASc, HAS-BLED, qSOFA y CURB-65 son listas de toggles.
  - **Cuestionario 0–3** — enunciado del ítem en 15px y un segmented de cuatro botones de 42px con los dígitos en 17px.
- CTA con estado, igual que TEG6s: "Completa los datos" deshabilitado en gris, "Calcular" en navy. La validación respeta los `min`/`max` de cada campo. Los errores de coherencia (diastólica > sistólica, creatinina ≤ 0) se muestran como toast, no bloquean el formulario.

### 12. Calculadoras — resultado (patrón común)
Tarjeta blanca radio 16px con una **banda superior de 6px** del color del nivel, y centrado:
- Nombre corto en eyebrow 12px/700.
- **Número grande**: 56px/800, tracking −0.04em, en el color del nivel, con la unidad al lado en 17px/600 `#5b6b8c` ("12" + "/15", "24.2" + "kg/m²", "3400" + "mL / 24 h").
- **Píldora de interpretación**: 15px/700 sobre el fondo suave del nivel ("TEC moderado", "Riesgo alto", "Obesidad grado I").
- Detalle en 15px/1.55 — incluye el desglose cuando aplica ("O3 V4 M5. Nivel de conciencia; ≤8 define coma.") o el reparto de volumen en Parkland.
- **Alerta crítica** cuando el dato la exige: caja `#fdecea` con texto `#8f1714` 13px/600. Hoy solo PHQ-9 ítem 9 (ideación de muerte/autolesión → evaluar riesgo de suicidio de inmediato).
- Debajo, grupo de dos filas: **Fórmula** y **Referencia** bibliográfica, 13px.
- Acciones: Guardar en el caso · "Corregir datos" (vuelve al formulario con los valores intactos) · "Otra calculadora".

Las 16 calculadoras, sus campos y sus `compute()` están en `et-data.js` → `CALCS`, portadas verbatim.

---

### 13–16. Resultado de algoritmo, Casos, Guías, Perfil, Encuesta
Sin cambios funcionales respecto al handoff v1, con dos añadidos:

**Resultado de algoritmo** — ahora soporta (a) la **lista numerada de pasos** descrita en §5, (b) el nivel **`conduct`** con su icono, eyebrow y nota neutra descritos en Semántica del color, y (c) el botón secundario "Otro algoritmo" vuelve a **la herramienta de origen** (MIP o MIAA), no siempre a MIP. TRAZABILIDAD y Referencia se mantienen.

**Casos** — el registro es ahora **multiherramienta**. Cada entrada se prefija con su origen y resume distinto según el tipo:
| Origen | Título de la entrada | Trazabilidad |
|---|---|---|
| `MIP · Espinal` | el título de la conducta | las respuestas del árbol, separadas por " · " |
| `MIAA · Björck` | "Grado 2C · V.A.C.® → cirugía → cierre" | el recorrido, o "Consulta directa · grado 2C" |
| `AAST · Bazo` | "Grado III" | órgano · descripción de la lesión · nota del ajuste |
| `TEG6s` | "Plaquetas, Fibrinógeno alterados" (o "Panel sin alteraciones") | heparina + los 7–8 valores con sus unidades |
| `Glasgow (GCS)` | "12 /15 · TEC moderado" | cada campo con su valor o su sí/no |
El punto de color de la entrada usa el nivel; las conductas se guardan como `info` (navy), nunca como acierto/error.

**Encuesta** — el nombre de la herramienta en las preguntas se toma de la herramienta activa ("¿Qué tan útil te pareció MIAA?", "…las escalas AAST?", "…las calculadoras?"). Se sigue ofreciendo una sola vez por sesión, ~900 ms después del primer resultado, y nunca bloquea.

---

### 17. Perfil (rediseñado) — seis bloques
El Perfil es la única pantalla donde el usuario ve y edita lo que la app sabe de él. Son **tres datos, todos anónimos**, más preferencias y estado.

**Copy de cabecera — es la promesa, no se suaviza:**
- Título "Tu perfil" (30px/800).
- Bajada en **15px/600 `#00205C`** (no en gris secundario: es una promesa, tiene que leerse): **"Anónimo. Nos dice qué herramientas construir, nunca quién eres."**
- Párrafo de 13px `#5b6b8c`: "Nunca pedimos nombre, correo ni identificador. Estos tres datos se usan agregados, para decidir qué construir. **Tus casos clínicos no salen de este teléfono.**" — la última frase en `#00205C` negrita.

**Orden de los bloques** (de lo que más define al usuario a lo que menos):

1. **ESPECIALIDAD** — grupo de lista de **7 filas** con check rojo `#E02826` de 16px en la activa: Cirugía general · Cirugía de trauma · Residente de cirugía · Medicina de urgencia · Enfermería · Estudiante de medicina · Otra. Selección en sitio, sin hoja: siete opciones caben y el usuario cambia de rol pocas veces.
   > **Corrección de dato acordada:** en el código hay una segunda lista de 9 que añade "Medicina interna" y "Medicina general". **El diseño usa la de 7** (la del hub); el equipo unifica el código hacia esta. `design/auditar.mjs` comprueba que no divergan.
2. **PAÍS** — una sola fila de 54px con etiqueta "País de práctica" a la izquierda, el **valor actual** a la derecha en 17px `#5b6b8c` (con elipsis, máx. 52% del ancho) y chevron. Abre la hoja de selección (§17b). Sin valor muestra "Sin definir".
3. **CÓMO NOS CONOCISTE** — misma fila de valor + chevron, etiqueta "Canal". Abre la hoja de canal (§17c). Debajo, en 12px: "Es la única forma que tenemos de saber qué canal funciona."
4. **IDIOMA** — segmented control de tres segmentos (Español / English / Português), 34px, el activo blanco con `0 1px 3px rgba(0,32,92,.18)`.
5. **DISPONIBILIDAD OFFLINE** — "5 de 5 herramientas" + "Descargadas" en verde, barra de 5px al 100% en `#1F7A5C`, y "Actualizado hace 2 h · 1,8 MB. Los cálculos se sincronizan al recuperar red."
6. **CURSOS EDUTRAUMA** — tres filas con el logo del curso a 26px: DQT, MIP, MIAA.

Pie: "© 2026 EduTrauma® — Enseñando a salvar vidas."

**Por qué fila-con-valor y no lista abierta para país y canal:** una lista de 18 filas (30 a futuro) dentro de la pantalla la vuelve un formulario interminable y entierra los bloques de abajo. El patrón iOS correcto es **fila con valor → hoja de selección**, igual que Ajustes.

### 17b. Hoja de selección de país — diseñada para ~30 opciones
Hoja modal al **88% de la altura** (no un picker de rueda: con 30 opciones la rueda es lenta y no admite búsqueda), `#f2f4f9`, radio `20px 20px 0 0`, sombra `0 -12px 40px rgba(0,32,92,.22)`, con grabber de 38×5.

- **Barra de hoja** de 44px con el título "País" centrado (17px/600) y **"Cancelar"** a la derecha en `#16829e` 17px. Borde inferior de 0.5px.
- **Buscador** `rgba(0,32,92,.07)` radio 10px, input de 17px, con botón circular de borrado de 24px cuando hay texto. **Búsqueda insensible a acentos y mayúsculas** (`normalize('NFD')`): "co" devuelve México, Colombia y Costa Rica; "peru" encuentra Perú.
- **Sin filtro, dos secciones**: **FRECUENTES** (Chile, México, Colombia, Argentina, Perú — los mercados principales, para que el 80% de los usuarios acierten en el primer toque) y **A–Z** (el resto ordenado con `localeCompare('es')`, con **"Otro"** siempre al final). Las frecuentes **no se repiten** en A–Z.
- **Con filtro, una sola sección** "RESULTADOS" sobre la lista completa.
- Filas de 50px, valor actual con check rojo. Tocar una fila selecciona, cierra la hoja y lanza el toast "País actualizado: Colombia".
- Estado vacío: "Sin resultados. Si tu país no aparece, elige «Otro»."

**Escala.** La lista vive en un array (`COUNTRIES` + `COUNTRY_FREQ`); añadir los 7 países que faltan para los 25 actuales, o llegar a 30, no toca la interfaz. A partir de ~40 conviene añadir índice alfabético lateral; por debajo de eso, buscador + frecuentes es suficiente.

Lista actual (18): Chile, México, Colombia, Argentina, Perú, Ecuador, Bolivia, Uruguay, Paraguay, Venezuela, Brasil, Panamá, Costa Rica, Guatemala, República Dominicana, España, Estados Unidos, Otro.

### 17c. Hoja de selección de canal
Hoja **de alto natural** (6 opciones caben sin scroll), anclada al borde inferior, con grabber, título "¿Cómo nos conociste?" (22px/800) y bajada "Anónimo. Nos dice qué canal funciona." Grupo de lista con filas de 54px; cada una lleva un tile `#eef1f7` de 30px con el icono del canal (sobre en Correo, marco+círculo en Instagram, burbuja en WhatsApp, tarjeta en LinkedIn, dos personas en Amigo/colega, tres puntos en Otro) y check rojo en la activa.

Opciones: **Correo EduTrauma · Instagram · WhatsApp · LinkedIn · Un amigo / colega · Otro.** Al elegir, cierra y lanza el toast "Gracias — nos ayuda a saber qué canal funciona".

Se pregunta **una sola vez** en el primer arranque; desde Perfil se puede corregir, pero la app no vuelve a preguntarlo.

---

### 18. Primer arranque — bienvenida de tres toques
Obligatorio y sin omitir, pero **no se ve como un registro**: no hay campos de texto, no hay cuenta, no hay correo ni contraseña, y cada paso se resuelve con **un solo toque** que avanza automáticamente (sin botón "Continuar"). De ahí los ~15 segundos.

Ocupa la pantalla completa (`position:absolute; inset:0`) por encima de todo, **salvo la barra de estado y el indicador de inicio del sistema**, que siempre quedan visibles: el contenedor de la app crea un contexto de apilado (`position:relative; z-index:0`) para que las capas internas no tapen el chrome del sistema.

**Paso 0 — Bienvenida.** Pantalla navy completa (mismo degradado y círculos decorativos que el panel del Kit), logo EduTrauma a 30px arriba a la izquierda, y abajo:
- Eyebrow "HERRAMIENTAS CLÍNICAS DE TRAUMA" (11px/700, tracking 0.22em).
- Titular **"Tres toques y estás dentro."** — 34px/800/39px, `text-wrap: balance`.
- Bajada: "Sin cuenta, sin correo, sin contraseña. Solo queremos saber para quién estamos construyendo." (16px/1.5).
- **Tarjeta de anonimato** `rgba(255,255,255,.1)` radio 13px con escudo-check verde `#4ad196` de 19px: "Anónimo de principio a fin. Nunca pedimos nombre ni identificador, y tus casos clínicos no salen de este teléfono." Es lo último que se lee antes de empezar, a propósito.
- Botón **"Empecemos"** rojo `#E02826`, 54px, radio 14px, 17px/700.

**Pasos 1–3 — un dato por pantalla.** Cabecera navy fija con radio inferior de 22px:
- **Indicador de progreso**: tres puntos de 7px; los completados en `#E02826`, el actual **se estira a 22px** (`transition: width .3s ease`), los pendientes en `rgba(255,255,255,.28)`. A la derecha, "PASO N DE 3" en 12px/700.
- Pregunta en 26px/800 blanco + una línea de porqué en 14px `rgba(255,255,255,.68)`:

| Paso | Pregunta | Porqué | Control |
|---|---|---|---|
| 1 | ¿Cuál es tu especialidad? | Para mostrarte primero lo que usas. | Grupo de lista de 7 filas de 56px con chevron |
| 2 | ¿En qué país ejerces? | Para adaptar protocolos y disponibilidad. | Buscador + FRECUENTES + A–Z, filas de 52px |
| 3 | ¿Cómo nos conociste? | Es la única forma de saber qué canal funciona. | 6 filas de 56px con tile de icono |

Cada pantalla usa la transición **push** del resto de la app, y al pie repite en 12px centrado: "Anónimo y agregado. Sin nombre, sin correo, sin identificador."

En el paso 2 el control es el **mismo** que la hoja de país del Perfil (buscador, frecuentes, A–Z, "Otro" al final) pero embebido en la pantalla, no en una hoja: durante el arranque no hay a dónde cancelar.

**Paso 4 — Confirmación.** Pantalla navy con círculo `rgba(74,209,150,.16)` de 72px y check verde de 36px que entra con `etSymbol` (0.5s, `cubic-bezier(.34,1.5,.64,1)`), "Listo" en 28px/800 y "Las cinco herramientas ya están en tu teléfono y funcionan sin conexión." Se cierra sola a los **1,4 s** y entra al Kit. Sin botón: el usuario no tiene que hacer nada más.

**Reglas de implementación.**
- El arranque se muestra mientras `onbDone` sea falso; al completarse se persiste en el dispositivo y no vuelve a aparecer. En el repo el equivalente es el gate de especialidad con `et_profile` en `localStorage` — extender ese objeto con `country` y `origin`.
- **No hay botón de omitir ni de cerrar**: los tres datos son obligatorios. Tampoco hay "atrás" — son tres toques; corregir se hace luego en Perfil, y eso se cumple con que los tres campos sean editables ahí.
- El prototipo expone un prop `showOnboarding` para poder revisar el resto de la app sin pasar por el arranque. **Es andamiaje de revisión, no una función del producto.**
- Nada del arranque requiere red.

---

## Requisitos transversales

**Trilingüe es/en/pt.** Ningún texto de interfaz va en una caja de ancho fijo. Las etiquetas que más crecen son los nombres de calculadora, las unidades y los enunciados de Glasgow y PHQ-9 — de ahí el nombre corto en las listas, el segmented apilado, y `text-wrap: pretty`/`balance` en títulos. Las cinco herramientas del repo ya tienen `I18N` con los tres idiomas **salvo Calculadoras**, que hoy no tiene archivo de traducción: un usuario en portugués ve las 16 en español. El diseño ya contempla los tres idiomas; falta el `calc-trans.js` equivalente a `miaa-trans.js` / `aast-trans.js`. El selector de idioma vive en Perfil y es preferencia global (`localStorage 'lang'` en el repo).

**Funciona sin conexión.** Ningún estado de la interfaz depende de red. El único texto de red es el indicador de estado del Kit y el de Perfil, y ambos son informativos. Los eventos de analítica y la encuesta se **encolan** y se reenvían al recuperar conexión (patrón `et_queue` del repo).

**Todo resultado se puede guardar en el caso activo** — las cinco herramientas, con el patrón de la tabla de arriba. Idempotente: el botón pasa a "Guardado" y no duplica.

**Toda pantalla de resultado lleva su referencia bibliográfica visible** y el descargo al pie: "Herramienta de apoyo a la decisión clínica — no reemplaza el juicio médico. EduTrauma® — Enseñando a salvar vidas."

**`prefers-reduced-motion`** está respetado con una regla global que reduce animaciones y transiciones a 0.01ms. En la implementación nativa, equivale a desactivar las transiciones push/pop y los rebotes, conservando los fundidos.

---

## Interactions & Behavior

**Navegación.** Cuatro pestañas raíz sin historial entre sí. Dentro de cada una, una pila: Kit → herramienta → (algoritmo | órgano | formulario) → resultado; Casos → detalle; Guías → detalle.

**Transición push/pop.** Empujar: `etPush` — `opacity .2 → 1`, `translateX(26px) → 0`. Volver: `etPop` — desde `translateX(-22px)`. Cambio de pestaña: `etFade` — `opacity 0 → 1`, `translateY(6px) → 0`. Todas 0.34s con `cubic-bezier(.32,.72,0,1)`.

**Feedback táctil diferenciado** (lo que hace que se sienta nativo):
- Filas de grupo de lista → realce de fondo `rgba(0,32,92,.055)`, sin escala.
- Tarjetas y botones → `transform: scale(...)` con `transition: transform .3s cubic-bezier(.34,1.5,.64,1)`. Escalas: celda de Björck `.96`, chip de órgano `.955`, tarjeta de opción `.965`, SÍ/NO `.955`, botón primario `.97` + `brightness(.9)`, píldora de reciente `.95`, botón Guardar de la barra AAST `.94`, cara de encuesta `.9`.
- Texto de acción (atrás, Cancelar, Evaluar otro caso) → `opacity: .4`, `transition .18s`.

**Toast.** A 96px del borde inferior, ancho completo menos 16px, `rgba(0,24,69,.95)` con blur, radio 14px, 15px/500 blanco, entra con `etUp`, se va a los 2,3 s. Usado para guardados y para errores de coherencia de las calculadoras.

**Corrección sin pérdida.** Desde cualquier resultado, el botón atrás devuelve al paso o al formulario con el estado intacto: en árboles retrocede un nodo; en la decisión SÍ/NO vuelve a la pregunta respondida; en TEG6s y calculadoras conserva todos los valores.

---

## State Management

```
screen        'kit' | 'tool' | 'question' | 'checklist' | 'result' | 'bjorck'
              | 'aast' | 'aastOrgan' | 'teg' | 'tegResult'
              | 'calcs' | 'calc' | 'calcResult'
              | 'casos' | 'caseDetail' | 'guias' | 'guiaDetail' | 'perfil'
toolId        herramienta abierta (enruta a 'tool' | 'aast' | 'teg' | 'calcs')
algoId        algoritmo en curso · nodeId  nodo del árbol · qIdx  índice en la decisión SÍ/NO
ctx           respuestas acumuladas → alimenta resolve()
history       [{nodeId|qIdx, label}] para retroceder y para la trazabilidad
checks        {criterioId: bool} del checklist NEXUS
result        {level, title, detail, warn?, list?, goto?, conduct?}
aastOrgan     clave del órgano · aastSel {gi, ii} grupo e ítem seleccionados
aastAdj       {multi, inc, dec} switches de ajuste
teg           {hep, ckr, ckhr, crta10, crtma, cffa10, cffma, ly30} · tegResult {comp[], alerts[]}
calcId        calculadora abierta · calcVals valores · calcResult salida de compute()
calcRecent    [calcId] máx. 4, orden de uso
saved         evita guardar el mismo resultado dos veces
filter        texto del buscador (se limpia al cambiar de pantalla)
favs          [algoId] · spec, lang  preferencias de perfil
country       país elegido (null hasta el primer arranque) · origin  canal de origen
onbStep       0 bienvenida · 1 especialidad · 2 país · 3 canal · 4 confirmación
onbDone       true cuando el primer arranque terminó (persistente)
sheet         'country' | 'origin' | null · sheetFilter  búsqueda de la hoja
caseId        caso activo · openCaseId  caso que se está viendo
cases         [{id, label, meta, active, entries:[{tool,title,level,time,trace}]}]
dir           1 push · −1 pop · 0 cambio de pestaña → elige la animación
fb            {open, step, done, tool, rating, txt} de la encuesta
```

**Reglas.** El bloque de caso en la portada muestra "Continuar caso" solo si el caso activo tiene **al menos un registro**. `openTool` enruta por herramienta y limpia el filtro; TEG6s además reinicia el formulario. El grado AAST mostrado siempre es el ajustado. La barra de grado solo existe si hay ítem seleccionado.

**Persistencia.** En el prototipo todo es en memoria. En producción: casos, favoritos, recientes de calculadora y perfil en almacenamiento local del dispositivo (**nunca en servidor** — la promesa es "solo en tu teléfono, sin identificadores"; el repo ya usa `localStorage` con `et_profile`, `calc_recent`, `lang`). La encuesta y la analítica anónima son lo único que sale del dispositivo, y van encoladas.

---

## Assets
- `logo-blanco-trim.png`, `logo-mip.png`, `logo-dqt.png`, `logo-miaa.png` — del repo (raíz), sin modificar.
- **Iconos**: SVG en línea, estilo Lucide, stroke 1.7–2, terminaciones redondeadas, heredando `currentColor`. En producción, Lucide (o SF Symbols en iOS nativo) con esos grosores.
- **Fotografía**: ninguna. Se evaluó incluir fotos de pabellón y docentes en la portada y se descartó por no aportar valor al usuario en contexto clínico. No reintroducir.
- **Tipografía**: fuente del sistema, sin webfonts.

## Screenshots
En `screenshots/` (402×874 @2x, capturadas del prototipo con la hoja de encuesta cerrada; el bisel de iPhone es andamiaje):

| Archivo | Pantalla |
|---|---|
| `01-kit.png` | Kit — portada, favoritos y las 5 herramientas |
| `02-miaa-lista.png` | MIAA — acceso a Björck + 5 algoritmos por fase |
| `03-bjorck.png` | Björck — los 9 grados en una pantalla |
| `04-miaa-conducta.png` | Conducta 2C con lista numerada de pasos |
| `05-miaa-decision.png` | Decisión SÍ/NO con categoría y regla práctica |
| `06-aast-buscador.png` | AAST — buscador y 32 órganos por región |
| `07-aast-grados.png` | AAST — tabla de grados del bazo, lesión seleccionada, ajuste aplicado y barra de grado |
| `08-teg-formulario.png` | TEG6s — formulario con teclado decimal |
| `09-teg-panel.png` | TEG6s — panel de 4 componentes |
| `10-calc-areas.png` | Calculadoras — 16 en 5 áreas con tipo de entrada |
| `11-calc-formulario.png` | CHA₂DS₂-VASc — segmentados y toggles |
| `12-calc-resultado.png` | Resultado con número grande, interpretación y fórmula |
| `13-caso-multiherramienta.png` | Caso con registros de MIP, TEG6s y una calculadora |
| `14-onb-bienvenida.png` | Primer arranque — bienvenida y promesa de anonimato |
| `15-onb-especialidad.png` | Primer arranque — paso 1 de 3, especialidad |
| `16-onb-pais.png` | Primer arranque — paso 2 de 3, país con frecuentes y A–Z |
| `17-onb-pais-busqueda.png` | Búsqueda de país ("co" → México, Colombia, Costa Rica) |
| `18-onb-origen.png` | Primer arranque — paso 3 de 3, cómo nos conociste |
| `19-onb-listo.png` | Primer arranque — confirmación y entrada a la app |
| `20-perfil.png` | Perfil con especialidad, país, canal, idioma, offline y cursos |
| `21-hoja-pais.png` | Hoja de selección de país con buscador |
| `22-hoja-canal.png` | Hoja de selección de canal |

## Files
- `EduTrauma Tools App.dc.html` — el prototipo completo (plantilla + lógica). Ábrelo en un navegador para recorrer los flujos.
- `et-data.js` — **contenido clínico portado verbatim**: MIAA (5 algoritmos + Björck), TEG6s (campos, rangos, `computeTEG`), las 16 calculadoras, el parser decimal y las etiquetas de ajuste AAST.
- `aast-data.js` — dataset AAST completo: 32 órganos, 6 regiones, ítems con grado/ICD-9/AIS/warn.
- `support.js`, `ios-frame.jsx` — runtime del prototipo y marco de iPhone. **Andamiaje, no diseño.** (Única modificación al marco: la barra de estado se fuerza a glifos blancos, porque la app siempre tiene franja de marca navy arriba.)
- `reference/edutrauma-ui.css` — el sistema de diseño actual del repo, origen de todos los tokens.
- `logo-*.png` — logos de marca y de curso.

## Repositorio de origen
`eliasadolfo/edutrauma-tools`, rama `main`. Archivos leídos para este diseño: `index.html` (hub), `mip/index.html`, `abdomen/index.html`, `aast/index.html` + `aast/aast-trans.js`, `teg/index.html`, `calculadoras/index.html`, `design/edutrauma-ui.css`, `design/DESIGN.md`, `design/feedback.js`. El mapa pantalla → archivo está en `github.md` en la raíz del proyecto de diseño.
