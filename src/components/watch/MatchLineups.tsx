'use client';

import { useState, useMemo } from 'react';
import { Match } from '@/types/football';
import { Users, Sparkles, ShieldCheck, Clock, CheckCircle2, UserCheck, ShieldAlert, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchLineupsProps {
    match: Match;
}

export interface Player {
    number: number;
    name: string;
    pos: 'GK' | 'DEF' | 'MID' | 'FWD';
}

const KNOWN_SQUADS: { [key: string]: Player[] } = {
    'ลิเวอร์พูล': [
        { number: 1, name: 'อลิสซอน เบ็คเกอร์', pos: 'GK' },
        { number: 66, name: 'เทรนต์ อเล็กซานเดอร์-อาร์โนลด์', pos: 'DEF' },
        { number: 5, name: 'อิบราฮิมา โกนาเต้', pos: 'DEF' },
        { number: 4, name: 'เฟอร์จิล ฟาน ไดจ์ค (C)', pos: 'DEF' },
        { number: 26, name: 'แอนดรูว์ โรเบิร์ตสัน', pos: 'DEF' },
        { number: 38, name: 'ไรอัน กราเฟนแบร์ก', pos: 'MID' },
        { number: 10, name: 'อเล็กซิส แม็ค อัลลิสเตอร์', pos: 'MID' },
        { number: 8, name: 'โดมินิค โซโบสไล', pos: 'MID' },
        { number: 11, name: 'โมฮาเหม็ด ซาลาห์', pos: 'FWD' },
        { number: 9, name: 'ดาร์วิน นูเญซ', pos: 'FWD' },
        { number: 7, name: 'หลุยส์ ดิอาซ', pos: 'FWD' },
    ],
    'อาร์เซนอล': [
        { number: 22, name: 'ดาบิด รายา', pos: 'GK' },
        { number: 4, name: 'เบน ไวท์', pos: 'DEF' },
        { number: 2, name: 'วิลเลียม ซาลิบา', pos: 'DEF' },
        { number: 6, name: 'กาเบรียล มากัลเญส', pos: 'DEF' },
        { number: 12, name: 'เยอร์เรียน ทิมเบอร์', pos: 'DEF' },
        { number: 5, name: 'โธมัส ปาร์เตย์', pos: 'MID' },
        { number: 41, name: 'เดแคลน ไรซ์', pos: 'MID' },
        { number: 8, name: 'มาร์ติน โอเดการ์ด (C)', pos: 'MID' },
        { number: 7, name: 'บูกาโย ซากา', pos: 'FWD' },
        { number: 29, name: 'ไค ฮาแวร์ตซ์', pos: 'FWD' },
        { number: 11, name: 'กาเบรียล มาร์ติเนลลี', pos: 'FWD' },
    ],
    'แมนเชสเตอร์ ซิตี้': [
        { number: 31, name: 'เอแดร์ซอน', pos: 'GK' },
        { number: 82, name: 'ริโก ลูอิส', pos: 'DEF' },
        { number: 25, name: 'มานูเอล อคานจี', pos: 'DEF' },
        { number: 3, name: 'รูเบน ดิอาส', pos: 'DEF' },
        { number: 24, name: 'ยอสโก กวาร์ดิโอล', pos: 'DEF' },
        { number: 16, name: 'โรดรี้', pos: 'MID' },
        { number: 8, name: 'มาเตโอ โควาซิช', pos: 'MID' },
        { number: 17, name: 'เควิน เดอ บรอยน์ (C)', pos: 'MID' },
        { number: 20, name: 'แบร์นาร์โด ซิลวา', pos: 'FWD' },
        { number: 9, name: 'เออร์ลิง ฮาลันด์', pos: 'FWD' },
        { number: 47, name: 'ฟิล โฟเดน', pos: 'FWD' },
    ],
    'แมนฯ ซิตี้': [
        { number: 31, name: 'เอแดร์ซอน', pos: 'GK' },
        { number: 82, name: 'ริโก ลูอิส', pos: 'DEF' },
        { number: 25, name: 'มานูเอล อคานจี', pos: 'DEF' },
        { number: 3, name: 'รูเบน ดิอาส', pos: 'DEF' },
        { number: 24, name: 'ยอสโก กวาร์ดิโอล', pos: 'DEF' },
        { number: 16, name: 'โรดรี้', pos: 'MID' },
        { number: 8, name: 'มาเตโอ โควาซิช', pos: 'MID' },
        { number: 17, name: 'เควิน เดอ บรอยน์ (C)', pos: 'MID' },
        { number: 20, name: 'แบร์นาร์โด ซิลวา', pos: 'FWD' },
        { number: 9, name: 'เออร์ลิง ฮาลันด์', pos: 'FWD' },
        { number: 47, name: 'ฟิล โฟเดน', pos: 'FWD' },
    ],
    'แมนเชสเตอร์ ยูไนเต็ด': [
        { number: 24, name: 'อ็องเดร โอนาน่า', pos: 'GK' },
        { number: 3, name: 'นุสแซร์ มาซราอุย', pos: 'DEF' },
        { number: 4, name: 'มัทไธจ์ส เดอ ลิกต์', pos: 'DEF' },
        { number: 6, name: 'ลิซานโดร มาร์ติเนซ', pos: 'DEF' },
        { number: 20, name: 'ดิโอโก ดาโลต์', pos: 'DEF' },
        { number: 18, name: 'คาเซมิโร่', pos: 'MID' },
        { number: 37, name: 'ค็อบบี้ เมนู', pos: 'MID' },
        { number: 8, name: 'บรูโน่ แฟร์นันเดส (C)', pos: 'MID' },
        { number: 17, name: 'อเลฮานโดร การ์นาโช่', pos: 'FWD' },
        { number: 11, name: 'โจชัว เซิร์กซี', pos: 'FWD' },
        { number: 10, name: 'มาร์คัส แรชฟอร์ด', pos: 'FWD' },
    ],
    'แมนฯ ยูไนเต็ด': [
        { number: 24, name: 'อ็องเดร โอนาน่า', pos: 'GK' },
        { number: 3, name: 'นุสแซร์ มาซราอุย', pos: 'DEF' },
        { number: 4, name: 'มัทไธจ์ส เดอ ลิกต์', pos: 'DEF' },
        { number: 6, name: 'ลิซานโดร มาร์ติเนซ', pos: 'DEF' },
        { number: 20, name: 'ดิโอโก ดาโลต์', pos: 'DEF' },
        { number: 18, name: 'คาเซมิโร่', pos: 'MID' },
        { number: 37, name: 'ค็อบบี้ เมนู', pos: 'MID' },
        { number: 8, name: 'บรูโน่ แฟร์นันเดส (C)', pos: 'MID' },
        { number: 17, name: 'อเลฮานโดร การ์นาโช่', pos: 'FWD' },
        { number: 11, name: 'โจชัว เซิร์กซี', pos: 'FWD' },
        { number: 10, name: 'มาร์คัส แรชฟอร์ด', pos: 'FWD' },
    ],
    'เชลซี': [
        { number: 1, name: 'โรเบิร์ต ซานเชซ', pos: 'GK' },
        { number: 27, name: 'มาโล กุสโต้', pos: 'DEF' },
        { number: 29, name: 'เวสลีย์ โฟฟาน่า', pos: 'DEF' },
        { number: 6, name: 'ลีวาย โคลวิลล์', pos: 'DEF' },
        { number: 3, name: 'มาร์ก กูกูเรยา', pos: 'DEF' },
        { number: 25, name: 'มอยเซส ไกเซโด้', pos: 'MID' },
        { number: 8, name: 'เอ็นโซ่ เฟร์นานเดซ (C)', pos: 'MID' },
        { number: 11, name: 'โนนี่ มาดูเอเก้', pos: 'FWD' },
        { number: 20, name: 'โคล พาลเมอร์', pos: 'MID' },
        { number: 7, name: 'เปโดร เนโต้', pos: 'FWD' },
        { number: 15, name: 'นิโคลัส แจ็คสัน', pos: 'FWD' },
    ],
    'เรอัล มาดริด': [
        { number: 1, name: 'ติโบต์ กูร์กตัวส์', pos: 'GK' },
        { number: 2, name: 'ดานี่ การ์บาฆาล', pos: 'DEF' },
        { number: 3, name: 'เอแดร์ มิลิเตา', pos: 'DEF' },
        { number: 22, name: 'อันโตนิโอ รูดิเกอร์', pos: 'DEF' },
        { number: 23, name: 'แฟร์ล็องด์ เมนดี้', pos: 'DEF' },
        { number: 14, name: 'โอเรเลียง ชูอาเมนี่', pos: 'MID' },
        { number: 8, name: 'เฟเดริโก บัลเบร์เด้', pos: 'MID' },
        { number: 5, name: 'จู๊ด เบลลิงแฮม', pos: 'MID' },
        { number: 11, name: 'โรดรีโก้', pos: 'FWD' },
        { number: 9, name: 'คีเลียน เอ็มบัปเป้', pos: 'FWD' },
        { number: 7, name: 'วินิซิอุส จูเนียร์', pos: 'FWD' },
    ],
    'บาร์เซโลน่า': [
        { number: 1, name: 'มาร์ค-อันเดร แทร์ สเตเก้น', pos: 'GK' },
        { number: 23, name: 'ฌูลส์ กุนเด้', pos: 'DEF' },
        { number: 2, name: 'เปา กูบาร์ซี่', pos: 'DEF' },
        { number: 5, name: 'อินญิโก้ มาร์ติเนซ', pos: 'DEF' },
        { number: 3, name: 'อเลฮานโดร บัลเด้', pos: 'DEF' },
        { number: 17, name: 'มาร์ค กาซาโด้', pos: 'MID' },
        { number: 8, name: 'เปดรี้', pos: 'MID' },
        { number: 20, name: 'ดานี่ โอลโม่', pos: 'MID' },
        { number: 19, name: 'ลามีน ยามาล', pos: 'FWD' },
        { number: 9, name: 'โรเบิร์ต เลวานดอฟสกี้', pos: 'FWD' },
        { number: 11, name: 'ราฟินญ่า', pos: 'FWD' },
    ],
    'บาร์เซโลนา': [
        { number: 1, name: 'มาร์ค-อันเดร แทร์ สเตเก้น', pos: 'GK' },
        { number: 23, name: 'ฌูลส์ กุนเด้', pos: 'DEF' },
        { number: 2, name: 'เปา กูบาร์ซี่', pos: 'DEF' },
        { number: 5, name: 'อินญิโก้ มาร์ติเนซ', pos: 'DEF' },
        { number: 3, name: 'อเลฮานโดร บัลเด้', pos: 'DEF' },
        { number: 17, name: 'มาร์ค กาซาโด้', pos: 'MID' },
        { number: 8, name: 'เปดรี้', pos: 'MID' },
        { number: 20, name: 'ดานี่ โอลโม่', pos: 'MID' },
        { number: 19, name: 'ลามีน ยามาล', pos: 'FWD' },
        { number: 9, name: 'โรเบิร์ต เลวานดอฟสกี้', pos: 'FWD' },
        { number: 11, name: 'ราฟินญ่า', pos: 'FWD' },
    ],
};

// ฐานข้อมูลตัวสำรอง (Substitutes)
const KNOWN_SUBS: { [key: string]: Player[] } = {
    'ลิเวอร์พูล': [
        { number: 62, name: 'ควีวิน เคลเลเฮอร์', pos: 'GK' },
        { number: 78, name: 'จาร์เรลล์ ควอนซาห์', pos: 'DEF' },
        { number: 2, name: 'โจ โกเมซ', pos: 'DEF' },
        { number: 3, name: 'วาตารุ เอ็นโด', pos: 'MID' },
        { number: 17, name: 'เคอร์ติส โจนส์', pos: 'MID' },
        { number: 18, name: 'โคดี้ กัคโป', pos: 'FWD' },
        { number: 20, name: 'ดีโอโก้ โชต้า', pos: 'FWD' },
    ],
    'อาร์เซนอล': [
        { number: 32, name: 'เนโต้', pos: 'GK' },
        { number: 15, name: 'ยาคุบ คิวิออร์', pos: 'DEF' },
        { number: 17, name: 'โอเล็กซานเดอร์ ซินเชนโก้', pos: 'DEF' },
        { number: 20, name: 'จอร์จินโญ่', pos: 'MID' },
        { number: 23, name: 'มิเกล เมริโน่', pos: 'MID' },
        { number: 19, name: 'เลอันโดร ทรอสซาร์', pos: 'FWD' },
        { number: 30, name: 'ราฮีม สเตอร์ลิง', pos: 'FWD' },
    ],
    'แมนฯ ซิตี้': [
        { number: 18, name: 'สเตฟาน ออร์เตก้า', pos: 'GK' },
        { number: 6, name: 'นาธาน อาเก้', pos: 'DEF' },
        { number: 5, name: 'จอห์น สโตนส์', pos: 'DEF' },
        { number: 27, name: 'มาเธอุส นูเนส', pos: 'MID' },
        { number: 19, name: 'อิลคาย กุนโดกัน', pos: 'MID' },
        { number: 11, name: 'เฌเรมี่ โดกู', pos: 'FWD' },
        { number: 26, name: 'ซาวินโญ่', pos: 'FWD' },
    ],
    'แมนเชสเตอร์ ซิตี้': [
        { number: 18, name: 'สเตฟาน ออร์เตก้า', pos: 'GK' },
        { number: 6, name: 'นาธาน อาเก้', pos: 'DEF' },
        { number: 5, name: 'จอห์น สโตนส์', pos: 'DEF' },
        { number: 27, name: 'มาเธอุส นูเนส', pos: 'MID' },
        { number: 19, name: 'อิลคาย กุนโดกัน', pos: 'MID' },
        { number: 11, name: 'เฌเรมี่ โดกู', pos: 'FWD' },
        { number: 26, name: 'ซาวินโญ่', pos: 'FWD' },
    ],
    'แมนเชสเตอร์ ยูไนเต็ด': [
        { number: 1, name: 'อัลทาย บายินดีร์', pos: 'GK' },
        { number: 5, name: 'แฮร์รี่ แม็กไกวร์', pos: 'DEF' },
        { number: 23, name: 'ลุค ชอว์', pos: 'DEF' },
        { number: 14, name: 'คริสเตียน อีริคเซ่น', pos: 'MID' },
        { number: 25, name: 'มานูเอล อูการ์เต้', pos: 'MID' },
        { number: 16, name: 'อาหมัด ดิยัลโล่', pos: 'FWD' },
        { number: 9, name: 'ราสมุส ฮอยลุนด์', pos: 'FWD' },
    ],
    'แมนฯ ยูไนเต็ด': [
        { number: 1, name: 'อัลทาย บายินดีร์', pos: 'GK' },
        { number: 5, name: 'แฮร์รี่ แม็กไกวร์', pos: 'DEF' },
        { number: 23, name: 'ลุค ชอว์', pos: 'DEF' },
        { number: 14, name: 'คริสเตียน อีริคเซ่น', pos: 'MID' },
        { number: 25, name: 'มานูเอล อูการ์เต้', pos: 'MID' },
        { number: 16, name: 'อาหมัด ดิยัลโล่', pos: 'FWD' },
        { number: 9, name: 'ราสมุส ฮอยลุนด์', pos: 'FWD' },
    ],
    'เชลซี': [
        { number: 12, name: 'ฟิลิป ยอร์เกนเซ่น', pos: 'GK' },
        { number: 4, name: 'โทซิน อดาราบิโอโย่', pos: 'DEF' },
        { number: 24, name: 'รีซ เจมส์', pos: 'DEF' },
        { number: 45, name: 'โรเมโอ ลาเวีย', pos: 'MID' },
        { number: 22, name: 'เคียร์แนน ดิวส์บิวรี-ฮอลล์', pos: 'MID' },
        { number: 19, name: 'เจดอน ซานโช่', pos: 'FWD' },
        { number: 18, name: 'คริสโตเฟอร์ เอ็นคุนคู', pos: 'FWD' },
    ],
    'เรอัล มาดริด': [
        { number: 13, name: 'อังเดร ลูนิน', pos: 'GK' },
        { number: 17, name: 'ลูกัส บาซเกซ', pos: 'DEF' },
        { number: 20, name: 'ฟราน การ์เซีย', pos: 'DEF' },
        { number: 10, name: 'ลูก้า โมดริช', pos: 'MID' },
        { number: 6, name: 'เอดูอาร์โด้ กามาวินก้า', pos: 'MID' },
        { number: 21, name: 'บราฮิม ดิอาซ', pos: 'FWD' },
        { number: 16, name: 'เอ็นดริค', pos: 'FWD' },
    ],
    'บาร์เซโลนา': [
        { number: 13, name: 'อินญากี้ เปนญ่า', pos: 'GK' },
        { number: 24, name: 'เอริค การ์เซีย', pos: 'DEF' },
        { number: 35, name: 'เคราร์ด มาร์ติน', pos: 'DEF' },
        { number: 21, name: 'เฟรงกี้ เดอ ยอง', pos: 'MID' },
        { number: 14, name: 'ปาโบล ตอร์เร่', pos: 'MID' },
        { number: 7, name: 'เฟร์ราน ตอร์เรส', pos: 'FWD' },
        { number: 10, name: 'อันซู ฟาติ', pos: 'FWD' },
    ],
    'บาร์เซโลน่า': [
        { number: 13, name: 'อินญากี้ เปนญ่า', pos: 'GK' },
        { number: 24, name: 'เอริค การ์เซีย', pos: 'DEF' },
        { number: 35, name: 'เคราร์ด มาร์ติน', pos: 'DEF' },
        { number: 21, name: 'เฟรงกี้ เดอ ยอง', pos: 'MID' },
        { number: 14, name: 'ปาโบล ตอร์เร่', pos: 'MID' },
        { number: 7, name: 'เฟร์ราน ตอร์เรส', pos: 'FWD' },
        { number: 10, name: 'อันซู ฟาติ', pos: 'FWD' },
    ],
};

// ฐานข้อมูลผู้จัดการทีม (Coaches)
const KNOWN_COACHES: { [key: string]: string } = {
    'ลิเวอร์พูล': 'อาร์เน่อ สล็อต (Arne Slot)',
    'อาร์เซนอล': 'มิเกล อาร์เตต้า (Mikel Arteta)',
    'แมนฯ ซิตี้': 'เป๊ป กวาร์ดิโอล่า (Pep Guardiola)',
    'แมนเชสเตอร์ ซิตี้': 'เป๊ป กวาร์ดิโอล่า (Pep Guardiola)',
    'แมนเชสเตอร์ ยูไนเต็ด': 'รูเบน อโมริม (Ruben Amorim)',
    'แมนฯ ยูไนเต็ด': 'รูเบน อโมริม (Ruben Amorim)',
    'เชลซี': 'เอ็นโซ่ มาเรสก้า (Enzo Maresca)',
    'เรอัล มาดริด': 'คาร์โล อันเชล็อตติ (Carlo Ancelotti)',
    'บาร์เซโลนา': 'ฮันซี่ ฟลิค (Hansi Flick)',
    'บาร์เซโลน่า': 'ฮันซี่ ฟลิค (Hansi Flick)',
};

function getTeamLineup(teamName: string, isHome: boolean): Player[] {
    for (const key of Object.keys(KNOWN_SQUADS)) {
        if (teamName.includes(key) || key.includes(teamName)) {
            return KNOWN_SQUADS[key];
        }
    }

    const prefix = isHome ? 'ผู้เล่นเหย้า' : 'ผู้เล่นเยือน';
    return [
        { number: 1, name: `${teamName} (GK)`, pos: 'GK' },
        { number: 2, name: `${prefix} แบ็กขวา`, pos: 'DEF' },
        { number: 4, name: `${prefix} กองหลังตัวกลาง`, pos: 'DEF' },
        { number: 5, name: `${prefix} เซ็นเตอร์แบ็ก (C)`, pos: 'DEF' },
        { number: 3, name: `${prefix} แบ็กซ้าย`, pos: 'DEF' },
        { number: 6, name: `${prefix} กองกลางตัวรับ`, pos: 'MID' },
        { number: 8, name: `${prefix} กองกลางตัวเชื่อม`, pos: 'MID' },
        { number: 10, name: `${prefix} เพลย์เมกเกอร์`, pos: 'MID' },
        { number: 7, name: `${prefix} ปีกขวา`, pos: 'FWD' },
        { number: 9, name: `${prefix} กองหน้าตัวเป้า`, pos: 'FWD' },
        { number: 11, name: `${prefix} ปีกซ้าย`, pos: 'FWD' },
    ];
}

function getTeamSubs(teamName: string): Player[] {
    for (const key of Object.keys(KNOWN_SUBS)) {
        if (teamName.includes(key) || key.includes(teamName)) {
            return KNOWN_SUBS[key];
        }
    }

    return [
        { number: 12, name: `ผู้รักษาประตูสำรอง`, pos: 'GK' },
        { number: 14, name: `กองหลังสำรอง`, pos: 'DEF' },
        { number: 16, name: `ฟูลแบ็กสำรอง`, pos: 'DEF' },
        { number: 18, name: `มิดฟิลด์สำรอง`, pos: 'MID' },
        { number: 20, name: `กองกลางตัวรุกสำรอง`, pos: 'MID' },
        { number: 22, name: `ปีกสำรอง`, pos: 'FWD' },
        { number: 24, name: `กองหน้าสำรอง`, pos: 'FWD' },
    ];
}

function getTeamCoach(teamName: string): string {
    for (const key of Object.keys(KNOWN_COACHES)) {
        if (teamName.includes(key) || key.includes(teamName)) {
            return KNOWN_COACHES[key];
        }
    }
    return `หัวหน้าผู้ฝึกสอน (${teamName})`;
}

export default function MatchLineups({ match }: MatchLineupsProps) {
    const [activeTab, setActiveTab] = useState<'FIELD' | 'LIST' | 'SUBS'>('FIELD');

    const homeName = match?.homeTeam?.name || 'ทีมเหย้า';
    const awayName = match?.awayTeam?.name || 'ทีมเยือน';
    const isLive = match?.status === 'LIVE';
    const isFinished = match?.status === 'FINISHED';

    const homeLineup: Player[] = useMemo(() => (match?.lineup?.home as Player[]) || getTeamLineup(homeName, true), [match, homeName]);
    const awayLineup: Player[] = useMemo(() => (match?.lineup?.away as Player[]) || getTeamLineup(awayName, false), [match, awayName]);
    
    const homeSubs: Player[] = useMemo(() => getTeamSubs(homeName), [homeName]);
    const awaySubs: Player[] = useMemo(() => getTeamSubs(awayName), [awayName]);

    const homeCoach = useMemo(() => getTeamCoach(homeName), [homeName]);
    const awayCoach = useMemo(() => getTeamCoach(awayName), [awayName]);

    return (
        <div className="flex flex-col gap-4 bg-[#0B0F17]/90 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-2xl font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-sm md:text-base text-slate-100 flex items-center gap-2">
                            รายชื่อ 11 ตัวจริง แผนการเล่น และตัวสำรอง (Squad & Tactics)
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </h3>
                        <p className="text-[11px] text-slate-400">
                            {isLive || isFinished ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> รายชื่อตัวจริงอย่างเป็นทางการ (Official Lineups)
                                </span>
                            ) : (
                                <span className="text-amber-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> คาดการณ์ 11 ตัวจริง (Predicted Lineup 4-3-3 vs 4-2-3-1)
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Tabs Selector */}
                <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10 self-stretch sm:self-auto">
                    <button
                        onClick={() => setActiveTab('FIELD')}
                        className={cn(
                            "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeTab === 'FIELD' ? "bg-emerald-500 text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
                        )}
                    >
                        ผังสนาม 3D
                    </button>
                    <button
                        onClick={() => setActiveTab('LIST')}
                        className={cn(
                            "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeTab === 'LIST' ? "bg-emerald-500 text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
                        )}
                    >
                        11 ตัวจริง
                    </button>
                    <button
                        onClick={() => setActiveTab('SUBS')}
                        className={cn(
                            "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1",
                            activeTab === 'SUBS' ? "bg-emerald-500 text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <UserCheck className="w-3.5 h-3.5" />
                        ตัวสำรอง & โค้ช
                    </button>
                </div>
            </div>

            {/* Tactical Pitch Field View */}
            {activeTab === 'FIELD' && (
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] rounded-2xl bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 border border-emerald-500/30 overflow-hidden shadow-2xl p-4 flex flex-col justify-between">
                    {/* Grass Pitch Pattern Overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
                    
                    {/* Center Pitch Lines */}
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/20 -translate-y-1/2 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white/20 pointer-events-none" />

                    {/* Home Team Formation (Top Half - 4-3-3) */}
                    <div className="relative z-10 flex flex-col items-center justify-between h-1/2 py-2">
                        <div className="flex items-center gap-2 px-3 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] font-bold text-amber-400 mb-1">
                            <span>{homeName} (4-3-3)</span>
                        </div>
                        {/* GK */}
                        <div className="flex justify-center">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-black font-extrabold text-[10px] shadow-md border border-amber-300">
                                {homeLineup[0]?.number}. {homeLineup[0]?.name.split(' ')[0]} (GK)
                            </span>
                        </div>
                        {/* DEF */}
                        <div className="flex justify-around w-full px-2 sm:px-4">
                            {homeLineup.slice(1, 5).map((p) => (
                                <span key={p.number} className="px-1.5 sm:px-2 py-0.5 rounded bg-black/80 text-white text-[9px] sm:text-[10px] font-bold border border-white/10 truncate max-w-[80px] sm:max-w-[100px] text-center">
                                    {p.number}. {p.name.split(' ')[0]}
                                </span>
                            ))}
                        </div>
                        {/* MID */}
                        <div className="flex justify-around w-4/5 px-2 sm:px-4">
                            {homeLineup.slice(5, 8).map((p) => (
                                <span key={p.number} className="px-1.5 sm:px-2 py-0.5 rounded bg-black/80 text-[#E5B842] text-[9px] sm:text-[10px] font-bold border border-[#E5B842]/30 truncate max-w-[80px] sm:max-w-[100px] text-center">
                                    {p.number}. {p.name.split(' ')[0]}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Away Team Formation (Bottom Half - 4-2-3-1) */}
                    <div className="relative z-10 flex flex-col items-center justify-between h-1/2 py-2">
                        {/* FWD */}
                        <div className="flex justify-around w-4/5 px-2 sm:px-4">
                            {awayLineup.slice(8, 11).map((p) => (
                                <span key={p.number} className="px-1.5 sm:px-2 py-0.5 rounded bg-black/80 text-emerald-400 text-[9px] sm:text-[10px] font-bold border border-emerald-500/30 truncate max-w-[80px] sm:max-w-[100px] text-center">
                                    {p.number}. {p.name.split(' ')[0]}
                                </span>
                            ))}
                        </div>
                        {/* MID & DEF */}
                        <div className="flex justify-around w-full px-2 sm:px-4">
                            {awayLineup.slice(1, 5).map((p) => (
                                <span key={p.number} className="px-1.5 sm:px-2 py-0.5 rounded bg-black/80 text-white text-[9px] sm:text-[10px] font-bold border border-white/10 truncate max-w-[80px] sm:max-w-[100px] text-center">
                                    {p.number}. {p.name.split(' ')[0]}
                                </span>
                            ))}
                        </div>
                        {/* GK */}
                        <div className="flex justify-center">
                            <span className="px-2 py-0.5 rounded-lg bg-blue-500 text-white font-extrabold text-[10px] shadow-md border border-blue-300">
                                {awayLineup[0]?.number}. {awayLineup[0]?.name.split(' ')[0]} (GK)
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] font-bold text-blue-400 mt-1">
                            <span>{awayName} (4-2-3-1)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Text Starting 11 Squad List View */}
            {activeTab === 'LIST' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Home Squad */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
                        <h4 className="font-extrabold text-xs text-[#E5B842] pb-2 border-b border-white/10 flex items-center justify-between">
                            <span>{homeName} (11 ตัวจริง)</span>
                            <span className="text-[10px] text-slate-400 font-mono">4-3-3</span>
                        </h4>
                        <div className="space-y-1 text-xs max-h-80 overflow-y-auto pr-1">
                            {homeLineup.map((p) => (
                                <div key={p.number} className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-colors">
                                    <div className="flex items-center gap-2 truncate mr-2">
                                        <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center border border-amber-500/30 shrink-0">
                                            {p.number}
                                        </span>
                                        <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">{p.pos}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Away Squad */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
                        <h4 className="font-extrabold text-xs text-blue-400 pb-2 border-b border-white/10 flex items-center justify-between">
                            <span>{awayName} (11 ตัวจริง)</span>
                            <span className="text-[10px] text-slate-400 font-mono">4-2-3-1</span>
                        </h4>
                        <div className="space-y-1 text-xs max-h-80 overflow-y-auto pr-1">
                            {awayLineup.map((p) => (
                                <div key={p.number} className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-blue-500/20 transition-colors">
                                    <div className="flex items-center gap-2 truncate mr-2">
                                        <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold text-[10px] flex items-center justify-center border border-blue-500/30 shrink-0">
                                            {p.number}
                                        </span>
                                        <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">{p.pos}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Substitutes & Coaches View */}
            {activeTab === 'SUBS' && (
                <div className="flex flex-col gap-4">
                    {/* Head Coaches Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                <Award className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80">ผู้จัดการทีม ({homeName})</span>
                                <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">{homeCoach}</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                                <Award className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400/80">ผู้จัดการทีม ({awayName})</span>
                                <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">{awayCoach}</p>
                            </div>
                        </div>
                    </div>

                    {/* Substitutes Squad List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Home Substitutes */}
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
                            <h4 className="font-extrabold text-xs text-[#E5B842] pb-2 border-b border-white/10 flex items-center justify-between">
                                <span>ตัวสำรอง ({homeName})</span>
                                <span className="text-[10px] text-slate-400">{homeSubs.length} คน</span>
                            </h4>
                            <div className="space-y-1 text-xs max-h-72 overflow-y-auto pr-1">
                                {homeSubs.map((p) => (
                                    <div key={p.number} className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center gap-2 truncate mr-2">
                                            <span className="w-5 h-5 rounded bg-white/10 text-slate-300 font-mono font-bold text-[10px] flex items-center justify-center border border-white/10 shrink-0">
                                                {p.number}
                                            </span>
                                            <span className="font-medium text-slate-300 truncate">{p.name}</span>
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">{p.pos}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Away Substitutes */}
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
                            <h4 className="font-extrabold text-xs text-blue-400 pb-2 border-b border-white/10 flex items-center justify-between">
                                <span>ตัวสำรอง ({awayName})</span>
                                <span className="text-[10px] text-slate-400">{awaySubs.length} คน</span>
                            </h4>
                            <div className="space-y-1 text-xs max-h-72 overflow-y-auto pr-1">
                                {awaySubs.map((p) => (
                                    <div key={p.number} className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center gap-2 truncate mr-2">
                                            <span className="w-5 h-5 rounded bg-white/10 text-slate-300 font-mono font-bold text-[10px] flex items-center justify-center border border-white/10 shrink-0">
                                                {p.number}
                                            </span>
                                            <span className="font-medium text-slate-300 truncate">{p.name}</span>
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">{p.pos}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
