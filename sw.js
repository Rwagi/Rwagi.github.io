// Wymuszamy na przeglądarce brak korzystania z dyskowej pamięci podręcznej Service Workera
self.addEventListener('install', (event) => {
    // Aktywuj natychmiast, nie czekaj na zamknięcie innych kart
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Wyczyść absolutnie wszystkie stare cache, jeśli jakieś istniały
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => caches.delete(cache))
            );
        }).then(() => self.clients.claim())
    );
});

// Strategia: Network-Only. Żądania lecą prosto do sieci. zero zapisu, zero zwrotów z pamięci podręcznej.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch((err) => {
            // Logowanie błędu tylko w konsoli (np. gdy całkowicie padnie sieć)
            console.warn('PWA Fetch pobrany z sieci nieudany:', err);
            return null;
        })
    );
});