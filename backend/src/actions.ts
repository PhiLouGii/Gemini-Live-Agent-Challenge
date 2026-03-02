import { getPage } from './screenshot';

export type Action = {
  action: 'click' | 'type' | 'scroll' | 'navigate' | 'wait' | 'done';
  target?: string;
  value?: string;
};

export async function executeAction(action: Action): Promise<string> {
  const page = await getPage();

  switch (action.action) {
    case 'navigate':
      await page.goto(action.value!);
      return `Navigated to ${action.value}`;

    case 'click':
      try {
        // Try to find by text first
        await page.getByText(action.target!, { exact: false }).first().click();
        return `Clicked on "${action.target}"`;
      } catch {
        // Fall back to placeholder/label
        try {
          await page.getByPlaceholder(action.target!).first().click();
          return `Clicked on "${action.target}"`;
        } catch {
          // Fall back to role
          await page.locator(`text=${action.target}`).first().click();
          return `Clicked on "${action.target}"`;
        }
      }

    case 'type':
      try {
        await page.getByPlaceholder(action.target!, { exact: false }).first().fill(action.value!);
        return `Typed "${action.value}" into "${action.target}"`;
      } catch {
        await page.locator(`text=${action.target}`).first().fill(action.value!);
        return `Typed "${action.value}" into "${action.target}"`;
      }

    case 'scroll':
      await page.evaluate(() => window.scrollBy(0, 500));
      return 'Scrolled down';

    case 'wait':
      await page.waitForTimeout(parseInt(action.value || '1000'));
      return `Waited ${action.value}ms`;

    default:
      return 'Unknown action';
  }
}