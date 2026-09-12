# Camas — la capa compartida

> Estado: base de datos montada. Interfaz pendiente.
> Proyecto Supabase `edutrauma-camas` · `waiyebnzegnpaqdbyxmc` · São Paulo.

## Qué es

Hasta ahora la app era **privada por diseño**: todo vivía en el teléfono y no
salía. Camas es lo contrario — datos de un paciente real, en un servidor,
visibles y editables por el equipo que lo atiende.

Pedido por Pablo Ottolino. Piloto con pacientes reales, en un hospital con el
que él ya conversó, y con un grupo pequeño.

## El modelo

La analogía que lo ordenó, de Elías: **es como tomar pedidos en un restaurante**.
Y de ahí sale la regla que casi se nos escapa — la comanda es de los comensales,
no de la mesa. Si los cambias de mesa, la comanda se va con ellos.

```
UNIDAD  (tiene un código que reparte el organizador)
  ├─ CAMA         "Box 3"  · el lugar, permanece
  └─ PACIENTE              · entra, se mueve, se va
       ├─ ASIGNACIÓN       · en qué cama está, y en cuáles estuvo
       ├─ EVOLUCIÓN        · lo que PASÓ. Firmada, con hora. SOLO SE AÑADE.
       └─ INDICACIÓN       · lo que FALTA por hacer. Alguien la marca.
```

**La evolución cuelga del paciente, no de la cama.** Si cuelga de la cama, al
mover a alguien de Box 3 a Cama 12 su historia se parte en dos y quien llegue
después no ve lo anterior — justo lo contrario de para qué sirve una evolución.

**Evolución e indicación son cosas distintas.** Una cuenta lo que pasó y se lee;
la otra es un pendiente que alguien tiene que ejecutar y marcar. "Control de
hematocrito a las 6" no es una nota.

Índices únicos parciales impiden dos imposibles físicos: que una cama tenga dos
pacientes a la vez, y que un paciente esté en dos camas a la vez.

## Las decisiones que no son negociables

**1. Casos y Camas son cosas separadas.**
A los usuarios actuales les prometimos, con esas palabras, que sus casos no
salen del teléfono. Camas sí sale. Si alguien se confunde de pantalla,
rompimos la promesa aunque técnicamente no la rompimos. Tienen que verse
distintas y decir en la cabecera quién más está mirando.

**2. La evolución solo se añade.**
Elías y Pablo pidieron "que gane el dato más actual". Eso vale para los datos
editables de la estadía (alias, egreso), donde perder una edición no borra
información. Para la evolución **no**: si dos residentes escriben sin señal y al
sincronizar gana el último, la línea del otro desaparece sin que nadie se
entere. Añadiendo, las dos entran con su hora y su autor, y el conflicto deja
de existir en vez de resolverse. No hay política de UPDATE ni de DELETE sobre
`evolucion`, a propósito.

Y no es una precaución de programador: una evolución clínica nunca se borra.
Si te equivocaste, escribes una que rectifica. Así es en papel desde siempre.

La indicación sí se puede marcar como hecha —eso es un update— pero un trigger
impide que se cambie su texto o su autor.

**3. Cada línea lleva quién y cuándo.**
Una cama compartida sin autor es un rumor, no un registro. `autor_nombre` se
guarda copiado: si alguien deja el equipo, su firma permanece en lo que
escribió.

**4. El código dice a qué unidad entras, no quién eres.**
Hace falta además identidad real (correo, una vez, sin contraseña) para firmar
y para que el organizador pueda revocar el acceso. Con pacientes reales eso es
lo mínimo que se pide si algo se discute.

**5. Sin señal se escribe igual.**
La app funciona en pabellón sin cobertura. Las notas se guardan locales con su
`cliente_ts` (la hora del teléfono, que es el orden real) y un `local_id` que
hace la sincronización idempotente: subir dos veces no duplica.

## Quién crea unidades

Durante el piloto, solo una lista corta. Cuando se distribuya, cualquiera —
para que crezca solo. Decisión de Elías, 12-sep-2026.

Eso **no está hardcodeado**. Vive en la tabla `ajuste`:

| clave | valor | significa |
|---|---|---|
| `creacion_unidades` | `cerrada` | solo los correos de `creador_autorizado` |
| | `abierta` | cualquiera con sesión iniciada |

Abrirlo es cambiar ese valor — no hay que tocar políticas ni desplegar la app.
Se hizo así a propósito: abrir después es trivial, cerrar después de que
existan unidades con pacientes dentro no lo es.

La lista autoriza por **correo, no por user_id**, para poder autorizar a
alguien antes de que entre por primera vez. Falta añadir el de Pablo.

Ambas tablas tienen RLS activo y **ninguna política**: nadie las lee desde la
app. Se administran desde la consola de Supabase. El aviso INFO del linter es
esperado.

## Cómo se entra a una unidad

Decisión de Elías, 12-sep-2026: **el código basta**. En un turno de trauma,
bloquear a alguien que necesita escribir a las 3 de la mañana es peor que el
riesgo de que entre alguien de más, teniendo el organizador la lista a la
vista. Dijo "por ahora", y se tomó en serio:

| clave | valor | significa |
|---|---|---|
| `ingreso_unidad` | `codigo` | con el código entras y ya |
| | `aprobacion` | entras como pendiente hasta que el organizador te admita |

La estructura soporta las dos: `miembro.estado` es `activo` o `pendiente`, y
ser miembro significa estar **activo**. Apretarlo es cambiar el valor.

El estado **no lo decide el cliente**: lo pone un trigger según el ajuste. La
app no puede pedir entrar como activa cuando el ajuste dice aprobación.

### Identidad y firma

Son tres cosas distintas:

1. **La cuenta** — el correo con el que inició sesión. Es el dato duro. La
   política de inserción exige `auth.uid() = autor_id`: la app no puede firmar
   como otro, el servidor lo rechaza.
2. **El nombre** — lo escribe cada uno al entrar a la unidad. Es lo que se ve
   en cada línea, y se guarda **copiado** en ella: si alguien rota a otro
   servicio y se le saca de la unidad, sus líneas siguen firmadas.
3. **El correo, copiado en `miembro`** — el nombre lo escribe cada uno y puede
   mentir; la cuenta detrás no. Por eso el organizador ve ambos. Ese es el
   control real, no el código.

Cada línea lleva además **dos horas**: `cliente_ts` (cuándo se escribió en el
teléfono) y `creada` (cuándo llegó al servidor). La evolución se ordena por la
primera, que es cuando pasó; la segunda deja constancia de que llegó después.

## Seguridad

Todo pasa por RLS, y todo gira en torno a pertenecer a la unidad. Las
funciones de acceso viven en el esquema `privado`, que PostgREST no expone:
nadie puede llamarlas desde fuera para preguntar quién pertenece a qué.

`get_advisors` sale limpio.

## Lo que falta

- Interfaz: unidad, camas, pacientes, evolución e indicaciones.
- Autenticación por correo.
- Cola de sincronización y qué se ve cuando no hay señal.
- Que un resultado de herramienta se pueda guardar en una cama, no solo en un
  caso privado.
- Dejar por escrito con quién se habló en el hospital y qué se autorizó.
- Añadir el correo de Pablo a `creador_autorizado`.
- **El alta.** Cuando el paciente egresa, el residente escribe el resumen de
  memoria buscando a qué hora pasó qué. La app va a tener esa línea de tiempo
  completa, firmada y con horas reales. Exportarla en ese momento es
  probablemente el mayor ahorro de trabajo de todo el proyecto. El paciente
  no se borra al egresar: se marca la salida y su evolución queda.
