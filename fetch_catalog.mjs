// Descarga el catálogo online de Mercadona y lo guarda en catalogo.json.
// Uso: node scripts/fetch_catalog.mjs   (Node 18 o superior, sin dependencias)
//
// Mercadona no tiene API oficial: se usan los endpoints internos de tienda.mercadona.es.
// El catálogo depende del almacén de la zona de reparto (Sevilla = "svq1").
import { readFile, writeFile } from "node:fs/promises";

const BASE = "https://tienda.mercadona.es/api";
const WH = process.env.MERCADONA_WH || "svq1";
const Q = `lang=es&wh=${WH}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path, tries = 4) {
  const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}${Q}`;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        headers: { accept: "application/json", "user-agent": "lista-compra-personal/1.0" },
      });
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
    } catch {}
    await sleep(1000 * (i + 1));
  }
  throw new Error("No se pudo pedir " + path);
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) await fn(items[i++]);
    })
  );
}

const MARCAS_PROPIAS = ["Hacendado", "Deliplus", "Bosque Verde", "Compy", "Delisana"];
const marcaDesdeNombre = (n) => MARCAS_PROPIAS.find((m) => n.toLowerCase().includes(m.toLowerCase())) || "";

// Marcas ya conocidas de ejecuciones anteriores (evita pedir el detalle de nuevo)
let previos = {};
try {
  const viejo = JSON.parse(await readFile("catalogo.json", "utf8"));
  previos = Object.fromEntries(viejo.productos.map((p) => [p.id, p]));
} catch {}

const top = await get("/categories/");
const grupos = [];
const out = new Map();

for (const g of top.results) {
  const gi = grupos.push(g.name) - 1;
  for (const sub of g.categories) {
    const d = await get(`/categories/${sub.id}/`);
    await sleep(120);
    if (!d) continue;
    for (const cat of d.categories ?? []) {
      for (const p of cat.products ?? []) {
        const pi = p.price_instructions ?? {};
        const tam = pi.unit_size && pi.size_format ? `${pi.unit_size} ${pi.size_format}` : "";
        out.set(String(p.id), {
          id: String(p.id),
          n: p.display_name,
          b: previos[String(p.id)]?.b ?? "",
          f: [p.packaging, tam].filter(Boolean).join(" · "),
          p: Number(pi.unit_price) || 0,
          u: pi.reference_price && pi.reference_format ? `${String(pi.reference_price).replace(".", ",")} €/${pi.reference_format}` : "",
          i: p.thumbnail || "",
          g: gi,
        });
      }
    }
  }
}

// Protección: si Mercadona devuelve algo raro, no se sobrescribe el catálogo bueno
if (out.size < 500) throw new Error(`Solo ${out.size} productos: se conserva el catálogo anterior.`);

// Marca de cada producto nuevo (el listado no la incluye; el detalle sí)
const sinMarca = [...out.values()].filter((p) => !p.b);
console.log(`${out.size} productos; pidiendo marca de ${sinMarca.length} nuevos...`);
await pool(sinMarca, 4, async (p) => {
  try {
    const d = await get(`/products/${p.id}/`, 2);
    p.b = (d?.brand || "").trim();
  } catch {}
  if (!p.b) p.b = marcaDesdeNombre(p.n);
  await sleep(100);
});

const productos = [...out.values()].sort((a, b) => a.g - b.g || a.n.localeCompare(b.n, "es"));
const actualizado = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
await writeFile("catalogo.json", JSON.stringify({ actualizado, almacen: WH, grupos, productos }));
console.log(`Listo: ${productos.length} productos (${actualizado}).`);
