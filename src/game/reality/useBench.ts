import { useEffect, useRef, useState } from 'react';
import { Bench } from '../../engine/reality/runtime';
import type { Circuit, Env, SimResult } from '../../engine/reality/circuit';
import type { SketchDef, Slots, ServoState } from '../../engine/reality/runtime';
import { BLINK } from '../../engine/reality/sketches';

export interface BenchView {
  result: SimResult;
  serial: string[];
  servo: Record<string, ServoState>;
  /** Milliseconds since the last Serial output (for the TX light). */
  txAgo: number;
  sketchId: string | null;
  upload(sketch: SketchDef | null, slots: Slots): void;
}

/**
 * Runs a virtual UNO against the circuit about 16 times a second. The board starts with the factory Blink
 * sketch (as a new UNO does) unless another sketch is given. Burned-out LEDs are reported through onBlown.
 */
export function useBench(circuit: Circuit, env: Env, usb: boolean, initial: { sketch: SketchDef | null; slots?: Slots } | null, onBlown?: (ids: string[]) => void): BenchView {
  const bench = useRef<Bench>();
  if (!bench.current) bench.current = new Bench(circuit, env, initial ? initial.sketch : BLINK, initial?.slots);
  const [, setFrame] = useState(0);
  const lastTx = useRef(-1e9);
  const blownCb = useRef(onBlown); blownCb.current = onBlown;
  const b = bench.current;
  b.circuit = circuit; b.env = env;
  useEffect(() => { b.plug(usb); }, [usb]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = window.setInterval(() => {
      const { events } = b.tick(60);
      if (events.serial.length) lastTx.current = b.t;
      if (events.blown.length) blownCb.current?.(events.blown);
      setFrame((f) => (f + 1) % 1_000_000);
    }, 60);
    return () => window.clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    result: b.last, serial: b.serial, servo: b.servo, txAgo: b.t - lastTx.current, sketchId: b.sketch?.id ?? null,
    upload: (sketch, slots) => b.upload(sketch, slots),
  };
}
