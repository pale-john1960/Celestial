/*
 * Celestial service worker — static-asset offline shell (hand-written, zero deps).
 *
 * DEV-SAFETY RATIONALE
 * --------------------
 * This app spends most of its life in Next.js DEV mode with hot module
 * replacement (HMR) running. A service worker that caches documents or a broad
 * slice of /_next/* would break hot reload: the dev HTML document is never
 * stable, and HMR payloads live under /_next/ OUTSIDE /_next/static/.
 * Therefore this worker is deliberately minimal:
 *
 *   1. It intercepts ONLY GET requests (never POST/PATCH API mutations).
 *   2. Of those, it serves cache-first ONLY for immutable/static assets:
 *        - path prefixes:  /seasonal/  /icons/  /samples/  /_next/static/
 *          (note the underscore prefix — /_next/static/ holds content-hashed
 *          build chunks in production and is safe; the broader /_next/ tree
 *          is NEVER matched because HMR lives there),
 *        - exact paths:    /logo.svg  /robots.txt  /manifest.webmanifest.
 *   3. EVERYTHING else — HTML navigations, /api/*, /_next/webpack-hmr and any
 *      other request — is returned without calling respondWith, so the
 *      browser handles it exactly as if no service worker existed. This keeps
 *      dev HMR, dev document loads and API cache semantics untouched.
 *   4. DEV STALENESS GUARD: any request whose URL carries a query string is
 *      bypassed entirely. Next dev (Turbopack) serves build chunks under
 *      /_next/static/ with a STABLE pathname + ?v=<build> query — the content
 *      changes under the same URL between recompiles, so a cache-first hit
 *      would pin stale code forever (observed: an edited component kept
 *      serving its pre-edit chunk). Production asset URLs are content-hashed
 *      and query-free, so this guard costs nothing in production and makes
 *      the SW safe in dev.
 *
 * The result: seasonal artwork, icons, sample files and hashed build assets
 * keep working offline, while the dev server behaves as if this file weren't
 * there at all for anything dynamic.
 */

const VERSION = "v2";
const CACHE = `celestial-static-${VERSION}`; // "celestial-static-v2"

/** Minimal immutable shell, precached at install time. */
const PRECACHE_URLS = [
  "/logo.svg",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/favicon-48.png",
];

/** Path prefixes served cache-first (immutable / static-only). */
const CACHE_FIRST_PREFIXES = [
  "/seasonal/",
  "/icons/",
  "/samples/",
  "/_next/static/",
];

/** Exact pathnames served cache-first. */
const CACHE_FIRST_EXACT = new Set([
  "/logo.svg",
  "/robots.txt",
  "/manifest.webmanifest",
]);

/** true when this request is one of the few shapes we are allowed to cache. */
function isStaticAssetPath(pathname) {
  if (CACHE_FIRST_EXACT.has(pathname)) return true;
  return CACHE_FIRST_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Precache each entry individually: one missing file must never reject
      // the whole install (the asset then simply gets cached on first fetch).
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(url);
          } catch (err) {
            // Dev server hiccup or transient 404 — non-fatal, skip it.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop every cache from a previous version.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only GET, only same-origin, only the static shapes listed above.
  // Everything else (documents, /api/*, HMR, websocket upgrades) falls
  // through to the browser untouched — no respondWith call at all.
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (!isStaticAssetPath(url.pathname)) return;
  // DEV STALENESS GUARD (see header note 4): query-carrying URLs are dev
  // versioned assets whose content mutates under a stable URL — never cache.
  if (url.search !== "") return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);

      // Cache-first: serve a fresh match immediately.
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        // Only successful basic responses are worth caching (no 404s, no
        // opaque cross-origin bodies — we already filtered by origin anyway).
        if (response && response.ok && response.type === "basic") {
          await cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        // Network failure: fall back to whatever we may have (e.g. a body
        // cached by a concurrent tab), else surface a network error.
        const fallback = await cache.match(request);
        if (fallback) return fallback;
        return Response.error();
      }
    })(),
  );
});
