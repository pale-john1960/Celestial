/*
 * Celestial service worker v3 — offline calendar shell (hand-written, zero deps).
 *
 * WHAT IT INTERCEPTS (three branches; EVERYTHING else is untouched)
 * -------------------------------------------------------------------
 *   A. STATIC ASSETS — cache-first (unchanged since v1):
 *        - path prefixes:  /seasonal/  /hero/  /flags/  /icons/  /samples/  /_next/static/
 *        - exact paths:    /logo.svg  /robots.txt  /manifest.webmanifest
 *      Plus a RUNTIME-captured copy of the app shell document "/" (see C).
 *
 *   B. /api/events GET — network-first with cache fallback:
 *      try the network; a successful response is cached (keyed by the full
 *      URL including the ?from=&to=&… query) and returned. On network
 *      failure serve the cached copy for that exact query; on cache miss
 *      respond 503 (NOT a network error) so the page's own JS fallback
 *      layer can take over: src/lib/client/api.ts catches it while offline
 *      and computes builtin events locally from the pure events engine.
 *      POST/PATCH/DELETE are never intercepted (method guard below), and
 *      no other /api/* path is matched.
 *
 *   C. NAVIGATIONS (request.mode === "navigate") — network-first:
 *      try the network so dev always loads fresh HTML; on failure serve the
 *      runtime-cached app shell. The shell is captured at RUNTIME (every
 *      successful online navigation to "/" stores a fresh clone under one
 *      stable cache key) and deliberately NOT precached at install time —
 *      dev HTML is unstable and an install-time copy would poison the
 *      shell with stale markup.
 *
 * DEV-SAFETY RATIONALE (why so narrow)
 * ------------------------------------
 * This app spends most of its life in Next.js DEV mode with hot module
 * replacement (HMR) running, so the worker only ever calls respondWith for
 * the three shapes above:
 *
 *   1. GET requests only — API mutations (POST/PATCH/DELETE), imports and
 *      HMR payloads are returned to the browser untouched.
 *   2. Anything under /_next/ that is NOT /_next/static/ (e.g.
 *      /_next/webpack-hmr) never matches any branch, so HMR keeps working.
 *   3. DEV STALENESS GUARDS (round-10 bugfix, refined in v4) for
 *      /_next/static/ URLs:
 *      a) URLs WITH a query string (?v=<build>) bypass the worker entirely
 *         — Turbopack dev serves recompiled chunks under stable pathnames +
 *         ?v=, so a cache-first hit would pin stale code forever (observed
 *         in round 10).
 *      b) Query-less /_next/static/ URLs are only cached when the server
 *         marks the response `immutable` (production content-hashed assets)
 *         — dev serves them `no-store` with mutating content, so they are
 *         never cached and always hit the network (v3 pinned them: second
 *         stale-code incident, fixed in v4).
 *      Production asset URLs are content-hashed and query-free, so the
 *      guards cost nothing in production.
 *   4. Documents are network-first (branch C), so a dev reload always
 *      revalidates HTML; the shell cache entry only ever serves true
 *      network failures.
 */

const VERSION = "v5";
const STATIC_CACHE = `celestial-static-${VERSION}`;
const API_CACHE = `celestial-api-${VERSION}`;

/** Stable cache key for the runtime-captured app shell document. */
const SHELL_URL = new URL("/", self.location.origin).href;

/** Minimal immutable shell, precached at install time (NOT the document). */
const PRECACHE_URLS = [
  "/logo.svg",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/favicon-48.png",
];

/** Path prefixes served cache-first (immutable / static-only). */
const CACHE_FIRST_PREFIXES = [
  "/seasonal/",
  "/hero/",
  "/flags/",
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
      const cache = await caches.open(STATIC_CACHE);
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
      // Drop every cache from a previous version (v1/v2 static caches, old
      // api caches — anything not in the current allow-list).
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

/** Branch A — cache-first for immutable/static assets. */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  // Serve a fresh match immediately.
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
}

/** Branch B — network-first + cache fallback for /api/events GET. */
async function handleApiEvents(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      // Keyed by the full request URL (query included) so every
      // [from, to, sources] combination caches independently.
      await cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // 503 with a JSON body (not a network error): the page's fetchEvents
    // sees a plain HTTP failure and, while offline, falls back to
    // locally-computed builtin events.
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      statusText: "Offline",
      headers: { "Content-Type": "application/json" },
    });
  }
}

/** Branch C — network-first + runtime-cached shell for navigations. */
async function handleNavigation(request, url) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    // Runtime-capture-latest: every successful online load of "/" refreshes
    // the shell entry under one stable key. (Install-time precache of "/"
    // is deliberately avoided — dev HTML is unstable, see header note C.)
    if (
      response &&
      response.ok &&
      response.type === "basic" &&
      url.pathname === "/"
    ) {
      await cache.put(SHELL_URL, response.clone());
    }
    return response;
  } catch (err) {
    const shell = await cache.match(SHELL_URL);
    if (shell) return shell;
    return new Response(
      "Celestial is offline and no cached copy of the app is available yet. Reconnect once to cache it.",
      {
        status: 503,
        statusText: "Offline",
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only GET, only same-origin. Everything else — API mutations, imports,
  // HMR payloads, websocket upgrades — falls through to the browser
  // untouched (no respondWith call at all).
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Branch B: the aggregated-events API (always carries ?from=&to=…).
  if (url.pathname === "/api/events") {
    event.respondWith(handleApiEvents(request));
    return;
  }

  // Branch C: top-level document navigations.
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request, url));
    return;
  }

  // Branch A: immutable/static assets.
  if (!isStaticAssetPath(url.pathname)) return;
  // DEV STALENESS GUARDS (see header note 3) for /_next/static/:
  //   3a. URLs with a ?v= query bypass the worker entirely (Turbopack dev
  //       serves recompiled chunks under stable pathnames + ?v=<build>).
  //   3b. Query-less /_next/static/ requests go through handleNextStatic:
  //       dev serves them with `Cache-Control: no-store` (content mutates
  //       under the same URL between recompiles) while production serves
  //       `public, max-age=31536000, immutable` — so only responses whose
  //       cache-control says immutable are ever cached. Dev chunks are
  //       therefore never pinned; production chunks are cached and work
  //       offline. (v3 and earlier cached them unconditionally and could pin
  //       stale dev chunks — observed twice, fixed in v4.)
  if (url.pathname.startsWith("/_next/static/")) {
    if (url.search !== "") return; // guard 3a
    event.respondWith(handleNextStatic(request)); // guard 3b
    return;
  }

  // Own static assets (seasonal/, icons/, samples/, logo…) — content-stable
  // across dev recompiles, safe to cache-first.
  event.respondWith(cacheFirst(request));
});

/** /_next/static/ handler — cache-first, but ONLY production-immutable
 * responses are ever stored (see fetch-handler note 3b). */
async function handleNextStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cc = response?.headers.get("cache-control") ?? "";
  if (response && response.ok && response.type === "basic" && cc.includes("immutable")) {
    await cache.put(request, response.clone());
  }
  return response;
}
