const CACHE='shorojontro-practice-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
 if(event.data?.type!=='PREPARE')return;
 event.waitUntil((async()=>{try{
 const cache=await caches.open(CACHE);
 const urls=[...new Set(event.data.urls)].filter(path=>{const u=new URL(path,self.location.origin);return u.origin===self.location.origin&&!u.pathname.startsWith('/api/')&&(u.pathname==='/practice'||u.pathname.startsWith('/assets/')||u.pathname.startsWith('/cards/')||u.pathname.startsWith('/backgrounds/'))});
 await Promise.all(urls.map(async path=>{const r=await fetch(path,{cache:'reload'});if(!r.ok)throw Error('download');await cache.put(path,r)}));
 event.ports[0]?.postMessage({ok:true});
 }catch{event.ports[0]?.postMessage({ok:false})}})());
});
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/'))return;
 if(u.pathname==='/practice'||u.pathname.startsWith('/assets/')||u.pathname.startsWith('/cards/')||u.pathname.startsWith('/backgrounds/'))event.respondWith(fetch(event.request).catch(async()=>{const cached=await caches.match(event.request);return cached||Response.error()}));
});
