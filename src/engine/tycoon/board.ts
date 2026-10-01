import { lab, unit } from '../label';
/**
 * Engine City Tycoon: a property-trading board where every money move is a maths problem. The eight colour
 * groups are the app's regions in learning order, so the expensive side of the board is the harder maths.
 */

export type Level = 'junior' | 'explorer' | 'tycoon';
export const LEVELS: Record<Level, { name: string; about: string; start: number }> = {
  junior: { name: 'Junior', about: 'Adding and subtracting within 100, doubles and halves. Rent is base + 10 per workshop.', start: 1000 },
  explorer: { name: 'Explorer', about: 'Times tables, division, fractions, decimals and percentages. Rent grows with square numbers.', start: 1500 },
  tycoon: { name: 'Tycoon', about: 'Percentage change, ratios, equations and trigonometry, plus 5% bank interest every lap.', start: 1500 },
};

export type GroupId = 'brown' | 'lblue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'dblue';
export interface Group { id: GroupId; name: string; color: string; topic: Record<Level, string>; workshop: number }
export const GROUPS: Record<GroupId, Group> = {
  brown: { id: 'brown', name: 'Arithmetic Village', color: '#8a5a2b', workshop: 50, topic: { junior: 'Adding within 20', explorer: 'Adding and subtracting', tycoon: 'Negative numbers and order of operations' } },
  lblue: { id: 'lblue', name: 'Multiplication Mines', color: '#7cc4e8', workshop: 50, topic: { junior: 'Adding within 50', explorer: 'Times tables', tycoon: 'Factors, primes and bigger products' } },
  pink: { id: 'pink', name: 'Division Dungeon', color: '#d9559b', workshop: 100, topic: { junior: 'Taking away within 50', explorer: 'Division with remainders', tycoon: 'Long division' } },
  orange: { id: 'orange', name: 'Fraction Forest', color: '#f08a24', workshop: 100, topic: { junior: 'Doubles and halves', explorer: 'Fractions of amounts', tycoon: 'Adding and comparing fractions' } },
  red: { id: 'red', name: 'Decimal Docks', color: '#d93a3a', workshop: 150, topic: { junior: 'Adding within 100', explorer: 'Decimals and percentages', tycoon: 'Percentage change' } },
  yellow: { id: 'yellow', name: 'Ratio Ridge', color: '#f2c230', workshop: 150, topic: { junior: 'Taking away within 100', explorer: 'Ratios and scale', tycoon: 'Sharing in a ratio' } },
  green: { id: 'green', name: 'Algebra Heights', color: '#2f9e5b', workshop: 200, topic: { junior: 'Tens and ones', explorer: 'One-step equations', tycoon: 'Two-step equations' } },
  dblue: { id: 'dblue', name: 'Trig Mountains', color: '#2b4fa8', workshop: 200, topic: { junior: 'Counting in 2s, 5s and 10s', explorer: 'Squares and square roots', tycoon: 'Pythagoras and trigonometry' } },
};

export type SpaceKind = 'start' | 'prop' | 'rail' | 'util' | 'puzzle' | 'chest' | 'tax' | 'cell' | 'park' | 'gocell';
export interface Space { i: number; kind: SpaceKind; name: string; group?: GroupId; price?: number; text?: string }

const P = (name: string, group: GroupId, price: number): Omit<Space, 'i'> => ({ kind: 'prop', name, group, price });
const RAW: Omit<Space, 'i'>[] = [
  { kind: 'start', name: 'Start Gate', text: 'Pass it to collect 200 gears.' },
  P('Tally Lane', 'brown', 60),
  { kind: 'chest', name: 'Workshop Chest' },
  P('Place-Value Row', 'brown', 60),
  { kind: 'tax', name: 'Toll Bridge', text: 'Pay 10% of your gears, rounded to the nearest 10.' },
  { kind: 'rail', name: 'Plus Line', price: 200 },
  P('Times-Table Tunnel', 'lblue', 100),
  { kind: 'puzzle', name: 'Puzzle' },
  P('Array Shaft', 'lblue', 100),
  P('Factor Vein', 'lblue', 120),
  { kind: 'cell', name: 'Error Book Cell', text: 'Just visiting is safe.' },
  P('Remainder Hall', 'pink', 140),
  { kind: 'util', name: 'Power Plant', price: 150 },
  P('Long-Division Stair', 'pink', 140),
  P('Quotient Keep', 'pink', 160),
  { kind: 'rail', name: 'Minus Line', price: 200 },
  P('Half Hollow', 'orange', 180),
  { kind: 'chest', name: 'Workshop Chest' },
  P('Three-Quarter Grove', 'orange', 180),
  P('Common Denominator Glade', 'orange', 200),
  { kind: 'park', name: 'Ledger Park', text: 'Taxes go in the park jar. Land here and say how much is inside to take it.' },
  P('Tenths Pier', 'red', 220),
  { kind: 'puzzle', name: 'Puzzle' },
  P('Hundredths Wharf', 'red', 220),
  P('Percent Point', 'red', 240),
  { kind: 'rail', name: 'Times Line', price: 200 },
  P('Ratio Road', 'yellow', 260),
  P('Proportion Pass', 'yellow', 260),
  { kind: 'util', name: 'Water Works', price: 150 },
  P('Scale Model Summit', 'yellow', 280),
  { kind: 'gocell', name: 'Go to the Error Book', text: 'Go straight to the Error Book Cell. Do not pass the Start Gate.' },
  P('Variable Villa', 'green', 300),
  P('Balance Boulevard', 'green', 300),
  { kind: 'chest', name: 'Workshop Chest' },
  P('Equation Estate', 'green', 320),
  { kind: 'rail', name: 'Divide Line', price: 200 },
  { kind: 'puzzle', name: 'Puzzle' },
  P('Pythagoras Peak', 'dblue', 350),
  { kind: 'tax', name: 'Luxury Levy', text: 'Pay 75 gears.' },
  P('Sine Summit', 'dblue', 400),
];
export const SPACES: Space[] = RAW.map((s, i) => ({ ...s, i }));
export const CELL = 10;
export const GO_BONUS = 200;
export const MAX_WORKSHOPS = 4; // the fourth is the Engine Hall
export const groupSpaces = (g: GroupId) => SPACES.filter((s) => s.group === g).map((s) => s.i);
export const buyable = (s: Space) => s.kind === 'prop' || s.kind === 'rail' || s.kind === 'util';

