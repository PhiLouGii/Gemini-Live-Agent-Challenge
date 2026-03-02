import { getScreenshot, initBrowser, navigateTo } from './screenshot';
import { getNextAction } from './gemini';
import { executeAction } from './actions';

export async function runAgent(
  userRequest: string,
  startUrl: string = 'https://www.google.com',
  onNarration?: (text: string) => void
): Promise<void> {
  
  await navigateTo(startUrl);
  
  const previousActions: string[] = [];
  let isDone = false;
  let steps = 0;
  const maxSteps = 10; // safety limit

  console.log(`\n🧓 Starting task: "${userRequest}"\n`);

  while (!isDone && steps < maxSteps) {
    steps++;
    console.log(`\n--- Step ${steps} ---`);

    // Take screenshot
    const screenshot = await getScreenshot();

    // Ask Gemini what to do next
    const { action, narration } = await getNextAction(
      screenshot,
      userRequest,
      previousActions
    );

    console.log(`🗣 Narration: ${narration}`);
    console.log(`⚡ Action: ${JSON.stringify(action)}`);

    if (onNarration) onNarration(narration);

    // Check if done
    if (action.action === 'done') {
      console.log('\n✅ Task complete!');
      isDone = true;
      break;
    }

    // Execute the action
    const result = await executeAction(action);
    previousActions.push(`Step ${steps}: ${result}`);
    console.log(`✔ Result: ${result}`);

    // Wait a moment for page to update
    await new Promise(r => setTimeout(r, 2000));
  }
}