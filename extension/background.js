chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === 'CAPTURE_SCREENSHOT') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ screenshot: dataUrl });
    });
    return true;
  }

  // Forward sensitive page detection to popup
  if (message.type === 'SENSITIVE_PAGE_DETECTED') {
    chrome.runtime.sendMessage({
      type: 'SENSITIVE_PAGE_DETECTED',
      payload: message.payload
    });
  }
});