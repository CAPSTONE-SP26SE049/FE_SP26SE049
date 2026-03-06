const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
    // Navigate to Login
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'nguyenductuan122004@gmail.com');
    await page.type('input[type="password"]', 'nguyenductuan1220049556@');
    await page.click('button[type="submit"]');
    
    // Navigate to Roadmap Manager
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.goto('http://localhost:5173/educator/roadmap', { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('.ant-btn-primary', { timeout: 5000 });
    
    // Hover over the primary button
    await page.hover('.ant-btn-primary');
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({ path: '/Users/penpen1112003/.gemini/antigravity/brain/6e13c16b-3ac6-43ea-8476-8dc22b14f0a2/hover_button_screenshot.png' });
    console.log("Screenshot taken: hover_button_screenshot.png");
    
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  } finally {
    await browser.close();
  }
})();
