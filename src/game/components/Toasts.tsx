import { useEffect } from 'react';
import { useGame } from '../store';
import { Icon } from './ui';

const SOUND: Record<string, import('../../engine/sound/SoundEngine').SoundCue | undefined> = {
  level: 'level-up', quest: 'quest', achievement: 'fanfare', item: 'coin', unlock: 'unlock', mastery: 'combo', xp: undefined, info: undefined,
};

export function Toasts() {
  const { state, dispatch, play } = useGame();
  const first = state.toasts[0];
  const last = state.toasts[state.toasts.length - 1];
  useEffect(() => {
    if (!last) return;
    const cue = SOUND[last.kind];
    if (cue) play(cue);
  }, [last?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!first) return;
    const t = setTimeout(() => dispatch({ type: 'DISMISS_TOAST', id: first.id }), 2400);
    return () => clearTimeout(t);
  }, [first, dispatch]);
  return (
    <div className="toasts">
      {state.toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dispatch({ type: 'DISMISS_TOAST', id: t.id })}>
          {t.icon && <Icon name={t.icon} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
