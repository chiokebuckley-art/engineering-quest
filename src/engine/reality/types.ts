/**
 * Reality Quest: a real object photo becomes a lab bench, a course and a series of simulated builds.
 * Content is curated data (a lab manifest, component cards, missions); the simulator only knows the parts
 * listed here, each with a reviewed electrical model.
 */

export type PartRole = 'controller' | 'input' | 'output' | 'support' | 'power' | 'driver';
/** How sure we are about an identity: a printed lid label, a candidate loose part, or a human-verified part. */
export type ReviewState = 'label-confirmed' | 'candidate' | 'verified';

/** One printed tile on the kit lid (row A–E × column 1–7) and the card it opens. */
export interface KitComponent {
  id: string;            // stable id, e.g. 'ultrasonic'
  tile: string;          // 'B5'
  printed: string;       // label as printed on the lid, e.g. 'Ultrasonic Sensor 1PC'
  name: string;          // plain-language name
  aliases: string[];     // other names kids meet ('HC-SR04', 'sonar')
  role: PartRole;
  count: string;         // '1', '5', '120'
  what: string;          // one sentence: what it does
  principle: string;     // how it works, from first principles, 2–4 short sentences
  io: { input: string; change: string; output: string }; // for the input → principle → output animation
  pins: string[];        // pin/lead names, e.g. ['VCC', 'Trig', 'Echo', 'GND']; [] when not applicable
  safety: string;        // safe handling in one or two sentences
  uses: string[];        // 2–3 real-world uses
  missions: string[];    // mission ids that use it ('m01'…'m10', 'boss')
  review: ReviewState;
  /** Available as a part on the circuit mat. */
  simulated?: boolean;
  /** Later lesson packs (kept in the drawer from day one). */
  later?: boolean;
}

export interface LabDef {
  id: string;
  title: string;
  domain: 'electronics';
  version: number;
  image: string;               // cropped, lid-only photo
  imageW: number; imageH: number;
  imageAlt: string;
  source: string;              // provenance of the photo
  components: KitComponent[];
  /** Normalised [x0, y0, x1, y1] rectangles (0–1) on the image, keyed by tile id. */
  hotspots: Record<string, [number, number, number, number]>;
}

/* ---------------- mastery ---------------- */

export type MasteryStage = 'recognize' | 'explain' | 'predict' | 'apply' | 'debug' | 'transfer';
export const MASTERY_STAGES: MasteryStage[] = ['recognize', 'explain', 'predict', 'apply', 'debug', 'transfer'];
