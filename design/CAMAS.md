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
