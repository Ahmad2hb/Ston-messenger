self.addEventListener("push", event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch(e) {}

  event.waitUntil(
    self.registration.showNotification(
      data.title || "STON Messenger",
      {
        body: data.body || "رسالة جديدة",
        icon: "/icon.png",
        data: { url: data.url || "/" }
      }
    )
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(
      event.notification.data?.url || "/"
    )
  );
});
