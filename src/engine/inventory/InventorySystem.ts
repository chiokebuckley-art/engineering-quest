import type { EquipSlot, InventoryState, ItemEffect, ItemId } from '../types';
import { itemById } from './items';

export function emptyInventory(): InventoryState {
  return { items: {}, equipped: {} };
}

export function addItem(inv: InventoryState, itemId: ItemId, qty = 1): InventoryState {
  return { ...inv, items: { ...inv.items, [itemId]: (inv.items[itemId] ?? 0) + qty } };
}

export function removeItem(inv: InventoryState, itemId: ItemId, qty = 1): InventoryState {
  const have = inv.items[itemId] ?? 0;
  if (have < qty) return inv;
  const items = { ...inv.items };
  if (have - qty <= 0) delete items[itemId];
  else items[itemId] = have - qty;
  return { ...inv, items };
}

export function hasItem(inv: InventoryState, itemId: ItemId, qty = 1): boolean {
  return (inv.items[itemId] ?? 0) >= qty;
}

export function equip(inv: InventoryState, itemId: ItemId): InventoryState {
  const def = itemById(itemId);
  if (!def || def.kind !== 'equipment' || !def.slot || !hasItem(inv, itemId)) return inv;
  return { ...inv, equipped: { ...inv.equipped, [def.slot]: itemId } };
}

export function unequip(inv: InventoryState, slot: EquipSlot): InventoryState {
  const equipped = { ...inv.equipped };
  delete equipped[slot];
  return { ...inv, equipped };
}

/** Sum of all effects currently equipped. */
export function equippedEffects(inv: InventoryState): ItemEffect[] {
  return Object.values(inv.equipped)
    .map((id) => (id ? itemById(id) : undefined))
    .flatMap((d) => d?.effects ?? []);
}

export function bonus(inv: InventoryState, type: 'damage-bonus' | 'xp-bonus'): number {
  return equippedEffects(inv).reduce((a, e) => (e.type === type ? a + e.percent : a), 0);
}

export function flat(inv: InventoryState, type: 'hint-charges' | 'shield'): number {
  return equippedEffects(inv).reduce((a, e) => (e.type === type ? a + e.amount : a), 0);
}
