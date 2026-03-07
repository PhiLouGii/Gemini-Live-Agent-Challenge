const API = 'http://localhost:3001';

// UI Elements
const speech = document.getElementById('speech');
const avatar = document.getElementById('avatar');
const logItems = document.getElementById('logItems');
const scamWarning = document.getElementById('scamWarning');
const scamText = document.getElementById('scamText');
const suggestions = document.getElementById('suggestions');
const suggestionItems = document.getElementById('suggestionItems');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const explainBtn = document.getElementById('explainBtn');
const scanBtn = document.getElementById('scanBtn');
const statusDot = document.getElementById('statusDot');
const taskBtn = document.getElementById('taskBtn');
const taskDialog = document.getElementById('taskDialog');
const taskGoalInput = document.getElementById('taskGoalInput');
const taskCancelBtn = document.getElementById('taskCancelBtn');
const taskConfirmBtn = document.getElementById('taskConfirmBtn');
const confirmDialog = document.getElementById('confirmDialog');
const confirmActionText = document.getElementById('confirmActionText');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');
const guidedToggle = document.getElementById('guidedToggle');
const guidedBanner = document.getElementById('guidedBanner');
let isGuidedMode = true;
const safetyDialog = document.getElementById('safetyDialog');
const safetyMessage = document.getElementById('safetyMessage');
const safetyDetails = document.getElementById('safetyDetails');
const safetyLeaveBtn = document.getElementById('safetyLeaveBtn');
const safetyProceedBtn = document.getElementById('safetyProceedBtn');
let safetyAcknowledged = false;
const formBtn = document.getElementById('formBtn');
const formPanel = document.getElementById('formPanel');
const formFields = document.getElementById('formFields');
const formCloseBtn = document.getElementById('formCloseBtn');
const formSubmitBtn = document.getElementById('formSubmitBtn');
const formValidateArea = document.getElementById('formValidateArea');
const confusionDialog = document.getElementById('confusionDialog');
const confusionTitle = document.getElementById('confusionTitle');
const confusionMessage = document.getElementById('confusionMessage');
const confusionDismissBtn = document.getElementById('confusionDismissBtn');
const confusionHelpBtn = document.getElementById('confusionHelpBtn');
const memoryBtn = document.getElementById('memoryBtn');
const memoryPanel = document.getElementById('memoryPanel');
const memoryList = document.getElementById('memoryList');
const memoryCloseBtn = document.getElementById('memoryCloseBtn');
const memoryKeyInput = document.getElementById('memoryKeyInput');
const memorySaveBtn = document.getElementById('memorySaveBtn');
const memoryTaskCount = document.getElementById('memoryTaskCount');

let isRunning = false;
let ws = null;

// Connect WebSocket
function connectWS() {
  ws = new WebSocket('ws://localhost:3001');
  ws.onopen = () => statusDot.classList.add('connected');
  ws.onclose = () => {
    statusDot.classList.remove('connected');
    setTimeout(connectWS, 3000); // reconnect
  };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    handleWSMessage(msg);
  };
}

function handleWSMessage(msg) {
  switch (msg.type) {
    case 'narration':
      setSpeech(msg.text);
      speakText(msg.text);
      break;
    case 'log':
      addLog(msg.text, 'success');
      break;
    case 'scam':
      showScamWarning(msg.warning);
      break;
    case 'status':
      addLog(msg.message, 'info');
      break;
    case 'done':
      setRunning(false);
      addLog(' Task complete!', 'success');
      loadSuggestions();
      break;
    case 'error':
      setRunning(false);
      addLog(`Error: ${msg.message}`, 'warning');
      break;
    case 'action':
      if (msg.action && msg.action.target) {
        highlightOnPage(msg.action.target);
      }
      break;
    case 'SENSITIVE_PAGE_DETECTED':
      showSafetyWarning(msg.payload);
      break;
  }
}

// Take screenshot of current tab
async function takeScreenshot() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' }, (response) => {
      resolve(response.screenshot); // returns base64 data URL
    });
  });
}

