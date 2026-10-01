import type { ItemDef, ItemId } from '../types';
import { asset } from '../../assets';

const icon = (f: string) => asset(`/assets/icons/${f}.svg`);

export const ITEMS: ItemDef[] = [
  // consumables
  { id: 'repair-kit', name: 'Repair Kit', description: 'Restores 40 health. Bandages and brass patches.', icon: icon('repair'), kind: 'consumable', rarity: 'common', effects: [{ type: 'heal', amount: 40 }], value: 15 },
  { id: 'focus-tonic', name: 'Focus Tonic', description: 'A clear-headed brew. Adds one free hint charge for the next battle.', icon: icon('potion'), kind: 'consumable', rarity: 'uncommon', effects: [{ type: 'hint-charges', amount: 1 }], value: 25 },
  { id: 'energy-cell', name: 'Energy Cell', description: 'Restores 20 energy.', icon: icon('energy'), kind: 'consumable', rarity: 'common', effects: [{ type: 'energy', amount: 20 }], value: 15 },
  // materials
  { id: 'iron-bolt', name: 'Iron Bolt', description: 'Standard fastener. Bridges, benches and machines all need them.', icon: icon('bolt'), kind: 'material', rarity: 'common', value: 2 },
  { id: 'copper-gear', name: 'Copper Gear', description: 'A small precision gear salvaged from the mines.', icon: icon('cog'), kind: 'material', rarity: 'common', value: 4 },
  { id: 'ore-crystal', name: 'Ore Crystal', description: 'A glowing crystal that stores mathematical energy.', icon: icon('crystal'), kind: 'material', rarity: 'uncommon', value: 12 },
  { id: 'timber', name: 'Timber Beam', description: 'Seasoned hardwood for structures.', icon: icon('ruler'), kind: 'material', rarity: 'common', value: 3 },
  { id: 'brass-plate', name: 'Brass Plate', description: 'Polished plate for precision instruments.', icon: icon('shield'), kind: 'material', rarity: 'uncommon', value: 10 },
  // equipment
  { id: 'apprentice-goggles', name: 'Apprentice Goggles', description: 'See the structure of a problem more clearly. +1 hint charge per battle.', icon: icon('goggles'), kind: 'equipment', slot: 'head', rarity: 'common', effects: [{ type: 'hint-charges', amount: 1 }], value: 40 },
  { id: 'brass-calipers', name: 'Brass Calipers', description: 'Precision tool. +10% damage from correct answers.', icon: icon('calipers'), kind: 'equipment', slot: 'tool', rarity: 'uncommon', effects: [{ type: 'damage-bonus', percent: 10 }], value: 80 },
  { id: 'surveyor-hammer', name: "Surveyor's Hammer", description: 'A heavy tool. +20% damage from correct answers.', icon: icon('hammer'), kind: 'equipment', slot: 'tool', rarity: 'rare', effects: [{ type: 'damage-bonus', percent: 20 }], value: 160 },
  { id: 'miners-gloves', name: "Miner's Gloves", description: 'Grip. Absorbs 5 damage per battle.', icon: icon('gloves'), kind: 'equipment', slot: 'hands', rarity: 'common', effects: [{ type: 'shield', amount: 5 }], value: 40 },
  { id: 'iron-boots', name: 'Iron-shod Boots', description: 'Steady footing. Absorbs 10 damage per battle.', icon: icon('boots'), kind: 'equipment', slot: 'feet', rarity: 'uncommon', effects: [{ type: 'shield', amount: 10 }], value: 70 },
  { id: 'scholars-charm', name: "Scholar's Charm", description: 'A brass pendant etched with an array of dots. +15% XP.', icon: icon('medal'), kind: 'equipment', slot: 'charm', rarity: 'rare', effects: [{ type: 'xp-bonus', percent: 15 }], value: 150 },
  // artifacts / keys
  { id: 'lost-ledger', name: 'The Lost Ledger', description: 'An ancient tally book. Its pages show that 12 rows of 12 was once called a "gross".', icon: icon('book'), kind: 'artifact', rarity: 'rare', value: 0 },
  { id: 'power-core-mult', name: 'Multiplication Power Core', description: 'The first core of the Mathematical Engine, won from the Dragon.', icon: icon('energy'), kind: 'artifact', rarity: 'epic', value: 0 },
  { id: 'forge-key', name: 'Forge Key', description: "Opens the gate to the Dragon's Forge.", icon: icon('unlock'), kind: 'key', rarity: 'rare', value: 0 },
];

const idx = new Map(ITEMS.map((i) => [i.id, i]));
export const itemById = (id: ItemId) => idx.get(id);
