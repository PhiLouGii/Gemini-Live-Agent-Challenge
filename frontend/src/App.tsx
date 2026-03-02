import { useState, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import axios from 'axios';
import GrandmaAvatar from './components/GrandmaAvatar';
import BrowserPanel from './components/BrowserPanel';
import ActionLog from './components/ActionLog';
import VoiceButton from './components/VoiceButton';
import ScamWarning from './components/ScamWarning';
import ChatInput from './components/ChatInput';

const API = 'http://localhost:3001';
const WS = 'ws://localhost:3001';

type LogItem = { type: 'success' | 'pending' | 'warning' | 'info'; text: string };

export default function App() {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [narration, setNarration] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [scamWarning, setScamWarning] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [listening, setListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [url, setUrl] = useState('https://www.google.com');
  const [started, setStarted] = useState(false);
  const recognitionRef = useRef<any>(null);

  // WebSocket
  const { lastMessage, readyState } = useWebSocket(WS);

  useEffect(() => {
    if (!lastMessage) return;
    const msg = JSON.parse(lastMessage.data);

    switch (msg.type) {
      case 'screenshot':
        setScreenshot(msg.image);
        break;
      case 'narration':
        setNarration(msg.text);
        speak(msg.text);
        break;
      case 'log':
        setLogs(prev => [...prev, { type: 'success', text: msg.text }]);
        break;
      case 'scam':
        setScamWarning(msg.warning);
        setLogs(prev => [...prev, { type: 'warning', text: '⚠️ Scam detected!' }]);
        break;
      case 'status':
        setLogs(prev => [...prev, { type: 'info', text: msg.message }]);
        break;
      case 'done':
        setIsRunning(false);
        setLogs(prev => [...prev, { type: 'success', text: 'Task complete!' }]);
        generateSuggestions();
        break;
      case 'error':
        setIsRunning(false);
        setLogs(prev => [...prev, { type: 'warning', text: `Error: ${msg.message}` }]);
        break;
    }
  }, [lastMessage]);

  // Text to speech
  function speak(text: string) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1.1;
  
  // Pick a warm female voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Samantha') ||
    v.name.includes('Karen') ||
    v.name.includes('Moira') ||
    v.name.includes('Female') ||
    v.name.toLowerCase().includes('female') ||
    (v.lang === 'en-US' && v.name.includes('Google') && !v.name.includes('Male'))
  );
  if (preferred) utterance.voice = preferred;

  utterance.onstart = () => setSpeaking(true);
  utterance.onend = () => setSpeaking(false);
  window.speechSynthesis.speak(utterance);
}

  // Start backend browser
  async function handleStart() {
    try {
      await axios.post(`${API}/api/start`);
      setStarted(true);
      setLogs([{ type: 'success', text: 'Browser started!' }]);
      setNarration("Hello dear! I'm ready to help you. Tell me what you'd like to do today.");
      speak("Hello dear! I'm ready to help you. Tell me what you'd like to do today.");
    } catch {
      setNarration('Could not start the browser. Is the backend running?');
    }
  }

  // Navigate to URL
  async function handleNavigate() {
    try {
      const res = await axios.post(`${API}/api/navigate`, { url });
      setScreenshot(res.data.screenshot);
      setLogs(prev => [...prev, { type: 'success', text: `Navigated to ${url}` }]);
    } catch {
      setLogs(prev => [...prev, { type: 'warning', text: 'Navigation failed' }]);
    }
  }

  // Simplify current page
  async function handleSimplify() {
    setLogs(prev => [...prev, { type: 'pending', text: 'Simplifying page...' }]);
    const res = await axios.post(`${API}/api/simplify`);
    setNarration(res.data.explanation);
    speak(res.data.explanation);
  }

  // Scan for scams
  async function handleScan() {
    setLogs(prev => [...prev, { type: 'pending', text: 'Checking for scams...' }]);
    const res = await axios.post(`${API}/api/scan`);
    if (res.data.isScam) {
      setScamWarning(res.data.warning);
    } else {
      setNarration("This page looks safe to me, dear! I don't see anything suspicious.");
      speak("This page looks safe to me, dear! I don't see anything suspicious.");
    }
  }

  async function generateSuggestions() {
  try {
    const screenshot = await getScreenshot();
    const res = await axios.post(`${API}/api/suggestions`, { screenshot });
    setSuggestions(res.data.suggestions);
  } catch {
    // silently fail
  }
}

async function getScreenshot() {
  const res = await axios.post(`${API}/api/screenshot`);
  return res.data.screenshot;
}

  // Voice input
  function handleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      setLogs(prev => [...prev, { type: 'info', text: `You said: "${transcript}"` }]);
      await runTask(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }

  // Run a task
  async function runTask(request: string) {
    setIsRunning(true);
    setScamWarning('');
    setLogs(prev => [...prev, { type: 'pending', text: `Starting: ${request}` }]);
    await axios.post(`${API}/api/task`, { request, url });
  }

  const connected = readyState === ReadyState.OPEN;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* Header */}
      <div style={{
        background: '#7c4f2f',
        color: 'white',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2rem' }}>🧓</span>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Grandma Mode</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Your gentle guide on the internet</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: connected ? '#2ecc71' : '#e74c3c',
          }} />
          <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>

        {/* Left: Browser */}
        <BrowserPanel
          screenshot={screenshot}
          url={url}
          onUrlChange={setUrl}
          onNavigate={handleNavigate}
          isRunning={isRunning}
        />

        {/* Right: Grandma panel */}
        <div style={{
          background: '#fdf6ec',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          gap: '16px',
          overflowY: 'auto',
        }}>

          <GrandmaAvatar speaking={speaking} text={narration} />

          {scamWarning && (
            <ScamWarning warning={scamWarning} onDismiss={() => setScamWarning('')} />
          )}

          <ActionLog logs={logs} />

          {/* Quick actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {!started ? (
              <button onClick={handleStart} style={{
                width: '100%',
                padding: '14px',
                background: '#7c4f2f',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}>
                🧓 Start Grandma Mode
              </button>
            ) : (
              <>
                {['📖 Explain this page', '🛡️ Check for scams'].map(cmd => (
                  <button key={cmd} onClick={() => {
                    if (cmd.includes('Explain')) handleSimplify();
                    else if (cmd.includes('scam')) handleScan();
                  }} style={{
                    background: 'white',
                    border: '2px solid #c9a87a',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    color: '#7c4f2f',
                    fontFamily: 'Georgia, serif',
                  }}>
                    {cmd}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Chat input + suggestions */}
          {started && (
            <ChatInput
              onSend={runTask}
              isRunning={isRunning}
              suggestions={suggestions}
              onSuggestion={(s) => runTask(s)}
            />
          )}

          <VoiceButton
            listening={listening}
            onClick={handleVoice}
            disabled={!started || isRunning}
          />

        </div>
      </div>
    </div>
  );
}