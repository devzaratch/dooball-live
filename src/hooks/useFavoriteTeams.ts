'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dooball_favorite_teams';
const EVENT_KEY = 'favoriteTeamsUpdated';

export function useFavoriteTeams() {
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const loadFavorites = () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        setFavorites(parsed);
                    }
                }
            } catch (err) {
                console.warn('Failed to load favorite teams:', err);
            }
        };

        loadFavorites();

        const handleCustomEvent = () => loadFavorites();
        window.addEventListener(EVENT_KEY, handleCustomEvent);
        window.addEventListener('storage', handleCustomEvent);

        return () => {
            window.removeEventListener(EVENT_KEY, handleCustomEvent);
            window.removeEventListener('storage', handleCustomEvent);
        };
    }, []);

    const toggleFavorite = useCallback((teamName?: string) => {
        if (!teamName || typeof window === 'undefined') return;
        const normalized = teamName.trim();
        if (!normalized) return;

        setFavorites((prev) => {
            const exists = prev.some((t) => t.toLowerCase() === normalized.toLowerCase());
            let updated: string[];
            if (exists) {
                updated = prev.filter((t) => t.toLowerCase() !== normalized.toLowerCase());
            } else {
                updated = [...prev, normalized];
            }

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                window.dispatchEvent(new Event(EVENT_KEY));
            } catch (err) {
                console.warn('Failed to save favorite teams:', err);
            }

            return updated;
        });
    }, []);

    const isFavorite = useCallback(
        (teamName?: string) => {
            if (!teamName) return false;
            const normalized = teamName.trim().toLowerCase();
            return favorites.some((t) => t.trim().toLowerCase() === normalized);
        },
        [favorites]
    );

    const isMatchFavorite = useCallback(
        (homeName?: string, awayName?: string) => {
            return isFavorite(homeName) || isFavorite(awayName);
        },
        [isFavorite]
    );

    return {
        favorites,
        toggleFavorite,
        isFavorite,
        isMatchFavorite,
    };
}
