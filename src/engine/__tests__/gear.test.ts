import { describe, it, expect } from 'vitest';
import { startGear, gearBank, gearAnswer, gearNext, gearTimeout, gearVote, gearTiebreak, gearContinue, botTurn, active, byId, CHAIN, chainValue, strength, roundMsFor, type GearState } from '../state/gear';
import { createRng } from '../rng';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';

const setup = { selection: { game: 'mult' as const, key: 'mult:all' }, me: 'Chioke', friends: ['Ava'], bots: [{ level: 'medium' as const }, { level: 'easy' as const }] };

/** Play the current contestant's turn: humans answer as told, bots via botTurn. */
function turn(g: GearState, correct: boolean, bank = false, now = 0): GearState {
  const who = g.contestants[g.turn];
  if (who.bot) { const d = botTurn(g, createRng(1)); g = d.bank ? gearBank(g) : g; g = gearAnswer(g, d.correct); }
  else { if (bank) g = gearBank(g); g = gearAnswer(g, correct); }
  return gearNext(g, {}, now, createRng(2));
}

describe('Weakest Gear', () => {
  it('climbs the chain, banks, drops on a miss, and auto-banks the top', () => {
    let g = startGear(setup, {}, 0, createRng(5));
    expect(g.contestants.length).toBe(4); expect(g.phase).toBe('question'); expect(g.roundMs).toBe(90_000);
    // Force a human turn and climb.
    const meIdx = g.contestants.findIndex((c) => c.isMe); g = { ...g, turn: meIdx };
    g = gearAnswer(g, true); expect(g.chain).toBe(1); expect(g.phase).toBe('feedback');
    g = { ...gearNext(g, {}, 0, createRng(1)), turn: meIdx };
    g = gearAnswer(g, true); expect(g.chain).toBe(2); expect(chainValue(g.chain)).toBe(20);
    g = { ...gearNext(g, {}, 0, createRng(1)), turn: meIdx };
    g = gearBank(g); expect(g.pot).toBe(20); expect(g.chain).toBe(0); expect(g.bankedThisTurn).toBe(20);
    expect(gearBank(g)).toBe(g); // once per turn
    g = gearAnswer(g, false); expect(byId(g, 'me').round.wrong).toBe(1); expect(byId(g, 'me').round.banked).toBe(20);
    // Climb the whole chain: the top banks automatically.
    g = { ...gearNext(g, {}, 0, createRng(1)), turn: meIdx, chain: CHAIN.length - 1 };
    g = gearAnswer(g, true); expect(g.pot).toBe(20 + 1000); expect(g.chain).toBe(0); expect(g.feedback!.text).toContain('Top of the chain');
    // A miss with a live chain loses it.
    g = { ...gearNext(g, {}, 0, createRng(1)), turn: meIdx, chain: 4 };
    g = gearAnswer(g, false); expect(byId(g, 'me').round.lost).toBe(100); expect(g.chain).toBe(0);
  });

  it('runs a whole game: rounds, votes with tiebreak, then a final with a winner', () => {
    let g = startGear(setup, {}, 0, createRng(9));
    let guard = 0; let fb = 0;
    while (g.phase !== 'over' && guard++ < 400) {
      if (g.phase === 'question') { g = turn(g, true, false, 0); if (++fb % 7 === 0) g = gearTimeout(g); }
      else if (g.phase === 'feedback') g = ++fb % 7 === 0 ? gearTimeout(g) : gearNext(g, {}, 0, createRng(3));
      else if (g.phase === 'vote') {
        // end-of-round: the clock is simulated by a timeout call before voting starts
        const v = g.voter!; const target = active(g).find((c) => c.id !== v)!.id; g = gearVote(g, v, target);
      } else if (g.phase === 'tiebreak') g = gearTiebreak(g, g.tie!.candidates[0]);
      else if (g.phase === 'eliminated') g = gearContinue(g, {}, 0, createRng(4));
      else if (g.phase === 'final') { const who = byId(g, g.final!.current); g = gearAnswer(g, who.isMe ? true : who.bot ? botTurn(g, createRng(guard)).correct : false); }
      else if (g.phase === 'finalFeedback') g = gearNext(g, {}, 0, createRng(5));
    }
    expect(g.phase).toBe('over'); expect(g.winnerId).toBeTruthy();
    expect(active(g).length).toBe(2); expect(g.final!.players).toContain(g.winnerId);
    expect(g.contestants.filter((c) => c.out !== undefined).length).toBe(2);
    expect(g.final!.history.length).toBeGreaterThanOrEqual(2);
  });

  it('voting: strongest gear breaks ties, bots vote alone if no humans remain, rounds shrink', () => {
    let g = startGear({ ...setup, friends: [], bots: [{ level: 'hard' }, { level: 'hard' }, { level: 'easy' }] }, {}, 0, createRng(2));
    expect(g.contestants.length).toBe(4);
    g = gearTimeout(g); expect(g.phase).toBe('vote'); expect(g.voter).toBe('me');
    expect(gearVote(g, 'me', 'me')).toBe(g);
    const bots = active(g).filter((c) => c.bot);
    g = gearVote(g, 'me', bots[0].id);
    expect(['eliminated', 'tiebreak']).toContain(g.phase);
    if (g.phase === 'tiebreak') { expect(g.tie!.strongest).toBeTruthy(); g = gearTiebreak(g, g.tie!.candidates[0]); }
    expect(g.phase).toBe('eliminated'); expect(g.eliminated!.sendOff.length).toBeGreaterThan(10);
    g = gearContinue(g, {}, 1000, createRng(3));
    expect(g.round).toBe(2); expect(g.roundMs).toBe(80_000); expect(roundMsFor(9)).toBe(40_000);
    expect(g.contestants.every((c) => c.round.right === 0)).toBe(true);
    // With me voted off, bots resolve the vote on their own.
    const meOut = { ...g, contestants: g.contestants.map((c) => (c.isMe ? { ...c, out: 1 } : c)) };
    const v = gearTimeout(meOut); expect(['eliminated', 'tiebreak']).toContain(v.phase); expect(v.phase).not.toBe('vote');
    expect(strength({ ...g.contestants[0], round: { right: 3, wrong: 0, banked: 50, lost: 0 } })).toBeGreaterThan(strength({ ...g.contestants[0], round: { right: 2, wrong: 0, banked: 500, lost: 0 } }));
    expect(strength({ ...g.contestants[0], round: { right: 2, wrong: 0, banked: 500, lost: 0 } })).toBeGreaterThan(strength({ ...g.contestants[0], round: { right: 2, wrong: 0, banked: 50, lost: 0 } }));
  });

  it('reducer: only the owner trains mastery, bots play through GEAR_BOT, stats and achievements update', () => {
    let s = gameReducer(initialState(), { type: 'CREATE_CHARACTER', name: 'Zed', avatar: 'a', specialization: 'undecided' });
    s = gameReducer(s, { type: 'GEAR_START', setup: { ...setup, me: 'Zed' } });
    expect(s.screen).toBe('gear'); expect(s.gear!.contestants.length).toBe(4);
    let guard = 0; let fb = 0;
    while (s.gear!.phase !== 'over' && guard++ < 600) {
      const g = s.gear!; const cur = g.phase === 'final' || g.phase === 'finalFeedback' ? byId(g, g.final!.current) : g.contestants[g.turn];
      if (g.phase === 'question' || g.phase === 'final') s = cur.bot ? gameReducer(s, { type: 'GEAR_BOT' }) : gameReducer(s, { type: 'GEAR_ANSWER', given: cur.isMe ? String(g.question.answer) : '0' });
      else if (g.phase === 'feedback' || g.phase === 'finalFeedback') s = g.phase === 'feedback' && ++fb % 6 === 0 ? gameReducer(s, { type: 'GEAR_TIMEOUT' }) : gameReducer(s, { type: 'GEAR_NEXT' });
      else if (g.phase === 'vote') s = gameReducer(s, { type: 'GEAR_VOTE', voterId: g.voter!, targetId: active(g).find((c) => c.id !== g.voter && !c.isMe)!.id });
      else if (g.phase === 'tiebreak') s = gameReducer(s, { type: 'GEAR_TIEBREAK', targetId: g.tie!.candidates.find((id) => id !== 'me') ?? g.tie!.candidates[0] });
      else if (g.phase === 'eliminated') s = gameReducer(s, { type: 'GEAR_CONTINUE' });
    }
    expect(s.gear!.phase).toBe('over');
    expect(s.stats.gear.games).toBe(1);
    const mine = s.answers.length; expect(mine).toBeGreaterThan(0);
    expect(s.answers.every((a) => a.context === 'drill')).toBe(true);
    // Ava's (friend) wrong answers never reached the log: answers logged equal the owner's total answers.
    const me = s.gear!.contestants.find((c) => c.isMe)!;
    expect(mine).toBe(me.total.right + me.total.wrong);
    s = gameReducer(s, { type: 'GEAR_EXIT' }); expect(s.gear).toBeNull();
  });
});

