var CACHE = 'wb-v3';
var PRE = [
  './', './index.html', './manifest.webmanifest', './assets/icon.svg', './assets/css/app.css',
  './assets/js/util.js', './assets/js/store.js', './assets/js/sync.js', './assets/js/sync-paircode.js', './assets/js/sync-supabase.js',
  './assets/js/seed_docs.js', './assets/js/ky_words.js', './assets/js/comp.js', './assets/js/exam.js', './assets/js/english.js',
  './assets/js/modules.js', './assets/js/modules2.js', './assets/js/modules3.js', './assets/js/modules4.js',
  './assets/js/modules5.js', './assets/js/modules6.js', './assets/js/review.js', './assets/js/wordstudy.js', './assets/js/app.js',
  './assets/js/qrcode.min.js', './assets/js/jsqr.min.js'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { return k !== CACHE ? caches.delete(k) : null; }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (resp) {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        var cp = resp.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
      }
      return resp;
    }).catch(function () {
      return caches.match(e.request).then(function (c) { return c || caches.match('./index.html'); });
    })
  );
});
