const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveSafeArea, positionInSafeArea, fitFontSize } = require('../src/carouselSafeArea.cjs');

for (const layoutId of ['cinematic-concert-still', 'museum-exhibition-system']) {
  for (const textPosition of ['bottom', 'top', 'center']) {
    test(`${layoutId} legacy ${textPosition} stays inside provisional Photo Mode area`, () => {
      const area = resolveSafeArea({ layoutId, typography: { textPosition } });
      assert.deepEqual(area, { x: 100, y: 560, width: 720, height: 720 });
      assert.equal(positionInSafeArea(textPosition), {
        top: 'flex-start', center: 'center', bottom: 'flex-end',
      }[textPosition]);
      assert.ok(area.x + area.width <= 820);
      assert.ok(area.y + area.height <= 1280);
    });
  }
}

test('CJK four-line hook starts at 64 and shrinks to fit the measured box', () => {
  const measurements = [];
  const size = fitFontSize((candidate) => {
    measurements.push(candidate);
    return { width: 700, height: Math.ceil(12 * candidate * 1.25) + 30 };
  }, { width: 720, height: 700 });
  assert.equal(measurements[0], 64);
  assert.ok(size < 64);
  assert.ok(12 * size * 1.25 + 30 <= 700);
});

test('unfittable content fails rather than clipping silently', () => {
  assert.throws(() => fitFontSize(() => ({ width: 721, height: 701 }),
    { width: 720, height: 700 }), /text cannot fit without clipping/);
});

test('legacy sizeScale can reduce type but hook cannot exceed 64px', () => {
  assert.equal(fitFontSize(() => ({ width: 100, height: 100 }), { width: 720, height: 720 }, 48), 48);
  assert.equal(fitFontSize(() => ({ width: 100, height: 100 }), { width: 720, height: 720 }, 80), 64);
});

test('custom area remains inside provisional limits and has room for text', () => {
  assert.deepEqual(resolveSafeArea({ safeArea: { x: 120, y: 600, width: 680, height: 650 } }),
    { x: 120, y: 600, width: 680, height: 650 });
  for (const safeArea of [
    { x: 90, y: 560, width: 720, height: 720 },
    { x: 100, y: 500, width: 720, height: 720 },
    { x: 60, y: 560, width: 720, height: 720 },
    { x: 100, y: 560, width: 750, height: 720 },
    { x: 100, y: 560, width: 720, height: 850 },
    { x: 100, y: 560, width: 0, height: 720 },
  ]) assert.throws(() => resolveSafeArea({ safeArea }), /safeArea/);
});
