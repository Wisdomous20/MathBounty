const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(4000);
  
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { found: false };
    const gl = canvas.getContext('webgl');
    return {
      found: true,
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
      webgl: !!gl,
      paramVendor: gl ? gl.getParameter(gl.VENDOR) : null,
      paramRenderer: gl ? gl.getParameter(gl.RENDERER) : null,
    };
  });
  console.log('Canvas info:', JSON.stringify(canvasInfo, null, 2));
  
  await page.screenshot({ path: 'landing-debug.png' });
  console.log('Screenshot saved to landing-debug.png');
  
  await browser.close();
})();
