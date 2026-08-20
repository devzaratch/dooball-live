'use client';

import { useState, useEffect } from 'react';
import { ref, push, set, onDisconnect, onValue, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';

/**
 * Hook สำหรับนับจำนวนผู้เข้าชมสดแบบ Realtime ผ่าน Firebase Database (Presence API)
 * พร้อมคำนวณฐานสถิติความนิยม (Base Multiplier) สำหรับแสดงผลตัวเลขที่ดึงดูดใจ
 */
export function useLiveViewers(matchId?: string, isLive: boolean = true) {
    const [realtimeCount, setRealtimeCount] = useState<number>(1);
    const [displayCount, setDisplayCount] = useState<number>(0);

    useEffect(() => {
        if (!matchId) return;

        // สุ่มสร้างฐานตัวเลขคนดูให้สมจริงตาม matchId เพื่อความสม่ำเสมอ
        const getBaseViewers = (id: string) => {
            let hash = 0;
            for (let i = 0; i < id.length; i++) {
                hash = (hash << 5) - hash + id.charCodeAt(i);
                hash |= 0;
            }
            const absHash = Math.abs(hash);
            // ฐานคนดูอยู่ระหว่าง 450 ถึง 2,850 คน
            return (absHash % 2400) + 450;
        };

        const baseViewers = getBaseViewers(matchId);

        try {
            const matchViewersRef = ref(db, `viewers/${matchId}`);
            // สร้าง session node สำหรับผู้ใช้นี้
            const myViewerRef = push(matchViewersRef);

            // ตั้งค่าลบตัวเองออกจากระบบเมื่อตัดการเชื่อมต่อ (onDisconnect)
            onDisconnect(myViewerRef).remove();

            // บันทึกเวลาเข้าชมของผู้ใช้
            set(myViewerRef, {
                joinedAt: serverTimestamp(),
            });

            // คอยฟังการเปลี่ยนแปลงของจำนวนผู้ใช้งานสด
            const unsubscribe = onValue(matchViewersRef, (snapshot) => {
                if (snapshot.exists()) {
                    const count = snapshot.size || Object.keys(snapshot.val() || {}).length;
                    setRealtimeCount(count);
                    const total = isLive ? baseViewers + (count * 15) : Math.floor(baseViewers / 4);
                    setDisplayCount(total);
                } else {
                    setRealtimeCount(1);
                    setDisplayCount(isLive ? baseViewers : 120);
                }
            }, (err) => {
                console.warn('Firebase viewers count read warning:', err.message);
                setDisplayCount(isLive ? baseViewers : 150);
            });

            return () => {
                unsubscribe();
                // ลบ session ออกเมื่อผู้ใช้กดปิดหน้าหรือเปลี่ยนไปแมตช์อื่น
                set(myViewerRef, null).catch(() => {});
            };
        } catch (error) {
            console.error('Live Viewers Hook Error:', error);
            setDisplayCount(isLive ? baseViewers : 150);
        }
    }, [matchId, isLive]);

    // ฟอร์แมตตัวเลขแสดงผล เช่น 1,452 หรือ 12.5k
    const formattedCount = displayCount > 9999
        ? `${(displayCount / 1000).toFixed(1)}k`
        : displayCount.toLocaleString('th-TH');

    return {
        viewerCount: displayCount,
        formattedViewerCount: formattedCount,
        realtimeCount,
    };
}
