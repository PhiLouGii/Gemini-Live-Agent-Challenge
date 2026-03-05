import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { initBrowser, getScreenshot, navigateTo, closeBrowser } from './src/screenshot';
import { getNextAction, detectScam, simplifyPage, getSuggestions } from './src/gemini';
import { executeAction } from './src/actions';

dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Track connected clients
let activeClient: WebSocket | null = null;

function sendToClient(type: string, data: object) {
  if (activeClient && activeClient.readyState === WebSocket.OPEN) {
    activeClient.send(JSON.stringify({ type, ...data }));
  }
}

// ── WebSocket connection ──────────────────────────────────────────
wss.on('connection', (ws) => {
  activeClient = ws;
  console.log('🔌 Frontend connected');
  ws.on('close', () => console.log('🔌 Frontend disconnected'));
});

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'Grandma Mode backend is alive!' });
});

// ── Start browser ─────────────────────────────────────────────────
app.post('/api/start', async (req, res) => {
  try {
    await initBrowser();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Run agent task ─────────────────────────────────────────────────
app.post('/api/task', async (req, res) => {
  const { request, url } = req.body;

  if (!request) {
    return res.status(400).json({ error: 'request is required' });
  }

  res.json({ success: true, message: 'Task started' });

  // Run agent in background, sending updates via WebSocket
  (async () => {
    try {
      if (url) await navigateTo(url);

      const previousActions: string[] = [];
      let isDone = false;
      let steps = 0;
      const maxSteps = 15;

      sendToClient('status', { message: `Starting task: ${request}` });

      while (!isDone && steps < maxSteps) {
        steps++;

        const screenshot = await getScreenshot();

        // Send screenshot to frontend
        sendToClient('screenshot', { image: screenshot });

        // Check for scams on every step
        const scamCheck = await detectScam(screenshot);
        if (scamCheck.isScam) {
          sendToClient('scam', { warning: scamCheck.warning, reason: scamCheck.reason });
          sendToClient('narration', { text: scamCheck.warning });
          break;
        }

        // Get next action
        const { action, narration, isDone: done } = await getNextAction(
          screenshot, request, previousActions
        );

        sendToClient('narration', { text: narration });
        sendToClient('action', { action });

        if (done || action.action === 'done') {
          isDone = true;
          sendToClient('status', { message: 'Task complete!' });
          break;
        }

        const result = await executeAction(action);
        previousActions.push(result);
        sendToClient('log', { text: result });

        await new Promise(r => setTimeout(r, 2000));
      }

      sendToClient('done', { success: true });
    } catch (err: any) {
      sendToClient('error', { message: err.message });
    }
  })();
});

// ── Scam check ────────────────────────────────────────────────────
app.post('/api/scan', async (req, res) => {
  try {
    const screenshot = await getScreenshot();
    const result = await detectScam(screenshot);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Simplify current page ─────────────────────────────────────────
app.post('/api/simplify', async (req, res) => {
  try {
    const screenshot = await getScreenshot();
    const explanation = await simplifyPage(screenshot);
    res.json({ explanation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Navigate to URL ───────────────────────────────────────────────
app.post('/api/navigate', async (req, res) => {
  const { url } = req.body;
  try {
    await navigateTo(url);
    const screenshot = await getScreenshot();
    res.json({ success: true, screenshot });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get current screenshot ────────────────────────────────────────
app.post('/api/screenshot', async (req, res) => {
  try {
    const screenshot = await getScreenshot();
    res.json({ screenshot });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Generate follow-up suggestions ───────────────────────────────
app.post('/api/suggestions', async (req, res) => {
  try {
    const screenshot = await getScreenshot();
    const result = await getSuggestions(screenshot);
    res.json({ suggestions: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Extension endpoints (screenshot comes FROM the extension)
app.post('/api/task-extension', async (req, res) => {
  const { request, screenshot } = req.body;
  if (!request || !screenshot) return res.status(400).json({ error: 'Missing fields' });

  res.json({ success: true });

  (async () => {
    try {
      const previousActions: string[] = [];
      let isDone = false;
      let steps = 0;

      sendToClient('status', { message: `Starting: ${request}` });

      while (!isDone && steps < 10) {
        steps++;

        const scamCheck = await detectScam(screenshot);
        if (scamCheck.isScam) {
          sendToClient('scam', { warning: scamCheck.warning });
          break;
        }

        const { action, narration, isDone: done } = await getNextAction(
          screenshot, request, previousActions
        );

        sendToClient('narration', { text: narration });
        sendToClient('action', { action });

        if (done || action.action === 'done') {
          isDone = true;
          sendToClient('done', { success: true });
          break;
        }

        previousActions.push(`Step ${steps}: ${action.action} ${action.target || ''}`);
        sendToClient('log', { text: `${action.action} ${action.target || ''}` });

        await new Promise(r => setTimeout(r, 1500));
      }

      if (!isDone) sendToClient('done', { success: true });
    } catch (err: any) {
      sendToClient('error', { message: err.message });
    }
  })();
});

app.post('/api/simplify-extension', async (req, res) => {
  try {
    const { screenshot } = req.body;
    const explanation = await simplifyPage(screenshot);
    res.json({ explanation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scan-extension', async (req, res) => {
  try {
    const { screenshot } = req.body;
    const result = await detectScam(screenshot);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suggestions-extension', async (req, res) => {
  try {
    const { screenshot } = req.body;
    const result = await getSuggestions(screenshot);
    res.json({ suggestions: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🧓 Grandma Mode backend running on port ${PORT}`);
});