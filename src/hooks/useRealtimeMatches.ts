'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Match } from '@/types/football';

export function useRealtimeMatches(initialData: Match[] = []) {
    const [matches, setMatches] = useState<Match[]>(initialData);
    const [loading, setLoading] = useState(initialData.length === 0);
    const isMountedRef = useRef(true);

    const fetchMatches = useCallback(async () => {
        try {
            const res = await fetch('/api/matches', {
                cache: 'no-cache',
                headers: { 'Accept': 'application/json' },
            });

            if (!res.ok) return;

            const data = await res.json();
            if (isMountedRef.current && data?.matches && Array.isArray(data.matches) && data.matches.length > 0) {
                setMatches(data.matches);
            }
        } catch (err) {
            console.warn('Matches fetch notice:', err);
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;

        // 1. Initial immediate fetch
        const loadInitial = async () => {
            await fetchMatches();
        };
        loadInitial();

        // 2. Smart Polling Interval (Every 4 seconds when tab is active, 15s when inactive)
        const intervalTime = 4000;
        let pollTimer: NodeJS.Timeout;

        const startPolling = (ms: number) => {
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    fetchMatches();
                }
            }, ms);
        };

        startPolling(intervalTime);

        // 3. Handle Visibility Change (Immediate refresh on tab focus)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchMatches();
                startPolling(4000);
            } else {
                startPolling(15000);

            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isMountedRef.current = false;
            if (pollTimer) clearInterval(pollTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchMatches]);

    return { matches, loading };
}