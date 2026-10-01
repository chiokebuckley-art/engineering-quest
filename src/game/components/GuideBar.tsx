import { useGame } from '../store';
import { nextStep } from '../../engine/state/guide';
import { Icon } from './ui';

/** The one big "do this next" button. Shown at the top of every scene. */
export function GuideBar() {
  const { state, dispatch, play } = useGame();
  if (!state.character) return null;
  const step = nextStep(state);
  return (
    <div className="guide">
      <div className="guide-label">NEXT</div>
      <button className="guide-btn" onClick={() => { play('open'); dispatch(step.action); }}>
        <Icon name={step.icon} className="lg" />
        <span className="guide-text"><b>{step.label}</b><small>{step.hint}</small></span>
        <span className="guide-go">▶</span>
      </button>
    </div>
  );
}
