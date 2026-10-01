// The one shared piece inside every world: a small home button back to Solving English Problems, and a
// note of where the learner was (so the hub's Continue card works). No dependencies, no changes to any
// world's own save. Loaded from each world's index.html as ../hub-bar.js (or ../../ for sub-pages).
const HUB=new URL('./',import.meta.url).href;
const KEY='sep.learner.v1';
const MODULES={'sentence-forge':'sf','linguistics-quest':'lq','wordraiders':'wr'};
function where(){const rel=location.href.startsWith(HUB)?location.href.slice(HUB.length):'';const module=MODULES[rel.split('/')[0]];return module?{module,href:rel}:null;}
function remember(){const at=where();if(!at)return;try{const raw=localStorage.getItem(KEY);const l=raw?JSON.parse(raw):{};if(!l||typeof l!=='object')return;l.version=1;l.lastVisited={...at,title:document.title.split('·')[0].trim().slice(0,60),at:Date.now()};localStorage.setItem(KEY,JSON.stringify(l));}catch{/* storage may be blocked; the button still works */}}
function mount(){
 if(window.top!==window.self||document.querySelector('.sep-home'))return;
 const style=document.createElement('style');
 style.textContent=`.sep-home{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483000;display:inline-flex;align-items:center;gap:7px;padding:9px 13px 9px 11px;border-radius:999px;background:#0f2233;color:#f3f7f2;font:600 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-decoration:none;box-shadow:0 6px 18px #0009,0 0 0 1.5px #ffffff2e;opacity:.92;transition:transform .15s,opacity .15s}.sep-home:hover,.sep-home:focus-visible{opacity:1;transform:translateY(-1px);outline:2px solid #f4b84b;outline-offset:2px}.sep-home svg{width:16px;height:16px;flex:none}@media print{.sep-home{display:none}}@media (prefers-reduced-motion:reduce){.sep-home{transition:none}}`;
 const a=document.createElement('a');a.className='sep-home';a.href=HUB+'#home';a.setAttribute('aria-label','Back to Solving English Problems');a.title='Back to Solving English Problems';
 a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/></svg><span>English home</span>';
 document.head.append(style);document.body.append(a);
}
if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
remember();
window.addEventListener('hashchange',remember);
window.addEventListener('pagehide',remember);
document.addEventListener('visibilitychange',()=>{if(document.hidden)remember();});
