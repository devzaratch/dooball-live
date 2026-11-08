'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'th' | 'la';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    th: {
        // Navbar
        live_football: 'ดูบอลสด',
        table: 'ตารางคะแนน',
        highlights: 'ไฮไลท์บอล',
        news: 'ข่าวฟุตบอล',
        search_placeholder: 'ค้นหาทีม / ลีก...',
        
        // Homepage & Match Cards
        all_matches: 'แข่งขันทั้งหมด',
        live_now: 'กำลังถ่ายทอดสด',
        upcoming: 'โปรแกรมเตะ',
        finished: 'จบการแข่งขัน',
        watch_live: 'ดูบอลสด',
        remind: 'แจ้งเตือน',
        reminded: 'ติดตามแล้ว',
        search_results: 'ผลการค้นหาสำหรับ',
        no_matches_found: 'ไม่พบโปรแกรมถ่ายทอดสด',
        date_today: 'วันนี้',

        // Sidebar & Hero
        top10_premier: '10 อันดับแรก พรีเมียร์ลีก',
        hero_live_now: 'กำลังถ่ายทอดสดบอลคู่ใหญ่',
        enter_watch_room: 'เข้าห้องดูบอลสดคู่นี้',
        hd_guarantee: 'สัญญาณถ่ายทอดสดความคมชัดระดับ HD อัปเดตลิงก์เร็วที่สุด ไม่กระตุก',

        // Standings Table Page (/table)
        standings_hub_title: 'ตารางคะแนนฟุตบอล',
        standings_hub_subtitle: 'อัปเดตอันดับตารางคะแนนล่าสุด 5 ลีกใหญ่ยุโรปเรียลไทม์',
        rank: 'อันดับ',
        team: 'ทีม',
        played: 'แข่ง',
        win: 'ชนะ',
        draw: 'เสมอ',
        loss: 'แพ้',
        goals: 'ประตู',
        points: 'แต้ม',
        top10_only: '10 อันดับแรก',
        show_all_20: 'แสดงทั้งหมด (20 ทีม)',

        // Highlights Page (/highlights)
        highlights_hub_title: 'ไฮไลท์บอลย้อนหลัง',
        highlights_hub_subtitle: 'รวมคลิปไฮไลท์ฟุตบอลคู่ใหญ่จากช่องทางการ Official',
        watch_clip: 'รับชมไฮไลท์',

        // News Page (/news)
        news_hub_title: 'ข่าวฟุตบอล ล่าสุดประจำวัน',
        news_hub_subtitle: 'อัปเดตข่าวสารฟุตบอลเด็ด สรุปผลหลังเกม ข่าวซื้อขายนักเตะทุกลีกดัง',
        hot_news: 'ข่าวเด็ดประจำวัน',
        read_more: 'อ่านต่อ',
        share_news: 'แชร์ข่าว',
        read_original: 'อ่านข่าวเต็มจากสำนักข่าว',
        views_count: 'ครั้ง',

        // Watch Page (/watch/[slug])
        match_prediction_title: 'ทายผลบอลสดแมตช์นี้ (Match Poll)',
        vote_home_win: 'เหย้าชนะ',
        vote_draw: 'เสมอ',
        vote_away_win: 'เยือนชนะ',
        voted_already: 'คุณลงคะแนนโหวตเรียลไทม์แล้ว',
        stadium_chat: 'แชทสดเชียร์บอล',
        type_chat: 'พิมพ์ข้อความเชียร์บอล...',
        send: 'ส่ง',
        stickers: 'สติ๊กเกอร์:',
    },
    la: {
        // Navbar
        live_football: 'ເບິ່ງບານສົດ',
        table: 'ຕາຕະລາງຄະແນນ',
        highlights: 'ໄຮໄລ້ບານເຕະ',
        news: 'ຂ່າວບານເຕະ',
        search_placeholder: 'ຄົ້ນຫາທີມ / ລີກ...',

        // Homepage & Match Cards
        all_matches: 'ການແຂ່ງຂັນທັງໝົດ',
        live_now: 'ກຳລັງຖ່າຍທອດສົດ',
        upcoming: 'ໂປຣແກຣມເຕະ',
        finished: 'ຈົບການແຂ່ງຂັນ',
        watch_live: 'ເບິ່ງບານສົດ',
        remind: 'ແຈ້ງເຕືອນ',
        reminded: 'ຕິດຕາມແລ້ວ',
        search_results: 'ຜົນການຄົ້ນຫາສຳລັບ',
        no_matches_found: 'ບໍ່ພົບໂປຣແກຣມຖ່າຍທອດສົດ',
        date_today: 'ມື້ນີ້',

        // Sidebar & Hero
        top10_premier: '10 ອັນດັບທຳອິດ ພຣີເມຍລີກ',
        hero_live_now: 'ກຳລັງຖ່າຍທອດສົດບານຄູ່ໃຫຍ່',
        enter_watch_room: 'ເຂົ້າຫ້ອງເບິ່ງບານສົດຄູ່ນີ້',
        hd_guarantee: 'ສັນຍານຖ່າຍທອດສົດຄວາມຄົມຊັດ HD ອັບເດດລີ້ງໄວທີ່ສຸດ ບໍ່ກະຕຸກ',

        // Standings Table Page (/table)
        standings_hub_title: 'ຕາຕະລາງຄະແນນບານເຕະ',
        standings_hub_subtitle: 'ອັບເດດອັນດັບຕາຕະລາງຄະແນນລ່າສຸດ 5 ລີກໃຫຍ່ຢູໂຣບ',
        rank: 'ອັນດັບ',
        team: 'ທີມ',
        played: 'ແຂ່ງ',
        win: 'ຊະນະ',
        draw: 'ສະເໝີ',
        loss: 'ເສຍ',
        goals: 'ປະຕູ',
        points: 'ແຕ້ມ',
        top10_only: '10 ອັນດັບທຳອິດ',
        show_all_20: 'ສະແດງທັງໝົດ (20 ທີມ)',

        // Highlights Page (/highlights)
        highlights_hub_title: 'ໄຮໄລ້ບານເຕະຍ້ອນຫຼັງ',
        highlights_hub_subtitle: 'ລວມຄລິບໄຮໄລ້ບານເຕະຄູ່ໃຫຍ່ຈາກຊ່ອງ Official',
        watch_clip: 'ຮັບຊົມໄຮໄລ້',

        // News Page (/news)
        news_hub_title: 'ຂ່າວບານເຕະ ລ່າສຸດປະຈຳວັນ',
        news_hub_subtitle: 'ອັບເດດຂ່າວສານບານເຕະເດັດ ສຫຼຸບຜົນຫຼັງເກມ ຂ່າວຊື້ຂາຍນັກເຕະ',
        hot_news: 'ຂ່າວເດັດປະຈຳວັນ',
        read_more: 'ອ່ານຕໍ່',
        share_news: 'ແຊຣ໌ຂ່າວ',
        read_original: 'ອ່ານຂ່າວເຕັມຈາກສຳນັກຂ່າວ',
        views_count: 'ຄັ້ງ',

        // Watch Page (/watch/[slug])
        match_prediction_title: 'ທາຍຜົນບານສົດແມັດນີ້ (Match Poll)',
        vote_home_win: 'ເຈົ້າບ້ານຊະນະ',
        vote_draw: 'ສະເໝີ',
        vote_away_win: 'ທີມຢາມຊະນະ',
        voted_already: 'ທ່ານລົງຄະແນນໂຫວດຮຽລທາມແລ້ວ',
        stadium_chat: 'ແຊັດສົດເຊຍບານ',
        type_chat: 'ພິມຂໍ້ຄວາມເຊຍບານ...',
        send: 'ສົ່ງ',
        stickers: 'ສະຕິກເກີ:',
    },
};

const LanguageContext = createContext<LanguageContextType>({
    lang: 'th',
    setLang: () => {},
    t: (key: string) => key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [lang, setLangState] = useState<Language>('th');

    useEffect(() => {
        const savedLang = localStorage.getItem('user_lang') as Language;
        if (savedLang === 'th' || savedLang === 'la') {
            queueMicrotask(() => setLangState(savedLang));
        }
    }, []);

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('user_lang', newLang);
    };

    const t = (key: string): string => {
        return translations[lang]?.[key] || translations['th']?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
