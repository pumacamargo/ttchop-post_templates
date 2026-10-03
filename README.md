# ttchop overlay kit (Remotion)

Proyecto Remotion para generar overlays de video (hook con camera-shake, gráficos/stats de producto, carrusel, precio con FOMO). Ver la memoria permanente del agente (`overlays_video_task.md`) para el proceso completo del pipeline (Telegram -> guion -> imágenes -> render -> FTP/Telegram).

## Setup en una sesión nueva

```bash
git clone https://github.com/pumacamargo/cacho_inmotion /tmp/cacho_inmotion
cd /tmp/cacho_inmotion
npm install
```

Los datos de producto (imágenes, `product.json`, `product_nicknames.json`) siguen viviendo en el repo separado `https://github.com/pumacamargo/ttchop_db` — clonarlo aparte para el paso de selección de imágenes/precio.

**Requisitos del sistema (una sola vez por entorno):**
```bash
apt-get install -y fonts-noto-cjk fonts-noto-color-emoji
```
Sin esto, el texto japonés y los emojis se renderizan invisibles/como cajas vacías en el render headless — no da error, solo sale en blanco. Verificar con `fc-list | grep -i noto`.

**No tocar la versión de React** (`react`/`react-dom` fijos en `18.3.1`) — React 19 causa un crash de stack overflow silencioso en el render headless de Remotion 4.0.488.

## Estructura

- `src/OverlayKit.jsx` — todos los componentes reutilizables: `Phase`, `envelope`, `PopText`, `SlideText`, `CameraShake`, `AnimatedList`, `AreaChart`, `ComparisonChart`, `NotificationPop`, `ProgressSteps`, `SplitScreen`, `GalleryGrid`, `CardFlip`, `MasonryGallery`, `RotatingCarousel`, `PriceShake`, `makeBaseTextStyle`, `centerCard`.
- `src/Root.jsx` — registra una `<Composition>` por video/producto (id = `ttchop-{productId}`, sufijo `-v2` etc. si se rehace el mismo producto).
- `src/<Nombre>Overlay.jsx` — una composición por producto ya entregado (sirven de referencia/plantilla para el siguiente).
- `public/` — NO se sube al repo (imágenes y video de cada producto se descargan/copian frescos en cada sesión, ver guía).

## Para un producto nuevo

1. Crear `public/carouselN/` con las imágenes elegidas del repo (`products/{productId}/images/`) y copiar el video descargado a `public/video_overlayN.mp4`.
2. Copiar un `src/<Nombre>Overlay.jsx` existente como plantilla, cambiar `ACCENT` (color del FONDO del video, no del empaque — extraer un frame y mirarlo), textos, timings, imágenes.
3. Agregar la `<Composition>` en `Root.jsx` con id único `ttchop-{productId}`.
4. Render de prueba corto (`--frames=0-200` o similar) antes del render completo.
5. Render completo: `npx remotion render index.ts <composition-id> <output.mp4> --codec=h264`.

## Reglas de estilo (resumen — la guía completa tiene el detalle)

- Estructura de 3 fases: Hook (0-3s, camera-shake fuerte `amplitude=45 decayFrames=22`) → Producto (~3-4s por template, alternar stats/imagen) → CTA (precio + FOMO + disclaimer).
- Tarjetas al 1.5x (`centerCard` con `scale(1.5)`), posicionadas en el tercio superior (`top: '28%'`), para dejar el video visible en el centro/abajo (formato TikTok).
- `PriceShake` ya incluye el disclaimer `※価格は予告なく変更される場合があります` automáticamente — no agregarlo a mano.
- CRF de exportación: 26 (`remotion.config.ts`) — buen balance calidad/tamaño para TikTok.
- Nunca inventar descuentos: si `product.json` no tiene `price.discount`, usar otra señal real (`social_proof.sales_volume`, `free_shipping`, rating) en el `fomo`.

## Pipeline con ttchop-server (collage + overlay)

El flujo completo cuando se usa ttchop-server para generar el collage base:

```
1. POST /collage/dialogue { product, collageTemplate, language }
   ← { dialogue: "script de voz..." }

2. POST /collage/create { voiceId, dialogue, sessions, renderId, ... }
   ← { videoUrl: "https://lemonsushi.com/.../collage.mp4" }

3. POST ttchop-post /render { videoUrl, productUrl, market? }
   ← MP4 con overlay animado
```

> ⚠️ **`sessions` en `/collage/create` DEBE incluir `downloadUrl` en cada video.** Si se pasan solo IDs, el LLM que genera el recipe de ffmpeg inventa URLs `gs://` incorrectas y el collage falla.

**Voice IDs de ElevenLabs:**
| Mercado | Voz | ID |
|---------|-----|----|
| 🇯🇵 JP | Announcer (masculino) | `gU0LNdkMOQCOrPrwtbee` |
| 🇲🇽 MX | Jessica (femenino) | `cgSgspJ2msm6clMCkdW9` |

