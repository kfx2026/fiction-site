// FictionVerse Service Worker — Push Notifications
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(clients.claim()); });

self.addEventListener('push', function(e){
  var data=e.data?e.data.json():{title:'New Chapter',body:'A book you follow has been updated!'};
  e.waitUntil(self.registration.showNotification(data.title,{
    body:data.body,icon:'/images/icons/icon-192.png',badge:'/images/icons/icon-72.png',
    data:{url:data.url||'/'}
  }));
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url||'/'));
});