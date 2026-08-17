import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import serviceAccount from '../../serviceAccountKey.json';

// Ensure we only initialize the app once, especially in Next.js dev mode (hot reloading)
if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount as any),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://football-888-b9a7e-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
}

export const adminDb = getDatabase();