// Send screenshot + request to backend
async function runTask(request) {
  if (isRunning) return;
  setRunning(true);
  addLog(`Starting: ${request}`, 'pending');

  const screenshotDataUrl = await takeScreenshot();
  // Strip the data:image/png;base64, prefix
  const base64 = screenshotDataUrl.replace(/^data:image\/png;base64,/, '');

  try {
    await fetch(`${API}/api/task-extension`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request, screenshot: base64 })
    });
  } catch (err) {
    addLog('Could not reach backend. Is it running?', 'warning');
    setRunning(false);
  }
}

// Execute action on the real page
async function executeOnPage(action) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'EXECUTE_ACTION',
        action
      }, resolve);
    });
  });
}

// Explain current page
async function explainPage() {
  addLog('Analyzing page...', 'pending');
  const screenshotDataUrl = await takeScreenshot();
  const base64 = screenshotDataUrl.replace(/^data:image\/png;base64,/, '');

  const res = await fetch(`${API}/api/simplify-extension`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ screenshot: base64 })
  });
  const data = await res.json();
  setSpeech(data.explanation);
  speakText(data.explanation);
  await loadSuggestions();
}

// Scan for scams
async function scanPage() {
  addLog('Checking for scams...', 'pending');
  const screenshotDataUrl = await takeScreenshot();
  const base64 = screenshotDataUrl.replace(/^data:image\/png;base64,/, '');

  const res = await fetch(`${API}/api/scan-extension`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ screenshot: base64 })
  });
  const data = await res.json();

  if (data.isScam) {
    showScamWarning(data.warning);
  } else {
    setSpeech("This page looks safe to me, dear! I don't see anything suspicious.");
    speakText("This page looks safe to me, dear! I don't see anything suspicious.");
  }
}

// Load follow-up suggestions
async function loadSuggestions() {
  try {
    const screenshotDataUrl = await takeScreenshot();
    const base64 = screenshotDataUrl.replace(/^data:image\/png;base64,/, '');

    const res = await fetch(`${API}/api/suggestions-extension`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenshot: base64 })
    });
    const data = await res.json();

    if (data.suggestions?.length) {
      suggestionItems.innerHTML = '';
      data.suggestions.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.textContent = '💬 ' + s;
        btn.onclick = () => runTask(s);
        suggestionItems.appendChild(btn);
      });
      suggestions.classList.remove('hidden');
    }
  } catch {
    // silently fail
  }
}

// Confirm before executing a critical action
function confirmAction(actionDescription) {
  return new Promise((resolve) => {
    confirmActionText.textContent = actionDescription;
    confirmDialog.classList.remove('hidden');

    confirmYesBtn.onclick = () => {
      confirmDialog.classList.add('hidden');
      resolve(true);
    };
    confirmNoBtn.onclick = () => {
      confirmDialog.classList.add('hidden');
      resolve(false);
    };
  });
}

