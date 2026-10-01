import { useEffect, useRef } from 'react';
import { WebGLRenderer } from 'three';
import { createRocketWorld, type FlightView } from './rocketWorld';

interface Props extends FlightView { onAvailability: (available: boolean) => void }

/** One canvas per screen; React updates the view ref without rebuilding GPU resources. */
export function RocketScene3D({ onAvailability, ...view }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(view); latest.current = view;
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let renderer: WebGLRenderer | undefined;
    let world: ReturnType<typeof createRocketWorld> | undefined;
    let observer: ResizeObserver | undefined;
    let stopped = false;
    let lastFrame = 0;
    let motionTime = 0;
    let lastTick = 0;
    let ready = false;
    const fail = () => { stopped = true; renderer?.setAnimationLoop(null); onAvailability(false); };
    const lost = (event: Event) => { event.preventDefault(); fail(); };
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.addEventListener('webglcontextlost', lost);
      node.appendChild(renderer.domElement);
      world = createRocketWorld();
      const resize = () => {
        if (!world || !renderer || stopped) return;
        const { width, height } = node.getBoundingClientRect();
        if (width <= 0 || height <= 0) return;
        renderer.setSize(width, height, false); world.resize(width, height);
      };
      resize(); observer = new ResizeObserver(resize); observer.observe(node);
      renderer.setAnimationLoop((ms) => {
        if (stopped || !world || !renderer) return;
        if (document.hidden) { lastTick = ms; return; }
        if (ms - lastFrame < (node.clientWidth < 600 ? 32 : 16)) return;
        lastFrame = ms;
        motionTime += Math.min(0.05, Math.max(0, (ms - lastTick) / 1000)); lastTick = ms;
        try {
          world.update(latest.current, motionTime); renderer.render(world.scene, world.camera);
          if (!ready) { ready = true; onAvailability(true); }
        } catch { fail(); }
      });
    } catch { fail(); }
    return () => {
      stopped = true; observer?.disconnect(); renderer?.setAnimationLoop(null);
      renderer?.domElement.removeEventListener('webglcontextlost', lost);
      world?.dispose(); renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
    };
  }, [onAvailability]);
  return <div className="rocket-world" ref={host} aria-hidden="true" />;
}
