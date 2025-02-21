const CACHE_NAME = 'ya-balloons-app-v1';
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/sounds/plock.m4a',
    '/manifest.json',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Cache instalado');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});