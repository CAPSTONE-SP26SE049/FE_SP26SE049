const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  try {
    // Navigate to Login
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    // Fill credentials
    await page.type('input[type="email"]', 'nguyenductuan122004@gmail.com');
    
    // Assuming the password input is the second input or input[type="password"]
    await page.type('input[type="password"]', 'nguyenductuan1220049556@');
    
    // Click login button (the submit button)
    await page.click('button[type="submit"]');
    
    // Navigate to Roadmap Manager
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.goto('http://localhost:5173/educator/roadmap', { waitUntil: 'networkidle2' });
    
    // Wait for the "+" button to appear and click it
    await page.waitForSelector('.ant-btn-primary', { timeout: 5000 });
    
    // Let's click it using evaluation
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent && b.textContent.includes('Thêm Bài Học Mới'));
      if (addBtn) addBtn.click();
    });
    
    // Wait for 2 seconds to see if it crashes
    await new Promise(r => setTimeout(r, 2000));
    
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  } finally {
    await browser.close();
  }
})();
