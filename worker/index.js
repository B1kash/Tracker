'use strict';

self.addEventListener('push', function (event) {
    let data = {};
    try {
        data = JSON.parse(event.data.text());
    } catch (e) {
        data = { title: 'Life Tracker', body: event.data.text() };
    }

    const defaultActions = [
        { action: 'log_habits', title: '✅ Check Habits' },
        { action: 'open_gym', title: '💪 Gym Log' }
    ];

    event.waitUntil(
        registration.showNotification(data.title || 'Life Tracker', {
            body: data.body || 'Time for your daily logging!',
            icon: '/icon-192x192.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            data: { url: data.url || '/habits' },
            actions: data.actions || defaultActions
        })
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    
    let targetUrl = event.notification.data?.url || '/habits';
    
    if (event.action === 'log_habits') {
        targetUrl = '/habits';
    } else if (event.action === 'open_gym') {
        targetUrl = '/gym';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                if (clientList[i].url.includes(targetUrl) && 'focus' in clientList[i]) {
                    return clientList[i].focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