### Overlays hardcodeados (timing personalizado)

Para productos con overlay a medida (ej. `XrealV4Overlay.jsx`), el proceso es:
1. Ajustar timings en el `.jsx` según la duración real del collage (ej. escalar de 39s → 25s si el collage quedó a 1.3x)
2. Actualizar `durationInFrames` en `Root.jsx` (duración en segundos × 25 fps)
3. Render directo sin pasar por ttchop-post: `npx remotion render index.ts <composition-id> /tmp/output.mp4`

## Disclaimer overlay para videos AI (ffmpeg)

Todo video generado con IA (Seedance, Veo3) debe llevar un disclaimer en la parte superior para evitar publicidad engañosa sobre tamaño/apariencia del producto.

**Comando:**
```bash
FONT="/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"

# Línea 1: nombre/categoría del producto (cambiar por producto)
echo -n "24.5インチタブレット" > /tmp/d1.txt
# Líneas 2-3: disclaimer fijo (siempre igual)
echo -n "※動画内のサイズは実際の商品と" > /tmp/d2.txt
echo -n "異なる場合があります。仕様は商品説明をご確認ください。" > /tmp/d3.txt

/usr/bin/ffmpeg -y -i input.mp4 \
  -vf "drawtext=fontfile='$FONT':textfile=/tmp/d1.txt:fontsize=15:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=10,
       drawtext=fontfile='$FONT':textfile=/tmp/d2.txt:fontsize=13:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=30,
       drawtext=fontfile='$FONT':textfile=/tmp/d3.txt:fontsize=13:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=48" \
  -codec:a copy output_disclaimer.mp4
```

**Notas importantes:**
- Usar `/usr/bin/ffmpeg` (sistema), NO el de Homebrew — el de Homebrew no tiene libfreetype y no soporta `drawtext`
- El texto en archivos `.txt` evita problemas de escape con caracteres japoneses en la terminal
- Línea 1 cambia por producto (categoría en japonés). Líneas 2-3 son siempre el mismo disclaimer fijo
- Posición: arriba centrado (`y=10, 30, 48`)
- El video de Seedance sale en 496×864 (480p) — a esa resolución fontsize 15/13 queda bien

## Portadas (thumbnails)

- Siempre extraer el frame del **collage base** (`collage/YYYY-MM-DD_JOBID.mp4`) o del AI video — nunca del overlay.
- El overlay tiene gráficos encima que tapan el frame limpio.
- El URL del collage base aparece en los logs de PM2 como `[JOBID] Public URL` antes de que el overlay sobreescriba el videoUrl en Firestore.
- Texto siempre en inglés (sin importar si el video es JP o MX).

```bash
python3 /root/projects/ttchop/ttchop-server/scripts/thumbnail_maker.py \
  "<collage_url>" "Product Name in English" /tmp/thumb.jpg
```

## Entrega por Telegram

- Mandar el MP4 como archivo adjunto local (`files: [path]`) via reply tool — Telegram lo muestra **inline como video**, no como archivo descargable.
- Si antes llegaba como archivo: era porque se mandaba el URL de Firebase (texto). Adjunto local = video inline.
- Regla: adjunto local siempre. FTP/Firebase URL solo si el archivo supera ~50MB.

## Cambios 2026-08-06

### Bugs corregidos en ttchop (frontend)

- **Renders crash**: `StatusBadge` no manejaba el status `'running'` → crash. Fix: ttchop-server ahora escribe `'processing'`.
- **Veo3 nunca llegaba a kie.ai**: la comparación en databaseService era `=== 'veo3'` (minúscula) pero el dropdown mandaba `'Veo3'` (capital). Fix: `.toLowerCase()` en la comparación. Esto afectaba SERVER mode — prod/test van por n8n que hacía su propia comparación con `'Veo3'` correctamente.
- **Scheduler bloqueado por índice Firestore**: se desplegó un índice compuesto en `scheduled_renders` que Firestore rechazaba mientras construía. Fix: eliminar el índice compuesto — el scheduler solo necesita filtro de campo único (`status == 'pending'`).
- **CalendarView en inglés solamente**: días y meses estaban hardcodeados en inglés. Fix: i18n completo con claves separadas por comas para arrays.
- **Collage + overlay encadenado**: nuevo checkbox en modo SERVER de la vista Collage para activar overlay automático al terminar el collage.

### Formato correcto de kie.ai para SERVER mode

Verificado contra el workflow de n8n (ttchop_webapp.json):
- Veo3: `imageUrls: [url]` (array con 1+ imágenes) al endpoint `/api/v1/veo/generate`
- Seedance: `reference_image_urls: [images[0]]` (1 imagen) dentro de `input{}` al endpoint `/api/v1/jobs/createTask`
- kie.ai devuelve HTTP 200 aunque haya error — verificar `data.code === 200`
