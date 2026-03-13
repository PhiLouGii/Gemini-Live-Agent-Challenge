import { GoogleGenAI } from '@google/genai';
import { Action } from './actions';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const MODEL = 'gemini-2.0-flash';

async function generateWithImage(prompt: string, base64Image: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
    ],
  });
  return response.text ?? '';
}

async function generateText(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return response.text ?? '';
}

// ── 1. Basic text prompt ──────────────────────────────────────────
export async function askGemini(prompt: string): Promise<string> {
  return generateText(prompt);
}

// ── 2. Get next action ────────────────────────────────────────────
export async function getNextAction(
  base64Image: string,
  userRequest: string,
  previousActions: string[]
): Promise<{ action: Action; narration: string; isDone: boolean }> {

  const prompt = `You are Grandma Mode, a helpful AI browser assistant.

User request: "${userRequest}"
Previous actions: ${previousActions.length > 0 ? previousActions.join(' → ') : 'none yet'}

Look at the screenshot and decide the SINGLE next action to take.

IMPORTANT RULES:
- NEVER say you cannot do something
- ALWAYS try to find a way forward
- Break complex tasks into tiny single steps
- If a page has a form, fill it step by step
- If login is required, navigate to the relevant section instead
- Be creative — if one approach fails, try another

Respond ONLY with this exact JSON:
{
  "action": "click" | "type" | "scroll" | "navigate" | "wait" | "done",
  "target": "visible text of element to interact with",
  "value": "text to type or URL if needed, otherwise null",
  "narration": "friendly one-sentence explanation of what you are doing",
  "isDone": true or false
}

Rules:
- "click": target = exact visible button/link text
- "type": target = placeholder text of input, value = what to type
- "navigate": value = full URL
- "done": ONLY when task is 100% complete
- Keep narration friendly and clear
- ONLY return JSON`;

  const text = await generateWithImage(prompt, base64Image);
  const cleaned = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    action: { action: parsed.action, target: parsed.target, value: parsed.value },
    narration: parsed.narration,
    isDone: parsed.isDone || parsed.action === 'done',
  };
}

// ── 3. Scam detection ─────────────────────────────────────────────
export async function detectScam(
  base64Image: string
): Promise<{ isScam: boolean; reason: string; warning: string; signals: string[] }> {

  const prompt = `You are a scam detection expert protecting internet users.

Analyze this webpage screenshot for scam signals:
- Urgent language ("Act now!", "You've won!", "Limited time!")
- Requests for personal info on suspicious pages
- Fake prize/lottery pages
- Suspicious payment pages
- Too-good-to-be-true offers
- Fake warnings or virus alerts
- Impersonation of banks/government
- Misspelled URLs or fake branding
- Pressure tactics

Respond ONLY with this exact JSON:
{
  "isScam": true or false,
  "reason": "brief technical one-line reason",
  "signals": ["signal 1", "signal 2", "signal 3"],
  "warning": "clear warning message explaining exactly why this is suspicious (if scam), or empty string if safe"
}`;

  const text = await generateWithImage(prompt, base64Image);
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// ── 4. Page simplifier ────────────────────────────────────────────
export async function simplifyPage(base64Image: string): Promise<string> {
  const prompt = `You are Grandma Mode, a helpful browser assistant.

Look at this screenshot and explain what this page is about in simple, clear language.
- Use short sentences
- Avoid technical jargon
- Mention the 2-3 most important things on the page
- Be friendly and helpful
- Keep it under 80 words

Speak directly to the user.`;

  return generateWithImage(prompt, base64Image);
}

// ── 5. Suggestions ────────────────────────────────────────────────
export async function getSuggestions(base64Image: string): Promise<string[]> {
  const prompt = `You are Grandma Mode helping a user browse the internet.

Look at this webpage and suggest 2-3 natural follow-up actions the user might want to do next.

Respond ONLY with a JSON array of short friendly action strings:
["Search for a cheaper option", "Read more about this", "Go back to results"]

Keep each suggestion under 8 words. Return ONLY the JSON array.`;

  const text = await generateWithImage(prompt, base64Image);
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// ── 6. Form simplifier ────────────────────────────────────────────
export async function simplifyFormFields(
  fields: any[],
  base64Image: string
): Promise<any[]> {

  const prompt = `You are Grandma Mode helping a user fill out a form.

Here are the form fields:
${JSON.stringify(fields, null, 2)}

For each field provide a simplified explanation in plain English.

Respond ONLY with a JSON array:
[
  {
    "id": "field id from input",
    "simpleLabel": "Simple clear name for this field",
    "explanation": "One sentence explaining what to put here",
    "example": "A practical example value",
    "required": true or false
  }
]

Rules:
- Use simple language anyone can understand
- Keep explanations under 15 words
- Give practical examples
- ONLY return the JSON array`;

  const text = await generateWithImage(prompt, base64Image);
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// ── 7. Quick answers ──────────────────────────────────────────────
export async function getQuickAnswer(
  request: string,
  base64Image: string
): Promise<{ isQuickAnswer: boolean; answer: string; links?: { label: string; url: string }[] }> {

  const prompt = `You are Grandma Mode helping a user.

The user asked: "${request}"

Decide if this is a QUICK ANSWER question that can be answered directly from knowledge.
Quick answer examples: opening hours, locations, prices, facts, weather, directions, contact info.

IMPORTANT RULES:
- You have general knowledge about businesses, places, and facts worldwide
- You do NOT need to visit a website to answer factual questions
- For opening hours give typical/general hours confidently
- Always provide 2-3 helpful relevant links
- If it needs actual browsing (buying, booking, filling forms) set isQuickAnswer to false

Respond ONLY with this JSON:
{
  "isQuickAnswer": true or false,
  "answer": "friendly confident answer in 2 sentences max, or empty string if not a quick answer",
  "links": [
    { "label": "short link label", "url": "https://full-url.com" }
  ]
}
ONLY return JSON.`;

  const text = await generateWithImage(prompt, base64Image);
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}