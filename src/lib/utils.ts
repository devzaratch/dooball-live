import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Standardizes match key for Firebase Realtime Database paths.
 * Firebase allows Thai / Unicode, but forbids: . $ # [ ] /
 */
export function getMatchRoomKey(matchOrSlug?: { slug?: string; id?: string | number } | string | null): string {
    if (!matchOrSlug) return 'default';
    if (typeof matchOrSlug === 'string') {
        return matchOrSlug.replace(/[.$#[\]/]/g, '_').trim();
    }
    const raw = matchOrSlug.slug || String(matchOrSlug.id || 'default');
    return raw.replace(/[.$#[\]/]/g, '_').trim();
}