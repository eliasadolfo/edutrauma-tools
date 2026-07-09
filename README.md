# EduTrauma Tools — tools.edutrauma.net

Kit de herramientas clínicas de EduTrauma. Hub trilingüe (ES/EN/PT) + apps de apoyo a la decisión clínica, con analytics anónimo y feedback in-app.

## Estructura del repo

```
/                      Hub: selector de idioma, grid de herramientas, mini-perfil
/abdomen/              Herramienta: ¿Cuándo dejar el abdomen abierto? (curso MIAA)
/design/               Sistema de diseño EduTrauma UI (css + DESIGN.md) — canónico
CNAME                  tools.edutrauma.net (GitHub Pages)
```

## Convenciones del ecosistema

| Recurso | Convención |
|---|---|
| **Herramienta nueva** | Carpeta `/nombre/` en este repo. Copiar estructura de `/abdomen/` (index.html + sw.js + manifest + design/). Checklist completo en `design/DESIGN.md`. |
| **Workflows n8n** | Nombre con prefijo `ET Tools — …` + tag `ET Tools`. Instancia: devn8n.tuescuelademarcas.cl |
| **Google Sheets** | Libro "EduTrauma Tools — Analytics" ([link](https://docs.google.com/spreadsheets/d/1Nsbsk1H2MA32pgMtJ86J1e_eCRxTI_27cNYs6lK0xms)). Pestañas: `dashboard` (métricas), `eventos` (crudo), `feedback` (comentarios). |
| **Service workers** | Cada herramienta tiene el suyo (scope propio). Subir versión de `CACHE` en CADA deploy o los teléfonos quedan con versión vieja. |
| **DNS** | Subdominios de edutrauma.net se gestionan en el panel DNS de **Kajabi** (CNAME → eliasadolfo.github.io). NO tocar registros www/raíz (son de Kajabi). |

## Analytics

- **Flujo:** app → `POST devn8n.tuescuelademarcas.cl/webhook/et-tools-event` → workflow n8n `ET Tools — Eventos de apps clínicas` → data table `et_tools_events` + espejo a Google Sheets.
- **Eventos:** `hub_view`, `tool_open`, `app_open`, `eval_completed`, `bjorck_completed`, `lang_change`, `profile_saved`, `feedback` {useful, comment}, `feedback_skipped`.
- **ID anónimo compartido** entre hub y herramientas vía localStorage (`et_anon`) — permite medir retención sin login.
- **Feedback in-app:** bottom sheet tras la 2ª evaluación completada, una sola vez por usuario.

## Métricas de decisión (revisar a las 8-12 semanas del lanzamiento)

| Métrica | Umbral "herramienta" |
|---|---|
| Retención 30 días | >25% |
| % completan evaluación | >70% |
| % feedback útil 👍 | >80% |
| Crecimiento orgánico | sostenido sin promoción |

## Deploy

```bash
git add -A && git commit -m "..." && git push   # GitHub Pages publica solo (~1 min)
```

URLs: producción **https://tools.edutrauma.net** · alias herramienta abdomen: miaa.edutrauma.net
