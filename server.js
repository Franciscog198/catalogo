// Servidor local: node server.js  ->  http://localhost:3000
const http = require("http"), fs = require("fs"), path = require("path");
const { createHmac, timingSafeEqual } = require("crypto");

try { fs.readFileSync(path.join(__dirname, ".env"), "utf8").split(/\r?\n/).forEach(l => {
  const m = l.match(/^\s*([A-Za-z_]+)\s*=\s*(.*?)\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}); } catch (_) {}

const DB = path.join(__dirname, "menu.local.json");
const secret = () => process.env.ADMIN_SECRET || "";
const sign = p => createHmac("sha256", secret()).update(p).digest("base64url");
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".css": "text/css", ".ico": "image/x-icon" };

function api(req, res, raw) {
  const send = (d, s = 200) => { res.writeHead(s, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(d)); };
  let b = null; try { b = JSON.parse(raw || "null"); } catch (_) {}
  if (req.method === "GET") { try { return send(JSON.parse(fs.readFileSync(DB, "utf8"))); } catch (_) { return send([]); } }
  if (req.method === "POST") {
    if (!secret() || !process.env.ADMIN_USER || !process.env.ADMIN_PASS) return send({ error: "Al servidor le faltan las variables ADMIN_USER, ADMIN_PASS o ADMIN_SECRET en el archivo .env." }, 500);
    const { user, pass } = b || {};
    if (!eq(user, process.env.ADMIN_USER) || !eq(pass, process.env.ADMIN_PASS)) return send({ error: "Usuario o contraseña incorrectos" }, 401);
    const p = String(Date.now() + 12 * 3600e3); return send({ token: p + "." + sign(p) });
  }
  if (req.method === "PUT") {
    const [p, s] = (req.headers.authorization || "").replace("Bearer ", "").split(".");
    if (!secret() || !s || !eq(s, sign(p)) || +p < Date.now()) return send({ error: "Sesión vencida" }, 401);
    if (!Array.isArray(b)) return send({ error: "Datos inválidos" }, 400);
    fs.writeFileSync(DB, JSON.stringify(b)); return send({ ok: true });
  }
  send({ error: "Método no permitido" }, 405);
}

http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  if (u === "/.netlify/functions/menu") {
    let raw = ""; req.on("data", c => raw += c); req.on("end", () => api(req, res, raw)); return;
  }
  const f = path.join(__dirname, u === "/" ? "index.html" : u);
  const rel = path.relative(__dirname, f);
  if (rel.startsWith("..") || /(^|[\\/])(\.|server\.js|menu\.local\.json|setup\.js)/.test(rel)) { res.writeHead(404); return res.end("No encontrado"); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end("No encontrado"); }
    res.writeHead(200, { "content-type": TYPES[path.extname(f).toLowerCase()] || "application/octet-stream" }); res.end(d);
  });
}).listen(3000, () => console.log("Sitio:  http://localhost:3000\nPanel:  http://localhost:3000/admin.html"));
