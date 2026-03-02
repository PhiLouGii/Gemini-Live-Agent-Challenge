import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';
import { Action } from './actions';

dotenv.config({ path: '../../.env' });

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_CLOUD_LOCATION!,
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.0-flash-001',
});

export async function askGemini(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.candidates![0].content.parts[0].text!;
}

export async function analyzeScreenshot(
  base64Image: string,
  userRequest: string
): Promise<string> {
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image,
          }
        },
        {
          text: `You are Grandma Mode, a warm and helpful AI assistant.
          
The user says: "${userRequest}"

Look at this screenshot and describe:
1. What page is this?
2. What are the main interactive elements (buttons, forms, links)?
3. What should I do to help the user with their request?

Be warm, clear and simple in your response.`
        }
      ]
    }]
  });

  return result.response.candidates![0].content.parts[0].text!;
}

export async function getNextAction(
  base64Image: string,
  userRequest: string,
  previousActions: string[]
): Promise<{ action: Action; narration: string }> {
  
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image,
          }
        },
        {
          text: `You are Grandma Mode, a warm helpful AI assistant controlling a browser.

User request: "${userRequest}"
Previous actions taken: ${previousActions.length > 0 ? previousActions.join(', ') : 'none yet'}

Look at the screenshot and decide the SINGLE next action to take.

You MUST respond with ONLY a JSON object in this exact format:
{
  "action": "click" | "type" | "scroll" | "navigate" | "wait" | "done",
  "target": "exact text of button or field to interact with",
  "value": "text to type or URL to navigate to (if needed)",
  "narration": "warm one-sentence explanation of what you are doing",
  "isDone": true or false
}

Rules:
- action "click": use target = visible text on the button/link
- action "type": use target = placeholder text of the input field, value = what to type
- action "navigate": use value = full URL
- action "done": when the task is complete
- Keep narration warm and simple like talking to a grandparent
- ONLY return the JSON, no other text`
        }
      ]
    }]
  });

  const text = result.response.candidates![0].content.parts[0].text!;
  
  // Clean up response and parse JSON
  const cleaned = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  
  return {
    action: {
      action: parsed.action,
      target: parsed.target,
      value: parsed.value,
    },
    narration: parsed.narration,
  };
}