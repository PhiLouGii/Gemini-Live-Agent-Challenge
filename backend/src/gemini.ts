import { VertexAI } from '@google-cloud/vertexai';
import { Action } from './actions';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_CLOUD_LOCATION!,
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.0-flash-001',
});

// ── 1. Basic text prompt ──────────────────────────────────────────
export async function askGemini(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.candidates![0].content.parts[0].text!;
}

// ── 2. Get next action ────────────────────────────────────────────
export async function getNextAction(
  base64Image: string,
  userRequest: string,
  previousActions: string[]
): Promise<{ action: Action; narration: string; isDone: boolean }> {

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        {
          text: `You are Grandma Mode, a helpful AI browser assistant.

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
- ONLY return JSON`
        }
      ]
    }]
  });

  const text = result.response.candidates![0].content.parts[0].text!;
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

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        {
          text: `You are a scam detection expert protecting internet users.

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
}`
        }
      ]
    }]
  });

  const text = result.response.candidates![0].content.parts[0].text!;
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// ── 4. Page simplifier ────────────────────────────────────────────
export async function simplifyPage(
  base64Image: string
): Promise<string> {

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        {
          text: `You are Grandma Mode, a helpful browser assistant.

Look at this screenshot and explain what this page is about in simple, clear language.
- Use short sentences
- Avoid technical jargon
- Mention the 2-3 most important things on the page
- Be friendly and helpful
- Keep it under 80 words

Speak directly to the user.`
        }
      ]
    }]
  });

  return result.response.candidates![0].content.parts[0].text!;
}

// ── 5. Suggestions ────────────────────────────────────────────────
export async function getSuggestions(base64Image: string): Promise<string[]> {
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        {
          text: `You are Grandma Mode helping a user browse the internet.

Look at this webpage and suggest 2-3 natural follow-up actions the user might want to do next.

Respond ONLY with a JSON array of short friendly action strings:
["Search for a cheaper option", "Read more about this", "Go back to results"]

Keep each suggestion under 8 words. Return ONLY the JSON array.`
        }
      ]
    }]
  });

  const text = result.response.candidates![0].content.parts[0].text!;
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// ── 6. Form simplifier ────────────────────────────────────────────
export async function simplifyFormFields(
  fields: any[],
  base64Image: string
): Promise<any[]> {

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        {
          text: `You are Grandma Mode helping a user fill out a form.

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
- ONLY return the JSON array`
        }
      ]
    }]
  });

  const text = result.response.candidates![0].content.parts[0].text!;
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// ── 7. Quick answers ──────────────────────────────────────────────
export async function getQuickAnswer(
  request: string,
  base64Image: string
): Promise<{ isQuickAnswer: boolean; answer: string; links?: { label: string; url: string }[] }> {

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        {
          text: `You are Grandma Mode, a helpful AI assistant with broad general knowledge.

The user asked: "${request}"

STEP 1 — Classify the request:
- QUICK: factual questions, business hours, locations, prices, definitions, weather, "who is", "what is", "where is", "when does", "how much" — anything answerable from general knowledge
- BROWSE: requires actually doing something on a website (buying, booking, filling forms, logging in)

STEP 2 — If QUICK, answer confidently from your own knowledge. Examples:
- "What time does KFC close?" → Answer with typical KFC hours (usually 10pm-11pm, varies by location)
- "Nearest airport to Maseru" → Moshoeshoe I International Airport
- "What is the capital of France?" → Paris
- "How much does Netflix cost?" → Answer with known pricing

CRITICAL RULES:
- You have vast general knowledge — USE IT confidently
- Never say "I don't have access" or "I can't check" for factual questions
- Never say you need to visit a website to answer a simple fact
- Always give a direct helpful answer first, then provide useful links
- For business hours, give typical/general hours with a note that they may vary
- For locations, give the actual place name and address if known
- Links should be genuinely useful: Google Maps, official site, Google Search

Respond ONLY with this JSON:
{
  "isQuickAnswer": true or false,
  "answer": "confident friendly answer in 2-3 sentences",
  "links": [
    { "label": "Find on Google Maps", "url": "https://www.google.com/maps/search/KFC+near+me" },
    { "label": "Official KFC website", "url": "https://www.kfc.com" }
  ]
}

ONLY return JSON, nothing else.`
        }
      ]
    }]
  });

  const text = result.response.candidates![0].content.parts[0].text!;
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}