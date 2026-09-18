// Lightweight integration shared by the existing static build and Vite source.
// Does not change Eng Quest state, save data, or navigation behavior.
const ownUrl = document.currentScript?.src || new URL('./linguistics-launcher.js', document.baseURI).href;
const destination = new URL('./linguistics-quest/', ownUrl).href;
function mountLinguisticsLink() {
 const stack = document.querySelector('.menu .inner .stack');
 if (!stack || stack.querySelector('[data-linguistics-link]')) return;
 const link = document.createElement('a');
 link.className = 'btn ghost block';
 link.href = destination;
 link.dataset.linguisticsLink = 'true';
 link.textContent = 'Linguistics Quest · Words & symbols ↗';
 const forex = stack.querySelector('a[href*="forex-quest"]');
 if (forex) forex.after(link); else stack.append(link);
}
const observer = new MutationObserver(mountLinguisticsLink);
observer.observe(document.documentElement, { childList: true, subtree: true });
mountLinguisticsLink();
