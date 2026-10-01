import { asset } from '../assets';
export interface Npc {
  id: string;
  name: string;
  role: string;
  portrait: string;
  color: string;
  region: string;
}

const p = (f: string) => asset(`/assets/characters/${f}.svg`);

export const NPCS: Record<string, Npc> = {
  vector: { id: 'vector', name: 'Professor Vector', role: 'Mathematics', portrait: p('professor-vector'), color: '#2dd4bf', region: 'village' },
  catalyst: { id: 'catalyst', name: 'Dr. Catalyst', role: 'Chemical Engineering', portrait: p('dr-catalyst'), color: '#4ade80', region: 'village' },
  volt: { id: 'volt', name: 'Engineer Volt', role: 'Electrical Engineering', portrait: p('engineer-volt'), color: '#22d3ee', region: 'village' },
  newton: { id: 'newton', name: 'Professor Newton', role: 'Physics', portrait: p('professor-newton'), color: '#ffb347', region: 'village' },
  ada: { id: 'ada', name: 'Mechanic Ada', role: 'Machines & Programming', portrait: p('mechanic-ada'), color: '#f97316', region: 'village' },
  brick: { id: 'brick', name: 'Foreman Brick', role: 'Mine Foreman', portrait: p('foreman-brick'), color: '#c9a227', region: 'mines' },
};

export const AVATARS = [
  { id: 'avatar-01', path: p('avatar-01'), label: 'Apprentice I' },
  { id: 'avatar-02', path: p('avatar-02'), label: 'Apprentice II' },
  { id: 'avatar-03', path: p('avatar-03'), label: 'Apprentice III' },
  { id: 'avatar-04', path: p('avatar-04'), label: 'Apprentice IV' },
  { id: 'avatar-05', path: p('avatar-05'), label: 'Apprentice V' },
  { id: 'avatar-06', path: p('avatar-06'), label: 'Automaton' },
];

export const SPECIALIZATIONS: { id: string; name: string; blurb: string; icon: string }[] = [
  { id: 'undecided', name: 'Undecided', blurb: 'Keep your options open. You can choose later — it never blocks mathematics.', icon: asset('/assets/icons/compass.svg') },
  { id: 'chemical', name: 'Chemical Engineer', blurb: 'Reactors, mixtures, heat exchangers. Ratios and differential equations will be your tools.', icon: asset('/assets/icons/flask.svg') },
  { id: 'electrical', name: 'Electrical Engineer', blurb: 'Circuits, power systems, signals. Systems of equations, complex numbers and Fourier analysis.', icon: asset('/assets/icons/circuit.svg') },
  { id: 'physics', name: 'Physicist', blurb: 'Forces, fields, motion. Vectors, calculus and mathematical physics.', icon: asset('/assets/icons/telescope.svg') },
  { id: 'automation', name: 'Automation Engineer', blurb: 'Robots, control systems, factories. Linear algebra and numerical methods.', icon: asset('/assets/icons/robot.svg') },
  { id: 'materials', name: 'Materials Engineer', blurb: 'Alloys, stresses, structures. Geometry, statistics and tensors.', icon: asset('/assets/icons/anvil.svg') },
];
