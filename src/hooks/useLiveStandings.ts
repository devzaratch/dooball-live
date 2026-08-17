'use client';

import { useMemo } from 'react';
import { Match } from '@/types/football';

export interface StandingItem {
    idStanding: string;
    intRank: string;
    idTeam: string;
    strTeam: string;
    strBadge: string;
    idLeague: string;
    strLeague: string;
    strSeason: string;
    strForm?: string;
    strDescription?: string;
    intPlayed: string;
    intWin: string;
    intLoss: string;
    intDraw: string;
    intGoalsFor: string;
    intGoalsAgainst: string;
    intGoalDifference: string;
    intPoints: string;
    isLiveUpdated?: boolean;
    liveDiff?: string;
    liveScoreStatus?: string;
}

export function useLiveStandings(baseStandings: StandingItem[], liveMatches: Match[]) {
    return useMemo(() => {
        if (!baseStandings || baseStandings.length === 0) return [];

        // Clone base standings
        const updatedStandings = baseStandings.map((item) => ({ ...item }));

        // Active LIVE or FINISHED matches
        const activeMatches = liveMatches.filter(
            (m) => m.status === 'LIVE' || m.status === 'FINISHED'
        );

        if (activeMatches.length === 0) return updatedStandings;

        // Process live score adjustments
        activeMatches.forEach((match) => {
            const homeScore = typeof match.homeTeam?.score === 'number' ? match.homeTeam.score : parseInt(String(match.homeTeam?.score || 0), 10);
            const awayScore = typeof match.awayTeam?.score === 'number' ? match.awayTeam.score : parseInt(String(match.awayTeam?.score || 0), 10);

            if (isNaN(homeScore) || isNaN(awayScore)) return;

            const homeName = (match.homeTeam?.name || '').toLowerCase();
            const awayName = (match.awayTeam?.name || '').toLowerCase();

            // Find matching teams in standings table
            const homeItem = updatedStandings.find((s) => {
                const sName = (s.strTeam || '').toLowerCase();
                return sName.includes(homeName) || homeName.includes(sName);
            });

            const awayItem = updatedStandings.find((s) => {
                const sName = (s.strTeam || '').toLowerCase();
                return sName.includes(awayName) || awayName.includes(sName);
            });

            // Adjust Home Team Live Stats
            if (homeItem) {
                const basePts = parseInt(homeItem.intPoints || '0', 10);
                const baseGF = parseInt(homeItem.intGoalsFor || '0', 10);
                const baseGA = parseInt(homeItem.intGoalsAgainst || '0', 10);

                let addPts = 0;
                if (homeScore > awayScore) addPts = 3;
                else if (homeScore === awayScore) addPts = 1;

                const livePts = basePts + addPts;
                const liveGF = baseGF + homeScore;
                const liveGA = baseGA + awayScore;
                const liveGD = liveGF - liveGA;

                homeItem.intPoints = String(livePts);
                homeItem.intGoalsFor = String(liveGF);
                homeItem.intGoalsAgainst = String(liveGA);
                homeItem.intGoalDifference = String(liveGD);
                homeItem.isLiveUpdated = true;
                homeItem.liveDiff = addPts > 0 ? `+${addPts} Pts` : `0 Pts`;
                homeItem.liveScoreStatus = `${homeScore}-${awayScore} (${match.status})`;
            }

            // Adjust Away Team Live Stats
            if (awayItem) {
                const basePts = parseInt(awayItem.intPoints || '0', 10);
                const baseGF = parseInt(awayItem.intGoalsFor || '0', 10);
                const baseGA = parseInt(awayItem.intGoalsAgainst || '0', 10);

                let addPts = 0;
                if (awayScore > homeScore) addPts = 3;
                else if (homeScore === awayScore) addPts = 1;

                const livePts = basePts + addPts;
                const liveGF = baseGF + awayScore;
                const liveGA = baseGA + homeScore;
                const liveGD = liveGF - liveGA;

                awayItem.intPoints = String(livePts);
                awayItem.intGoalsFor = String(liveGF);
                awayItem.intGoalsAgainst = String(liveGA);
                awayItem.intGoalDifference = String(liveGD);
                awayItem.isLiveUpdated = true;
                awayItem.liveDiff = addPts > 0 ? `+${addPts} Pts` : `0 Pts`;
                awayItem.liveScoreStatus = `${awayScore}-${homeScore} (${match.status})`;
            }
        });

        // Re-sort standings dynamically by Live Points -> Live Goal Difference -> Live Goals For
        updatedStandings.sort((a, b) => {
            const ptsA = parseInt(a.intPoints || '0', 10);
            const ptsB = parseInt(b.intPoints || '0', 10);
            if (ptsA !== ptsB) return ptsB - ptsA;

            const gdA = parseInt(a.intGoalDifference || '0', 10);
            const gdB = parseInt(b.intGoalDifference || '0', 10);
            if (gdA !== gdB) return gdB - gdA;

            const gfA = parseInt(a.intGoalsFor || '0', 10);
            const gfB = parseInt(b.intGoalsFor || '0', 10);
            return gfB - gfA;
        });

        // Update rank numbers
        return updatedStandings.map((item, index) => ({
            ...item,
            intRank: String(index + 1),
        }));
    }, [baseStandings, liveMatches]);
}
