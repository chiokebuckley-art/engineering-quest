import { describe, expect, it } from 'vitest';
import { startGear, gearLaunch, adoptRemote, gearAnswer, gearNext, type GearState, type GearSetup } from './gear';
import { gearSpotlightId, normalizeGearAvatar, suggestedGearAvatar } from './gearAvatars';
import { createRng } from '../rng';
const setup: GearSetup={selection:{game:'mult',key:'mult:all'},me:'Player',avatarId:'ella',friends:['Friend A','Friend B'],friendAvatars:['ian','myla'],bots:[]};
const game=()=>startGear(setup,{},1000,createRng(42));
describe('Weakest Gear avatars and lighting',()=>{
 it('keeps chosen characters attached to players after randomized seating',()=>{
  const g=game();expect(g.contestants.find(c=>c.id==='me')?.avatarId).toBe('ella');expect(g.contestants.find(c=>c.id==='friend-1')?.avatarId).toBe('ian');expect(g.contestants.find(c=>c.id==='friend-2')?.avatarId).toBe('myla');
 });
 it('defaults old saves and invalid network values to Engineer',()=>{
  for(const value of [undefined,null,'not-an-avatar','../../secret',{},1])expect(normalizeGearAvatar(value)).toBe('engineer');
 });
 it('moves spotlight when the next question begins and keeps it during feedback',()=>{
  const g=game(),id=g.contestants[g.turn].id;expect(gearSpotlightId(g)).toBe(id);
  const feedback=gearAnswer(g,true);expect(gearSpotlightId(feedback)).toBe(id);
  const next=gearNext(feedback,{},1100,createRng(7));expect(gearSpotlightId(next)).not.toBe(id);expect(gearSpotlightId(next)).toBe(next.contestants[next.turn].id);
 });
 it('keeps final feedback on the player who just answered, then follows the next finalist',()=>{
  const g=game();const [a,b]=g.contestants.map(c=>c.id);const f:GearState={...g,phase:'final',final:{players:[a,b],asked:{[a]:0,[b]:0},score:{[a]:0,[b]:0},current:a,suddenDeath:false,history:[]}};
  const feedback=gearAnswer(f,true);expect(feedback.final?.current).toBe(b);expect(gearSpotlightId(feedback)).toBe(a);expect(gearSpotlightId(gearNext(feedback,{},1100,createRng(7)))).toBe(b);
 });
 it('turns off player spotlight during voting, tiebreaks and elimination',()=>{
  for(const phase of ['vote','tiebreak','eliminated','lobby'] as const)expect(gearSpotlightId({...game(),phase})).toBeUndefined();
  const g=game();g.contestants[g.turn].out=1;expect(gearSpotlightId(g)).toBeUndefined();
 });
 it('lights the winner after the game',()=>{const g=game();expect(gearSpotlightId({...g,phase:'over',winnerId:g.contestants[1].id})).toBe(g.contestants[1].id);});
 it('preserves online avatar choices through host launch and guest state adoption',()=>{
  const host=startGear({...setup,online:{roomCode:'TEST',isHost:true,myId:'p-host'}},{},1000);
  expect(host.online?.lobby[0].avatarId).toBe('ella');
  host.online!.lobby.push({id:'p-ian',name:'Guest',avatarId:'ian'},{id:'p-myla',name:'Guest Two',avatarId:'myla'});
  const launched=gearLaunch(host,{},1000,createRng(2));expect(launched.contestants.find(c=>c.id==='p-ian')?.avatarId).toBe('ian');
  const guest=startGear({...setup,avatarId:'ian',online:{roomCode:'TEST',isHost:false,myId:'p-ian'}},{},1000);
  const adopted=adoptRemote(guest,launched);expect(adopted.contestants.find(c=>c.isMe)?.avatarId).toBe('ian');expect(adopted.online?.myAvatarId).toBe('ian');expect(gearSpotlightId(adopted)).toBe(gearSpotlightId(launched));
 });
});

it('suggests the named child while preserving unknown names as Engineer',()=>{expect(suggestedGearAvatar(' Ella ')).toBe('ella');expect(suggestedGearAvatar('MYLA')).toBe('myla');expect(suggestedGearAvatar('Ian')).toBe('ian');expect(suggestedGearAvatar('Explorer')).toBe('engineer');});

it('accepts Mom and Dad in setup and remote state',()=>{for(const id of ['mom','dad'] as const){expect(normalizeGearAvatar(id)).toBe(id);expect(suggestedGearAvatar(id.toUpperCase())).toBe(id);const g=startGear({...setup,avatarId:id},{},1000,createRng(42));expect(g.contestants.find(c=>c.id==='me')?.avatarId).toBe(id);}});
