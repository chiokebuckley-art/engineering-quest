import { useGame } from '../store';
import { ITEMS, itemById } from '../../engine/inventory/items';
import { Icon, Panel } from '../components/ui';
import type { EquipSlot } from '../../engine/types';
import { SPECIALIZATIONS } from '../../content/npcs';

const SLOTS: EquipSlot[] = ['tool', 'head', 'hands', 'feet', 'charm'];

export function InventoryScreen() {
  const { state, dispatch, play } = useGame();
  const inv = state.inventory;
  const c = state.character!;
  const owned = ITEMS.filter((i) => (inv.items[i.id] ?? 0) > 0);
  const groups = ['consumable', 'equipment', 'material', 'artifact', 'key'] as const;
  return (
    <div className="screen-scroll">
      <div className="container stack">
        <div className="grid-2">
          <Panel title="Character" icon="helmet">
            <div className="row" style={{ gap: 14 }}>
              <img src={c.avatar} alt="" style={{ width: 96, height: 96, borderRadius: 16, border: '2px solid var(--brass)' }} />
              <div className="stack" style={{ gap: 2, flex: 1 }}>
                <b style={{ fontFamily: 'var(--font-display)' }}>{c.name}</b>
                <span className="small muted">{c.title} · Level {c.level}</span>
                <div className="list-row"><span>Intelligence</span><b>{c.intelligence}</b></div>
                <div className="list-row"><span>Engineering skill</span><b>{c.engineeringSkill}</b></div>
                <div className="list-row"><span>Specialization</span>
                  <select value={c.specialization} onChange={(e) => dispatch({ type: 'SET_SPECIALIZATION', specialization: e.target.value as never })} style={{ background: '#050912', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 6, padding: '2px 6px' }}>
                    {SPECIALIZATIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <h4 style={{ marginTop: 12 }}>Equipment</h4>
            {SLOTS.map((slot) => {
              const id = inv.equipped[slot];
              const def = id ? itemById(id) : undefined;
              return (
                <div key={slot} className="list-row">
                  <span className="muted" style={{ textTransform: 'capitalize', width: 60 }}>{slot}</span>
                  <span style={{ flex: 1 }}>{def ? <><Icon name={def.icon} /> {def.name} <span className="small muted">— {def.description}</span></> : <span className="muted">empty</span>}</span>
                  {def && <button className="btn small ghost" onClick={() => dispatch({ type: 'UNEQUIP', slot })}>Remove</button>}
                </div>
              );
            })}
          </Panel>
          <Panel title="Inventory" icon="backpack" right={<span className="chip">{owned.reduce((a, i) => a + (inv.items[i.id] ?? 0), 0)} items</span>}>
            {owned.length === 0 && <p className="small muted">Your pack is empty. Creatures in the mines drop bolts, gears and crystals.</p>}
            {groups.map((g) => {
              const items = owned.filter((i) => i.kind === g);
              if (!items.length) return null;
              return (
                <div key={g} style={{ marginBottom: 10 }}>
                  <h4>{g}s</h4>
                  <div className="stack" style={{ gap: 6 }}>
                    {items.map((i) => (
                      <div key={i.id} className={`item-card ${i.rarity}`}>
                        <Icon name={i.icon} />
                        <div style={{ flex: 1 }}><b>{i.name}</b> <span className="qty">×{inv.items[i.id]}</span><div className="small muted">{i.description}</div></div>
                        {i.kind === 'consumable' && <button className="btn small" onClick={() => { play('click'); dispatch({ type: 'USE_ITEM', itemId: i.id }); }}>Use</button>}
                        {i.kind === 'equipment' && inv.equipped[i.slot!] !== i.id && <button className="btn small" onClick={() => { play('click'); dispatch({ type: 'EQUIP', itemId: i.id }); }}>Equip</button>}
                        {i.kind === 'equipment' && inv.equipped[i.slot!] === i.id && <span className="chip ok">Equipped</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </Panel>
        </div>
      </div>
    </div>
  );
}
