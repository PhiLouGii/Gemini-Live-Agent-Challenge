# Grandma Mode — Text Description

## The Problem

The internet was not built for everyone. Complex layouts, confusing forms, scam-filled pages, and overwhelming navigation leave millions of people frustrated, lost, or vulnerable every single day. Whether you are unfamiliar with technology, navigating a foreign website, or simply dealing with a poorly designed page — the internet can feel like a wall.

## The Inspiration

Grandma Mode started with a simple observation: watching someone struggle to book a hotel online because the page was too cluttered, the buttons too small, and the process too confusing. The question became — what if there was someone sitting next to you who could explain it, guide you through it, and do it for you if needed? That is Grandma Mode.

The name started as a reference to elderly users, but the product quickly became something broader — a tool for anyone who needs help navigating the web. Non-native speakers, people with disabilities, anyone on a confusing government or medical site, or simply anyone who wants a task done faster.

## What It Does

Grandma Mode is a Chrome and Edge browser extension powered by Gemini 2.0 Flash that acts as a personal AI web navigator. It captures real browser screenshots, sends them to Gemini Vision for multimodal analysis, and returns structured actions that are executed directly on the live DOM.

**Core features:**

Screen Understanding — every feature in Grandma Mode is powered by Gemini Vision analyzing a real screenshot of the user's browser. The agent never relies on DOM access or page source — it sees the page the same way a human does.

Task Automation — the user describes what they want in plain language. The agent enters a step-by-step loop: take screenshot, ask Gemini what to do next, highlight the target element, confirm with the user if Guided Mode is on, execute the action, repeat. The loop continues until the task is complete or the user stops it.

Scam Detection — every screenshot is analyzed for suspicious patterns including urgent language, fake prize pages, impersonation of banks or government services, and suspicious payment forms. Signals are surfaced to the user with a plain English explanation.

Form Guide — the agent scans the DOM for form fields, extracts their labels and placeholders, and sends them to Gemini with a screenshot. Gemini rewrites each field in plain English with an explanation and a practical example. Clicking any field highlights it on the actual form.

Confusion Detection — the content script monitors user behavior passively. Rapid scrolling (five scrolls in under 500ms), repeated back navigation, and extended idle time (30 seconds) each trigger a prompt asking if the user needs help.

Guided Mode — a toggle that controls whether the agent asks for confirmation before each action or executes automatically. When on, a confirmation dialog appears with the exact action described before anything happens on the page.

Quick Answers — before entering the task loop, the agent checks whether the request can be answered from Gemini's own knowledge. Questions about opening hours, locations, prices, and facts are answered instantly with relevant links, without any navigation.

Memory — user preferences are stored in Firestore and applied automatically. Patterns like preferring the cheapest option, avoiding subscriptions, or wanting free delivery are extracted from task requests and saved per user.

Voice — all narration is spoken via the Web Speech API with a warm female voice. The agent speaks every explanation, warning, and confirmation aloud.

## Technologies Used

**Google Cloud:**
- Vertex AI — Gemini 2.0 Flash (`gemini-2.0-flash-001`) for all vision and language tasks
- Cloud Run — serverless backend deployment in us-central1
- Firestore — persistent user memory and preference storage
- Application Default Credentials — IAM-based authentication on Cloud Run

**Backend:**
- Node.js and TypeScript
- Express for the REST API
- WebSocket (ws library) for real-time communication with the extension
- Playwright for local browser automation (not used in production)

**Extension:**
- Chrome Extension Manifest V3
- Side Panel API for persistent UI across page navigation
- `chrome.tabs.captureVisibleTab` for real screenshot capture
- Content scripts for DOM interaction and element highlighting
- Web Speech API for voice output

**Other:**
- Netlify for landing page hosting
- GitHub for version control

## Data Sources

No external datasets were used. All intelligence comes from Gemini 2.0 Flash analyzing live browser screenshots in real time. User preferences are the only persistent data, stored in Firestore under a default user ID.

## How It Was Built

The project was built in approximately one week as a solo submission. Development started with a basic screenshot-to-Gemini pipeline, then expanded to include the full agent loop, DOM execution, scam detection, form simplification, confusion detection, and memory.

The backend was initially developed locally with ts-node and deployed to Google Cloud Run using the gcloud CLI with buildpacks. The extension was loaded unpacked in Chrome throughout development and tested against real websites including Amazon, Google, hotel booking sites, and government pages.

The most significant architectural decision was keeping the extension responsible for screenshot capture and DOM execution while delegating all AI reasoning to the backend. This kept the extension lightweight and allowed the backend to be updated and redeployed without touching the extension code.

## Findings and Learnings

Gemini Vision is remarkably capable at interpreting real browser screenshots. It identifies buttons, form fields, navigation elements, and even subtle scam signals without any DOM access or page structure information. The raw visual understanding was more reliable than expected.

Structured JSON prompting is the key to turning a language model into a reliable agent. The model needs a strict output contract — exact action types, target element descriptions, and values to type — to produce output that can be executed programmatically. Loose prompts produce narrative responses. Tight prompts produce actions.

Chrome Extension Manifest V3 side panels are the right UI pattern for persistent browser assistants. Unlike popups which close on every page navigation, the side panel stays open and maintains state across the entire browsing session.

API key security is not optional. During development a Gemini API key was exposed in a public GitHub push and immediately revoked by Google's automated scanner. The project was migrated to Vertex AI with Application Default Credentials — a more secure approach that uses Google Cloud IAM instead of raw API keys and eliminates the risk of accidental exposure.

Cloud Run cold starts affect user experience. The backend was optimized with lazy browser initialization so the server starts immediately on the health check port without waiting for Playwright to launch.

## Challenges

Getting Gemini to act rather than describe was the first major challenge. Early prompts returned rich narration but vague actions. The solution was engineering prompts that force structured JSON output with specific element targets, exact values, and clear action types.

Making the agent work on real websites was harder than expected. Dynamic sites re-render the DOM after every action, React components replace native input events, and automation detection blocks simple click and type operations. The content script was rebuilt with a multi-strategy element finder and character-by-character typing that dispatches keyboard events to simulate real user input.

Keeping the UI clean and professional required restraint. The original design used emojis throughout and spoke with overly familiar language. Stripping this back to a minimal, warm but neutral interface made the product feel more credible and broadly usable.

## What Is Next

Multi-user support with proper authentication would make memory genuinely personal rather than shared across a default user ID. Chrome Web Store submission would replace the current zip-based installation. Mobile support via an Android accessibility overlay would extend the reach significantly. Localization for non-English speakers is a natural next step given that language barriers are one of the core problems the product addresses.