export interface StreamLink {
    id: string;
    label: string;      // เช่น "ช่อง 1 (HD)", "พากย์ไทย"
    url: string;        // m3u8 หรือ iframe URL
    quality?: string;   // "1080p", "720p"
}

export interface MatchEvent {
    id?: string;
    minute: number;
    team: 'home' | 'away';
    type: 'goal' | 'yellow_card' | 'red_card' | 'sub';
    player: string;
    assistOrSub?: string;
}

export interface PlayerLineup {
    id?: string;
    name: string;
    number?: number;
    position?: string;
}

export interface TeamLineup {
    formation?: string;
    coach?: string;
    startingLineup?: PlayerLineup[];
    substitutes?: PlayerLineup[];
}

export interface MatchLineup {
    home?: TeamLineup;
    away?: TeamLineup;
}

export interface Match {
    id: string;
    slug?: string;
    date?: string;       // วันที่ เช่น "16 ส.ค 2569"
    date_string?: string;
    dateOrder?: number;  // ลำดับวันที่ เช่น 1, 2
    homeTeam: {
        name: string;
        logo: string;
        score?: number | string;
    };
    awayTeam: {
        name: string;
        logo: string;
        score?: number | string;
    };
    league: {
        name: string;
        logo?: string;
    };
    kickoffTime: string; // ISO String หรือ "20:00"
    status: 'UPCOMING' | 'LIVE' | 'FINISHED';
    currentMinute?: string;
    link?: string;
    streamLinks?: StreamLink[];
    h2h?: string[] | Record<string, unknown>[];
    h2hHome?: string[];
    h2hAway?: string[];
    lineup?: MatchLineup;
    events?: MatchEvent[];
}

export interface StandingRow {
    rank: number;
    team: {
        name: string;
        logo: string;
    };
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
}