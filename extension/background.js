// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_SCREENSHOT') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ screenshot: dataUrl });
    });
    return true;
  }

  if (message.type === 'SENSITIVE_PAGE_DETECTED' ||
      message.type === 'CONFUSION_DETECTED') {
    chrome.runtime.sendMessage({
      type: message.type,
      payload: message.payload
    });
  }
});