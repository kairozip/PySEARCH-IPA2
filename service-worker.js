self.addEventListener("install", () => {
  console.log("PySearch installed");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