// Run a full goal-driven task with step confirmation
async function runGoalTask(goal) {
  if (isRunning) return;
  setRunning(true);
  setSpeech(`Alright dear, let me help you: "${goal}". I'll take it one step at a time!`);
  speakText(`Alright dear, let me help you with that. I'll take it one step at a time!`);
  addLog(`Goal: ${goal}`, 'info');

  const previousActions = [];
  let isDone = false;
  let steps = 0;

  while (!isDone && steps < 10) {
    steps++;

    // Take fresh screenshot each step
    const screenshotDataUrl = await takeScreenshot();
    const base64 = screenshotDataUrl.replace(/^data:image\/png;base64,/, '');

    // Ask backend what to do next
    let nextAction, narration, done;
    try {
      const res = await fetch(`${API}/api/next-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: goal, screenshot: base64, previousActions })
      });
      const data = await res.json();
      nextAction = data.action;
      narration = data.narration;
      done = data.isDone;
    } catch {
      addLog('Could not reach backend', 'warning');
      break;
    }

    setSpeech(narration);
    speakText(narration);

    if (done || nextAction.action === 'done') {
      isDone = true;
      addLog('✅ Task complete!', 'success');
      setSpeech("There we go, dear! I've finished that for you. Was there anything else you needed?");
      speakText("There we go, dear! I've finished that for you.");
      break;
    }

    // In guided mode: explain + confirm each step
if (isGuidedMode) {
  const criticalActions = ['click', 'type'];
  if (criticalActions.includes(nextAction.action)) {
    const actionDesc = nextAction.action === 'type'
      ? `Type "${nextAction.value}" into ${nextAction.target || 'the field'}`
      : `Click on "${nextAction.target}"`;

    const confirmed = await confirmAction(actionDesc);
    if (!confirmed) {
      addLog(`Skipped: ${actionDesc}`, 'info');
      previousActions.push(`Skipped: ${actionDesc}`);
      continue;
    }
  }
}
// In auto mode: just highlight briefly then act
else {
  if (nextAction.target) highlightOnPage(nextAction.target);
  await new Promise(r => setTimeout(r, 800));
}

    // Execute on real page
    const result = await executeOnPage(nextAction);
    addLog(result?.result || nextAction.action, 'success');
    previousActions.push(`Step ${steps}: ${nextAction.action} ${nextAction.target || ''}`);

    // Wait for page to respond
    await new Promise(r => setTimeout(r, 2000));
  }

  setRunning(false);
  await loadSuggestions();
}

function updateGuidedBanner() {
  if (isGuidedMode) {
    guidedBanner.className = 'guided-banner';
    guidedBanner.textContent = '🐢 Guided Mode ON — I\'ll explain each step and ask before acting';
  } else {
    guidedBanner.className = 'guided-banner off';
    guidedBanner.textContent = '⚡ Guided Mode OFF — I\'ll complete tasks automatically';
  }
}

function showSafetyWarning(payload) {
  if (safetyAcknowledged) return; // don't show twice

  const messages = {
    payment: "I can see this page is asking for payment or card information. Before you enter anything, let me make sure this site is safe!",
    checkout: "This looks like a checkout or payment page, dear. Are you sure you're ready to complete this purchase?",
    download: "This page wants you to download something. Downloads can sometimes contain harmful software. Shall I check it first?",
    personal: "I noticed this page is asking for personal information. Let's make sure it's safe before you share anything!"
  };

  safetyMessage.textContent = messages[payload.type] || messages.personal;
  safetyDetails.textContent = payload.message;
  safetyDialog.classList.remove('hidden');

  // Speak the warning
  speakText("Hold on sweetheart! " + (messages[payload.type] || messages.personal));
  setSpeech("Hold on sweetheart! " + (messages[payload.type] || messages.personal));
  addLog('🛡️ Safety check triggered', 'warning');
}

// Highlight element on the real page
function highlightOnPage(target) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'HIGHLIGHT_ELEMENT',
      target
    });
  });
}

async function simplifyForm() {
  addLog('Scanning form fields...', 'pending');

  // Get raw fields from page
  const fields = await new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'SCAN_FORMS' }, (res) => {
        resolve(res?.fields || []);
      });
    });
  });

  if (fields.length === 0) {
    setSpeech("I don't see any forms on this page, dear. Try navigating to a page with a form!");
    speakText("I don't see any forms on this page dear.");
    return;
  }

  addLog(`Found ${fields.length} form fields`, 'success');
  setSpeech("I found a form! Let me explain each field in simple terms for you, dear.");
  speakText("I found a form! Let me explain each field in simple terms.");

  // Send to backend for AI simplification
  const screenshotDataUrl = await takeScreenshot();
  const base64 = screenshotDataUrl.replace(/^data:image\/png;base64,/, '');

  let simplified;
  try {
    const res = await fetch(`${API}/api/simplify-form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, screenshot: base64 })
    });
    simplified = await res.json();
  } catch {
    addLog('Could not reach backend', 'warning');
    return;
  }

  // Render simplified fields
  formFields.innerHTML = '';
  simplified.fields.forEach(field => {
    const card = document.createElement('div');
    card.className = 'form-field-card';
    card.innerHTML = `
      <div class="form-field-label">
        ${field.simpleLabel}
        <span class="${field.required ? 'form-field-required' : 'form-field-optional'}">
          ${field.required ? 'Required' : 'Optional'}
        </span>
      </div>
      <div class="form-field-explanation">${field.explanation}</div>
      ${field.example ? `<div class="form-field-example">Example: ${field.example}</div>` : ''}
    `;

    // Click card to highlight field on page
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'HIGHLIGHT_FIELD',
          fieldId: field.id
        });
      });
      addLog(`Highlighting: ${field.simpleLabel}`, 'info');
    });

    formFields.appendChild(card);
  });

  formValidateArea.classList.remove('hidden');
  formPanel.classList.remove('hidden');
  addLog('Form simplified!', 'success');
}

