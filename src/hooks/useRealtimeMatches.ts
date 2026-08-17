'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Match } from '@/types/football';

export function useRealtimeMatches(initialData: Match[] = []) {
    const [matches, setMatches] = useState<Match[]>(initialData);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        // Fetch automated live match feed
        const fetchAutomatedFeed = async () => {
            try {
                const res = await fetch('/api/matches/auto-sync');
                const data = await res.json();
                if (isMounted && data?.matches && Array.isArray(data.matches)) {
                    setMatches((prev) => (prev.length === 0 ? data.matches : prev));
                }
            } catch (err) {
                console.warn('Auto-sync feed fetch notice:', err);
            }
        };

        fetchAutomatedFeed();

        // Firebase Realtime Listener
        const matchesRef = ref(db, 'matches');

        const unsubscribe = onValue(
            matchesRef,
            (snapshot) => {
                const rawData = snapshot.val();

                if (rawData && isMounted) {
                    const rawArray = Array.isArray(rawData)
                        ? rawData
                        : Object.keys(rawData).map((key) => ({ id: key, ...rawData[key] }));

                    const formattedMatches: Match[] = rawArray
                        .filter((item) => item !== null)
                        .map((item, index) => {
                            const streamLinks = item.streamLinks && Array.isArray(item.streamLinks) ? [...item.streamLinks] : [];
                            if (item.embed_url && !streamLinks.some((s: any) => s.url === item.embed_url)) {
                                streamLinks.unshift({
                                    id: `stream-main-${index}`,
                                    label: 'ลิงก์ถ่ายทอดสดหลัก (HD)',
                                    url: item.embed_url,
                                    quality: '1080p',
                                });
                            }

                            const matchDate = item.date_string || item.date || item.date_str || item.match_date || item.day || '';
                            const rawStatus = String(item.status || '').trim();
                            const statusLower = rawStatus.toLowerCase();

                            const isLiveMatch = item.is_live === true || rawStatus === 'LIVE' || statusLower === 'live';
                            const isFinishedMatch = 
                                rawStatus === 'FINISHED' ||
                                rawStatus === 'จบการแข่งขัน' ||
                                statusLower === 'ft' ||
                                statusLower === 'finished' ||
                                statusLower === 'ended' ||
                                statusLower === 'full-time' ||
                                statusLower === 'aet' ||
                                statusLower === 'pen' ||
                                (item.is_live === false && (item.time === '00:00' || rawStatus === 'จบการแข่งขัน') && item.home_score !== undefined && item.home_score !== '-' && item.home_score !== '?');

                            const finalStatus = isLiveMatch ? 'LIVE' : (isFinishedMatch ? 'FINISHED' : 'UPCOMING');
                            const kickoffTime = isFinishedMatch
                                ? 'จบการแข่งขัน'
                                : (item.time && item.time !== '00:00' && item.time !== 'จบการแข่งขัน' ? item.time : (item.kickoffTime || '00:00'));

                            return {
                                id: String(item.id ?? index),
                                slug: item.slug || `${(item.home || 'home').toLowerCase().replace(/\s+/g, '-')}-vs-${(item.away || 'away').toLowerCase().replace(/\s+/g, '-')}`,
                                date: matchDate,
                                dateOrder: item.date_order ?? index,
                                homeTeam: {
                                    name: item.home || item.homeTeam?.name || 'ทีมเหย้า',
                                    score: item.home_score !== undefined && item.home_score !== '?' ? item.home_score : (item.homeTeam?.score ?? '-'),
                                    logo: item.home_logo || item.homeTeam?.logo,
                                },
                                awayTeam: {
                                    name: item.away || item.awayTeam?.name || 'ทีมเยือน',
                                    score: item.away_score !== undefined && item.away_score !== '?' ? item.away_score : (item.awayTeam?.score ?? '-'),
                                    logo: item.away_logo || item.awayTeam?.logo,
                                },
                                league: {
                                    name: item.league?.name || item.league || 'ทั่วไป',
                                    logo: item.league_logo || item.league?.logo,
                                },
                                kickoffTime: kickoffTime,
                                status: finalStatus,
                                currentMinute: item.currentMinute || item.status || '0',
                                streamLinks: streamLinks,
                            };
                        });

                    setMatches(formattedMatches);
                }
                if (isMounted) setLoading(false);
            },
            (error) => {
                console.warn('Firebase Read Warning:', error.message);
                if (isMounted) setLoading(false);
            }
        );

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    return { matches, loading };
}