// Provisional art-safe zone for 1080x1920 organic Photo Mode previews.
// Not an official TikTok specification: verify each post with the app preview.
const DEFAULT_AREA = Object.freeze({ x: 100, y: 560, width: 720, height: 720 });

function resolveSafeArea(style = {}) {
  const area = { ...DEFAULT_AREA, ...(style.safeArea || {}) };
  const { x, y, width, height } = area;
  if (![x, y, width, height].every(Number.isFinite) ||
      x < 100 || y < 560 || width < 200 || height < 200 ||
      x + width > 820 || y + height > 1280) {
    throw new Error('safeArea must fit within provisional x=100..820, y=560..1280');
  }
  return area;
}

function positionInSafeArea(position) {
  return position === 'top' ? 'flex-start' : position === 'center' ? 'center' : 'flex-end';
}

function fitFontSize(measure, bounds, maxSize = 64) {
  for (let size = Math.min(64, Math.max(16, Math.round(maxSize))); size >= 16; size--) {
    const { width, height } = measure(size);
    if (width <= bounds.width && height <= bounds.height) return size;
  }
  throw new Error('text cannot fit without clipping in safeArea');
}

module.exports = { resolveSafeArea, positionInSafeArea, fitFontSize };