function showConfusionPrompt(reason) {
  const messages = {
    rapid_scroll: {
      title: "Looking for something, dear?",
      message: "I noticed you're scrolling quite a bit. Would you like me to help you find what you're looking for?",
      speech: "I noticed you're scrolling a lot dear. Are you looking for something? I can help!"
    },
    back_clicking: {
      title: "Having trouble finding the right page?",
      message: "I see you've gone back a few times. It's easy to get lost online! Would you like step-by-step guidance?",
      speech: "I noticed you went back a couple of times. Would you like me to guide you step by step?"
    },
    idle: {
      title: "Still there, dear?",
      message: "You've been on this page for a while. Would you like me to explain what's on here or help you do something?",
      speech: "You seem to have been on this page for a while. Would you like some help?"
    }
  };

  const msg = messages[reason] || messages.idle;
  confusionTitle.textContent = msg.title;
  confusionMessage.textContent = msg.message;
  confusionDialog.classList.remove('hidden');
  speakText(msg.speech);
  setSpeech(msg.speech);
  addLog('🤔 Confusion detected — offering help', 'info');
}

async function loadMemory() {
  try {
    const res = await fetch(`${API}/api/memory`);
    const data = await res.json();

    memoryTaskCount.textContent = `Tasks completed: ${data.totalTasks || 0}`;

    if (!data.preferences || data.preferences.length === 0) {
      memoryList.innerHTML = '<div class="memory-empty">I\'m still learning about you, dear!</div>';
      return;
    }

    memoryList.innerHTML = '';
    data.preferences.forEach(pref => {
      const item = document.createElement('div');
      item.className = 'memory-item';
      item.innerHTML = `
        <span>✨ ${pref.value}</span>
        <button onclick="deleteMemory('${pref.key}')">✕</button>
      `;
      memoryList.appendChild(item);
    });

    memoryPanel.classList.remove('hidden');
  } catch {
    addLog('Could not load memory', 'warning');
  }
}

async function deleteMemory(key) {
  await fetch(`${API}/api/memory/preference/${key}`, { method: 'DELETE' });
  loadMemory();
}

// UI helpers
function setSpeech(text) {
  speech.textContent = text;
  avatar.classList.add('speaking');
  setTimeout(() => avatar.classList.remove('speaking'), 3000);
}

function addLog(text, type = 'info') {
  const icons = { success: '✅', warning: '⚠️', pending: '⏳', info: '💬' };
  const div = document.createElement('div');
  div.className = `log-item ${type}`;
  div.textContent = (icons[type] || '') + ' ' + text;
  logItems.appendChild(div);
  logItems.scrollTop = logItems.scrollHeight;
}

function setRunning(running) {
  isRunning = running;
  sendBtn.disabled = running;
  explainBtn.disabled = running;
  scanBtn.disabled = running;
  voiceBtn.disabled = running;
  chatInput.disabled = running;
  chatInput.placeholder = running ? 'Please wait...' : 'Type what you need help with...';
}

function showScamWarning(text) {
  scamText.textContent = text;
  scamWarning.classList.remove('hidden');
  speakText('Warning! ' + text);
}

// Text to speech
function speakText(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1.1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Samantha') || v.name.includes('Karen') ||
    v.name.includes('Moira') || v.name.includes('Female') ||
    (v.lang === 'en-US' && !v.name.includes('Male'))
  );
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

// Event listeners
sendBtn.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text || isRunning) return;
  chatInput.value = '';
  runTask(text);
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

explainBtn.addEventListener('click', explainPage);
scanBtn.addEventListener('click', scanPage);

