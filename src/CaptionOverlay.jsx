import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';

// ─────────────────────────────────────────────────────────────────────────────
// CaptionOverlay — generic captions + overlays burner for a base video.
// 1080x1920. All timing is in seconds; converted to frames with useVideoConfig().
// Reuses the sticker/outline look already used across the template repo.
// ─────────────────────────────────────────────────────────────────────────────

const FADE_MS = 200; // fade in/out duration (ms)
const FRAME_W = 1080;

const DEFAULT_FONT =
  "'KeinannMaruPOPjp', 'けいなん丸ポップ体JP', 'Noto Sans CJK JP', sans-serif";

// Full-width (≈1em) vs half-width (≈0.5em) heuristic so text width can be
// measured without a font-metrics API. CJK/kana/ideographic punctuation are
// full-width; ASCII digits/letters (e.g. "7") and Latin are half-width.
const FULL_WIDTH_RANGES = [
  [0x1100, 0x115f],
  [0x2e80, 0xa4cf],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe30, 0xfe4f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
];

const isFullWidth = (cp) => FULL_WIDTH_RANGES.some(([a, b]) => cp >= a && cp <= b);

const measureTextWidth = (text, fontSize) => {
  let em = 0;
  for (const ch of text) em += isFullWidth(ch.codePointAt(0)) ? 1 : 0.5;
  return em * fontSize;
};

// Tag geometry — the exact box the Tag component paints (same width/line-height
// criteria), so the arrow can be anchored to the text block by construction.
// Returns width (max line width), height (all lines), line height and fontSize.
const TAG_LINE_HEIGHT_RATIO = 1.25;
const tagMetrics = (tag) => {
  const fontSize = tag.fontSize ?? 38;
  const lines = tag.lines ?? [];
  const lineH = Math.round(fontSize * TAG_LINE_HEIGHT_RATIO);
  const width = lines.reduce(
    (max, line) => Math.max(max, measureTextWidth(line, fontSize)),
    0
  );
  return { fontSize, lines, lineH, width, height: lines.length * lineH };
};

// Circular text shadow → clean bold dark outline (no gaps, no bumps).
const makeCircularShadow = (radius, color, steps = 24) => {
  const s = [];
  for (let i = 0; i < steps; i++) {
    const a = (i * 2 * Math.PI) / steps;
    s.push(
      `${(Math.cos(a) * radius).toFixed(1)}px ${(Math.sin(a) * radius).toFixed(1)}px 0 ${color}`
    );
  }
  return s.join(', ');
};

// Returns {startF, endF} when the frame is inside [start, end), else null.
const windowFor = (frame, start, end, fps) => {
  const startF = Math.round(start * fps);
  const endF = Math.round(end * fps);
  if (frame < startF || frame >= endF) return null;
  return { startF, endF };
};

