import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { loadFont as loadBebasNeue, fontFamily as bebasNeueFamily } from '@remotion/google-fonts/BebasNeue';
import { loadFont as loadPlayfairDisplay, fontFamily as playfairDisplayFamily } from '@remotion/google-fonts/PlayfairDisplay';

// weights/subsets acotados a lo que realmente usan los 2 layouts — si no, Remotion
// hace ~48 requests por familia (todas las variantes) en cada render.
loadBebasNeue('normal', { weights: ['400'], subsets: ['latin', 'latin-ext'] });
loadPlayfairDisplay('normal', { weights: ['500', '700'], subsets: ['latin', 'latin-ext'] });

// Fuentes CJK ya instaladas en el VPS (plan TTC-55 §0.7: Noto Sans/Serif CJK JP,
// IPAGothic). Chrome hace fallback automático a estas para los glifos japoneses
// dentro del MISMO bloque de texto (kinsoku shori incluido) — no hace falta cargar
// nada de Google Fonts para japonés, ni partir el salto de línea a mano.
const CJK_SANS = "'Noto Sans CJK JP', 'IPAGothic', sans-serif";
const CJK_SERIF = "'Noto Serif CJK JP', serif";

// Cada estilo de carrusel (carousel_style template, plan §5) apunta a un layoutId.
// El template SOLO parametriza este layout (fuentes/colores/posición vía
// `typography`) — agregar un estilo nuevo casi nunca requiere código nuevo, salvo
// que de verdad sea una composición visual distinta (ahí sí se agrega otra entrada
// aquí y en LAYOUT_IDS). Fase 2 implementa 2 de los 4 del plan; los otros 2 quedan
// para la Fase 5 (TTC-56 fases 0-5).
const LAYOUTS = {
  'cinematic-concert-still': {
    fontFamily: `'${bebasNeueFamily}', ${CJK_SANS}`,
    defaultWeight: 400,
    defaultCase: 'uppercase',
    defaultColor: '#ffffff',
    defaultAccentColor: '#ff3df0',
    defaultBackground: 'gradient',
    defaultTextPosition: 'bottom',
    defaultTracking: 2,
  },
  'museum-exhibition-system': {
    fontFamily: `'${playfairDisplayFamily}', ${CJK_SERIF}`,
    defaultWeight: 500,
    defaultCase: 'none',
    defaultColor: '#2b2622',
    defaultAccentColor: '#8a7a5c',
    defaultBackground: 'band',
    defaultTextPosition: 'bottom',
    defaultTracking: 0.5,
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

const ROLE_SIZE_SCALE = { hook: 1.25, cta: 1.1, body: 1 };

// 'gradient' es una franja independiente detrás de TODO el bloque de texto (no solo
// su altura exacta), para que el degradado se vea bien sin importar cuántas líneas
// ocupe el texto. 'band'/'blur' en cambio envuelven solo la caja de texto — ver
// textBoxStyleFor, que es lo que se le aplica al <div> de contenido, no al frame.
function gradientOverlayStyle(textPosition) {
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    ...(textPosition === 'top' ? { top: 0, height: '42%' } : { bottom: 0, height: '48%' }),
    background:
      textPosition === 'top'
        ? 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)'
        : 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
  };
}

function textBoxStyleFor(background) {
  if (background === 'blur') return { backdropFilter: 'blur(14px)', background: 'rgba(0,0,0,0.35)', padding: '40px 56px', borderRadius: 12 };
  if (background === 'band') return { background: 'rgba(250, 247, 240, 0.92)', padding: '40px 56px', borderRadius: 4 };
  return {};
}

function positionStyleFor(textPosition) {
  if (textPosition === 'top') return { top: 0, justifyContent: 'flex-start', paddingTop: 140 };
  if (textPosition === 'center') return { top: 0, height: '100%', justifyContent: 'center' };
  return { bottom: 0, justifyContent: 'flex-end', paddingBottom: 140 }; // default 'bottom'
}

// Still 1080x1920 (9:16, D6). `bg` es un nombre de archivo YA descargado a public/
// por ttchop-post antes de llamar a renderStill (CORS bloquea URLs remotas en
// Remotion headless, mismo patrón que downloadVideo en ttchop-post/pipeline/render.js).
export const CarouselSlide = ({ bg, text = '', role = 'body', slideIndex = 0, total = 1, style = {} }) => {
  const layout = LAYOUTS[style.layoutId] || LAYOUTS['cinematic-concert-still'];
  const typography = style.typography || {};

  const fontFamily = typography.fontFamily || layout.fontFamily;
  const weight = typography.weight || layout.defaultWeight;
  const textCase = typography.case || layout.defaultCase;
  const color = typography.color || layout.defaultColor;
  const accentColor = typography.accentColor || layout.defaultAccentColor;
  const background = typography.background || layout.defaultBackground;
  const textPosition = typography.textPosition || layout.defaultTextPosition;
  const tracking = typography.tracking ?? layout.defaultTracking;
  const sizeScale = (typography.sizeScale || 1) * (ROLE_SIZE_SCALE[role] || 1);
  const baseFontSize = Math.round(64 * sizeScale);

  return (
    <AbsoluteFill style={{ backgroundColor: '#111' }}>
      <AbsoluteFill>
        <Img src={staticFile(bg)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>

      {background === 'gradient' && <div style={gradientOverlayStyle(textPosition)} />}

      {/* Numeración n/N opcional (plan §8.3) — discreta, esquina superior derecha */}
      <div
        style={{
          position: 'absolute',
          top: 56,
          right: 56,
          color: 'rgba(255,255,255,0.85)',
          fontFamily: CJK_SANS,
          fontSize: 32,
          textShadow: '0 1px 6px rgba(0,0,0,0.6)',
          letterSpacing: 2,
        }}
      >
        {slideIndex + 1}/{total}
      </div>

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 80px',
          ...positionStyleFor(textPosition),
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '100%',
            ...textBoxStyleFor(background),
          }}
        >
          <div
            style={{
              fontFamily,
              fontWeight: weight,
              textTransform: textCase === 'uppercase' ? 'uppercase' : 'none',
              color,
              fontSize: baseFontSize,
              lineHeight: 1.25,
              letterSpacing: tracking,
              textAlign: 'center',
              textWrap: 'balance',
              maxWidth: '100%',
              whiteSpace: 'pre-wrap',
              textShadow: background === 'none' ? '0 2px 16px rgba(0,0,0,0.7)' : 'none',
            }}
          >
            {text}
          </div>
          {role === 'hook' && (
            <div
              style={{
                marginTop: 24,
                width: 96,
                height: 6,
                background: accentColor,
                borderRadius: 3,
              }}
            />
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
