import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { GearAvatarPicker, avatarLabel, gearAsset } from '../components/GearAvatarPicker';
import { suggestedGearAvatar, type GearAvatarId } from '../../engine/state/gearAvatars';
import { CATEGORIES, LABELS, RULES, allowedCategories, emptyDiceData, groupFact, fractionFact, mathRight, needsSum, needsGroup, scoreFor, totals, diceSteps, type Category, type DiceEvent, type Mode } from '../../engine/state/diceWorkshop';
import { labeled, LabelKey } from '../components/Labeled';
import { labn } from '../../engine/label';
import './diceWorkshop.css';
import { DiceTableScreen, DiceOnlineBox } from './DiceTableScreen';
const Scene=lazy(()=>import('../components/DiceWorkshopScene'));
const pipLocations:Record<number,number[]>={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
export function DiceWorkshopScreen(){
 const {state}=useGame();
 return state.diceTable?<DiceTableScreen t={state.diceTable} />:<DiceSolo />;
}
function DiceSolo(){
 const {state,dispatch,play}=useGame();const data=state.diceWorkshop??emptyDiceData(),r=data.run;
 const [mode,setMode]=useState<Mode>('both'),[avatar,setAvatar]=useState<GearAvatarId>(state.diceWorkshop?.avatar??suggestedGearAvatar(state.character?.name??''));
 const [sum,setSum]=useState(''),[group,setGroup]=useState(''),[flat,setFlat]=useState(false),[zero,setZero]=useState<Category|null>(null),[restart,setRestart]=useState(false);
 const answer=useRef<HTMLInputElement>(null);
 const send=(event:DiceEvent)=>dispatch({type:'DICE_EVENT',event});
 useEffect(()=>{if(zero)document.querySelector('.dice-confirm')?.scrollIntoView?.({behavior:state.settings.reducedMotion?'auto':'smooth',block:'center'});},[zero,state.settings.reducedMotion]);
 useEffect(()=>{setSum('');setGroup('');setZero(null);},[r?.revision,r?.rolls]);
 const score=totals(r?.card??{},r?.bonus??0),fact=groupFact(r?.dice??[1,2,3,4,5]);
 const open=r?allowedCategories(r):[];const ready=!!r?.rolls&&!r.finished;const done=Object.keys(r?.card??{}).length;
 function record(category:Category){play(done===12?'victory':'coin');send({kind:'score',category});setZero(null);}
 // The app shell does not scroll; screens scroll inside .screen-scroll.
 return <div className="screen-scroll"><section className="dice-workshop" aria-labelledby="dice-title">
  <header className="dice-header"><div><span className="dice-eyebrow">ENG. QUEST · MATH ARCADE</span><h1 id="dice-title">Dice Workshop</h1></div><button className="btn small" onClick={()=>dispatch({type:'NAVIGATE',screen:'arcade'})}>{r&&!r.finished?'Save & leave':'Back to Arcade'}</button></header>
  {!r?<>
   <p className="dice-intro">Five dice. Thirteen choices. Build your score with addition, equal groups, fractions or ratios—at your own pace.</p>
   <img className="dice-preview" src={`${import.meta.env.BASE_URL}assets/dice-workshop/preview.png`} alt="Dice Workshop: a teal dice table with a math screen and brass-trimmed scorecard" />
   <div className="dice-setup"><GearAvatarPicker value={avatar} onChange={setAvatar} label="Choose your player" />
    <label className="dice-mode">Practice<select value={mode} onChange={e=>setMode(e.target.value as Mode)}><option value="sum">Addition · add all five dice</option><option value="groups">Multiplication · equal groups</option><option value="both">Both · addition and multiplication</option><option value="fractions">Fractions · what fraction of the dice match</option><option value="ratios">Ratios · even dice to odd dice</option></select></label>
    <button className="btn primary" onClick={()=>{play('open');send({kind:'start',mode,avatar});}}>Start game</button><p className="dice-muted">Solo practice · No timer · Progress saved with your profile</p>
   </div>
   <DiceOnlineBox mode={mode} avatar={avatar} />
  </>:<>
   <div className="dice-summary"><span className="dice-player">{data.avatar==='engineer'?<span aria-hidden="true">⚙</span>:<img src={gearAsset(`${data.avatar}.jpg`)} alt="" />}{avatarLabel(data.avatar)}</span><span>{r.finished?'Complete':`Turn ${done+1} of 13`}</span><strong>Total {score.total}</strong><button className="dice-link" aria-pressed={flat} onClick={()=>setFlat(!flat)}>{flat?'Show 3D table':'Use simple view'}</button></div>
   {!flat&&<Suspense fallback={<div className="dice-scene-placeholder">Loading your table…</div>}><Scene run={r} reducedMotion={state.settings.reducedMotion} /></Suspense>}
   {r.finished?<div className="dice-finish"><span className="dice-eyebrow">SCORECARD COMPLETE</span><h2>{score.total} points</h2><p>You filled all 13 categories. Best score: {data.best}.</p><button className="btn primary" onClick={()=>send({kind:'clear'})}>Play again</button></div>:<>
    <div className="dice-turn">
     <div className="dice-dice" role="group" aria-label="Your five dice: tap to hold or release">{r.dice.map((value,i)=><button key={i} className={`dice-die ${r.held[i]?'held':''}`} aria-label={`Die ${i+1}: ${r.rolls?value:'not rolled'}, ${r.held[i]?'held':'not held'}`} aria-pressed={r.held[i]} disabled={!r.rolls||r.rolls>=3} onClick={()=>{play('click');send({kind:'hold',index:i});}}><span className="dice-face" aria-hidden="true">{r.rolls?Array.from({length:9},(_,n)=><i key={n} className={pipLocations[value].includes(n)?'pip':''}/>):<b>?</b>}</span><span>{r.held[i]?'HELD':'HOLD'}</span></button>)}</div>
     <div className="dice-roll-controls"><button className="btn primary" disabled={r.rolls>=3||r.held.every(Boolean)} onClick={()=>{play('build');send({kind:'roll'});}}>{!r.rolls?'Roll five dice':'Roll unheld dice'}</button><span>{3-r.rolls} rolls left</span></div>
     <p className="dice-muted">{r.rolls===3?'All rolls used. Check your math, then pick a score.':r.held.every(Boolean)?'All dice held. Release one to roll again, or check your math.':'You may score after any roll. Held dice stay; the others roll again.'}</p>
    </div>
    {ready&&<form className="dice-math" onSubmit={e=>{e.preventDefault();const right=mathRight(r,sum,group).right;play(right?'correct':'wrong');send({kind:'check',sum,group});}}>
     <span className="dice-eyebrow">BUILD YOUR MATH</span>
     {r.mode==='fractions'&&<label className="dice-equation"><span>What fraction of the dice show {fractionFact(r.dice).value}?</span><input ref={answer} aria-label="Fraction of the dice" inputMode="text" placeholder="?/5" required value={sum} disabled={r.checked} onChange={e=>setSum(e.target.value)} autoComplete="off" /></label>}
     {r.mode==='ratios'&&<label className="dice-equation"><span>Even dice : odd dice =</span><input ref={answer} aria-label="Ratio of even to odd dice" inputMode="text" placeholder="? : ?" required value={sum} disabled={r.checked} onChange={e=>setSum(e.target.value)} autoComplete="off" /></label>}
     {needsSum(r.mode)&&<label className="dice-equation">Dice faces: {r.dice.join(' + ')} = <input ref={answer} aria-label="Total of all five dice" inputMode="numeric" pattern="[0-9]*" required value={sum} disabled={r.checked} onChange={e=>setSum(e.target.value)} autoComplete="off" /> <span className="qty-label">(dice total)</span></label>}
     {needsGroup(r.mode)&&<label className="dice-equation"><span>{fact.count} {fact.count===1?'die':'dice'} showing {fact.value}: {labeled(`${labn(fact.count,'matching die','matching dice')} × ${fact.value} (face value)`)} = </span><input ref={r.mode==='groups'?answer:undefined} aria-label="Equal groups answer" inputMode="numeric" pattern="[0-9]*" required value={group} disabled={r.checked} onChange={e=>setGroup(e.target.value)} autoComplete="off" /> <span className="qty-label">(group total)</span></label>}
     {!r.checked&&<div className="dice-actions"><button className="btn primary" type="submit">Check my math</button><button className="btn" type="button" onClick={()=>send({kind:'reveal'})}>Show the steps</button></div>}
     {r.checked&&<div className="dice-steps"><strong>{r.assisted?'Let’s work it out:':'You’ve got it!'}</strong>{diceSteps(r).map((line,i)=><p key={i}>{labeled(line)}</p>)}<LabelKey /><p>Choose one open category below.</p></div>}
    </form>}
   </>}
   <p className="dice-status" role="status" aria-live="polite">{r.last&&<span>{r.last} </span>}{r.message}</p>
   <div className="dice-scorecard"><div className="dice-score-heading"><h2>Your scorecard</h2><span>{done}/13 filled</span></div>
    {ready&&r.checked&&open.length<CATEGORIES.filter(c=>r.card[c]===undefined).length&&<p className="dice-joker">Five of a kind again! First fill the matching upper category; if it is filled, choose a lower category. {r.card.five===50?'This turn also earns a 100-point bonus.':''}</p>}
    <table><thead><tr><th scope="col">Category</th><th scope="col">Points</th><th scope="col">This turn</th></tr></thead><tbody>{CATEGORIES.map(cat=>{const filled=r.card[cat]!==undefined,points=scoreFor(r.dice,cat,r.card);return <tr key={cat} className={filled?'filled':''}><th scope="row">{LABELS[cat]}<small>{RULES[cat]}</small></th><td>{filled?r.card[cat]:'—'}</td><td>{filled?<span aria-label="Recorded">✓</span>:<button className="btn small" disabled={!ready||!r.checked||!open.includes(cat)} aria-label={`Score ${LABELS[cat]}${ready&&r.checked?`: ${points} points`:''}`} onClick={()=>points===0?setZero(cat):record(cat)}>{ready&&r.checked?`Take ${points}`:'—'}</button>}</td></tr>;})}</tbody></table>
    {zero&&<div className="dice-confirm" role="alert"><p>Record 0 in {LABELS[zero]}? This uses that category for the rest of this game.</p><button className="btn" onClick={()=>record(zero)}>Record zero</button><button className="btn" onClick={()=>setZero(null)}>Keep choosing</button></div>}
    <div className="dice-totals"><span>Upper section: {score.upper}/63</span><span>Upper bonus: {score.upperBonus}</span><span>Extra five-of-a-kind bonuses: {r.bonus}</span><strong>Total: {score.total}</strong></div>
   </div>
   {!r.finished&&<div className="dice-restart">{restart?<><p>Discard this scorecard and start over? Your best score and practice history stay saved.</p><button className="btn" onClick={()=>{send({kind:'clear'});setRestart(false);}}>Discard scorecard</button><button className="btn" onClick={()=>setRestart(false)}>Keep playing</button></>:<button className="dice-link" onClick={()=>setRestart(true)}>Start over</button>}</div>}
  </>}
  <details className="dice-rules"><summary>How to play</summary><ol><li>Roll five dice. Tap any dice to hold them, then roll the others. You get up to three rolls each turn.</li><li>Add the dice or solve the equal-groups fact. Try again after a mistake, or use Show the steps. Help unlocks scoring but does not count as a correct independent answer.</li><li>Choose one unused category. You can take zero when no useful category remains. Fill all 13 to finish.</li></ol><p>Reach 63 points in the upper section for 35 bonus points. Five matching dice score 50. Later five-of-a-kind rolls earn 100 extra only if that first box scored 50. Joker rules guide which category you can use.</p><p>This is untimed solo practice. Use Save & leave to return later on this profile.</p></details>
  <footer className="dice-history">Best: {data.best} · Games completed: {data.games} · Math checks: {data.correct}/{data.attempts} correct</footer>
 </section></div>;
}
