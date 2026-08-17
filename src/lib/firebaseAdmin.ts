import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

function getServiceAccount() {
    // 1. Try Environment Variable (JSON String or Base64 String)
    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (envKey) {
        try {
            const jsonStr = envKey.startsWith('{') ? envKey : Buffer.from(envKey, 'base64').toString('utf-8');
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY env var:', e);
        }
    }

    // 2. Fallback to local serviceAccountKey.json file if present
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const localKey = require('../../serviceAccountKey.json');
        return localKey;
    } catch {
        console.warn('serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT_KEY env var missing.');
        return null;
    }
}

// Ensure we only initialize the app once, especially in Next.js dev mode (hot reloading)
if (getApps().length === 0) {
    const serviceAccount = getServiceAccount();
    const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://football-888-b9a7e-default-rtdb.asia-southeast1.firebasedatabase.app";

    if (serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount),
            databaseURL
        });
    } else {
        initializeApp({
            databaseURL
        });
    }
}

export const adminDb = getDatabase();

