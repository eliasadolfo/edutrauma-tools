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

```
UNIDAD  (tiene un código que reparte el organizador)
  └─ CAMA        "Box 3"  · permanece
       └─ ESTADÍA          · un paciente ocupando esa cama durante un período
            └─ NOTA        · firmada, con hora, SOLO SE AÑADE
```

Los pacientes rotan: la cama es el lugar, la estadía es quién está ahí ahora.

## Las decisiones que no son negociables

**1. Casos y Camas son cosas separadas.**
A los usuarios actuales les prometimos, con esas palabras, que sus casos no
salen del teléfono. Camas sí sale. Si alguien se confunde de pantalla,
rompimos la promesa aunque técnicamente no la rompimos. Tienen que verse
distintas y decir en la cabecera quién más está mirando.

**2. Las notas solo se añaden.**
Elías y Pablo pidieron "que gane el dato más actual". Eso vale para los datos
editables de la estadía (alias, egreso), donde perder una edición no borra
información. Para las notas **no**: si dos residentes escriben sin señal y al
sincronizar gana el último, la nota del otro desaparece sin que nadie se
entere. Añadiendo, las dos entran con su hora y su autor, y el conflicto deja
de existir en vez de resolverse. No hay política de UPDATE ni de DELETE sobre
`nota`, a propósito.

**3. Cada nota lleva quién y cuándo.**
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

- Interfaz: unidad, camas, estadía, notas.
- Autenticación por correo.
- Cola de sincronización y qué se ve cuando no hay señal.
- Que un resultado de herramienta se pueda guardar en una cama, no solo en un
  caso privado.
- Dejar por escrito con quién se habló en el hospital y qué se autorizó.
