/**
 * ProtoThrive Service Worker - Optimized for Cloudflare Pages
 * Enterprise-grade caching and performance optimization
 */

const CACHE_NAME = 'protothrive-v1.0.0';
const STATIC_CACHE = 'protothrive-static-v1.0.0';
const DYNAMIC_CACHE = 'protothrive-dynamic-v1.0.0';

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - Cache first
  static: [
    '/_next/static/',
    '/static/',
    '/images/',
    '/icons/',
    '/favicon.ico',
    '/manifest.json'
  ],
  
  // API routes - Network first
  api: [
    '/api/',
    '/auth/'
  ],
  
  // Pages - Stale while revalidate
  pages: [
    '/',
    '/dashboard',
    '/roadmaps',
    '/snippets',
    '/enterprise'
  ]
};

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll([
          '/',
          '/_next/static/css/',
          '/_next/static/js/',
          '/manifest.json',
          '/favicon.ico'
        ]);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - Implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Determine cache strategy based on URL
  const strategy = getCacheStrategy(url.pathname);
  
  switch (strategy) {
    case 'static':
      event.respondWith(cacheFirst(request));
      break;
    case 'api':
      event.respondWith(networkFirst(request));
      break;
    case 'pages':
      event.respondWith(staleWhileRevalidate(request));
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

// Cache First Strategy - For static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache First Strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network First Strategy - For API calls
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate Strategy - For pages
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, return cached version if available
    return cachedResponse || new Response('Offline', { status: 503 });
  });
  
  return cachedResponse || fetchPromise;
}

// Determine cache strategy based on URL path
function getCacheStrategy(pathname) {
  // Static assets
  for (const pattern of CACHE_STRATEGIES.static) {
    if (pathname.startsWith(pattern)) {
      return 'static';
    }
  }
  
  // API routes
  for (const pattern of CACHE_STRATEGIES.api) {
    if (pathname.startsWith(pattern)) {
      return 'api';
    }
  }
  
  // Pages
  for (const pattern of CACHE_STRATEGIES.pages) {
    if (pathname === pattern) {
      return 'pages';
    }
  }
  
  return 'network';
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Service Worker: Background sync triggered');
  
  // Implement background sync logic here
  // For example, sync offline form submissions, etc.
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'View Details',
          icon: '/icons/checkmark.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/xmark.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PERFORMANCE_METRICS') {
    // Log performance metrics
    console.log('Performance metrics:', event.data.metrics);
    
    // Send to analytics if needed
    if (event.data.metrics.loadTime > 3000) {
      console.warn('Slow page load detected:', event.data.metrics);
    }
  }
});

console.log('Service Worker: Loaded and ready');