document.getElementById('dismissScam').addEventListener('click', () => {
  scamWarning.classList.add('hidden');
});

// Voice
voiceBtn.addEventListener('click', () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert('Use Chrome for voice support'); return; }

  const recognition = new SR();
  recognition.lang = 'en-US';
  voiceBtn.classList.add('listening');
  voiceBtn.textContent = '⏹️';

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    addLog(`You said: "${transcript}"`, 'info');
    runTask(transcript);
  };
  recognition.onend = () => {
    voiceBtn.classList.remove('listening');
    voiceBtn.textContent = '🎙️';
  };
  recognition.start();
});

// Task mode
taskBtn.addEventListener('click', () => {
  taskDialog.classList.toggle('hidden');
});

taskCancelBtn.addEventListener('click', () => {
  taskDialog.classList.add('hidden');
  taskGoalInput.value = '';
});

taskConfirmBtn.addEventListener('click', () => {
  const goal = taskGoalInput.value.trim();
  if (!goal) return;
  taskDialog.classList.add('hidden');
  taskGoalInput.value = '';
  runGoalTask(goal);
});

taskGoalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    taskConfirmBtn.click();
  }
});

// Guided mode toggle
guidedToggle.addEventListener('change', () => {
  isGuidedMode = guidedToggle.checked;
  updateGuidedBanner();
  const msg = isGuidedMode
    ? "Guided mode is on, dear. I'll walk you through everything carefully!"
    : "Got it! I'll work quickly and complete tasks automatically.";
  setSpeech(msg);
  speakText(msg);
});

updateGuidedBanner();

// Safety dialog buttons
safetyLeaveBtn.addEventListener('click', () => {
  safetyDialog.classList.add('hidden');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.goBack(tabs[0].id);
  });
  setSpeech("Good call, dear! I've taken you back to safety.");
  speakText("Good call dear, I've taken you back to safety.");
});

safetyProceedBtn.addEventListener('click', () => {
  safetyAcknowledged = false;
  safetyDialog.classList.add('hidden');
  setSpeech("Alright dear, just be careful and only enter information you trust this site with!");
  speakText("Alright dear, just be careful!");
});

// Form simplifier
formBtn.addEventListener('click', simplifyForm);

formCloseBtn.addEventListener('click', () => {
  formPanel.classList.add('hidden');
});

formSubmitBtn.addEventListener('click', async () => {
  const confirmed = await confirmAction('Submit this form');
  if (confirmed) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'SUBMIT_FORM' });
    });
    formPanel.classList.add('hidden');
    setSpeech("I've submitted the form for you, dear! Let's see what happens next.");
    speakText("I've submitted the form for you dear!");
  }
});

// Confusion dialog
confusionDismissBtn.addEventListener('click', () => {
  confusionDialog.classList.add('hidden');
  setSpeech("No problem dear! I'm here if you need me.");
});

confusionHelpBtn.addEventListener('click', () => {
  confusionDialog.classList.add('hidden');
  explainPage();
  setSpeech("Of course dear! Let me explain what's on this page for you.");
  speakText("Of course dear! Let me explain what's on this page for you.");
});

// Memory panel
memoryBtn.addEventListener('click', () => {
  memoryPanel.classList.toggle('hidden');
  if (!memoryPanel.classList.contains('hidden')) loadMemory();
});

memoryCloseBtn.addEventListener('click', () => {
  memoryPanel.classList.add('hidden');
});

memorySaveBtn.addEventListener('click', async () => {
  const value = memoryKeyInput.value.trim();
  if (!value) return;
  await fetch(`${API}/api/memory/preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: `custom_${Date.now()}`, value })
  });
  memoryKeyInput.value = '';
  loadMemory();
  setSpeech(`Got it dear! I'll remember that ${value}`);
  speakText(`Got it dear! I'll remember that.`);
});

// Init
connectWS();
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SENSITIVE_PAGE_DETECTED') {
    showSafetyWarning(message.payload);
  }
  if (message.type === 'CONFUSION_DETECTED') {
    showConfusionPrompt(message.payload.reason);
  }
});