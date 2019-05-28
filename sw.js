importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');

workbox.skipWaiting();
workbox.clientsClaim();

// Provide an URL to enable a custom offline page
const OFFLINE_PAGE = '/offline.html';

// Pre-cache the AMP Runtime
self.addEventListener('install', (event) => {
  const urls = [
    'https://cdn.ampproject.org/v0.js',
    'https://cdn.ampproject.org/v0/amp-install-serviceworker-0.1.js',
    'https://cdn.ampproject.org/v0/amp-analytics-0.1.js',
    'https://cdn.ampproject.org/v0/amp-dynamic-css-classes-0.1.js',
    'https://fonts.googleapis.com/css?family=Montserrat'
  ];
  if (OFFLINE_PAGE) {
    urls.push(OFFLINE_PAGE);
  }
  event.waitUntil(
    caches.open(workbox.core.cacheNames.runtime).then((cache) => cache.addAll(urls))
  );
});

workbox.navigationPreload.enable();


let navigationStrategy;
if (OFFLINE_PAGE) {
  const networkFirstWithOfflinePage = async (args) => {
    const response = await workbox.strategies.networkFirst().handle(args);
    if (response) {
      return response;
    }
    return caches.match(OFFLINE_PAGE);
  };
  navigationStrategy = networkFirstWithOfflinePage;
} else {
  navigationStrategy = workbox.strategies.networkFirst();
}

// By default Use a network first strategy to ensure the latest content is used
workbox.routing.setDefaultHandler(workbox.strategies.networkFirst());

// Serve the AMP Runtime from cache and check for an updated version in the background
workbox.routing.registerRoute(
  /https:\/\/cdn\.ampproject\.org\/.*/,
  workbox.strategies.staleWhileRevalidate()
);

// Cache Images
workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg|webp)(\?.*)?$/,
  workbox.strategies.cacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
      })
    ]
  }),
);


workbox.routing.registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  }),
);

// Cache the Google Fonts webfont files with a cache first strategy for 1 year.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  workbox.strategies.cacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.Plugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  }),
);
