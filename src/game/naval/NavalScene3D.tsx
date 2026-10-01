import { useEffect, useRef } from 'react';
import { WebGLRenderer } from 'three';
import { createNavalWorld } from './navalWorld';
import type { BattleView } from './battle';

export function NavalScene3D({ view, onAvailability }: { view: BattleView; onAvailability: (ready: boolean) => void }) {
  const host = useRef<HTMLDivElement>(null); const latest = useRef(view); latest.current = view;
  const labels = useRef(new Map<string, HTMLDivElement>());
  const rosterKey = view.ships.map(s => s.id).join('|');
  useEffect(() => {
    const node = host.current; if (!node) return;
    let renderer: WebGLRenderer | undefined; let world: ReturnType<typeof createNavalWorld> | undefined;
    let observer: ResizeObserver | undefined; let stopped = false; let announced = false; let last = 0; let time = 0;
    const fail = () => { stopped = true; renderer?.setAnimationLoop(null); onAvailability(false); };
    const onLost = (event: Event) => { event.preventDefault(); fail(); };
    try {
      renderer = new WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.domElement.setAttribute('aria-hidden', 'true'); renderer.domElement.addEventListener('webglcontextlost', onLost);
      node.appendChild(renderer.domElement); world = createNavalWorld(latest.current);
      const resize = () => {
        if (!renderer || !world || stopped) return;
        const { width, height } = node.getBoundingClientRect(); if (!width || !height) return;
        renderer.setSize(width, height, false); world.resize(width, height);
        for (const label of world.labels()) {
          const el = labels.current.get(label.id); if (!el) continue;
          el.style.left = `${label.x}%`; el.style.top = `${label.y}%`;
        }
      };
      resize(); observer = new ResizeObserver(resize); observer.observe(node);
      renderer.setAnimationLoop((ms) => {
        if (stopped || !renderer || !world) return;
        if (document.hidden || node.clientWidth === 0) { last = ms; return; }
        if (ms - last < 32) return;
        time += Math.min(0.05, Math.max(0, (ms - last) / 1000)); last = ms;
        try {
          world.update(latest.current, time); renderer.render(world.scene, world.camera);
          if (!announced) { announced = true; onAvailability(true); }
        } catch { fail(); }
      });
    } catch { fail(); }
    return () => {
      stopped = true; observer?.disconnect(); renderer?.setAnimationLoop(null);
      renderer?.domElement.removeEventListener('webglcontextlost', onLost);
      world?.dispose(); renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
    };
  }, [onAvailability, rosterKey, view.key]);
  return <div className="naval-renderer">
    <div className="naval-canvas" ref={host} aria-hidden="true" />
    {view.ships.map(ship => <div key={ship.id} ref={element => { if (element) labels.current.set(ship.id, element); else labels.current.delete(ship.id); }} className={`ship-label ${ship.id === view.activeId ? 'captain' : ''}`} style={{ ['--ship-color' as string]: ship.color }}>
      <span title={ship.name}>{ship.name}{ship.id === view.activeId ? ' •' : ''}</span>
      <i><b style={{ width: `${ship.hull}%` }} /></i>
    </div>)}
  </div>;
}
