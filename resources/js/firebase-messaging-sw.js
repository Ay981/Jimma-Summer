import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

const params = new URL(self.location).searchParams;

const app = initializeApp({
    apiKey: params.get('apiKey'),
    authDomain: params.get('authDomain'),
    projectId: params.get('projectId'),
    storageBucket: params.get('storageBucket'),
    messagingSenderId: params.get('messagingSenderId'),
    appId: params.get('appId'),
});

const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "Muraja'a Monitor";
    self.registration.showNotification(title, {
        body: payload.notification?.body ?? '',
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        data: { url: payload.data?.url || '/' },
    });
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            for (const client of list) {
                if (client.url.includes(url) && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
        }),
    );
});
