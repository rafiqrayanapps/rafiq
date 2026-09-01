// Firebase Cloud Messaging Service Worker
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const payload = event.data.json();
      const notificationTitle = payload.notification?.title || 'رفيق المصمم';
      const notificationOptions = {
        body: payload.notification?.body || 'إشعار جديد في رفيق المصمم',
        icon: payload.notification?.icon || '/icon-192.png',
        badge: '/icon-192.png',
        data: payload.data || {},
      };
      event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
    } catch (e) {
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('رفيق المصمم', {
          body: text || 'إشعار جديد',
          icon: '/icon-192.png',
        })
      );
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
