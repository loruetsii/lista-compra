# Compra: lista de la compra compartida con el catálogo de Mercadona

Web app (PWA) para iPhone. Gratis. Muestra todo el catálogo de Mercadona con foto, marca y precio, y la lista se sincroniza entre vuestros dos móviles.

## Cómo está montada

| Pieza | Para qué | Coste |
|---|---|---|
| GitHub Pages | Aloja la web | Gratis (repositorio público) |
| GitHub Actions | Descarga el catálogo cada lunes y lo guarda en `catalogo.json` | Gratis |
| Supabase | Guarda la lista y la sincroniza al momento | Gratis (plan Free) |

## Puesta en marcha (unos 20 minutos)

### 1. Subir el proyecto a GitHub
1. Crea una cuenta en github.com si no tienes.
2. Crea un repositorio **público** llamado `lista-compra`.
3. En el repositorio: *Add file → Upload files* y arrastra todo el contenido de esta carpeta, incluida la carpeta `.github` (en el Mac se ve con Cmd + Mayús + punto).

### 2. Activar la web
*Settings → Pages → Build and deployment*: Source = *Deploy from a branch*, rama `main`, carpeta `/ (root)`. Tu web será `https://TU_USUARIO.github.io/lista-compra/`.

### 3. Descargar el catálogo
1. *Settings → Actions → General → Workflow permissions*: marca **Read and write permissions** y guarda.
2. Pestaña *Actions → Actualizar catálogo → Run workflow*.
3. Tarda unos 10 minutos la primera vez (pide la marca de cada producto). Al terminar aparece un commit con `catalogo.json` y la web se actualiza sola.
4. Desde entonces se repite cada lunes a las 5:00 UTC. Las siguientes veces tarda menos, porque solo pide la marca de los productos nuevos.

### 4. Activar la sincronización
1. Crea un proyecto gratis en supabase.com.
2. *SQL Editor*: pega el contenido de `supabase.sql` y pulsa *Run*.
3. *Project settings → API*: copia **Project URL** y **anon public key**.
4. En GitHub, edita `config.js` y pégalos entre las comillas.

### 5. Instalar en los iPhone
1. Abre la web en **Safari** → botón Compartir → *Añadir a pantalla de inicio*.
2. Abre la app desde el icono. La primera vez ofrece *Crear lista nueva*.
3. Toca el indicador de arriba a la derecha para ver el **código** y envíaselo a tu novia.
4. Ella instala la app igual y, al abrirla, escribe el código en *Unirme*.

> En iPhone, la app instalada en la pantalla de inicio no comparte datos con Safari. Por eso lo fiable es introducir el código dentro de la app instalada, en vez de abrir el enlace.

## Si algo no sale bien

- **El catálogo sale vacío o raro:** el almacén se configura con la variable `MERCADONA_WH` (por defecto `svq1`, Sevilla). El catálogo online depende de la zona de reparto, no de una tienda concreta. Se puede probar otro valor en `.github/workflows/catalogo.yml` añadiendo `env: MERCADONA_WH: ...` al paso del script.
- **La acción falla:** Mercadona puede bloquear las IP de GitHub o cambiar su API. Se puede ejecutar a mano desde tu ordenador con `node scripts/fetch_catalog.mjs` y subir el `catalogo.json` resultante. Si la API cambia, hay que ajustar `scripts/fetch_catalog.mjs`.
- **La lista deja de sincronizar:** el plan gratuito de Supabase pausa los proyectos tras una semana sin actividad. Se reactiva desde su panel.

## Privacidad

Cualquiera que conozca el código de la lista puede ver y modificarla. El código es largo y aleatorio, así que basta con no compartirlo. La clave `anon` de Supabase es pública por diseño.

## Aviso

Mercadona no ofrece API oficial. El script usa los mismos endpoints que su web, una vez por semana y con pausas entre peticiones. Úsalo solo para uso personal.
