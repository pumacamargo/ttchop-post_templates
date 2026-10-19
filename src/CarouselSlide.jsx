import React, { useLayoutEffect, useRef } from 'react';
import { AbsoluteFill, Img, staticFile, delayRender, continueRender, cancelRender } from 'remotion';
import { resolveSafeArea, positionInSafeArea, fitFontSize } from './carouselSafeArea.cjs';
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

// La franja visual acompaña la columna segura; no invade controles ni caption.
function gradientOverlayStyle(area) {
  return {
    position: 'absolute',
    left: area.x - 20,
    top: area.y - 40,
    width: area.width + 40,
    height: area.height + 80,
    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.53) 62%, rgba(0,0,0,0) 100%)',
  };
}

function textBoxStyleFor(background) {
  if (background === 'blur') return { backdropFilter: 'blur(14px)', background: 'rgba(0,0,0,0.35)', padding: '24px', borderRadius: 12 };
  if (background === 'band') return { background: 'rgba(250, 247, 240, 0.92)', padding: '24px', borderRadius: 4 };
  return {};
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
  const area = resolveSafeArea(style);
  const boxRef = useRef(null);
  const textRef = useRef(null);

  // Medir con Chrome y las fuentes ya cargadas, no estimar caracteres CJK.
  // Remotion no captura el PNG hasta que la caja real cabe en el área segura.
  useLayoutEffect(() => {
    const handle = delayRender('Fitting carousel text');
    let active = true;
    document.fonts.ready.then(() => {
      if (!active) { continueRender(handle); return; }
      const box = boxRef.current;
      const textNode = textRef.current;
      fitFontSize((size) => {
        textNode.style.fontSize = `${size}px`;
        return {
          width: Math.max(box.scrollWidth, textNode.scrollWidth + (background === 'band' || background === 'blur' ? 48 : 0)),
          height: box.scrollHeight,
        };
      }, area, 64 * (typography.sizeScale || 1) * (ROLE_SIZE_SCALE[role] || 1));
      box.dataset.fittedFontSize = textNode.style.fontSize;
      const rect = box.getBoundingClientRect();
      if (rect.left < area.x - 1 || rect.right > area.x + area.width + 1 ||
          rect.top < area.y - 1 || rect.bottom > area.y + area.height + 1 ||
          textNode.scrollWidth > textNode.clientWidth + 1) {
        throw new Error('carousel text box exceeds provisional safeArea');
      }
      continueRender(handle);
    }).catch((error) => cancelRender(error));
    return () => { active = false; };
  }, [text, role, fontFamily, weight, textCase, tracking, background, typography.sizeScale, area.x, area.y, area.width, area.height]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#111' }}>
      <AbsoluteFill>
        <Img src={staticFile(bg)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>

      {background === 'gradient' && <div style={gradientOverlayStyle(area)} />}

      {/* Numeración fuera de la columna y de los controles del lado derecho. */}
      <div
        style={{
          position: 'absolute',
          top: 460,
          left: area.x,
          color: 'rgba(255,255,255,0.85)',
          fontFamily: CJK_SANS,
          fontSize: 32,
          textShadow: '0 1px 6px rgba(0,0,0,0.6)',
          letterSpacing: 2,
        }}
      >
        {slideIndex + 1}/{total}
      </div>

      <div
        data-testid="carousel-safe-area"
        style={{
          position: 'absolute',
          left: area.x,
          top: area.y,
          width: area.width,
          height: area.height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: positionInSafeArea(textPosition),
        }}
      >
        <div
          ref={boxRef}
          data-testid="carousel-text-box"
          style={{
            boxSizing: 'border-box',
            flexShrink: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            ...textBoxStyleFor(background),
          }}
        >
          <div
            ref={textRef}
            data-testid="carousel-text"
            style={{
              fontFamily,
              fontWeight: weight,
              textTransform: textCase === 'uppercase' ? 'uppercase' : 'none',
              color,
              fontSize: 64,
              lineHeight: 1.25,
              letterSpacing: tracking,
              textAlign: 'center',
              textWrap: 'balance',
              width: '100%',
              overflowWrap: 'anywhere',
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
      </div>
    </AbsoluteFill>
  );
};
