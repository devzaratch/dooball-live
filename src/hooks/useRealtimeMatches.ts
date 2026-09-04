'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Match } from '@/types/football';

export function useRealtimeMatches(initialData: Match[] = []) {
    const [matches, setMatches] = useState<Match[]>(initialData);
    const [loading, setLoading] = useState(initialData.length === 0);
    const isMountedRef = useRef(true);
    const hasInitialLoadRef = useRef(false);

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
                hasInitialLoadRef.current = true;
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
        fetchMatches();

        // 2. Fallback check: if first fetch takes time, try auto-sync backup
        const autoSyncTimer = setTimeout(async () => {
            if (!hasInitialLoadRef.current && isMountedRef.current) {
                try {
                    const backupRes = await fetch('/api/matches/auto-sync');
                    const backupData = await backupRes.json();
                    if (isMountedRef.current && !hasInitialLoadRef.current && backupData?.matches?.length > 0) {
                        setMatches(backupData.matches);
                    }
                } catch {
                    // Ignore backup errors
                }
            }
        }, 2000);

        // 3. Smart Polling Interval (Every 4 seconds when tab is active, 15s when inactive)
        let intervalTime = 4000;
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

        // 4. Handle Visibility Change (Immediate refresh on tab focus)
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
            clearTimeout(autoSyncTimer);
            if (pollTimer) clearInterval(pollTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchMatches]);

    return { matches, loading };
}