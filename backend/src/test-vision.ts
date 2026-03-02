import { initBrowser, getScreenshot, closeBrowser } from './screenshot';
import { analyzeScreenshot } from './gemini';

async function test() {
  console.log(' Starting vision test...');
  
  await initBrowser();
  console.log(' Taking screenshot...');
  
  const screenshot = await getScreenshot();
  console.log(' Sending to Gemini...');
  
  const response = await analyzeScreenshot(screenshot, 'I want to search for flights to Paris');
  console.log('\n Grandma Mode says:\n');
  console.log(response);
  
  await closeBrowser();
}

test().catch(console.error);