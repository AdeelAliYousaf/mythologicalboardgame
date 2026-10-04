const CACHE = 'dragon-ladder-v9-credits';
const CORE = ["/", "/Music/GameTheme.mp3", "/Music/credits.mp3", "/VoiceOvers/aivictory.mp3", "/VoiceOvers/facedragon.mp3", "/VoiceOvers/fateusage.mp3", "/VoiceOvers/firstvictory.mp3", "/VoiceOvers/secondvictory.mp3", "/VoiceOvers/thirdvictory.mp3", "/VoiceOvers/Frexia-Bypassing.mp3", "/VoiceOvers/Frexia-DragonEncounter.mp3", "/VoiceOvers/Frexia-PowerActivated.mp3", "/VoiceOvers/Frexia-Victory.mp3", "/VoiceOvers/Frexia.mp3", "/VoiceOvers/Loki-PowerActivated.mp3", "/VoiceOvers/Loki-Victory.mp3", "/VoiceOvers/Loki.mp3", "/VoiceOvers/Thor-PowerActivated.mp3", "/VoiceOvers/Thor-Victory.mp3", "/VoiceOvers/Thor.mp3", "/VoiceOvers/dragon.mp3", "/assets/board.webp", "/assets/complete-concept.webp", "/assets/derived/dragon-beast.webp", "/assets/derived/dragon-flight-0.png", "/assets/derived/dragon-flight-1.png", "/assets/derived/dragon-flight-2.png", "/assets/derived/dragon-flight-3.png", "/assets/derived/dragon-serpent.webp", "/assets/derived/dragon-spiral.webp", "/assets/derived/dragon-wing.webp", "/assets/derived/frexia.webp", "/assets/derived/loki.webp", "/assets/derived/penalty-17.webp", "/assets/derived/penalty-20.webp", "/assets/derived/penalty-26.webp", "/assets/derived/penalty-35.webp", "/assets/derived/thor.webp", "/assets/dragon-cards.webp", "/assets/hero-cards.webp", "/assets/og-graph.png", "/assets/pinkribbon.png", "/assets/rules.webp", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    // The home document names the build's JavaScript and CSS entry files.
    const home = await cache.match('/');
    if (home) {
      const html = await home.text();
      const files = [...html.matchAll(/(?:src|href)=["'](\/_next\/static\/[^"']+)["']/g)]
        .map(match => match[1].replaceAll('&amp;', '&'));
      await Promise.allSettled([...new Set(files)].map(file => cache.add(file)));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('dragon-ladder-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok && response.type === 'basic') {
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') return (await cache.match('/')) || Response.error();
      throw error;
    }
  })());
});
