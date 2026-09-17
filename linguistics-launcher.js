// Lightweight integration shared by the existing static build and Vite source.
// Does not change Eng Quest state, save data, or navigation behavior.
const ownUrl = document.currentScript?.src || new URL('./linguistics-launcher.js', document.baseURI).href;
// Linguistics Quest now lives inside Solving English Problems, published either beside this game
// (../solving-english-problems/) or inside its site (./solving-english-problems/). Prefer whichever exists.
const candidates = [new URL('../solving-english-problems/', ownUrl).href, new URL('./solving-english-problems/', ownUrl).href];
let destination = candidates[0];
Promise.all(candidates.map(u => fetch(u + 'index.html', { method: 'HEAD', cache: 'no-store' }).then(r => r.ok).catch(() => false)))
 .then(ok => { const i = ok.indexOf(true); if (i > 0) { destination = candidates[i]; const link = document.querySelector('[data-linguistics-link]'); if (link) link.href = destination; } });
function mountLinguisticsLink() {
 const stack = document.querySelector('.menu .inner .stack');
 if (!stack || stack.querySelector('[data-linguistics-link]')) return;
 const link = document.createElement('a');
 link.className = 'btn ghost block';
 link.href = destination;
 link.dataset.linguisticsLink = 'true';
 link.textContent = 'Solving English Problems · Words, sentences & reading ↗';
 const forex = stack.querySelector('a[href*="forex-quest"]');
 if (forex) forex.after(link); else stack.append(link);
}
const observer = new MutationObserver(mountLinguisticsLink);
observer.observe(document.documentElement, { childList: true, subtree: true });
mountLinguisticsLink();
