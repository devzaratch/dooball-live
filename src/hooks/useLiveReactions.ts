'use client';

import { useEffect, useCallback } from 'react';
import { ref, push, onChildAdded, limitToLast, query, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';

export interface ReactionEvent {
    id: string;
    emoji: string;
    xPercent: number; // Random horizontal position on player (10% to 90%)
    timestamp: number;
}

export function useLiveReactions(matchId: string, onReceiveReaction?: (event: ReactionEvent) => void) {
    const cleanMatchId = (matchId || 'live-room').replace(/[^a-zA-Z0-9_-]/g, '_');

    useEffect(() => {
        if (!cleanMatchId) return;

        const reactionsRef = query(ref(db, `match_reactions/${cleanMatchId}`), limitToLast(20));

        const startTime = Date.now() - 5000; // Only process recent reactions

        const unsubscribe = onChildAdded(reactionsRef, (snapshot) => {
            const val = snapshot.val();
            if (!val || !val.emoji) return;

            const reactionTime = typeof val.timestamp === 'number' ? val.timestamp : Date.now();
            if (reactionTime < startTime) return;

            const reactionEvent: ReactionEvent = {
                id: snapshot.key || `${Date.now()}-${Math.random()}`,
                emoji: val.emoji,
                xPercent: val.xPercent ?? Math.floor(Math.random() * 80) + 10,
                timestamp: reactionTime,
            };

            onReceiveReaction?.(reactionEvent);
        });

        return () => {
            unsubscribe();
        };
    }, [cleanMatchId, onReceiveReaction]);

    const sendReaction = useCallback(
        async (emoji: string) => {
            if (!cleanMatchId || !emoji) return;

            try {
                const reactionsRef = ref(db, `match_reactions/${cleanMatchId}`);
                const randomX = Math.floor(Math.random() * 80) + 10;

                await push(reactionsRef, {
                    emoji,
                    xPercent: randomX,
                    timestamp: serverTimestamp(),
                });
            } catch (err) {
                console.warn('Failed to send live reaction:', err);
            }
        },
        [cleanMatchId]
    );

    return { sendReaction };
}
