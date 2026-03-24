// Firebase Messaging Service Worker
// Este arquivo recebe notificações em background quando o app está fechado/minimizado
// As credenciais do Firebase são injetadas via variáveis de ambiente durante o build

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

// Configuração do Firebase (valores são substituídos durante o build pelo Vite)
firebase.initializeApp({
  apiKey: "AIzaSyDkiH2j8IiLneTn6ree38hiqPIXRNmrpJA",
  authDomain: "trainlog-ae8e6.firebaseapp.com",
  projectId: "trainlog-ae8e6",
  storageBucket: "trainlog-ae8e6.firebasestorage.app",
  messagingSenderId: "878016503949",
  appId: "1:878016503949:web:4acc5d1a024a307fd042c4"
});

const messaging = firebase.messaging();

// Receber mensagens em background / quando o app está fechado
messaging.onBackgroundMessage((payload) => {
  console.log('[Firebase SW] 🔔 Notificação em background recebida:', payload);

  // Evita notificação duplicada: quando o payload já contém `notification`,
  // o FCM/WebPush normalmente exibe automaticamente.
  const hasNotificationPayload = Boolean(payload?.notification?.title || payload?.notification?.body);
  if (hasNotificationPayload) {
    console.log('[Firebase SW] ℹ️ Notificação já exibida automaticamente pelo FCM.');
    return;
  }

  const { title, body, image } = payload.notification || {};
  const icon = image || '/web-app-manifest-192x192.png';
  
  const notificationOptions = {
    body: body || '',
    icon,
    tag: 'trainlog-notification',
    renotify: true,
    data: payload.data,
    vibrate: [200, 100, 200] // Vibração no dispositivo
  };

  console.log('[Firebase SW] 📢 Exibindo notificação:', title, body);
  return self.registration.showNotification(title || 'TrainLog', notificationOptions);
});

// Clique na notificação - redireciona para a rota específica se houver
self.addEventListener('notificationclick', (event) => {
  console.log('[Firebase SW] 👆 Clique na notificação:', event);
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const url = notificationData.url || notificationData.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Procura por uma janela já aberta do app
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não houver janela aberta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Fecha notificação quando botão de fechar é clicado (suporte adicional)
self.addEventListener('notificationclose', (event) => {
  console.log('[Firebase SW] ❌ Notificação fechada:', event);
});
