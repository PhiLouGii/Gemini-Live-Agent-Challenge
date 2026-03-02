import { initBrowser, closeBrowser } from './screenshot';
import { runAgent } from './agent';

async function test() {
  await initBrowser();
  
  await runAgent(
    'Search for flights from Nairobi to Paris',
    'https://www.google.com/travel/flights'
  );

  // Keep browser open for 5 seconds so we can see the result
  await new Promise(r => setTimeout(r, 5000));
  await closeBrowser();
}

test().catch(console.error);