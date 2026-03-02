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
      addLog('✅ Task complete!', 'success');
      loadSuggestions();
      break;
    case 'error':
      setRunning(false);
      addLog(`Error: ${msg.message}`, 'warning');
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

// Init
connectWS();