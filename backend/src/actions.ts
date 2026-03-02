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
        await page.getByText(action.target!, { exact: false }).first().click({ timeout: 5000 });
        return `Clicked on "${action.target}"`;
      } catch {
        try {
          await page.locator(`[aria-label*="${action.target}"]`).first().click({ timeout: 5000 });
          return `Clicked on "${action.target}"`;
        } catch {
          await page.keyboard.press('Enter');
          return `Pressed Enter (fallback for "${action.target}")`;
        }
      }

    case 'type':
      try {
        // Try focused element first
        await page.keyboard.type(action.value!, { delay: 50 });
        return `Typed "${action.value}"`;
      } catch {
        try {
          await page.getByRole('searchbox').fill(action.value!);
          return `Typed "${action.value}" into searchbox`;
        } catch {
          await page.getByRole('textbox').first().fill(action.value!);
          return `Typed "${action.value}" into textbox`;
        }
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