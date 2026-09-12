#!/bin/bash
# ============================================================
# Migración: el app móvil pasa a ser tools.edutrauma.net
#
# Qué hace, en orden:
#   1. Guarda el hub actual como /clasico.html — un sitio de respaldo al que
#      mandar a alguien si algo sale mal, sin tener que revertir nada.
#   2. Mueve el app de /app/ a la raíz y corrige las rutas ../ → ./
#   3. Convierte las cinco páginas de herramienta en redirecciones al app,
#      conservando su URL para no romper QR ni enlaces ya repartidos.
#   4. Deja /app/ redirigiendo a la raíz.
#
# Reversible: git revert del commit devuelve todo.
# Uso: bash design/migrar-app.sh [destino]
# ============================================================
set -e
DEST="${1:-$HOME/Desktop/EduTrauma_Tools}"
cd "$DEST"

echo "→ 1. El hub actual queda como respaldo en /clasico.html"
cp index.html clasico.html

echo "→ 2. El app pasa a la raíz"
# Las rutas del app apuntaban a ../ porque vivía un nivel abajo.
sed -e 's|href="\.\./|href="|g' \
    -e 's|src="\.\./|src="|g' \
    app/index.html > index.html

for f in app/*.js; do
  base=$(basename "$f")
  sed -e "s|'\.\./|'|g" -e 's|"\.\./|"|g' -e 's|\${[^}]*}\.\./|../|g' "$f" > "$base"
done
# En las plantillas las imágenes se interpolan como ../${x}: quitar el ../
sed -i '' 's|src="\.\./\${|src="${|g' ./*.js 2>/dev/null || true

echo "→ 3. Las cinco herramientas redirigen al app conservando su URL"
for pair in "abdomen:abdomen" "aast:aast" "mip:mip" "teg:teg" "calculadoras:calc"; do
  dir="${pair%%:*}"; hash="${pair##*:}"
  cat > "$dir/index.html" <<HTML
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>EduTrauma Tools</title>
<meta name="theme-color" content="#00205C">
<meta name="robots" content="noindex">
<!-- Esta dirección se conserva porque ya circula en QR, enlaces y apps
     instaladas. Ahora lleva a la herramienta dentro del app. -->
<link rel="canonical" href="https://tools.edutrauma.net/#${hash}">
<script>location.replace('../#${hash}' + location.search);</script>
<meta http-equiv="refresh" content="0; url=../#${hash}">
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#00205C;color:#fff;
       font:400 15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  a{color:#fff}
</style>
</head>
<body><p>Abriendo EduTrauma Tools… <a href="../#${hash}">Continuar</a></p></body>
</html>
HTML
done

echo "→ 4. /app/ redirige a la raíz"
cat > app/index.html <<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>EduTrauma Tools</title>
<meta name="robots" content="noindex">
<script>location.replace('../' + location.hash);</script>
<meta http-equiv="refresh" content="0; url=../">
</head>
<body></body>
</html>
HTML

echo "✅ Migración aplicada en $DEST"
