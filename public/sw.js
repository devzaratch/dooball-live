// DoBallLaos Web Push Service Worker
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications
self.addEventListener('push', (event) => {
    let data = {
        title: '⚽ บอลเริ่มเตะแล้ว! (DoBallLaos Live)',
        body: 'แมตช์ที่คุณติดตามกำลังถ่ายทอดสด กดเพื่อเข้าชมสัญญาณ Full HD ทันที!',
        icon: '/icon',
        badge: '/icon',
        url: '/',
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icon',
        badge: data.badge || '/icon',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
        },
        actions: [
            { action: 'watch', title: '📺 เข้าดูบอลสดตอนนี้' },
            { action: 'close', title: 'ปิด' },
        ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
