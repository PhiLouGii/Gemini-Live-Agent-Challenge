import { chromium, Browser, Page } from 'playwright';

let browser: Browser | null = null;
let page: Page | null = null;

export async function initBrowser(): Promise<void> {
  browser = await chromium.launch({ headless: false }); // false so we can see it
  const context = await browser.newContext();
  page = await context.newPage();
  await page.goto('https://www.google.com');
  console.log('🌐 Browser launched!');
}

export async function getScreenshot(): Promise<string> {
  if (!page) throw new Error('Browser not initialized');
  const buffer = await page.screenshot({ type: 'png' });
  return buffer.toString('base64');
}

export async function navigateTo(url: string): Promise<void> {
  if (!page) throw new Error('Browser not initialized');
  await page.goto(url);
}

export async function getPage(): Promise<Page> {
  if (!page) throw new Error('Browser not initialized');
  return page;
}

export async function closeBrowser(): Promise<void> {
  if (browser) await browser.close();
}