import type { Rng } from '../rng';
import { unit as u } from '../label';

/**
 * Engineering situations used to dress multiplication and division problems.
 * Each template turns (groups, perGroup) into a short scenario. The prose names every number
 * ("4 support assemblies", "6 bolts"), with the singular when a count is 1.
 */
export interface Scenario {
  groupNoun: string;      // "support assemblies"
  itemNoun: string;       // "bolts"
  unit: string;           // answer unit
  site: string;           // where it happens
  application: string;    // why an engineer cares
  build: (groups: number, per: number) => string; // multiplication prompt
  share: (total: number, groups: number) => string; // division prompt (total ÷ groups = per)
  verb: string;           // what a correct answer does
}

export const SCENARIOS: Scenario[] = [
  {
    groupNoun: 'support assemblies', itemNoun: 'bolts', unit: 'bolts', site: 'the collapsed bridge',
    application: 'Structural engineers total fasteners per assembly to order materials.',
    build: (g, p) => `The damaged bridge needs ${g} support ${u(g, 'assembly', 'assemblies')}. Each assembly requires ${p} ${u(p, 'bolt')}. How many bolts must you collect?`,
    share: (t, g) => `You have ${t} bolts for ${g} identical support assemblies. How many bolts go into each assembly?`,
    verb: 'The bolts are delivered to the construction site.',
  },
  {
    groupNoun: 'crates', itemNoun: 'copper gears', unit: 'gears', site: 'the mine depot',
    application: 'Inventory planning: parts per container × containers.',
    build: (g, p) => `The depot holds ${g} ${u(g, 'crate')} of copper gears with ${p} ${u(p, 'gear')} in each crate. How many gears are in stock?`,
    share: (t, g) => `${t} copper gears must be packed evenly into ${g} crates. How many gears per crate?`,
    verb: 'The inventory ledger is updated.',
  },
  {
    groupNoun: 'solar panels', itemNoun: 'watts', unit: 'W', site: 'the village roof array',
    application: 'Electrical engineers size an array by multiplying panel power by panel count.',
    build: (g, p) => `A roof array has ${g} solar ${u(g, 'panel')}. Each panel produces ${p} ${u(p, 'watt')} at noon. What is the total power output?`,
    share: (t, g) => `An array must deliver ${t} watts using ${g} identical panels. How many watts must each panel produce?`,
    verb: 'The array powers the lamps.',
  },
  {
    groupNoun: 'pipe runs', itemNoun: 'metres of pipe', unit: 'm', site: 'the water system',
    application: 'Piping layout: segments × length per segment gives total pipe to order.',
    build: (g, p) => `The water system needs ${g} pipe ${u(g, 'run')}, each ${p} ${u(p, 'metre')} long. How many metres of pipe are required?`,
    share: (t, g) => `${t} metres of pipe are cut into ${g} equal runs. How long is each run?`,
    verb: 'Water flows through the new line.',
  },
  {
    groupNoun: 'conveyor sections', itemNoun: 'rollers', unit: 'rollers', site: 'the ore conveyor',
    application: 'Mechanical design counts identical components across repeated sections.',
    build: (g, p) => `An ore conveyor has ${g} ${u(g, 'section')} with ${p} ${u(p, 'roller')} per section. How many rollers does it use?`,
    share: (t, g) => `${t} rollers are spread evenly over ${g} conveyor sections. How many rollers per section?`,
    verb: 'The conveyor turns again.',
  },
  {
    groupNoun: 'battery packs', itemNoun: 'cells', unit: 'cells', site: 'the power room',
    application: 'Battery packs are cells in series/parallel; total cells = packs × cells per pack.',
    build: (g, p) => `The power room stores ${g} battery ${u(g, 'pack')}. Each pack contains ${p} ${u(p, 'cell')}. How many cells in total?`,
    share: (t, g) => `${t} cells are assembled into ${g} identical packs. How many cells per pack?`,
    verb: 'The power room hums to life.',
  },
  {
    groupNoun: 'gear wheels', itemNoun: 'teeth', unit: 'teeth', site: 'the engine housing',
    application: 'Gear ratios depend on tooth counts.',
    build: (g, p) => `A gearbox contains ${g} ${u(g, 'gear wheel', 'identical gear wheels')} with ${p} ${u(p, 'tooth', 'teeth')} each. How many teeth in total?`,
    share: (t, g) => `A set of ${g} identical gears has ${t} teeth altogether. How many teeth on each gear?`,
    verb: 'The gears mesh cleanly.',
  },
  {
    groupNoun: 'work shifts', itemNoun: 'hours', unit: 'hours', site: 'the workshop',
    application: 'Project scheduling: shifts × hours per shift.',
    build: (g, p) => `Rebuilding the workshop takes ${g} work ${u(g, 'shift')} of ${p} ${u(p, 'hour')} each. How many hours of work is that?`,
    share: (t, g) => `${t} hours of work are split evenly into ${g} shifts. How long is each shift?`,
    verb: 'The schedule is posted.',
  },
  {
    groupNoun: 'robots', itemNoun: 'motors', unit: 'motors', site: 'the robotics bay',
    application: 'Each robot arm uses one motor per joint.',
    build: (g, p) => `The robotics bay is assembling ${g} ${u(g, 'robot')}. Each robot needs ${p} ${u(p, 'motor')}. How many motors are needed?`,
    share: (t, g) => `${t} motors are available for ${g} identical robots. How many motors per robot?`,
    verb: 'The robots twitch and power on.',
  },
  {
    groupNoun: 'reactor tanks', itemNoun: 'litres', unit: 'L', site: 'the chemical shed',
    application: 'Chemical engineers total tank capacity to plan a batch.',
    build: (g, p) => `The chemical shed has ${g} reactor ${u(g, 'tank')}, each holding ${p} ${u(p, 'litre')}. What is the total capacity?`,
    share: (t, g) => `${t} litres of solution are divided equally into ${g} tanks. How many litres per tank?`,
    verb: 'The batch is prepared.',
  },
  {
    groupNoun: 'lamp posts', itemNoun: 'lanterns', unit: 'lanterns', site: 'the village road',
    application: 'Lighting layout: posts × lanterns per post.',
    build: (g, p) => `The village road has ${g} lamp ${u(g, 'post')} with ${p} ${u(p, 'lantern')} on each. How many lanterns light the road?`,
    share: (t, g) => `${t} lanterns are mounted evenly on ${g} lamp posts. How many lanterns per post?`,
    verb: 'The road is lit.',
  },
  {
    groupNoun: 'rail carts', itemNoun: 'kilograms of ore', unit: 'kg', site: 'the mine rail',
    application: 'Load planning: carts × mass per cart.',
    build: (g, p) => `${g} rail ${u(g, 'cart leaves', 'carts leave')} the mine, each carrying ${p} ${u(p, 'kilogram')} of ore. How much ore is moved?`,
    share: (t, g) => `${t} kilograms of ore are loaded evenly onto ${g} carts. How much does each cart carry?`,
    verb: 'The ore rolls to the surface.',
  },
];

export const pickScenario = (rng: Rng) => rng.pick(SCENARIOS);
