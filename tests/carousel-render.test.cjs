const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bundle } = require('@remotion/bundler');
const { selectComposition, renderStill } = require('@remotion/renderer');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const asset = `ttc58_test_${process.pid}.png`;
const png = path.join(root, 'public', asset);
const outputDir = path.join(process.env.TMPDIR || '/root/carousel-ttc58-previews', `ttc58-tests-${process.pid}`);

// Render en Chromium real: el componente cancela el render si su caja medida
// excede la zona segura; así se prueban glifos CJK, wrapping y fuentes reales.
test('both layouts render CJK hooks and long text without leaving the safe area', { timeout: 180000 }, async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64'));
  try {
    const serveUrl = await bundle({ entryPoint: path.join(root, 'index.ts') });
    const cases = [
      ['cinematic-concert-still', 'hook', '本当に必要なものは\nこれだけだった'],
      ['cinematic-concert-still', 'hook', 'この商品を試して初めて気づいたことがあります。\n忙しい毎日でも使いやすさは妥協しなくていい。\n小さな工夫で暮らしが変わるかもしれません。\n最後まで見て違いを確かめてください。'],
      ['museum-exhibition-system', 'body', '毎日の暮らしを\n少しだけ心地よく\n使い続けたくなる\n理由を見つけました'],
      ['museum-exhibition-system', 'hook', 'こんなにシンプルなのに驚くほど使いやすい。\nいつもの時間がもっと快適になる理由を\n実際に試してじっくり確かめました。\nあなたにもその違いを感じてほしいです。'],
    ];
    for (const [index, [layoutId, role, text]] of cases.entries()) {
      const inputProps = { bg: asset, text, role, style: { layoutId, typography: { textPosition: 'bottom' } } };
      const composition = await selectComposition({ serveUrl, id: 'CarouselSlide', inputProps });
      const output = path.join(outputDir, `${layoutId}-${role}-${index}.png`);
      await renderStill({ composition, serveUrl, output, inputProps, imageFormat: 'png', logLevel: 'error' });
      const image = fs.readFileSync(output);
      assert.equal(image.readUInt32BE(16), 1080);
      assert.equal(image.readUInt32BE(20), 1920);
    }
  } finally {
    fs.rmSync(png, { force: true });
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});
