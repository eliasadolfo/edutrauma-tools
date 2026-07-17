# EduTrauma Tools — tools.edutrauma.net

Kit de herramientas clínicas de EduTrauma. Hub trilingüe (ES/EN/PT) + apps de apoyo a la decisión clínica, con analytics anónimo y feedback in-app.

## Estructura del repo

```
/                      Hub: selector de idioma, grid de herramientas, mini-perfil
/abdomen/              Tool: ¿Cuándo dejar el abdomen abierto? (curso MIAA)
/aast/                Tool: Escalas AAST de lesiones de órganos (curso DQT) — DB + aast-trans.js (ES/EN/PT)
/design/               Sistema de diseño EduTrauma UI (css + DESIGN.md) — canónico
CNAME                  tools.edutrauma.net (GitHub Pages)
```

## Convenciones del ecosistema

| Recurso | Convención |
|---|---|
| **Tool nueva** | Carpeta `/nombre/` en este repo. Copiar estructura de una tool existente (index.html + sw.js + manifest + design/). Contenido clínico grande → base de datos + `<tool>-trans.js` con traducciones mapeadas por etiqueta ES canónica (ver `/aast/`). Chip del curso en el header. |
| **Workflows n8n** | Nombre con prefijo `ET Tools — …` + tag `ET Tools`. Instancia: devn8n.tuescuelademarcas.cl |
| **Google Sheets** | Libro "EduTrauma Tools — Analytics" ([link](https://docs.google.com/spreadsheets/d/1Nsbsk1H2MA32pgMtJ86J1e_eCRxTI_27cNYs6lK0xms)). Pestañas: `dashboard` (veredicto automático de decisión + KPIs por etapa —adquisición, retención, activación, embudo, calidad— con metas, + 6 gráficos automáticos), `eventos` (crudo: ts/anon_id/event/tool/lang/country/specialty/tz/ua/extra), `feedback` (comentarios filtrados), `calc` (series de cálculo para los gráficos — no tocar). |
| **Service workers** | Cada herramienta tiene el suyo (scope propio). Subir versión de `CACHE` en CADA deploy o los teléfonos quedan con versión vieja. |
| **DNS** | Subdominios de edutrauma.net se gestionan en el panel DNS de **Kajabi** (CNAME → eliasadolfo.github.io). NO tocar registros www/raíz (son de Kajabi). |

## Analytics

- **Flujo:** app → `POST devn8n.tuescuelademarcas.cl/webhook/et-tools-event` → workflow n8n `ET Tools — Eventos de apps clínicas` → data table `et_tools_events` (fuente de verdad).
- **Sync a Sheets:** workflow `ET Tools — Sync a Sheets (cada hora)` reescribe la pestaña `eventos` desde la data table (sin race conditions, auto-reparable). Sync manual: `POST /webhook/et-tools-sync-now`.
- **Eventos:** `hub_view`, `tool_open`, `app_open`, `eval_completed`, `bjorck_completed`, `lang_change`, `profile_saved`, `source` {source: correo|instagram|whatsapp|linkedin|amigo|otro}, `feedback` {useful, comment}, `feedback_skipped`.
- **Atribución:** tras elegir especialidad (o una vez para usuarios ya existentes) el hub pregunta «¿Cómo nos conociste?» — un toque, opcional, no bloquea. `id` de canal independiente del idioma. localStorage: `et_source` (respondido) / `et_source_asked` (saltado).
- **Panel:** dashboard interno protegido con clave en `tools.edutrauma.net/panel/` — consume el endpoint JSON `ET Tools — Datos del panel (JSON)` (id JYtnOU9EiXLbZpWX, GET `/webhook/et-panel-data?k=<clave>`, clave en n8n, NO en el repo). Métricas: veredicto de decisión, retención/activación, uso y notas por tool, países, profesiones (canónicas + «otra» desglosada), fuentes de origen, peticiones (nuevas/mejoras), actividad 14 días.
- **ID anónimo compartido** entre hub y herramientas vía localStorage (`et_anon`) — permite medir retención sin login.
- **Feedback in-app:** bottom sheet tras la 2ª evaluación completada, una sola vez por usuario.

## Métricas de decisión (revisar a las 8-12 semanas del lanzamiento)

| Métrica | Umbral "herramienta" |
|---|---|
| Retención 30 días | >25% |
| % completan evaluación | >70% |
| % feedback útil 👍 | >80% |
| Crecimiento orgánico | sostenido sin promoción |

## Antes de cada deploy — auditoría de coherencia

```bash
node design/auditar.mjs     # ~37 reglas, 1 segundo, debe pasar
```
Verifica que las tools no diverjan: archivos compartidos idénticos, pie unificado,
idioma solo en el hub, disclaimers, SW network-first. Reglas completas y checklist
en `design/DESIGN.md` → "Reglas de la casa".

## Deploy

Fuente de verdad local: `~/Desktop/EduTrauma_Tools/`. Para publicar:
```bash
# clonar fresco, copiar SIN pisar .git/CNAME, commit, push
git clone https://github.com/eliasadolfo/edutrauma-tools.git _pub && cd _pub
rsync -a --exclude '.git' --exclude 'CNAME' ~/Desktop/EduTrauma_Tools/ .
git add -A && git commit -m "..." && git push   # Pages publica en ~1 min
```
⚠️ NO usar rsync directo sobre un clon que tenga `.git` sin `--exclude '.git'` (lo borra).
⚠️ Repos PÚBLICOS obligatorio (GitHub Pages no sirve repos privados en plan Free).

URLs: producción **https://tools.edutrauma.net** · alias herramienta abdomen: miaa.edutrauma.net
