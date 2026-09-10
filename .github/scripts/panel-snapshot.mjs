/* ============================================================
   Genera panel/data.json: una foto CIFRADA de las métricas.

   Por qué existe: el panel pedía los datos directamente al servidor n8n
   (otro dominio). Las extensiones de privacidad del navegador bloquean esas
   peticiones "de terceros", y el panel quedaba en error. Sirviendo el archivo
   desde el MISMO dominio del panel, la petición es de primera parte y ninguna
   extensión la bloquea — además carga al instante.

   El repo es público, así que el archivo va CIFRADO con la clave del equipo
   (AES-256-GCM, clave derivada con PBKDF2-SHA256). Sin la clave es ilegible.
   ============================================================ */
import { writeFileSync, mkdirSync } from 'node:fs';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';

const KEY = process.env.PANEL_KEY;
const URL_BASE = 'https://devn8n.tuescuelademarcas.cl/webhook/et-panel-data';
const ITER = 200000;

if (!KEY) { console.error('Falta PANEL_KEY'); process.exit(1); }

const res = await fetch(`${URL_BASE}?k=${encodeURIComponent(KEY)}`, {
  headers: { 'User-Agent': 'edutrauma-panel-snapshot' }
});
if (!res.ok) { console.error('El endpoint respondió HTTP', res.status); process.exit(1); }

const datos = await res.json();
if (datos.error) { console.error('El endpoint devolvió error:', datos.error); process.exit(1); }
if (typeof datos.users !== 'number') { console.error('Respuesta inesperada (sin "users")'); process.exit(1); }

/* Cifrado — el formato debe coincidir exactamente con el descifrado del panel
   (Web Crypto): PBKDF2-SHA256 → AES-256-GCM, con el tag pegado al final. */
const salt = randomBytes(16);
const iv = randomBytes(12);
const clave = pbkdf2Sync(KEY, salt, ITER, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', clave, iv);
const ct = Buffer.concat([cipher.update(JSON.stringify(datos), 'utf8'), cipher.final()]);
const paquete = {
  v: 1,
  alg: 'AES-GCM',
  kdf: 'PBKDF2-SHA256',
  iter: ITER,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  data: Buffer.concat([ct, cipher.getAuthTag()]).toString('base64'),
  generado: datos.generated || new Date().toISOString()
};

mkdirSync('panel', { recursive: true });
writeFileSync('panel/data.json', JSON.stringify(paquete));
console.log(`OK · ${datos.users} usuarios · ${datos.total_events} eventos · ${paquete.data.length} bytes cifrados`);
