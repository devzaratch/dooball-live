'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import MatchSidebar from '@/components/layout/MatchSidebar';
import SeoContentSection from '@/components/home/SeoContentSection';
import { useRealtimeMatches } from '@/hooks/useRealtimeMatches';
import { useLiveStandings } from '@/hooks/useLiveStandings';
import MatchCard from '@/components/home/MatchCard';
import { Match } from '@/types/football';
import { Flame, Radio, Trophy, Film, Search, Sparkles, ChevronRight, Play, Clock, ShieldCheck, Calendar } from 'lucide-react';

const THAI_NAMES_MAP: { [key: string]: string } = {
  'Liverpool': 'ลิเวอร์พูล',
  'Arsenal': 'อาร์เซนอล',
  'Manchester City': 'แมนฯ ซิตี้',
  'Aston Villa': 'แอสตัน วิลลา',
  'Chelsea': 'เชลซี',
  'Newcastle': 'นิวคาสเซิล',
  'Nottingham Forest': 'ฟอเรสต์',
  'Brighton': 'ไบรท์ตัน',
  'Bournemouth': 'บอร์นมัธ',
  'Fulham': 'ฟูแล่ม',
  'Tottenham': 'สเปอร์ส',
  'Everton': 'เอฟเวอร์ตัน',
  'Brentford': 'เบรนท์ฟอร์ด',
  'Manchester United': 'แมนฯ ยูไนเต็ด',
  'West Ham': 'เวสต์แฮม',
  'Wolverhampton Wanderers': 'วูล์ฟแฮมป์ตัน',
  'Leicester': 'เลสเตอร์',
  'Ipswich': 'อิปสวิช',
  'Crystal Palace': 'พาเลซ',
  'Southampton': 'เซาแธมป์ตัน',
};

