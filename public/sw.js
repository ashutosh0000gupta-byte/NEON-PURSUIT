/**
 * NEON PURSUIT - Progressive Web App Service Worker
 * Caches core engine, game scripts, and ad assets for high-speed offline launch.
 */
const CACHE_NAME = 'neon-pursuit-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/playcanvas.min.js',
  '/js/audio.js',
  '/js/particles.js',
  '/js/vehicle.js',
  '/js/traffic.js',
  '/js/police.js',
  '/js/pursuitBreaker.js',
  '/js/garage.js',
  '/js/blacklist.js',
  '/js/leaderboard.js',
  '/js/race.js',
  '/js/city.js',
  '/js/billboard.js',
  '/js/adTracker.js',
  '/js/hud.js',
  '/js/mobileControls.js',
  '/js/game.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ [PWA] Caching Static Game Engine Assets...');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let API requests go to the network
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
