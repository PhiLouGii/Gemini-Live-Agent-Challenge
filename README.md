# Grandma Mode- Your Personal AI Web Navigator
> **The internet, simplified. For everyone.**

Grandma Mode is a Chrome/Edge extension powered by **Gemini 2.0 Flash** and deployed on **Google CLoud Run**. It watched your screen, understands any webpage, speaks instructions clearly, detect scams, and completes tasks automatically. 

Built for the **GeminiLive Agent Challenge**. 

---

## Live Demo
- **Backend API:** https://grandma-mode-backend-243863724444.us-central1.run.app/health
- **Landing Page:** https://grandma-mode.netlify.app/

---

## Features
| Feature | Description |
|---|---|
|  **Screen Understanding** | Gemini Vision analyzes any webpage in real time |
|  **Task Automation** | Tell it what you want — it clicks, types, scrolls and navigates |
| **Scam Detection** | Detects suspicious pages, fake payment forms, urgent language |
|  **Visual Highlighting** | Golden glow shows exactly what element it's interacting with |
|  **Form Guide** | Rewrites complex form labels in plain English |
|  **Memory** | Learns your preferences via Firestore (cheapest option, free delivery, etc.) |
|  **Voice** | Speaks responses in a warm, clear voice via Web Speech API |
|  **Confusion Detection** | Notices rapid scrolling, back-clicking, idling — and offers help |
|  **Guided Mode** | Step-by-step confirmations before every action |
|  **Quick Answers** | Answers factual questions instantly without navigating (KFC hours, nearest airport, etc.) |
|  **Chat History** | Persistent conversation history across sessions |
|  **Smart Suggestions** | Clickable follow-up actions that actually execute |

---

## Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                        │
│                                                          │
│  ┌─────────────┐      ┌──────────────────────────────┐  │
│  │  Any Website │      │     Grandma Mode             │  │
│  │  (Real DOM)  │◄────►│     Side Panel               │  │
│  │             │      │     (popup.js)               │  │
│  └─────────────┘      └──────────┬───────────────────┘  │
│         ▲                        │                       │
│         │ content.js             │ screenshot            │
│         │ executes actions       │ chrome.tabs           │
│         │ highlights elements    │ .captureVisibleTab    │
└─────────┼────────────────────────┼───────────────────────┘
          │                        │
          │                        ▼
          │             ┌─────────────────────┐
          │             │   Node.js Backend   │
          │             │   Cloud Run         │
          │             │   (server.ts)       │
          │             └────────┬────────────┘
          │                      │
          │         ┌────────────┼────────────┐
          │         ▼            ▼            ▼
          │  ┌────────────┐ ┌────────┐ ┌──────────┐
          │  │ Vertex AI  │ │Firest- │ │WebSocket │
          │  │ Gemini 2.0 │ │ore     │ │(real-time│
          └──│ Flash      │ │Memory  │ │updates)  │
             └────────────┘ └────────┘ └──────────┘
```

**Flow:**
1. Extension captures screenshot of current tab
2. Screenshot sent to Cloud Run backend via POST
3. Backend sends to Gemini 2.0 Flash with task context
4. Gemini returns structured JSON `{action, target, value, narration}`
5. Backend sends action + narration back via WebSocket
6. Extension highlights element → executes action on real DOM
7. Voice speaks narration to user
8. Loop repeats until task is complete

---

## Quick Start
### Prerequisites
- Node.js 18+
- Google Cloud project with Vertex AI + Firestore enabled
- Chrome or Microsoft Edge browser

### 1. Clone the repo
```bash
git clone https://github.com/PhiLouGii/Gemini-Live-Agent-Challenge.git
cd Gemini-Live-Agent-Challenge
```

### 2. Set up environment
```bash
cd backend
cp ../.env.example .env
```

Edit `.env`:
```env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
PORT=3001
```

### 3. Set up Google Cloud credentials
```bash
gcloud auth application-default login
gcloud config set project your-project-id
```

Add a `serviceAccountKey.json` to the `backend/` folder (download from Firebase Console → Project Settings → Service Accounts).

### 4. Run the backend
```bash
cd backend 
npm install
npx ts-node server.ts
```

### 5. Load the extension
1. Open Chrome/Edge and go to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load Unpacked**
4. Select the `extension/` folder
5. Click the Grandma Mode icon in your toolbar


## Cloud Deployment
The backend is deployed on Google Cloud Run:

```bash
cd backend
gcloud run deploy grandma-mode-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=your-project-id,GOOGLE_CLOUD_LOCATION=us-central1"
```

---

## Project Structure

```
grandma-mode/
├── backend/
│   ├── server.ts          # Express + WebSocket server
│   ├── src/
│   │   ├── gemini.ts      # All Gemini AI functions
│   │   ├── memory.ts      # Firestore user memory
│   │   ├── actions.ts     # Browser action executor
│   │   └── screenshot.ts  # Playwright browser (local)
│   └── package.json
├── extension/
│   ├── manifest.json      # Chrome Extension Manifest V3
│   ├── popup.js           # Main extension logic
│   ├── popup.html         # Side panel UI
│   ├── content.js         # DOM interaction + highlighting
│   ├── background.js      # Service worker
│   └── styles.css
└── landing/
    └── index.html         # Landing page
```

---

## API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/next-action` | Get next AI action for a goal |
| POST | `/api/simplify-extension` | Explain current page in plain English |
| POST | `/api/scan-extension` | Scam detection on current page |
| POST | `/api/suggestions-extension` | Get follow-up suggestions |
| POST | `/api/simplify-form` | Explain form fields in plain English |
| POST | `/api/quick-answer` | Instant answers from AI knowledge |
| GET | `/api/memory` | Get user preferences |
| POST | `/api/memory/preference` | Save a preference |

---

## Tech Stack
| Layer | Technology |
|---|---|
| AI | Gemini 2.0 Flash via Google GenAI SDK (@google/genai) |
| Backend | Node.js + TypeScript + Express |
| Deployment | Google Cloud Run |
| Database | Google Firestore |
| Extension | Chrome Extension Manifest V3 |
| Voice | Web Speech API |
| Real-time | WebSockets |

---

## Built By
**Philippa Louise Giibwa** - Solo Developer
Gemini Live Agent Challenge, March 2026