export default function HomePage() {
  const { matches = [], loading } = useRealtimeMatches([]) || {};
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'TODAY'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sidebarStandings, setSidebarStandings] = useState<any[]>([]);
  const [homeHighlights, setHomeHighlights] = useState<any[]>([]);

  // Live Standings Auto-Calculation Hook
  const liveSidebarStandings = useLiveStandings(sidebarStandings, matches);

  useEffect(() => {
    fetch('/api/table?league=4328')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.table && Array.isArray(data.table)) {
          setSidebarStandings(data.table.slice(0, 10));
        }
      })
      .catch(() => {});

    // ดึงไฮไลท์ฟุตบอลสดใหม่อัตโนมัติสำหรับ Widget หน้าแรก
    fetch('/api/highlights')
      .then((res) => res.json())
      .then((data) => {
        if (data?.highlights && Array.isArray(data.highlights) && data.highlights.length > 0) {
          setHomeHighlights(data.highlights.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  // เลือก Hero Featured Match (คู่เด็ดประจำวัน / คู่ที่ LIVE อยู่)
  const featuredMatch = useMemo(() => {
    if (!matches || matches.length === 0) return null;
    const liveMatch = matches.find((m) => m.status === 'LIVE');
    return liveMatch || matches[0];
  }, [matches]);

  // ดึงรายการวันที่ทั้งหมดที่มีสำหรับแท็บฟิลเตอร์
  const uniqueDates = useMemo(() => {
    if (!matches) return [];
    const dates = matches
      .map((m) => m.date)
      .filter((d): d is string => Boolean(d));
    return Array.from(new Set(dates));
  }, [matches]);

  // ดึงรายการลีกที่มีทั้งหมดสำหรับแท็บฟิลเตอร์
  const uniqueLeagues = useMemo(() => {
    if (!matches) return [];
    const leagues = matches
      .map((m) => m.league?.name)
      .filter((name): name is string => Boolean(name));
    return Array.from(new Set(leagues));
  }, [matches]);

  // กรองรายการแข่งขันตามเงื่อนไขต่างๆ
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Filter สถานะ (ทั้งหมด, LIVE, ตารางวันนี้)
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'LIVE' && m.status === 'LIVE') ||
        (statusFilter === 'TODAY' && (uniqueDates.length > 0 ? m.date === uniqueDates[0] : m.status !== 'FINISHED'));

      // Filter วันที่
      const matchesDate =
        selectedDate === 'ALL' || m.date === selectedDate;

      // Filter ลีก
      const matchesLeague =
        selectedLeague === 'ALL' || m.league?.name === selectedLeague;

      // Filter คำค้นหา
      const homeName = m.homeTeam?.name?.toLowerCase() || '';
      const awayName = m.awayTeam?.name?.toLowerCase() || '';
      const leagueName = m.league?.name?.toLowerCase() || '';
      const matchDateStr = m.date?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        !search ||
        homeName.includes(search) ||
        awayName.includes(search) ||
        leagueName.includes(search) ||
        matchDateStr.includes(search);

      return matchesStatus && matchesDate && matchesLeague && matchesSearch;
    });
  }, [matches, statusFilter, selectedDate, selectedLeague, searchTerm, uniqueDates]);

  // จัดกลุ่มแมตช์ตาม "วันที่" ➔ ตาม "ชื่อลีก" (Hierarchical Grouping)
  const groupedByDateAndLeague = useMemo(() => {
    const dateGroups: { [date: string]: { [league: string]: Match[] } } = {};

    filteredMatches.forEach((match) => {
      const matchDate = match.date || 'โปรแกรมถ่ายทอดสด';
      const leagueName = match.league?.name || 'รายการแข่งขันทั่วไป';

      if (!dateGroups[matchDate]) {
        dateGroups[matchDate] = {};
      }
      if (!dateGroups[matchDate][leagueName]) {
        dateGroups[matchDate][leagueName] = [];
      }
      dateGroups[matchDate][leagueName].push(match);
    });

    return dateGroups;
  }, [filteredMatches]);

  return (
    <div className="flex flex-col gap-6 md:gap-8 p-3 sm:p-4 md:p-6 pb-20 md:pb-6 max-w-[1600px] mx-auto min-h-screen font-sans animate-[fadeIn_0.5s_ease-out]">
      
      {/* ================= HERO FEATURED SECTION ================= */}
      {featuredMatch && (
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-[#0B0F17] border border-white/10 p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[280px] sm:w-[500px] h-[200px] sm:h-[300px] bg-[#E5B842]/10 blur-[80px] pointer-events-none rounded-full" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#E5B842]/40 to-transparent" />
          
          <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto text-center gap-4 sm:gap-6">
            
            {/* Header Badge */}
            <div className="flex items-center gap-2 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#E5B842]" />
              <span className="text-[10px] sm:text-xs font-bold text-slate-200 uppercase tracking-wider">
                แมตช์แนะนำประจำวัน
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                {featuredMatch.league?.name || 'ดูบอลสด HD'}
              </span>
            </div>

            {/* Teams & Score / Matchup */}
            <div className="flex items-center justify-between w-full max-w-2xl gap-2 sm:gap-4">
              
              {/* Home Team */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-3 w-1/3">
                <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-white/5 border border-white/10 p-2 sm:p-3 flex items-center justify-center overflow-hidden shadow-2xl">
                  {featuredMatch.homeTeam?.logo ? (
                    <img
                      src={featuredMatch.homeTeam.logo}
                      alt={featuredMatch.homeTeam.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="font-bold text-xl sm:text-2xl text-amber-400">H</span>
                  )}
                </div>
                <h2 className="font-extrabold text-xs sm:text-base md:text-xl text-slate-100 line-clamp-1">
                  {featuredMatch.homeTeam?.name}
                </h2>
              </div>

              {/* Center Status / Score */}
              <div className="flex flex-col items-center justify-center w-1/3">
                {featuredMatch.status === 'LIVE' ? (
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-rose-500/20 text-rose-400 text-[10px] sm:text-xs font-bold border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse">
                      <Radio className="w-3 h-3" />
                      LIVE {featuredMatch.currentMinute ? `${featuredMatch.currentMinute}'` : ''}
                    </span>
                    <div className="flex items-center gap-2 sm:gap-3 my-0.5 sm:my-1">
                      <span className="text-2xl sm:text-4xl md:text-5xl font-black font-mono text-[#E5B842]">
                        {featuredMatch.homeTeam?.score ?? 0}
                      </span>
                      <span className="text-base sm:text-xl text-slate-600 font-bold">:</span>
                      <span className="text-2xl sm:text-4xl md:text-5xl font-black font-mono text-[#E5B842]">
                        {featuredMatch.awayTeam?.score ?? 0}
                      </span>
                    </div>
                  </div>
                ) : featuredMatch.status === 'FINISHED' ? (
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] sm:text-xs font-bold border border-white/10">
                      จบการแข่งขัน
                    </span>
                    <div className="flex items-center gap-2 sm:gap-3 my-0.5 sm:my-1">
                      <span className="text-2xl sm:text-4xl md:text-5xl font-black font-mono text-[#E5B842]">
                        {featuredMatch.homeTeam?.score ?? 0}
                      </span>
                      <span className="text-base sm:text-xl text-slate-600 font-bold">:</span>
                      <span className="text-2xl sm:text-4xl md:text-5xl font-black font-mono text-[#E5B842]">
                        {featuredMatch.awayTeam?.score ?? 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] sm:text-xs font-semibold border border-amber-500/20">
                      <Clock className="w-3 h-3" />
                      {featuredMatch.kickoffTime || 'รอเริ่มการแข่งขัน'}
                    </span>
                    {featuredMatch.homeTeam?.score !== '-' && featuredMatch.homeTeam?.score !== undefined ? (
                      <div className="flex items-center gap-2 sm:gap-3 my-0.5 sm:my-1">
                        <span className="text-2xl sm:text-4xl md:text-5xl font-black font-mono text-[#E5B842]">
                          {featuredMatch.homeTeam?.score ?? 0}
                        </span>
                        <span className="text-base sm:text-xl text-slate-600 font-bold">:</span>
                        <span className="text-2xl sm:text-4xl md:text-5xl font-black font-mono text-[#E5B842]">
                          {featuredMatch.awayTeam?.score ?? 0}
                        </span>
                      </div>
                    ) : (
                      <span className="text-base sm:text-2xl font-black font-mono text-slate-500 my-0.5 sm:my-1">VS</span>
                    )}
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-3 w-1/3">
                <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-white/5 border border-white/10 p-2 sm:p-3 flex items-center justify-center overflow-hidden shadow-2xl">
                  {featuredMatch.awayTeam?.logo ? (
                    <img
                      src={featuredMatch.awayTeam.logo}
                      alt={featuredMatch.awayTeam.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="font-bold text-xl sm:text-2xl text-amber-400">A</span>
                  )}
                </div>
                <h2 className="font-extrabold text-xs sm:text-base md:text-xl text-slate-100 line-clamp-1">
                  {featuredMatch.awayTeam?.name}
                </h2>
              </div>

            </div>

            {/* Watch CTA Button */}
            <Link
              href={`/watch/${featuredMatch.slug || featuredMatch.id}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#E5B842] to-[#d4a737] hover:from-[#f3c853] hover:to-[#e0b441] text-black text-xs sm:text-sm font-black tracking-wide shadow-[0_0_25px_rgba(229,184,66,0.3)] hover:scale-105 transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              <span>🔴 เข้าห้องดูบอลสดคู่นี้</span>
            </Link>

          </div>
        </section>
      )}

      {/* ================= MAIN CONTENT + SIDEBAR LAYOUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        
        {/* Main Column: Fixtures Portal */}
        <main className="flex flex-col gap-6 min-w-0">
          
          {/* Controls Bar: Status Filter & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0B0F17]/90 border border-white/10 backdrop-blur-xl shadow-xl">
            
            {/* Status Filter Tabs */}
            <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด ({matches.length})
              </button>
              <button
                onClick={() => setStatusFilter('LIVE')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'LIVE'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                LIVE ({matches.filter((m) => m.status === 'LIVE').length})
              </button>
              <button
                onClick={() => setStatusFilter('TODAY')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'TODAY'
                    ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ตารางวันนี้
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาทีม, ลีก, วันที่..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#E5B842]/50 transition-all"
              />
            </div>

          </div>

          {/* Date Selector Pills (ระบบเลือกดูตามวันที่) */}
          {uniqueDates.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
              <div className="flex items-center gap-1.5 text-xs text-[#E5B842] font-bold px-2 shrink-0">
                <Calendar className="w-4 h-4" />
                <span>วันที่:</span>
              </div>
              <button
                onClick={() => setSelectedDate('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  selectedDate === 'ALL'
                    ? 'bg-[#E5B842] text-black border-[#E5B842] font-bold shadow-md'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                ทุกวันที่
              </button>
              {uniqueDates.map((dateStr) => (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                    selectedDate === dateStr
                      ? 'bg-[#E5B842] text-black border-[#E5B842] font-bold shadow-md'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  📅 {dateStr}
                </button>
              ))}
            </div>
          )}

          {/* League Quick Filter Pills */}
          {uniqueLeagues.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold px-2 shrink-0">
                <Trophy className="w-4 h-4 text-slate-400" />
                <span>ลีก:</span>
              </div>
              <button
                onClick={() => setSelectedLeague('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  selectedLeague === 'ALL'
                    ? 'bg-white/20 text-white border-white/30 font-bold'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                ทุกลีก
              </button>
              {uniqueLeagues.map((league) => (
                <button
                  key={league}
                  onClick={() => setSelectedLeague(league)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                    selectedLeague === league
                      ? 'bg-white/20 text-white border-white/30 font-bold'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {league}
                </button>
              ))}
            </div>
          )}

          {/* Hierarchical Grouped Fixtures List (จัดกลุ่มตามวันที่ -> ตามลีก) */}
          {Object.keys(groupedByDateAndLeague).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#0B0F17]/60 border border-white/10 rounded-3xl text-center p-6 backdrop-blur-xl">
              <Flame className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-300 mb-1">ไม่พบรายการแข่งขันในเงื่อนไขนี้</h3>
              <p className="text-xs text-slate-500">ลองเปลี่ยนคำค้นหา เลือกวันที่อื่น หรือสลับไปดูแท็บรายการทั้งหมด</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(groupedByDateAndLeague).map(([dateStr, leaguesMap]) => (
                <div key={dateStr} className="flex flex-col gap-4">
                  
                  {/* Date Section Header Banner (หัวข้อวันที่) */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent p-3.5 rounded-2xl border-l-4 border-[#E5B842] border-y border-r border-white/10 shadow-lg">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-5 h-5 text-[#E5B842]" />
                      <h2 className="text-sm md:text-base font-extrabold text-[#E5B842] tracking-wide">
                        {dateStr}
                      </h2>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      {Object.values(leaguesMap).reduce((acc, curr) => acc + curr.length, 0)} คู่
                    </span>
                  </div>

                  {/* Leagues Under Date */}
                  <div className="flex flex-col gap-5 pl-1 sm:pl-2">
                    {Object.entries(leaguesMap).map(([leagueName, leagueMatches]) => {
                      const leagueLogo = leagueMatches[0]?.league?.logo;

                      return (
                        <section
                          key={leagueName}
                          className="flex flex-col gap-3 bg-[#0B0F17]/60 border border-white/10 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-xl"
                        >
                          {/* League Sub-Header */}
                          <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                {leagueLogo ? (
                                  <img src={leagueLogo} alt={leagueName} className="w-full h-full object-contain" />
                                ) : (
                                  <Trophy className="w-3.5 h-3.5 text-[#E5B842]" />
                                )}
                              </div>
                              <h3 className="font-extrabold text-xs md:text-sm text-slate-100 uppercase tracking-wider">
                                {leagueName}
                              </h3>
                            </div>
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                              {leagueMatches.length} คู่
                            </span>
                          </div>

                        {/* Match Cards */}
                        <div className="flex flex-col gap-2.5 pt-1">
                          {leagueMatches.map((match) => (
                            <MatchCard key={match.id} match={match} />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                  </div>

                </div>
              ))}
            </div>
          )}

        </main>

        {/* Right Sidebar: Quick Widgets */}
        <aside className="flex flex-col gap-6">
          
          {/* Quick Standings Widget (Top 10) */}
          <div className="flex flex-col bg-[#0B0F17]/90 border border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#E5B842]" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  ตารางคะแนน (10 อันดับแรก)
                </h4>
              </div>
              <Link href="/table" className="text-[11px] font-semibold text-[#E5B842] hover:underline flex items-center">
                ดูทั้งหมด <ChevronRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="grid grid-cols-12 text-[10px] text-slate-500 font-semibold uppercase px-2 mb-1">
                <span className="col-span-2">อันดับ</span>
                <span className="col-span-7">สโมสร</span>
                <span className="col-span-3 text-right">คะแนน</span>
              </div>
              
              {(liveSidebarStandings.length > 0
                ? liveSidebarStandings
                : [
                    { intRank: '1', strTeam: 'Liverpool', intPoints: '84' },
                    { intRank: '2', strTeam: 'Arsenal', intPoints: '83' },
                    { intRank: '3', strTeam: 'Manchester City', intPoints: '81' },
                    { intRank: '4', strTeam: 'Chelsea', intPoints: '70' },
                    { intRank: '5', strTeam: 'Newcastle', intPoints: '66' },
                    { intRank: '6', strTeam: 'Aston Villa', intPoints: '64' },
                    { intRank: '7', strTeam: 'Nottingham Forest', intPoints: '61' },
                    { intRank: '8', strTeam: 'Brighton', intPoints: '59' },
                    { intRank: '9', strTeam: 'Bournemouth', intPoints: '56' },
                    { intRank: '10', strTeam: 'Fulham', intPoints: '54' },
                  ]
              ).map((item: any, idx: number) => {
                const rankNum = item.intRank || item.rank || (idx + 1);
                const rawName = item.strTeam || item.name || '';
                const pts = item.intPoints || item.pts || '0';
                const thaiName = THAI_NAMES_MAP[rawName] || rawName;

                return (
                  <div key={rankNum} className="grid grid-cols-12 items-center p-1.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors">
                    <span className="col-span-2 font-bold text-slate-400">#{rankNum}</span>
                    <div className="col-span-7 flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-slate-200 truncate">{thaiName}</span>
                      {item.isLiveUpdated && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" title={`กำลังเตะสด (${item.liveDiff || ''})`} />
                      )}
                    </div>
                    <span className="col-span-3 font-mono font-bold text-[#E5B842] text-right">{pts}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Highlights Widget */}
          <div className="flex flex-col bg-[#0B0F17]/90 border border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-rose-500" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  ไฮไลท์ฟุตบอลแนะนำ
                </h4>
              </div>
              <Link href="/highlights" className="text-[11px] font-semibold text-rose-400 hover:underline flex items-center">
                ดูทั้งหมด <ChevronRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {(homeHighlights.length > 0 ? homeHighlights : [
                { id: '1', title: 'บาเลนเซีย 0-1 เรอัล เบติส | ลาลีกา ไฮไลต์', league: 'ลาลีกา', date: 'วันนี้' },
                { id: '2', title: 'ซาบาห์ 5-2 ฮาโปเอล เบียร์ เชว่า | ยูฟ่า แชมเปียนส์ ลีก', league: 'ยูฟ่า แชมเปียนส์ลีก', date: 'เมื่อวานนี้' },
                { id: '3', title: 'ลิเวอร์พูล 7-0 แมนเชสเตอร์ ยูไนเต็ด | ไฮไลท์ พรีเมียร์ลีก', league: 'พรีเมียร์ลีก', date: 'สัปดาห์นี้' },
              ]).map((item: any, idx: number) => (
                <Link key={item.id || idx} href="/highlights" className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-rose-500/40 hover:bg-white/5 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden relative">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                    ) : (
                      <Play className="w-4 h-4 text-rose-500 fill-current" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-rose-400 truncate transition-colors">{item.title}</span>
                    <span className="text-[10px] text-slate-500">{item.league} • {item.date || 'Full HD'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Guarantee Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 text-xs text-amber-300 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 shrink-0 text-[#E5B842]" />
            <p className="leading-tight">สัญญาณถ่ายทอดสดความคมชัดระดับ HD อัปเดตลิงก์เร็วที่สุด ไม่กระตุก</p>
          </div>

        </aside>

      </div>

      {/* Super SEO Keywords & FAQ Accordion Section (เจาะกลุ่มเป้าหมายไทยและลาว 🇹🇭🇱🇦) */}
      <SeoContentSection />

    </div>
  );
}