const CACHE = 'dragon-ladder-v13-all-assets';
const CORE = [
  "/",
  "/assets/board.webp",
  "/assets/complete-concept.webp",
  "/assets/derived/dragon-beast.webp",
  "/assets/derived/dragon-flight-0.png",
  "/assets/derived/dragon-flight-1.png",
  "/assets/derived/dragon-flight-2.png",
  "/assets/derived/dragon-flight-3.png",
  "/assets/derived/dragon-serpent.webp",
  "/assets/derived/dragon-spiral.webp",
  "/assets/derived/dragon-wing.webp",
  "/assets/derived/frexia.webp",
  "/assets/derived/loki.webp",
  "/assets/derived/penalty-17.webp",
  "/assets/derived/penalty-20.webp",
  "/assets/derived/penalty-26.webp",
  "/assets/derived/penalty-35.webp",
  "/assets/derived/thor.webp",
  "/assets/dragon-cards.webp",
  "/assets/fonts/cinzel/Cinzel-Black.otf",
  "/assets/fonts/cinzel/Cinzel-Bold.otf",
  "/assets/fonts/cinzel/Cinzel-Regular.otf",
  "/assets/fonts/cinzel/CinzelDecorative-Black.otf",
  "/assets/fonts/cinzel/CinzelDecorative-Bold.otf",
  "/assets/fonts/cinzel/CinzelDecorative-Regular.otf",
  "/assets/hero-cards.webp",
  "/assets/og-graph.png",
  "/assets/pinkribbon.png",
  "/assets/rules.webp",
  "/assets/she-is-precious.png",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.webmanifest",
  "/Music/credits.mp3",
  "/Music/GameTheme.mp3",
  "/VoiceOvers/aivictory.mp3",
  "/VoiceOvers/dragon.mp3",
  "/VoiceOvers/facedragon.mp3",
  "/VoiceOvers/fateusage.mp3",
  "/VoiceOvers/firstvictory.mp3",
  "/VoiceOvers/Frexia-Bypassing.mp3",
  "/VoiceOvers/Frexia-DragonEncounter.mp3",
  "/VoiceOvers/Frexia-PowerActivated.mp3",
  "/VoiceOvers/Frexia-Victory.mp3",
  "/VoiceOvers/Frexia.mp3",
  "/VoiceOvers/laddermissclimb.mp3",
  "/VoiceOvers/Loki-PowerActivated.mp3",
  "/VoiceOvers/Loki-Selecting.mp3",
  "/VoiceOvers/Loki-Victory.mp3",
  "/VoiceOvers/Loki.mp3",
  "/VoiceOvers/secondvictory.mp3",
  "/VoiceOvers/thirdvictory.mp3",
  "/VoiceOvers/Thor-PowerActivated.mp3",
  "/VoiceOvers/Thor-Victory.mp3",
  "/VoiceOvers/Thor.mp3",
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE.map(path => new Request(path, { cache: 'reload' })));
    // The home document names the build's JavaScript and CSS entry files.
    const home = await cache.match('/');
    if (home) {
      const html = await home.text();
      const files = [...html.matchAll(/(?:src|href)=["'](\/_next\/static\/[^"']+)["']/g)]
        .map(match => match[1].replaceAll('&amp;', '&'));
      await Promise.all([...new Set(files)].map(file => cache.add(file)));
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
  if (url.pathname === '/sw.js') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (event.request.mode === 'navigate' || event.request.destination === 'document') {
      try {
        const response = await fetch(event.request, { cache: 'no-store' });
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      } catch {
        return (await cache.match(event.request)) || (await cache.match('/')) || Response.error();
      }
    }
    const cached = await cache.match(event.request);
    if (cached) {
      const range = event.request.headers.get('range');
      if (range && cached.status === 200) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (match) {
          const bytes = await cached.arrayBuffer();
          const size = bytes.byteLength;
          const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
          const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
          if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
          return new Response(bytes.slice(start, end + 1), { status: 206, headers: {
            'Content-Type': cached.headers.get('Content-Type') || 'application/octet-stream',
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Content-Length': String(end - start + 1),
            'Accept-Ranges': 'bytes',
          } });
        }
      }
      return cached;
    }
    try {
      const response = await fetch(event.request);
      if (response.status === 200 && response.type === 'basic') {
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') return (await cache.match('/')) || Response.error();
      throw error;
    }
  })());
});
