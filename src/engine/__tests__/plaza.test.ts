import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAZA, PLAZA_MATH, PLAZA_PAUSE_MS, checkPlazaEquation, checkPlazaMove, currentPlazaPlayer, endPlazaEarly, findPlazaMoves, initialPlaza, launchPlaza, passPlaza, pausedPlaza, playPlaza, plazaPlacements, plazaResumable, plazaViewFor, rackSize, recordPlaza, restorePlaza, seatsPlaza, sitOutPlaza, startPlaza, botPlaza, undoPlaza, plazaGoalProgress, type PlazaConfig, type PlazaState } from '../state/plaza';
import { initialState } from '../state/initialState';
import { gameReducer } from '../state/reducer';

const blank = () => Array(121).fill(null);
const config = (patch: Partial<PlazaConfig> = {}): PlazaConfig => ({ ...DEFAULT_PLAZA, ...patch });
const check = (eq: string, patch: Partial<PlazaConfig> = {}) => checkPlazaEquation([...eq], config(patch));

describe('Equation Plaza arithmetic and placement', () => {
  it.each(['3+4=7', '7=3+4', '12+8=20', '0+1=1'])('accepts %s', eq => expect(check(eq)).toBeNull());
  it.each(['3+4=8', '07+1=8', '1+1=2=2', '2=2', '2+3×4=14', '1++2=3', '1.5+1=2.5', 'alert(1)'])('rejects %s', eq => expect(check(eq)).not.toBeNull());
  it('enforces selected operations, ranges, tables and exact quotients', () => {
    expect(check('4−2=2')).toContain('operation');
    expect(check('10+11=21')).toContain('20');
    expect(check('4−2=2', { math: 'sub' })).toBeNull();
    expect(check('2−4=2', { math: 'sub' })).toContain('zero');
    expect(check('3×4=12', { math: 'mult', tables: [3] })).toBeNull();
    expect(check('4×3=12', { math: 'mult', tables: [3] })).toBeNull();
    expect(check('4×4=16', { math: 'mult', tables: [3] })).toContain('selected');
    expect(check('12÷3=4', { math: 'div', tables: [3] })).toBeNull();
    expect(check('5÷2=2', { math: 'div' })).toContain('whole');
    expect(check('0÷0=0', { math: 'div' })).toContain('zero');
  });
  it('number bonds accepts target addition and inverse subtraction', () => {
    expect(check('6+4=10', { math: 'bonds' })).toBeNull();
    expect(check('10−6=4', { math: 'bonds' })).toBeNull();
    expect(check('6+3=9', { math: 'bonds' })).toContain('Make 10');
    expect(check('9−6=3', { math: 'bonds' })).toContain('Make 10');
    expect(check('25+25=50', { math: 'bonds', target: 50 })).toBeNull();
    expect(rackSize(config({ math: 'bonds', target: 50 }))).toBe(9);
  });
  it('centers equals, scores once, and disallows reused premium bonuses', () => {
    const rack = [...'3+4=712'];
    const opening = checkPlazaMove(blank(), rack, { start: 57, direction: 'across', tokens: [...'3+4=7'] }, config());
    expect(opening.error).toBeNull(); expect(opening.points).toBe(14);
    expect(checkPlazaMove(blank(), rack, { start: 56, direction: 'across', tokens: [...'3+4=7'] }, config()).error).toContain('center');
    const moves = plazaPlacements(opening.board, [...'7−2=5'], config({ math: 'mixed' }), [...'−2=5911']);
    expect(moves.length).toBeGreaterThan(0);
    const hooked = checkPlazaMove(opening.board, [...'−2=5911'], moves[0], config({ math: 'mixed' }));
    expect(hooked.error).toBeNull(); expect(hooked.used).not.toContain('7');
    expect(checkPlazaMove(opening.board, rack, { start: 57, direction: 'across', tokens: [...'3+4=7'] }, config()).error).toContain('new');
  });
  it('rejects wrong rack counts, wraparound, missing tiles, invalid crossings and disconnected moves', () => {
    expect(checkPlazaMove(blank(), [...'3+4=812'], { start: 57, direction: 'across', tokens: [...'3+4=7'] }, config()).error).toContain('rack');
    expect(checkPlazaMove(blank(), null, { start: 64, direction: 'across', tokens: [...'3+4=7'] }, config()).error).toContain('edge');
    const b = blank(); [...'3+4=7'].forEach((t, i) => b[57 + i] = t);
    expect(checkPlazaMove(b, null, { start: 1, direction: 'across', tokens: [...'2+5=7'] }, config()).error).toContain('Reuse');
    // Parallel equations touch the old plus sign, but create two-character side fragments.
    expect(checkPlazaMove(b, null, { start: 46, direction: 'across', tokens: [...'3+4=7'] }, config()).error).not.toBeNull();
    const crossing = [...b]; crossing[50] = '2';
    expect(checkPlazaMove(crossing, null, { start: 61, direction: 'down', tokens: [...'7−2=5'] }, config({ math: 'mixed' })).error).not.toBeNull();
  });
  it('validates malformed network move payloads without throwing', () => {
    for (const move of [null, {}, { start: 57, direction: 'across', tokens: null }, { start: NaN, direction: 'down', tokens: [] }]) expect(() => checkPlazaMove(blank(), [], move as never, config())).not.toThrow();
  });
  it('anchors builder board tiles to their actual location', () => {
    const b = blank(); [...'3+4=7'].forEach((t, i) => b[57 + i] = t);
    expect(plazaPlacements(b, [...'7−2=5'], config({ math: 'mixed' }), null, [{ offset: 0, cell: 61 }]).length).toBeGreaterThan(0);
    expect(plazaPlacements(b, [...'7−2=5'], config({ math: 'mixed' }), null, [{ offset: 0, cell: 57 }])).toEqual([]);
  });
});

