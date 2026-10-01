import { GEAR_AVATARS, normalizeGearAvatar, type GearAvatarId } from '../../engine/state/gearAvatars';
export const gearAsset = (file: string) => `${import.meta.env.BASE_URL}assets/weakest-gear/${file}`;
export const avatarLabel = (id: GearAvatarId) => id === 'engineer' ? 'Engineer' : id[0].toUpperCase() + id.slice(1);
export function GearAvatarPicker({ value, onChange, label, compact = false }: { value: GearAvatarId; onChange: (id: GearAvatarId) => void; label: string; compact?: boolean }) {
  if (compact) return <label className="small">{label}<select className="text" value={value} onChange={e => onChange(normalizeGearAvatar(e.target.value))}>{GEAR_AVATARS.map(id => <option key={id} value={id}>{avatarLabel(id)}</option>)}</select></label>;
  return <fieldset className="gear-avatar-picker"><legend>{label}</legend><div className="gear-avatar-options">{GEAR_AVATARS.map(id => <button type="button" key={id} aria-pressed={id === value} className={id === value ? 'selected' : ''} onClick={() => onChange(id)}>{id === 'engineer' ? <span className="gear-default-avatar" aria-hidden="true">⚙</span> : <img src={gearAsset(`${id}.jpg`)} alt="" />}<span>{avatarLabel(id)}</span></button>)}</div></fieldset>;
}
