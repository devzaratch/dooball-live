export interface StreamLink {
    id: string;
    label: string;      // เช่น "ช่อง 1 (HD)", "พากย์ไทย"
    url: string;        // m3u8 หรือ iframe URL
    quality?: string;   // "1080p", "720p"
}

export interface Match {
    id: string;
    slug?: string;
    date?: string;       // วันที่ เช่น "16 ส.ค 2569"
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
    streamLinks?: StreamLink[];
    h2h?: any[];
    lineup?: any;
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