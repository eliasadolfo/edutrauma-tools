# EduTrauma UI — Sistema de diseño v1.0

Sistema visual para la **serie de mini-apps clínicas EduTrauma** (herramientas de decisión para cirujanos, uso móvil/iPhone, incluso en pabellón). Primera app: [miaa.edutrauma.net](https://miaa.edutrauma.net).

**Regla de oro:** una app nueva de la serie = copiar la estructura HTML de una existente + `design/edutrauma-ui.css` + cambiar solo contenido y lógica. Cero CSS nuevo salvo necesidad real.

---

## Principios

1. **Legible con estrés y con guantes** — targets táctiles grandes (botones SÍ/NO ≥ 56px alto), contraste alto, una sola decisión por pantalla.
2. **Semántica clínica por color** — rojo = dejar abierto/alerta; verde = cierre seguro/ok; navy = neutro/institucional; teal = informativo. El color *siempre* acompaña, nunca es el único portador del significado.
3. **iOS-first** — tipografía del sistema (SF en iPhone), safe-areas, botones de texto estilo iOS, bottom sheets.
4. **Un archivo por app + CSS compartido** — vanilla HTML/CSS/JS, sin frameworks, PWA offline.

## Tokens

### Color — marca
| Token | Valor | Uso |
|---|---|---|
| `--et-navy` | `#00205C` | Primario (Pantone 281c del manual de marca) |
| `--et-red` | `#E02826` | Acento marca (Pantone 485c) |

### Color — semánticos
| Token | Valor | Uso |
|---|---|---|
| `--et-danger` / `-soft` / `-line` | `#E02826` / `#fdecea` / `#f0c4bd` | Resultado "dejar abierto", alertas |
| `--et-success` / `-soft` / `-line` | `#1F7A5C` / `#e9f6f1` / `#bfe3d3` | Resultado "cierre seguro", ok |
| `--et-warning-*` | `#fff8ec` / `#f2dfb3` / `#7a5b13` | Precauciones clínicas |
| `--et-info` / `-soft` / `-line` | `#16829e` / `#e7f4f7` / `#c9e8ee` | Badges de categoría, links informativos |

### Color — neutrales (gris con sesgo navy)
`--et-bg #eef1f7` · `--et-bg-2 #e3e8f3` · `--et-card #fff` · `--et-text #00205C` · `--et-muted #5b6b8c` · `--et-line #dbe1ee`

### Tipografía
System stack (`--et-font`). Escala: título 1.28 / resultado 1.35 / pregunta 1.18 / botón 1.05 / cuerpo 0.92 / caption 0.78 / label 0.72 (uppercase +tracking) / micro 0.68 rem.

### Radios y sombra
lg 18 (tarjetas) · md 14 (botones respuesta) · sm 12 (acciones) · xs 10 (cajas) · pill 999. Una sola elevación: `--et-shadow`.

## Componentes

| Componente | Clase | Notas |
|---|---|---|
| **Header doble logo** | `.brand-strip` + `.brand-logo` + `.brand-chip` | EduTrauma blanco a la izq; logo de curso a color dentro de chip blanco a la der. Sin texto adicional en la franja. |
| **Cinta de ecosistema** | `.brand-ribbon` | Va SIEMPRE bajo la franja, con el texto fijo "HERRAMIENTAS CLÍNICAS" (decisión de marca 2026-07). Navy profundo + filete rojo superior (evoca la línea divisoria del logo EduTrauma). Es la firma que une todas las apps de la serie. |
| Cabecera de página | `header > h1 + p` | Título + bajada italic. `text-wrap: balance`. |
| Botón info iOS | `.rule-link` | Texto + ícono ⓘ fino, tinte teal, bajo la bajada. Abre el bottom sheet. |
| Progreso | `.progress-wrap/track/fill/label` | Gradiente navy→rojo. Label "PREGUNTA X DE N". |
| Badge categoría | `.category-badge` (+`.bjorck`) | Pill con ícono SVG stroke. |
| Tarjeta pregunta | `.card > .question-text + .answers` | Botones `.answer-btn` NO (izq) / SÍ (der), grid 1:1. |
| Volver | `.back-row > .back-btn` | "‹ Corregir respuesta anterior". |
| Resultado | `.result-card` `.open/.closed/.bjorck` | Ícono 56px + eyebrow + título + detalle + `.trigger-box` (trazabilidad). |
| Precaución | `.caution-box` | Ámbar, para advertencias clínicas. |
| Acciones | `.restart-btn` (primario navy) / `.secondary-btn` (outline) | |
| Bottom sheet | `.overlay > .sheet` | Cierre por tap fuera o `.close-sheet`. Respeta `prefers-reduced-motion`. |
| Footer | `footer` | Disclaimer + "EduTrauma® — Enseñando a salvar vidas." |

## Patrón de página (toda app de la serie)

```
.app
 ├─ .brand-strip          ← doble logo
 ├─ .brand-ribbon         ← "HERRAMIENTAS CLÍNICAS" (fijo en toda la serie)
 ├─ header                ← h1 + bajada + .rule-link (opcional)
 ├─ .progress-wrap        ← si hay flujo por pasos
 ├─ main                  ← pregunta | resultado (render por JS)
 └─ footer                ← disclaimer legal
+ .overlay/.sheet         ← ayuda contextual
```

## Assets

- `logo-blanco-trim.png` — EduTrauma horizontal blanco (para franja navy). **Preferencia del equipo: usar siempre el logo horizontal, no el isotipo solo.**
- `logo-miaa.png` — logo curso MIAA (color, va dentro de `.brand-chip`).
- Íconos de app: logo blanco sobre navy (`icon-192/512`, `apple-touch-icon`).
- Fuente de colores oficiales: `~/Desktop/Logos Edutrauma/AF_Logo Edu_Trauma.ai`.

## Do / Don't

| ✅ | ❌ |
|---|---|
| Colores solo vía tokens `--et-*` | Hex hardcodeado en la app |
| Botones respuesta ≥56px alto | Targets pequeños |
| Rojo/verde solo para semántica clínica | Rojo/verde decorativo |
| Disclaimer siempre en footer | Omitir el disclaimer |
| Bump `CACHE` en sw.js en cada deploy | Olvidarlo (los teléfonos quedan pegados en versión vieja) |

## Checklist app nueva

1. Copiar `index.html`, `sw.js`, `manifest.json`, `design/`, logos e íconos de una app existente
2. Cambiar: contenido/lógica JS, `<title>`, metas, `short_name`, nombre de caché (`<app>-v1`)
3. Chip derecho: logo del curso al que pertenece (o quitar `.brand-chip` si es genérica)
4. Repo GitHub público nuevo + Pages + CNAME `<sub>.edutrauma.net` (DNS en Kajabi: CNAME `<sub>` → `eliasadolfo.github.io`)
