// 파일을 수정하면 버전을 올려야 휴대폰에 새 파일이 반영됨
const CACHE_VERSION = "v1";
const CACHE_NAME = `allowance-ledger-${CACHE_VERSION}`;

const PRECACHE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// 이전 버전 캐시 정리
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("allowance-ledger-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// 캐시 우선, 없으면 네트워크에서 받아 캐시에 저장
self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // 오프라인에서 페이지 이동 요청이면 첫 화면을 보여줌
          if (request.mode === "navigate") return caches.match("./index.html");
          return Response.error();
        });
    })
  );
});
