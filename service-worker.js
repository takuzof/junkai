const CACHE="junkai-v189";
const CORE=["./","./index.html","./manifest.webmanifest","./icon.svg"];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message",event=>{
  if(event.data==="SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);

  // Always prefer the network for app navigation/HTML so a new version is seen immediately.
  if(event.request.mode==="navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html")){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(event.request,{cache:"no-store"});
        const cache=await caches.open(CACHE);
        cache.put("./index.html",fresh.clone());
        return fresh;
      }catch(e){
        return (await caches.match("./index.html")) || (await caches.match("./"));
      }
    })());
    return;
  }

  // Static assets: refresh from network when possible, retain offline fallback.
  event.respondWith((async()=>{
    try{
      const fresh=await fetch(event.request,{cache:"no-store"});
      const cache=await caches.open(CACHE);
      cache.put(event.request,fresh.clone());
      return fresh;
    }catch(e){
      return caches.match(event.request);
    }
  })());
});
