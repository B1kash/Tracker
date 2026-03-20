'use strict';

self.addEventListener('push', function (event) {
    const data = JSON.parse(event.data.text());
    event.waitUntil(
        registration.showNotification(data.title, {
            body: data.body,
            icon: '/icon-192x192.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            data: { url: data.url }
        })
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (event.notification.data.url) {
                let client = null;
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].url === event.notification.data.url && 'focus' in clientList[i]) {
                        client = clientList[i];
                        break;
                    }
                }
                if (client) {
                    return client.focus();
                } else if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url);
                }
            }
        })
    );
});