describe('Weakest Gear online engine', () => {
  it('votes can arrive in any order, a lobby launches from its roster, and leaving is handled', async () => {
    const { startGear: sg, gearLaunch, gearVote: gv, gearTimeout: gt, gearLeft, adoptRemote, active: act } = await import('../state/gear');
    let g = sg({ selection: { game: 'mult', key: 'mult:all' }, me: 'Host', friends: [], bots: [{ level: 'easy' }], online: { roomCode: 'ABCD', isHost: true, myId: 'p-h' } }, {}, 0, createRng(1));
    expect(g.phase).toBe('lobby'); expect(g.online!.lobby).toEqual([{ id: 'p-h', name: 'Host', avatarId: 'engineer' }]);
    expect(gearLaunch(g, {}, 0, createRng(1))).toBe(g); // only two podiums
    g = { ...g, online: { ...g.online!, lobby: [...g.online!.lobby, { id: 'p-a', name: 'Ava' }, { id: 'p-b', name: 'Ben' }] } };
    g = gearLaunch(g, {}, 0, createRng(2));
    expect(g.phase).toBe('question'); expect(g.contestants.length).toBe(4); expect(g.contestants.find((c) => c.isMe)!.id).toBe('p-h');
    // Guest view of the same state.
    const guest = adoptRemote({ ...g, online: { ...g.online!, isHost: false, myId: 'p-a', myName: 'Ava' } }, g);
    expect(guest.contestants.find((c) => c.isMe)!.id).toBe('p-a'); expect(guest.online!.isHost).toBe(false);
    // Any-order voting.
    g = gt(g); expect(g.phase).toBe('vote');
    g = gv(g, 'p-b', 'p-a'); expect(g.votes['p-b']).toBe('p-a'); expect(g.phase).toBe('vote');
    expect(gv(g, 'p-b', 'p-h')).toBe(g); // already voted
    g = gv(g, 'p-a', 'p-b'); g = gv(g, 'p-h', 'p-b');
    expect(['eliminated', 'tiebreak']).toContain(g.phase);
    // Leaving mid-round moves the turn on; a leaving finalist forfeits.
    let h = gearLaunch({ ...sg({ selection: { game: 'mult', key: 'mult:all' }, me: 'Host', friends: [], bots: [], online: { roomCode: 'ABCD', isHost: true, myId: 'p-h' } }, {}, 0, createRng(3)), online: { roomCode: 'ABCD', isHost: true, myId: 'p-h', myName: 'Host', lobby: [{ id: 'p-h', name: 'Host' }, { id: 'p-a', name: 'Ava' }, { id: 'p-b', name: 'Ben' }, { id: 'p-c', name: 'Cy' }] } }, {}, 0, createRng(4));
    const curBefore = h.contestants[h.turn].id;
    h = gearLeft(h, curBefore);
    expect(h.contestants.find((c) => c.id === curBefore)!.out).toBe(1); expect(h.contestants[h.turn].id).not.toBe(curBefore); expect(h.phase).toBe('question');
    expect(act(h).length).toBe(3);
    h = gearLeft(h, act(h)[0].id); expect(h.phase).toBe('eliminated'); expect(act(h).length).toBe(2);
  });
  it('number bonds use the target picked in setup, all the way up the chain', () => {
    let g = startGear({ ...setup, selection: { game: 'bonds', key: 'bonds:15' } }, {}, 0, createRng(9));
    const meIdx = g.contestants.findIndex((c) => c.isMe);
    for (let k = 0; k < 12; k++) {
      expect(g.question.masterySkillId).toBe('bonds.15');
      g = { ...gearNext(gearAnswer({ ...g, turn: meIdx }, true), {}, 0, createRng(k + 3)), turn: meIdx };
    }
  });
});
