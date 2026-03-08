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

// ── 2. Analyze screenshot + decide next action ────────────────────
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
          text: `You are Grandma Mode, a warm helpful AI assistant controlling a browser for an elderly user.

User request: "${userRequest}"
Previous actions: ${previousActions.length > 0 ? previousActions.join(' → ') : 'none yet'}

Look at the screenshot and decide the SINGLE next action to take.

Respond ONLY with this exact JSON format:
{
  "action": "click" | "type" | "scroll" | "navigate" | "wait" | "done",
  "target": "visible text of element to interact with",
  "value": "text to type or URL (if needed, otherwise null)",
  "narration": "warm one-sentence explanation for elderly user",
  "isDone": true or false
}

Rules:
- "click": target = exact visible button/link text on screen
- "type": target = placeholder text of input, value = what to type  
- "navigate": value = full URL
- "done": task is fully complete
- Narration must be warm, simple, like talking to a grandparent
- ONLY return JSON, nothing else`
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
          text: `You are a scam detection expert protecting elderly internet users.

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
  "warning": "warm gentle warning message for elderly user (if scam), or empty string if safe"
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
          text: `You are Grandma Mode helping an elderly user understand a webpage.

Look at this screenshot and explain what this page is about in simple, clear language.
- Use short sentences
- Avoid technical jargon
- Mention the 2-3 most important things on the page
- Be warm and reassuring
- Keep it under 100 words

Speak directly to the user as if you are their helpful grandchild.`
        }
      ]
    }]
  });

  return result.response.candidates![0].content.parts[0].text!;
}

export async function getSuggestions(base64Image: string): Promise<string[]> {
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        {
          text: `You are Grandma Mode helping an elderly user browse the internet.

Look at this webpage and suggest 2-3 simple follow-up actions the user might want to do next.

Respond ONLY with a JSON array of short, friendly action strings. Example:
["Search for a cheaper option", "Read more about this topic", "Go back to the previous page"]

Keep each suggestion under 8 words. Return ONLY the JSON array.`
        }
      ]
    }]
  });

  const text = result.response.candidates![0].content.parts[0].text!;
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

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
          text: `You are Grandma Mode helping an elderly user fill out a form.

Here are the form fields found on the page:
${JSON.stringify(fields, null, 2)}

For each field, provide a simplified explanation in plain English.

Respond ONLY with a JSON array like this:
[
  {
    "id": "field id from input",
    "simpleLabel": "Simple name for this field",
    "explanation": "One warm sentence explaining what to put here",
    "example": "An example value (optional, leave empty string if not helpful)",
    "required": true or false
  }
]

Rules:
- Use simple language an elderly person would understand
- Be warm and reassuring
- Keep explanations under 15 words
- Give practical examples where helpful
- ONLY return the JSON array`
        }
      ]
    }]
  });

  const text = result.response.candidates![0].content.parts[0].text!;
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}