/** Base rent for a street: about a tenth of its price. */
export function baseRent(level: Level, price: number): number {
  if (level === 'junior') return Math.round(price / 10);
  return Math.round((price / 10) * (price >= 300 ? 0.9 : 0.8));
}

/** A rent the payer works out, with the sum shown the way the level teaches it. Numbers carry word labels (label.ts). */
export interface RentCalc { amount: number; expr: string; steps: string[] }

export function streetRent(level: Level, price: number, workshops: number, fullSet: boolean): RentCalc {
  const b = baseRent(level, price);
  if (workshops === 0) {
    if (fullSet) return { amount: b * 2, expr: `${b} (base rent) × 2 (full set)`, steps: [`The owner has the whole colour set, so rent is doubled.`, `${b} (base rent) × 2 (full set) = ${b * 2} (rent in gears)`] };
    return { amount: b, expr: `${b} (base rent)`, steps: [`Rent with no workshops is the base rent: ${b} (rent in gears).`] };
  }
  const shops = lab(workshops, unit(workshops, 'workshop'));
  if (level === 'junior') {
    const amt = b + 10 * workshops;
    return { amount: amt, expr: `${b} (base rent) + 10 (gears per workshop) × ${shops}`, steps: [`Each workshop adds 10 gears of rent.`, `10 (gears per workshop) × ${shops} = ${10 * workshops} (workshop rent)`, `${b} (base rent) + ${10 * workshops} (workshop rent) = ${amt} (rent in gears)`] };
  }
  const k = workshops + 1;
  return { amount: b * k * k, expr: `${b} (base rent) × (${shops} + 1 (street))²`, steps: [`Count the street as 1 level and each workshop as 1 more, then square the levels.`, `${shops} + 1 (street) = ${k} (levels)`, `${k}² = ${k} (levels) × ${k} (levels) = ${k * k} (rent multiplier)`, `${b} (base rent) × ${k * k} (rent multiplier) = ${b * k * k} (rent in gears)`] };
}
const LINES = ['one line', 'two lines', 'three lines', 'four lines'];
export function railRent(owned: number): RentCalc {
  const amt = 25 * 2 ** (owned - 1);
  const chain = [25]; for (let i = 1; i < owned; i++) chain.push(chain[i - 1] * 2);
  return { amount: amt, expr: owned === 1 ? '25 (rent for one line)' : `25 (rent for one line) doubled ${owned - 1} time${owned > 2 ? 's' : ''}`, steps: [owned === 1 ? 'One line owned: rent is 25 gears.' : `Rent doubles for each extra line: ${chain.map((x, i) => lab(x, LINES[i] ?? 'lines')).join(' → ')}`] };
}
export function utilRent(diceTotal: number, both: boolean): RentCalc {
  const k = both ? 10 : 4;
  return { amount: diceTotal * k, expr: `${diceTotal} (dice total) × ${k} (gears per dice point)`, steps: [`Your dice total was ${diceTotal}. ${both ? 'The owner has both utilities, so rent is 10 gears for each point on the dice.' : 'One utility: rent is 4 gears for each point on the dice.'}`, `${diceTotal} (dice total) × ${k} (gears per dice point) = ${diceTotal * k} (rent in gears)`] };
}
/** Toll Bridge: 10% of your gears to the nearest 10 (Junior pays a flat 50). */
export function tollTax(level: Level, gears: number): RentCalc {
  if (level === 'junior') return { amount: 50, expr: '50', steps: ['Junior toll is always 50 gears.'] };
  const ten = gears / 10; const amt = Math.round(ten / 10) * 10;
  return { amount: amt, expr: `10% of ${gears} (your gears), to the nearest 10`, steps: [`10% means divide by 10: ${gears} (your gears) ÷ 10 = ${Number.isInteger(ten) ? ten : ten.toFixed(1)} (tenth of your gears)`, `To the nearest 10: ${amt} (toll in gears)`] };
}
export const LUXURY = 75;
/** Mortgage for half the price; buying it back costs that plus 10%. */
export const mortgageValue = (price: number) => price / 2;
export const unmortgageCost = (price: number) => Math.round((price / 2) * 1.1);

/** Chance of each dice total with two dice, out of 36. */
export const DICE_WAYS: Record<number, number> = Object.fromEntries(Array.from({ length: 11 }, (_, k) => [k + 2, 6 - Math.abs(5 - k)]));
