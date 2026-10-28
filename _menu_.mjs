//import { getStore } from "@netlify/blobs";
//import { createHmac, timingSafeEqual } from "node:crypto";
//
//const secret = () => process.env.ADMIN_SECRET || "";
//const sign = p => createHmac("sha256", secret()).update(p).digest("base64url");
//const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
//const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
//
//export default async (req) => {
//  const store = getStore("smash");
//  if (req.method === "GET") return json((await store.get("menu", { type: "json" })) || []);
//
//  if (req.method === "POST") {
//    const { user, pass } = await req.json().catch(() => ({}));
//    if (!secret() || !process.env.ADMIN_USER || !process.env.ADMIN_PASS) return json({ error: "Al servidor le faltan las variables ADMIN_USER, ADMIN_PASS o ADMIN_SECRET." }, 500);
//    if (!eq(user, process.env.ADMIN_USER) || !eq(pass, process.env.ADMIN_PASS)) return json({ error: "Usuario o contraseña incorrectos" }, 401);
//    const p = String(Date.now() + 12 * 3600e3);
//    return json({ token: p + "." + sign(p) });
//  }
//
//  if (req.method === "PUT") {
//    const [p, s] = (req.headers.get("authorization") || "").replace("Bearer ", "").split(".");
//    if (!secret() || !s || !eq(s, sign(p)) || +p < Date.now()) return json({ error: "Sesión vencida" }, 401);
//    const m = await req.json().catch(() => null);
//    if (!Array.isArray(m)) return json({ error: "Datos inválidos" }, 400);
//    await store.setJSON("menu", m);
//    return json({ ok: true });
//  }
//  return json({ error: "Método no permitido" }, 405);
//};