describe('Equation Plaza full games', () => {
  for (const { id } of PLAZA_MATH) it(`${id}: every rack can play, and all players get equal turns`, () => {
    let g = startPlaza({ mode: 'computer', name: 'Learner', config: config({ math: id, range: 100, target: 100, tables: [7, 12], ops: ['+', '−', '×', '÷'], rounds: 5 }) }, 810 + id.length);
    let turns = 0;
    while (g.phase === 'playing' && turns++ < 20) {
      const p = currentPlazaPlayer(g);
      expect(p.rack.length).toBeLessThanOrEqual(rackSize(g.config));
      const moves = findPlazaMoves(g, p.rack, turns);
      expect(moves.length, `rack=${p.rack.join('')} board ${g.boardNumber}`).toBeGreaterThan(0);
      const result = checkPlazaMove(g.board, p.rack, moves[0], g.config); expect(result.error).toBeNull();
      g = p.bot ? botPlaza(g) : playPlaza(g, moves[0]);
    }
    expect(g.phase).toBe('over'); expect(g.players.map(p => p.turns)).toEqual([5, 5]);
    expect(g.players.every(p => p.score > 0)).toBe(true);
  }, 20000);
  it('practice stays untimed; swap and new boards preserve earned points', () => {
    let g = startPlaza({ mode: 'practice', name: 'Learner', config: config() }, 777);
    const m = findPlazaMoves(g, currentPlazaPlayer(g).rack)[0]; g = playPlaza(g, m);
    const score = currentPlazaPlayer(g).score;
    g = passPlaza(g); expect(g.phase).toBe('playing'); expect(currentPlazaPlayer(g).score).toBe(score); expect(currentPlazaPlayer(g).turns).toBe(2);
    g = { ...g, board: Array(121).fill('9') }; g = passPlaza(g);
    expect(g.boardNumber).toBe(2); expect(currentPlazaPlayer(g).score).toBe(score); expect(findPlazaMoves(g, currentPlazaPlayer(g).rack).length).toBeGreaterThan(0);
  });
  it('does not mutate old states while preparing the next turn', () => {
    const g = startPlaza({ mode: 'computer', name: 'Learner', config: config() }, 71), before = JSON.stringify(g);
    playPlaza(g, findPlazaMoves(g, currentPlazaPlayer(g).rack)[0]); expect(JSON.stringify(g)).toBe(before);
    passPlaza(g); expect(JSON.stringify(g)).toBe(before);
  });
  it('private online views hide other racks and other players’ seat ids', () => {
    let g = startPlaza({ mode: 'online', name: 'Host', config: config(), online: { code: 'ABCD', myId: 'p-host', host: true } }, 73);
    g.online!.lobby.push({ id: 'p-guest', name: 'Guest' }); g = launchPlaza(g);
    const view = plazaViewFor(g, 'p-guest'); expect(view.players[0].rack).toEqual([]); expect(g.players[0].rack.length).toBe(7);
    expect(view.players.map(p => p.id)).toEqual(['seat-1', 'p-guest']); expect(view.online!.lobby.map(p => p.id)).toEqual(['seat-1', 'p-guest']);
    expect(JSON.stringify(view)).not.toContain('p-host'); // the host's seat id is what would let someone take the seat
  });
  it('a player who drops keeps their seat: their turn waits, the host can skip it, and they get it back', () => {
    let g = startPlaza({ mode: 'online', name: 'Host', config: config({ rounds: 5 }), online: { code: 'ABCD', myId: 'p-host', host: true } }, 74);
    g.online!.lobby.push({ id: 'p-guest', name: 'Guest' }, { id: 'p-third', name: 'Third' }); g = launchPlaza(g);
    g = playPlaza(g, findPlazaMoves(g, currentPlazaPlayer(g).rack)[0]);
    expect(currentPlazaPlayer(g).id).toBe('p-guest');
    const away = seatsPlaza(g, ['p-third']);
    expect(away.phase).toBe('playing'); expect(away.players[1].away).toBe(true); expect(away.notice).toContain('Guest is away');
    expect(currentPlazaPlayer(away).id).toBe('p-guest'); // the turn waits for them
    expect(seatsPlaza(away, ['p-third'])).toBe(away); expect(seatsPlaza(g, []).players[0].away).toBeFalsy(); // the host is never away from itself
    const back = seatsPlaza(away, ['p-third', 'p-guest']);
    expect(back.players[1].away).toBe(false); expect(back.notice).toContain('Guest is back'); expect(back.players[1].rack).toEqual(g.players[1].rack);
    expect(sitOutPlaza(g, 'p-guest')).toBe(g); // only an away player can be skipped
    let skip = sitOutPlaza(away, 'p-guest');
    expect(currentPlazaPlayer(skip).id).toBe('p-third'); expect(skip.players[1].turns).toBe(1); expect(skip.log[0].text).toContain('skipped');
    expect(sitOutPlaza(skip, 'p-guest')).toBe(skip);
    expect(seatsPlaza(skip, ['p-third', 'p-guest']).players[1]).toMatchObject({ away: false, sitOut: false }); // coming back ends the skipping
    for (let k = 0; k < 40 && skip.phase === 'playing'; k++) {
      expect(currentPlazaPlayer(skip).id).not.toBe('p-guest');
      skip = playPlaza(skip, findPlazaMoves(skip, currentPlazaPlayer(skip).rack)[0]);
    }
    expect(skip.phase).toBe('over'); expect(skip.players.map(p => p.turns)).toEqual([5, 5, 5]); expect(skip.endedEarly).toBeFalsy();
    expect(recordPlaza(initialPlaza(), skip).sessions).toBe(1);
  });
  it('only the host can end an online match early, and an early end never counts', () => {
    let g = startPlaza({ mode: 'online', name: 'Host', config: config(), online: { code: 'ABCD', myId: 'p-host', host: true } }, 75);
    g.online!.lobby.push({ id: 'p-guest', name: 'Guest' }); g = launchPlaza(g);
    const view = plazaViewFor(g, 'p-guest'); expect(endPlazaEarly(view)).toBe(view);
    const ended = endPlazaEarly(g); expect(ended).toMatchObject({ phase: 'over', endedEarly: true });
    expect(recordPlaza(initialPlaza(), ended).sessions).toBe(0);
  });
  it('brings back games saved on this device and keeps a left match to go back to', () => {
    const who = gameReducer(initialState(), { type: 'CREATE_CHARACTER', name: 'L', avatar: '', specialization: 'undecided' });
    let s = gameReducer(who, { type: 'PLAZA_START', setup: { mode: 'computer', name: 'L', config: config() } });
    const saved = JSON.parse(JSON.stringify(s)), g = saved.plaza as PlazaState;
    expect(gameReducer(initialState(), { type: 'LOAD', state: saved }).plaza).toEqual(g);
    expect(restorePlaza({ ...g, board: [] })).toBeNull();
    expect(restorePlaza({ ...g, players: [{ ...g.players[0], rack: ['<b>'] }] })).toBeNull();
    expect(restorePlaza({ ...g, phase: 'over' })).toBeNull();
    expect(restorePlaza({ ...g, mode: 'online' })).toBeNull();
    expect(restorePlaza(null)).toBeNull();
    // Leave keeps the match; one tap brings it back; Forget clears it.
    s = gameReducer(s, { type: 'PLAZA_EXIT' });
    expect(s.plaza).toBeNull(); expect(s.stats.plaza.paused?.game.mode).toBe('computer');
    const resumed = gameReducer(s, { type: 'PLAZA_RESUME' });
    expect(resumed.plaza).toBe(s.stats.plaza.paused!.game); expect(resumed.stats.plaza.paused).toBeUndefined(); expect(resumed.screen).toBe('plaza');
    expect(gameReducer(resumed, { type: 'PLAZA_RESUME' })).toBe(resumed);
    expect(gameReducer(s, { type: 'PLAZA_FORGET' }).stats.plaza.paused).toBeUndefined();
    expect(pausedPlaza(s.stats.plaza, Date.now() + PLAZA_PAUSE_MS + 1)).toBeNull();
    const kept = JSON.parse(JSON.stringify(s));
    expect(gameReducer(initialState(), { type: 'LOAD', state: kept }).stats.plaza.paused?.game).toEqual(kept.stats.plaza.paused.game);
    kept.stats.plaza.paused.game = { nope: 1 };
    expect(gameReducer(initialState(), { type: 'LOAD', state: kept }).stats.plaza.paused).toBeUndefined();
    // Solo practice ends with its summary instead, and a host's empty lobby is not worth keeping.
    const practice = gameReducer(gameReducer(who, { type: 'PLAZA_START', setup: { mode: 'practice', name: 'L', config: config() } }), { type: 'PLAZA_EXIT' });
    expect(practice.stats.plaza.paused).toBeUndefined();
    const lobby = startPlaza({ mode: 'online', name: 'Host', config: config(), online: { code: 'ABCD', myId: 'p-host', host: true } }, 76);
    expect(plazaResumable(lobby)).toBe(false); expect(plazaResumable({ ...lobby, online: { ...lobby.online!, host: false }, rev: 3 })).toBe(true);
    // A cloud copy adopted mid-game leaves this device's own game and left match alone.
    const live = gameReducer(s, { type: 'PLAZA_START', setup: { mode: 'local', name: 'L', config: config() } });
    const cloud = gameReducer(who, { type: 'PLAZA_START', setup: { mode: 'computer', name: 'M', config: config() } });
    const adopted = gameReducer(live, { type: 'LOAD', keepPlaza: true, state: cloud });
    expect(adopted.plaza).toBe(live.plaza); expect(adopted.stats.plaza.paused).toBe(live.stats.plaza.paused);
  });
  it('records only the profile player once, keeping board points out of math mastery', () => {
    let s = gameReducer(initialState(), { type: 'PLAZA_START', setup: { mode: 'practice', name: 'Learner', config: config() } });
    const move = findPlazaMoves(s.plaza!, currentPlazaPlayer(s.plaza!).rack)[0];
    s = gameReducer(s, { type: 'PLAZA_PLAY', move }); s = gameReducer(s, { type: 'PLAZA_END' });
    expect(s.stats.plaza.sessions).toBe(1); expect(s.stats.plaza.equations).toBe(1); expect(s.mastery).toEqual({});
    s = gameReducer(s, { type: 'PLAZA_END' }); expect(s.stats.plaza.sessions).toBe(1);
    const old = initialState(); delete (old.stats as Partial<typeof old.stats>).plaza;
    expect(gameReducer(initialState(), { type: 'LOAD', state: old }).stats.plaza).toEqual(initialPlaza());
  });
  it('explains every score as face points, tile bonuses and equation multipliers that add up', () => {
    const opening = checkPlazaMove(blank(), [...'3+4=712'], { start: 57, direction: 'across', tokens: [...'3+4=7'] }, config());
    expect(opening.detail).toMatch(/face/); expect(opening.detail.endsWith(`= ${opening.points} (points)`)).toBe(true);
    const plain = checkPlazaMove(blank(), [...'3+4=712'], { start: 57, direction: 'across', tokens: [...'3+4=7'] }, config({ bonuses: 'off' }));
    expect(plain.detail).toBe(`${plain.points} (face points) = ${plain.points} (points)`);
    // property: the numbers in the breakdown reproduce the total for random legal moves
    for (const seed of [3, 5, 8, 13, 21]) {
      let g = startPlaza({ mode: 'practice', name: 'L', config: config({ bonuses: 'classic', math: 'mixed' }) }, seed);
      for (let k = 0; k < 4; k++) {
        const m = findPlazaMoves(g, currentPlazaPlayer(g).rack, seed + k)[0]; if (!m) break;
        const c = checkPlazaMove(g.board, currentPlazaPlayer(g).rack, m, g.config);
        const expr = c.detail.replace(/[^:+]*: /g, '').replace(/ = \d+ \(points\)$/, '').replace(/ \((face points|tile bonus|equation bonus|whole-rack bonus)\)/g, '').replace(/×/g, '*');
        expect(Function(`return ${expr}`)()).toBe(c.points);
        g = playPlaza(g, m);
      }
    }
  });
  it('Solo practice can undo the last Place once, restoring board, rack and score', () => {
    let g = startPlaza({ mode: 'practice', name: 'Learner', config: config() }, 91);
    const rack = [...currentPlazaPlayer(g).rack], m = findPlazaMoves(g, rack)[0];
    const placed = playPlaza(g, m);
    expect(placed.undo).toBeDefined(); expect(currentPlazaPlayer(placed).score).toBeGreaterThan(0);
    const back = undoPlaza(placed);
    expect(back.board).toEqual(g.board); expect(currentPlazaPlayer(back).rack).toEqual(rack); expect(currentPlazaPlayer(back).score).toBe(0);
    expect(back.log).toEqual([]); expect(back.rev).toBeGreaterThan(placed.rev); expect(back.undo).toBeUndefined();
    expect(undoPlaza(back)).toBe(back); // only once
    expect(passPlaza(placed).undo).toBeUndefined(); // a swap ends the chance to undo
    const vs = startPlaza({ mode: 'computer', name: 'L', config: config() }, 91);
    expect(playPlaza(vs, findPlazaMoves(vs, currentPlazaPlayer(vs).rack)[0]).undo).toBeUndefined(); // matches never undo
  });
  it('Solo practice tracks a goal and a best play; the summary and guide are recorded', () => {
    let g = startPlaza({ mode: 'practice', name: 'L', config: config(), goal: { kind: 'equations', n: 2 }, coach: true }, 55);
    expect(g.coach).toBe(true); expect(plazaGoalProgress(g)).toEqual({ have: 0, need: 2, done: false });
    for (let k = 0; k < 3 && !plazaGoalProgress(g)!.done; k++) g = playPlaza(g, findPlazaMoves(g, currentPlazaPlayer(g).rack, k + 1)[0]);
    expect(plazaGoalProgress(g)!.done).toBe(true); expect(currentPlazaPlayer(g).best!.points).toBeGreaterThan(0);
    expect(plazaGoalProgress(startPlaza({ mode: 'practice', name: 'L', config: config(), goal: null }, 1))).toBeNull();
    let s = gameReducer(initialState(), { type: 'PLAZA_START', setup: { mode: 'practice', name: 'L', config: config(), goal: { kind: 'points', n: 60 }, coach: true } });
    expect(s.stats.plaza.coached).toBeFalsy();
    s = gameReducer(s, { type: 'PLAZA_PLAY', move: findPlazaMoves(s.plaza!, currentPlazaPlayer(s.plaza!).rack)[0] });
    expect(s.stats.plaza.coached).toBe(true); expect(s.plaza!.coach).toBe(true);
    s = gameReducer(s, { type: 'PLAZA_COACH_DONE' }); expect(s.plaza!.coach).toBe(false);
    s = gameReducer(s, { type: 'PLAZA_UNDO' }); expect(currentPlazaPlayer(s.plaza!).score).toBe(0); expect(s.plaza!.coach).toBe(false); // a dismissed guide stays dismissed
    s = gameReducer(s, { type: 'PLAZA_END' }); expect(s.plaza!.endedAt).toBeGreaterThan(0); expect(s.plaza!.undo).toBeUndefined();
    expect(s.stats.plaza.sessions).toBe(1); expect(s.stats.plaza.coached).toBe(true); // recording the session keeps the guide flag
  });
});
