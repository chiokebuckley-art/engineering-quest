import type { SkillRequirement } from '../engine/types';
import { asset } from '../assets';

export interface LabEquipment {
  id: string;
  name: string;
  description: string;
  image: string;
  requires: SkillRequirement[];
  requiresQuest?: string;
  stage: number; // where it appears on the lab floor
  unlocksWith: string; // human sentence
}

export const LAB_EQUIPMENT: LabEquipment[] = [
  { id: 'workbench', name: 'Workbench', description: 'A sturdy bench. Every project starts here.', image: asset('/assets/machines/workshop-building.svg'), requires: [], stage: 0, unlocksWith: 'Available from the start.' },
  { id: 'measurement-bench', name: 'Measurement Bench', description: 'Calipers, rulers, a balance. Measurement is where numbers meet the physical world.', image: asset('/assets/machines/measurement-bench.svg'), requires: [{ skillId: 'mult', mastery: 90 }], requiresQuest: 'q.power-core-1', stage: 1, unlocksWith: 'Master multiplication and recover the first power core.' },
  { id: 'water-system', name: 'Water Pump & Pipes', description: 'A working pump with a gauge. Flow rates are division.', image: asset('/assets/machines/water-pump.svg'), requires: [{ skillId: 'div', mastery: 70 }], requiresQuest: 'q.pump', stage: 2, unlocksWith: 'Complete "Pump Failure" and develop division.' },
  { id: 'precision-tools', name: 'Precision Tools', description: 'Micrometers and gauge blocks. Fractions of a millimetre matter.', image: asset('/assets/machines/measurement-bench.svg'), requires: [{ skillId: 'frac', mastery: 85 }], stage: 3, unlocksWith: 'Master fractions.' },
  { id: 'circuit-bench', name: 'Circuit Bench', description: 'Power supply, breadboard, multimeter. Systems of equations become circuits.', image: asset('/assets/machines/power-core-multiplication.svg'), requires: [{ skillId: 'alg1.systems', mastery: 85 }], stage: 4, unlocksWith: 'Master algebra.' },
  { id: 'cad-station', name: 'CAD Station', description: 'Design parts in three dimensions.', image: asset('/assets/machines/mathematical-engine.svg'), requires: [{ skillId: 'geo.volume', mastery: 85 }], stage: 5, unlocksWith: 'Master geometry.' },
  { id: 'robotics-station', name: 'Robotics Station', description: 'Arms, joints, angles. Every joint is a trigonometry problem.', image: asset('/assets/machines/mathematical-engine.svg'), requires: [{ skillId: 'trig.vectors', mastery: 85 }], stage: 6, unlocksWith: 'Master trigonometry.' },
  { id: 'simulation-computer', name: 'Simulation Computer', description: 'Model changing systems before you build them.', image: asset('/assets/machines/mathematical-engine.svg'), requires: [{ skillId: 'calc1.integration', mastery: 85 }], stage: 7, unlocksWith: 'Master calculus.' },
  { id: 'reactor-sim', name: 'Advanced Reactor Simulation', description: 'Reaction kinetics, tanks, circuits — dynamic systems over time.', image: asset('/assets/machines/mathematical-engine.svg'), requires: [{ skillId: 'ode.systems', mastery: 85 }], stage: 8, unlocksWith: 'Master differential equations.' },
];
