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
        const fs = require('fs');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require('path');
        const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
        if (fs.existsSync(keyPath)) {
            const raw = fs.readFileSync(keyPath, 'utf-8');
            return JSON.parse(raw);
        }
    } catch {
        // ignore
    }
    console.warn('serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT_KEY env var missing.');
    return null;
}

const ADMIN_APP_NAME = 'dooball-admin-app';
const serviceAccount = getServiceAccount();
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://football-888-b9a7e-default-rtdb.asia-southeast1.firebasedatabase.app";

const adminApp = getApps().find(app => app.name === ADMIN_APP_NAME) || initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
    databaseURL
}, ADMIN_APP_NAME);

export const adminDb = getDatabase(adminApp);

