import { chromium, Browser, Page } from 'playwright';

let browser: Browser | null = null;
let page: Page | null = null;

export async function initBrowser(): Promise<void> {
  browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1280,720',
      '--disable-dev-shm-usage',
    ]
  });

  const context = await browser.newContext({
    locale: 'en-US',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  });

  // Hide automation flags
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    (window as any).chrome = { runtime: {} };
  });

  page = await context.newPage();
  await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
  console.log('🌐 Browser launched!');
}

export async function getScreenshot(): Promise<string> {
  if (!page) throw new Error('Browser not initialized');
  const buffer = await page.screenshot({ type: 'png' });
  return buffer.toString('base64');
}

export async function navigateTo(url: string): Promise<void> {
  if (!page) throw new Error('Browser not initialized');
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}

export async function getPage(): Promise<Page> {
  if (!page) throw new Error('Browser not initialized');
  return page;
}

export async function closeBrowser(): Promise<void> {
  if (browser) await browser.close();
}