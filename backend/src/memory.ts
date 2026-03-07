import * as admin from 'firebase-admin';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export type UserPreference = {
  key: string;
  value: string;
  addedAt: Date;
};

export type UserMemory = {
  userId: string;
  preferences: UserPreference[];
  lastSeen: Date;
  totalTasks: number;
};

// Default user ID for now (single user mode)
const DEFAULT_USER = 'grandma_user_1';

// ── Get user memory ───────────────────────────────────────────────
export async function getUserMemory(userId: string = DEFAULT_USER): Promise<UserMemory> {
  const doc = await db.collection('users').doc(userId).get();

  if (!doc.exists) {
    return {
      userId,
      preferences: [],
      lastSeen: new Date(),
      totalTasks: 0,
    };
  }

  return doc.data() as UserMemory;
}

// ── Save preference ───────────────────────────────────────────────
export async function savePreference(
  key: string,
  value: string,
  userId: string = DEFAULT_USER
): Promise<void> {
  const ref = db.collection('users').doc(userId);
  const doc = await ref.get();

  if (!doc.exists) {
    await ref.set({
      userId,
      preferences: [{ key, value, addedAt: new Date() }],
      lastSeen: new Date(),
      totalTasks: 0,
    });
    return;
  }

  const data = doc.data() as UserMemory;
  const existing = data.preferences || [];

  // Update if exists, add if new
  const updated = existing.filter((p: UserPreference) => p.key !== key);
  updated.push({ key, value, addedAt: new Date() });

  await ref.update({
    preferences: updated,
    lastSeen: new Date(),
  });
}

// ── Delete preference ─────────────────────────────────────────────
export async function deletePreference(
  key: string,
  userId: string = DEFAULT_USER
): Promise<void> {
  const ref = db.collection('users').doc(userId);
  const doc = await ref.get();
  if (!doc.exists) return;

  const data = doc.data() as UserMemory;
  const updated = (data.preferences || []).filter(
    (p: UserPreference) => p.key !== key
  );

  await ref.update({ preferences: updated });
}

// ── Increment task count ──────────────────────────────────────────
export async function incrementTaskCount(
  userId: string = DEFAULT_USER
): Promise<void> {
  const ref = db.collection('users').doc(userId);
  const doc = await ref.get();

  if (!doc.exists) {
    await ref.set({ userId, preferences: [], lastSeen: new Date(), totalTasks: 1 });
    return;
  }

  const data = doc.data() as UserMemory;
  await ref.update({
    totalTasks: (data.totalTasks || 0) + 1,
    lastSeen: new Date(),
  });
}

// ── Extract preferences from task ────────────────────────────────
export async function extractAndSavePreferences(
  userRequest: string,
  userId: string = DEFAULT_USER
): Promise<void> {
  // Simple preference extraction rules
  const rules = [
    { pattern: /cheap|cheapest|budget|low.?cost|affordable/i, key: 'price_preference', value: 'Prefers cheapest option' },
    { pattern: /large.?text|bigger.?font|can't.?see/i, key: 'accessibility', value: 'Needs large text' },
    { pattern: /no.?subscri|avoid.?subscri/i, key: 'subscription', value: 'Avoids subscriptions' },
    { pattern: /fast|quick|fastest/i, key: 'speed', value: 'Prefers fastest option' },
    { pattern: /free.?deliver|free.?ship/i, key: 'delivery', value: 'Prefers free delivery' },
    { pattern: /english|simple.?language/i, key: 'language', value: 'Prefers simple English' },
  ];

  for (const rule of rules) {
    if (rule.pattern.test(userRequest)) {
      await savePreference(rule.key, rule.value);
    }
  }
}