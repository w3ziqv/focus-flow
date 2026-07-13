// sw-register.js — Service worker registration

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      // SW registration failed — app still works online.
    });
  });
}
