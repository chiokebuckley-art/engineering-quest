import { useGame } from '../store';
import { BOND_TARGETS } from '../../engine/curriculum/skills';
import { skillMastery } from '../../engine/mastery/MasteryEngine';

/** Pick the number-bond target (make 5, 10, 15 … 100), as in Arcade practice. Shows mastery per target. */
export function BondPicker({ value, onChange }: { value: number; onChange: (t: number) => void }) {
  const { state, play } = useGame();
  const now = Date.now();
  return (
    <div className="bond-picker">
      <div className="small muted" style={{ margin: '8px 0 4px' }}>Make the number: to 20 every number counts, past 20 the bonds go by fives.</div>
      <div className="bond-grid">
        {BOND_TARGETS.map((t) => {
          const m = Math.round(skillMastery(`bonds.${t}`, state.mastery, now));
          return (
            <button key={t} className={`btn bond ${value === t ? 'primary' : 'ghost'}`} onClick={() => { play('click'); onChange(t); }} title={`Make ${t}: ${m}% mastered`} aria-pressed={value === t}>
              <b>{t}</b><small>{m}%</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
