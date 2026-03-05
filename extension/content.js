// Listen for actions from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXECUTE_ACTION') {
    executeAction(message.action)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'HIGHLIGHT_ELEMENT') {
    highlightElement(message.target);
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'CLEAR_HIGHLIGHT') {
    clearHighlight();
    sendResponse({ success: true });
    return true;
  }
});

// ── Highlight system ──────────────────────────────────────────────
let overlayEl = null;
let highlightEl = null;
let dimEl = null;

function highlightElement(target) {
  clearHighlight();

  const el = findElement(target);
  if (!el) return;

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const rect = el.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // Dim overlay for whole page
  dimEl = document.createElement('div');
  dimEl.id = '__grandma_dim__';
  Object.assign(dimEl.style, {
    position: 'fixed',
    top: '0', left: '0',
    width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.35)',
    zIndex: '999998',
    pointerEvents: 'none',
    transition: 'opacity 0.3s',
    opacity: '0',
  });
  document.body.appendChild(dimEl);
  setTimeout(() => dimEl.style.opacity = '1', 10);

  // Glowing highlight box
  highlightEl = document.createElement('div');
  highlightEl.id = '__grandma_highlight__';
  Object.assign(highlightEl.style, {
    position: 'absolute',
    top: `${rect.top + scrollY - 6}px`,
    left: `${rect.left + scrollX - 6}px`,
    width: `${rect.width + 12}px`,
    height: `${rect.height + 12}px`,
    border: '3px solid #f39c12',
    borderRadius: '8px',
    boxShadow: '0 0 0 4px rgba(243,156,18,0.4), 0 0 20px rgba(243,156,18,0.6)',
    zIndex: '999999',
    pointerEvents: 'none',
    animation: '__grandma_pulse__ 1.5s infinite',
  });

  // Add pulse animation
  if (!document.getElementById('__grandma_styles__')) {
    const style = document.createElement('style');
    style.id = '__grandma_styles__';
    style.textContent = `
      @keyframes __grandma_pulse__ {
        0%, 100% { box-shadow: 0 0 0 4px rgba(243,156,18,0.4), 0 0 20px rgba(243,156,18,0.6); }
        50% { box-shadow: 0 0 0 8px rgba(243,156,18,0.2), 0 0 40px rgba(243,156,18,0.8); }
      }
    `;
    document.head.appendChild(style);
  }

  // Label above element
  overlayEl = document.createElement('div');
  overlayEl.id = '__grandma_label__';
  Object.assign(overlayEl.style, {
    position: 'absolute',
    top: `${rect.top + scrollY - 38}px`,
    left: `${rect.left + scrollX}px`,
    background: '#f39c12',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'Georgia, serif',
    fontWeight: 'bold',
    zIndex: '999999',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  });
  overlayEl.textContent = `🧓 Here, dear!`;

  document.body.appendChild(highlightEl);
  document.body.appendChild(overlayEl);

  // Auto clear after 4 seconds
  setTimeout(clearHighlight, 4000);
}

function clearHighlight() {
  document.getElementById('__grandma_dim__')?.remove();
  document.getElementById('__grandma_highlight__')?.remove();
  document.getElementById('__grandma_label__')?.remove();
  dimEl = null;
  highlightEl = null;
  overlayEl = null;
}

// ── Action executor ───────────────────────────────────────────────
async function executeAction(action) {
  switch (action.action) {
    case 'click':
      return clickElement(action.target);
    case 'type':
      return typeInElement(action.target, action.value);
    case 'scroll':
      window.scrollBy({ top: 400, behavior: 'smooth' });
      return 'Scrolled down';
    case 'navigate':
      window.location.href = action.value;
      return `Navigating to ${action.value}`;
    default:
      return 'Unknown action';
  }
}

function findElement(target) {
  // Try buttons, links, inputs by text
  const selectors = ['button', 'a', 'input', '[role="button"]', 'label', 'span', 'div'];
  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      const text = el.textContent?.trim() || el.getAttribute('placeholder') || el.getAttribute('aria-label') || '';
      if (text.toLowerCase().includes(target.toLowerCase())) {
        return el;
      }
    }
  }
  // Try placeholder
  const byPlaceholder = document.querySelector(`[placeholder*="${target}"]`);
  if (byPlaceholder) return byPlaceholder;

  // Try aria-label
  const byAria = document.querySelector(`[aria-label*="${target}"]`);
  if (byAria) return byAria;

  return null;
}

function clickElement(target) {
  // Highlight first, then click
  highlightElement(target);
  
  setTimeout(() => {
    const el = findElement(target);
    if (el) {
      el.click();
    }
  }, 800); // slight delay so user sees highlight before click

  return `Clicked "${target}"`;
}

