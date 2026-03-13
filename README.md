# Grandma Mode- Your Personal AI Web Navigator
> **The internet, simplified. For everyone.**

Grandma Mode is a Chrome/Edge extension powered by **Gemini 2.0 Flash** and deployed on **Google CLoud Run**. It watched your screen, understands any webpage, speaks instructions clearly, detect scams, and completes tasks automatically. 

Built for the **GeminiLive Agent Challenge**. 

---

## Live Demo
- **Backend API:** https://grandma-mode-backend-243863724444.us-central1.run.app/health
- **Landing Page:** 

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