const { getStore, connectLambda } = require("@netlify/blobs");
const { createHmac, timingSafeEqual } = require("node:crypto");

const secret = () => process.env.ADMIN_SECRET || "";
const sign = p => createHmac("sha256", secret()).update(p).digest("base64url");
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
const json = (d, s = 200) => ({ statusCode: s, headers: { "content-type": "application/json", "cache-control": "no-store" }, body: JSON.stringify(d) });
const body = e => { try { return JSON.parse(e.isBase64Encoded ? Buffer.from(e.body, "base64").toString() : e.body || "null"); } catch (_) { return null; } };

exports.handler = async (event) => {
  connectLambda(event);
  const store = getStore("smash");

  if (event.httpMethod === "GET") return json((await store.get("menu", { type: "json" })) || []);

  if (event.httpMethod === "POST") {
    const { user, pass } = body(event) || {};
    if (!secret() || !process.env.ADMIN_USER || !process.env.ADMIN_PASS) return json({ error: "Al servidor le faltan las variables ADMIN_USER, ADMIN_PASS o ADMIN_SECRET." }, 500);
    if (!eq(user, process.env.ADMIN_USER) || !eq(pass, process.env.ADMIN_PASS)) return json({ error: "Usuario o contraseña incorrectos" }, 401);
    const p = String(Date.now() + 12 * 3600e3);
    return json({ token: p + "." + sign(p) });
  }

  if (event.httpMethod === "PUT") {
    const [p, s] = (event.headers.authorization || "").replace("Bearer ", "").split(".");
    if (!secret() || !s || !eq(s, sign(p)) || +p < Date.now()) return json({ error: "Sesión vencida" }, 401);
    const m = body(event);
    if (!Array.isArray(m)) return json({ error: "Datos inválidos" }, 400);
    await store.setJSON("menu", m);
    return json({ ok: true });
  }
  return json({ error: "Método no permitido" }, 405);
};
