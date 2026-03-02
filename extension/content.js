// Listen for click/type/scroll actions from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXECUTE_ACTION') {
    executeAction(message.action)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function executeAction(action) {
  switch (action.action) {
    case 'click':
      return clickElement(action.target);
    case 'type':
      return typeInElement(action.target, action.value);
    case 'scroll':
      window.scrollBy(0, 400);
      return 'Scrolled down';
    case 'navigate':
      window.location.href = action.value;
      return `Navigating to ${action.value}`;
    default:
      return 'Unknown action';
  }
}

function clickElement(target) {
  // Try finding by text content
  const all = document.querySelectorAll('button, a, input[type="submit"], [role="button"]');
  for (const el of all) {
    if (el.textContent?.trim().toLowerCase().includes(target.toLowerCase())) {
      el.click();
      return `Clicked "${target}"`;
    }
  }
  // Try by placeholder
  const input = document.querySelector(`[placeholder*="${target}"]`);
  if (input) { input.click(); return `Clicked "${target}"`; }
  
  throw new Error(`Could not find element: ${target}`);
}

function typeInElement(target, value) {
  // Try by placeholder
  let el = document.querySelector(`[placeholder*="${target}"]`);
  if (!el) {
    // Try focused or first input
    el = document.querySelector('input:not([type="hidden"]), textarea');
  }
  if (el) {
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return `Typed "${value}"`;
  }
  throw new Error(`Could not find input: ${target}`);
}