function typeInElement(target, value) {
  highlightElement(target);

  setTimeout(() => {
    let el = document.querySelector(`[placeholder*="${target}"]`);
    if (!el) el = document.querySelector('input:not([type="hidden"]), textarea');
    if (el) {
      el.focus();
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, 800);

  return `Typed "${value}" into "${target}"`;
}

// ── Payment/Personal Data Detection ──────────────────────────────
function detectSensitivePage() {
  const sensitivePatterns = [
    // Payment fields
    'card number', 'credit card', 'debit card', 'cvv', 'cvc',
    'expiry', 'expiration', 'card details', 'billing',
    // Personal info
    'social security', 'ssn', 'passport', 'date of birth',
    'bank account', 'routing number',
    // Downloads
    'download now', 'download free', 'click to download',
    // Checkout
    'place order', 'confirm order', 'complete purchase',
    'pay now', 'submit payment',
  ];

  const pageText = document.body.innerText.toLowerCase();
  const inputs = document.querySelectorAll('input');

  // Check input types
  for (const input of inputs) {
    const type = input.type?.toLowerCase();
    const name = (input.name || input.id || input.placeholder || '').toLowerCase();
    if (
      type === 'tel' ||
      name.includes('card') ||
      name.includes('cvv') ||
      name.includes('ccnum') ||
      name.includes('credit') ||
      name.includes('account')
    ) {
      return {
        detected: true,
        type: 'payment',
        message: 'I can see fields asking for card or payment information on this page.'
      };
    }
  }

  // Check page text
  for (const pattern of sensitivePatterns) {
    if (pageText.includes(pattern)) {
      const type = ['download', 'install'].some(w => pattern.includes(w))
        ? 'download'
        : pattern.includes('order') || pattern.includes('pay') || pattern.includes('purchase')
        ? 'checkout'
        : 'personal';

      return {
        detected: true,
        type,
        message: `I noticed this page is asking for ${type === 'payment' ? 'payment details' : type === 'download' ? 'a download' : 'personal information'}.`
      };
    }
  }

  return { detected: false };
}

// Run detection when page loads and report back
(function () {
  const result = detectSensitivePage();
  if (result.detected) {
    chrome.runtime.sendMessage({
      type: 'SENSITIVE_PAGE_DETECTED',
      payload: result
    });
  }
})();

// Also watch for dynamic changes (e.g. checkout appearing after clicking)
const observer = new MutationObserver(() => {
  const result = detectSensitivePage();
  if (result.detected) {
    chrome.runtime.sendMessage({
      type: 'SENSITIVE_PAGE_DETECTED',
      payload: result
    });
    observer.disconnect(); // only fire once
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// ── Form Scanner ──────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_FORMS') {
    const fields = scanForms();
    sendResponse({ fields });
    return true;
  }

  if (message.type === 'HIGHLIGHT_FIELD') {
    highlightFormField(message.fieldId);
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'SUBMIT_FORM') {
    const form = document.querySelector('form');
    if (form) {
      form.submit();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
    return true;
  }
});

function scanForms() {
  const forms = document.querySelectorAll('form');
  if (forms.length === 0) return [];

  const fields = [];
  const form = forms[0]; // take first form

  const inputs = form.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'
  );

  inputs.forEach((input, index) => {
    const id = input.id || input.name || `field_${index}`;
    const label = findLabelFor(input) || input.placeholder || input.name || id;
    const required = input.required || input.getAttribute('aria-required') === 'true';
    const type = input.type || 'text';
    const value = input.value || '';

    fields.push({ id, label, required, type, value, index });
  });

  return fields;
}

function findLabelFor(input) {
  // Try label[for]
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent.trim();
  }
  // Try parent label
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel.textContent.trim();
  // Try aria-label
  if (input.getAttribute('aria-label')) return input.getAttribute('aria-label');
  // Try placeholder
  if (input.placeholder) return input.placeholder;
  return null;
}

function highlightFormField(fieldId) {
  const el = document.getElementById(fieldId) ||
    document.querySelector(`[name="${fieldId}"]`);
  if (el) {
    el.style.outline = '3px solid #f39c12';
    el.style.boxShadow = '0 0 10px rgba(243,156,18,0.5)';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus();
    setTimeout(() => {
      el.style.outline = '';
      el.style.boxShadow = '';
    }, 3000);
  }
}

// ── Confusion Detection ───────────────────────────────────────────
(function() {
  let rapidScrollCount = 0;
  let backClickCount = 0;
  let lastScrollTime = 0;
  let idleTimer = null;
  let confusionReported = false;
  const IDLE_THRESHOLD = 30000; // 30 seconds
  const SCROLL_THRESHOLD = 5;   // 5 rapid scrolls

  function reportConfusion(reason) {
    if (confusionReported) return;
    confusionReported = true;
    chrome.runtime.sendMessage({
      type: 'CONFUSION_DETECTED',
      payload: { reason }
    });
    // Reset after 2 minutes
    setTimeout(() => confusionReported = false, 120000);
  }

  // Rapid scroll detection
  window.addEventListener('scroll', () => {
    const now = Date.now();
    if (now - lastScrollTime < 500) {
      rapidScrollCount++;
      if (rapidScrollCount >= SCROLL_THRESHOLD) {
        reportConfusion('rapid_scroll');
        rapidScrollCount = 0;
      }
    } else {
      rapidScrollCount = 0;
    }
    lastScrollTime = now;
    resetIdleTimer();
  });

  // Back button / navigation confusion
  let historyLength = window.history.length;
  window.addEventListener('popstate', () => {
    backClickCount++;
    if (backClickCount >= 2) {
      reportConfusion('back_clicking');
      backClickCount = 0;
    }
    resetIdleTimer();
  });

  // Mouse movement resets idle
  window.addEventListener('mousemove', resetIdleTimer);
  window.addEventListener('keydown', resetIdleTimer);
  window.addEventListener('click', resetIdleTimer);

  // Idle detection
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      reportConfusion('idle');
    }, IDLE_THRESHOLD);
  }

  // Start idle timer
  resetIdleTimer();
})();