// Fade in over the first `fadeFrames`, fade out over the last `fadeFrames`.
const fadeOpacity = (frame, startF, endF, fadeFrames) => {
  const fadeIn = interpolate(frame, [startF, startF + fadeFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [endF - fadeFrames, endF], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return Math.min(fadeIn, fadeOut);
};

// ─── Caption — a white rounded "sticker" with dark text (natural weight) ─────
const Caption = ({ c, pill, frame, fps, fadeFrames }) => {
  const win = windowFor(frame, c.start, c.end, fps);
  if (!win) return null;
  const {
    fontSize,
    padX,
    padY,
    radiusRatio,
    centerY,
    fg,
    bg,
    fontWeight = 400, // natural weight of KeinannMaruPOPjp (Regular only)
  } = pill;

  const boxW = measureTextWidth(c.text, fontSize) + 2 * padX;
  const lineH = fontSize; // alto de línea
  const boxH = lineH + 2 * padY;
  const radius = boxH * radiusRatio;
  const opacity = fadeOpacity(frame, win.startF, win.endF, fadeFrames);

  return (
    <div
      style={{
        position: 'absolute',
        left: FRAME_W / 2 - boxW / 2, // box center at x=540
        top: centerY - boxH / 2, // box center at centerY
        width: boxW,
        height: boxH,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        borderRadius: radius,
        boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
        opacity,
      }}
    >
      <span
        style={{
          color: fg,
          fontFamily: DEFAULT_FONT,
          fontWeight,
          fontSize,
          lineHeight: `${lineH}px`,
          whiteSpace: 'nowrap',
        }}
      >
        {c.text}
      </span>
    </div>
  );
};

// ─── Tag — 2 lines of white text (natural weight) with a dark outline ───────
const Tag = ({ tag, frame, fps, fadeFrames }) => {
  const win = windowFor(frame, tag.start, tag.end, fps);
  if (!win) return null;
  const { fontSize, lines, lineH } = tagMetrics(tag);
  const fontWeight = tag.fontWeight ?? 400; // natural weight of KeinannMaruPOPjp
  const opacity = fadeOpacity(frame, win.startF, win.endF, fadeFrames);
  return (
    <div style={{ position: 'absolute', left: tag.x, top: tag.y, opacity }}>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            color: '#ffffff',
            fontFamily: DEFAULT_FONT,
            fontWeight,
            fontSize,
            lineHeight: `${lineH}px`,
            textShadow: makeCircularShadow(6, '#000000', 24),
            whiteSpace: 'nowrap',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};

// ─── Arrow — thick red downward arrow with a white outline ───────────────────
// When a `tag` is provided the arrow is anchored to the tag *by construction*:
// its horizontal center matches the tag text block center, and its top edge sits
// `gap` px (default 18, i.e. 15–20) below the tag text bottom. This recomputes
// automatically whenever tag.x / tag.y / tag.fontSize / tag.lines change.
// Optional arrow.dx / arrow.dy nudge the anchored position; without a tag, the
// legacy arrow.x / arrow.y top-left is used as-is.
const ARROW_W = 140;
const ARROW_H = 180;
const ARROW_GAP_DEFAULT = 18;

const Arrow = ({ arrow, tag, frame, fps, fadeFrames }) => {
  const win = windowFor(frame, arrow.start, arrow.end, fps);
  if (!win) return null;
  const opacity = fadeOpacity(frame, win.startF, win.endF, fadeFrames);

  let left;
  let top;
  if (tag) {
    const { width, height } = tagMetrics(tag);
    const gap = arrow.gap ?? ARROW_GAP_DEFAULT;
    const dx = arrow.dx ?? 0;
    const dy = arrow.dy ?? 0;
    const centerX = tag.x + width / 2; // text block horizontal center
    left = centerX - ARROW_W / 2 + dx;
    top = tag.y + height + gap + dy; // just below the text block bottom
  } else {
    left = arrow.x ?? 0;
    top = arrow.y ?? 0;
  }

  return (
    <svg
      width={ARROW_W}
      height={ARROW_H}
      viewBox="0 0 140 180"
      style={{ position: 'absolute', left, top, opacity }}
    >
      <polygon
        points="48,4 92,4 92,104 130,104 70,172 10,104 48,104"
        fill="#E20014"
        stroke="#ffffff"
        strokeWidth={8}
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ─── Disc — small semi-light disclaimer, centered at x, top at y ─────────────
const Disc = ({ disc, frame, fps, fadeFrames }) => {
  const win = windowFor(frame, disc.start, disc.end, fps);
  if (!win) return null;
  const fontSize = disc.fontSize ?? 26;
  const opacity = fadeOpacity(frame, win.startF, win.endF, fadeFrames);
  return (
    <div
      style={{
        position: 'absolute',
        left: disc.x,
        top: disc.y,
        transform: 'translateX(-50%)',
        opacity,
        color: 'rgba(230,230,230,0.92)',
        fontFamily: DEFAULT_FONT,
        fontWeight: 400,
        fontSize,
        lineHeight: `${Math.round(fontSize * 1.3)}px`,
        textShadow: makeCircularShadow(3, '#101010', 24),
        whiteSpace: 'nowrap',
      }}
    >
      {disc.text}
    </div>
  );
};

export const CaptionOverlay = ({
  videoSrc = 'squishy01_base.mp4',
  captions = [],
  pill = {
    fontWeight: 400,
    fontSize: 48,
    padX: 26,
    padY: 16,
    radiusRatio: 0.42,
    centerY: 505,
    fg: '#141414',
    bg: '#ffffff',
  },
  tag = null,
  arrow = null,
  disc = null,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeFrames = Math.round((FADE_MS / 1000) * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Base video (audio track is carried by OffthreadVideo) */}
      <AbsoluteFill>
        <OffthreadVideo
          src={staticFile(videoSrc)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>

      {captions.map((c, i) => (
        <Caption key={i} c={c} pill={pill} frame={frame} fps={fps} fadeFrames={fadeFrames} />
      ))}

      {tag ? <Tag tag={tag} frame={frame} fps={fps} fadeFrames={fadeFrames} /> : null}
      {arrow ? (
        <Arrow arrow={arrow} tag={tag} frame={frame} fps={fps} fadeFrames={fadeFrames} />
      ) : null}
      {disc ? <Disc disc={disc} frame={frame} fps={fps} fadeFrames={fadeFrames} /> : null}
    </AbsoluteFill>
  );
};
