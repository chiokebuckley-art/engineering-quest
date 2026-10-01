import type { GearAvatarId } from './gearAvatars';
import type { Screen } from './types';
import type { EquipSlot, RegionId, SkillId, Specialization } from '../types';

export type Action =
  | { type: 'VISUAL_STUDY'; id: string }
  | { type: 'VISUAL_ANSWER'; id: string; mode: import('../visual-library/progress').VisualMode; correct: boolean }
  | { type: 'DICE_EVENT'; event: import('./diceWorkshop').DiceEvent }
  | { type: 'DICE_HOST'; mode: import('./diceWorkshop').Mode; code: string; myId: string; avatar: import('./gearAvatars').GearAvatarId }
  | { type: 'DICE_JOIN'; code: string; myId: string; avatar: import('./gearAvatars').GearAvatarId }
  | { type: 'DICE_ROSTER'; seats: import('./diceTable').DiceSeat[] }
  | { type: 'DICE_LAUNCH' }
  | { type: 'DICE_ACT'; action: import('./diceTable').DiceAction }
  | { type: 'DICE_GUEST'; id: string; action: import('./diceTable').DiceAction }
  | { type: 'DICE_REMOTE'; table: import('./diceTable').DiceTable }
  | { type: 'DICE_LEFT'; id: string }
  | { type: 'DICE_TABLE_EXIT' }
  | { type: 'COUNT_AUTH'; digest: string; salt?: string }
  | { type: 'COUNT_LOCK' }
  | { type: 'COUNT_RESULT'; result: import('../countlab/engine').LabResult }
  | { type: 'COUNT_CONTROLS'; maxDecks: number; timers: boolean; coach: boolean }
  /** `keepPlaza`: a cloud copy is adopted mid-session; this device keeps its own Equation Plaza game and left match. */
  | { type: 'LOAD'; state: import('./types').GameState; keepPlaza?: boolean }
  | { type: 'NEW_GAME' }
  | { type: 'CREATE_CHARACTER'; name: string; avatar: string; specialization: Specialization }
  | { type: 'SET_SPECIALIZATION'; specialization: Specialization }
  | { type: 'NAVIGATE'; screen: Screen; params?: Record<string, string | number | undefined> }
  | { type: 'SEEN_INTRO' }
  | { type: 'TRAVEL'; regionId: RegionId }
  | { type: 'TALK'; npcId: string }
  | { type: 'DIALOGUE_NEXT' }
  | { type: 'DIALOGUE_CLOSE' }
  | { type: 'ACCEPT_QUEST'; questId: string }
  | { type: 'START_LESSON'; lessonId: string }
  | { type: 'LESSON_NEXT' }
  | { type: 'LESSON_ANSWER'; given: string }
  | { type: 'LESSON_TOGGLE_EXPLAIN' }
  | { type: 'LESSON_EXIT' }
  | { type: 'START_BATTLE'; enemyId: string; regionId: RegionId; depth?: number; factId?: string; route?: 'quiet' | 'loud'; preview?: boolean }
  /** After a miss: retry for full damage, retry with the array helper for half, or go train the fact in the Arcade. */
  | { type: 'BATTLE_RECOVER'; choice: 'retry' | 'helper' | 'train' }
  /** Ask Vector, Ada or Brick for a tip on this question (costs a hint charge). */
  | { type: 'BATTLE_TIP'; npc: 'vector' | 'ada' | 'brick' }
  /** Spend energy: the answer is shown and the blow lands; the fact comes back later to answer yourself. */
  | { type: 'BATTLE_POWER' }
  /** Close the battle and go train in the Arcade, with a shield waiting for the return. */
  | { type: 'PLAY_TRAIN'; game: import('./types').ArcadeGame; selection: string; label: string }
  /** From the lesson completion card: carry on with the quest. */
  | { type: 'LESSON_CONTINUE' }
  /** Seat a recovered power core in the Engine. */
  | { type: 'CEREMONY_DONE' }
  /** From the Arcade, back to the fight you left to train for. */
  | { type: 'PLAY_RETURN' }
  | { type: 'BATTLE_ANSWER'; given: string }
  | { type: 'BATTLE_HINT' }
  | { type: 'BATTLE_NEXT' }
  | { type: 'BATTLE_FLEE' }
  | { type: 'BATTLE_CLOSE' }
  | { type: 'START_DRILL'; skillIds: SkillId[]; count: number; timed?: boolean; diagnostic?: boolean }
  | { type: 'START_MISSION'; missionId: string }
  | { type: 'SESSION_ANSWER'; given: string }
  | { type: 'SESSION_HINT' }
  | { type: 'SESSION_TOGGLE_EXPLAIN' }
  | { type: 'SESSION_NEXT' }
  | { type: 'SESSION_EXIT' }
  | { type: 'START_DUNGEON' }
  | { type: 'ARCADE_START'; game: import('./types').ArcadeGame; mode: import('./types').ArcadeMode; selection: string; durationMs?: number; reward?: 'gears'; targetMs?: number }
  | { type: 'ARCADE_ANSWER'; given: string }
  | { type: 'ARCADE_NEXT' }
  | { type: 'ARCADE_TIMEOUT' }
  | { type: 'ARCADE_EXIT' }
  /* ---- Mental Math Academy ---- */
  | { type: 'MM_START'; mode: import('../mentalmath/session').MMMode; skillId: string; scaffold?: import('../mentalmath/session').MMScaffold; level?: 1 | 2 | 3 | 4 | 5 | 6; targetMs?: number; count?: number }
  | { type: 'MM_WORKOUT' }
  | { type: 'MM_PLACEMENT' }
  | { type: 'MM_BOSS'; world: number }
  | { type: 'MM_BEGIN' }
  | { type: 'MM_CHOOSE'; strategy: import('../mentalmath/strategies').StrategyId }
  | { type: 'MM_ANSWER'; given: string }
  | { type: 'MM_NEXT' }
  | { type: 'MM_HINT' }
  | { type: 'MM_ANOTHER' }
  | { type: 'MM_VISUAL' }
  | { type: 'MM_SCAFFOLD'; scaffold: import('../mentalmath/session').MMScaffold }
  | { type: 'MM_REVEAL' }
  | { type: 'MM_EXIT' }
  | { type: 'VERSUS_SETUP'; kind: 'hotseat' | 'online'; game: import('./types').ArcadeGame; selection: string; names: string[]; roomCode?: string; isHost?: boolean; seed?: number; durationMs?: number; levels?: import('./types').VersusLevel[] }
  | { type: 'VERSUS_SET_PLAYERS'; players: import('./types').VersusPlayer[] }
  | { type: 'VERSUS_ROUND'; seed: number; game: import('./types').ArcadeGame; selection: string; startAt: number; players?: { id: string; name: string }[]; durationMs?: number; level?: number; wins?: Record<string, number>; plan?: import('./types').VersusLevel[] }
  | { type: 'VERSUS_BEGIN_TURN' }
  | { type: 'VERSUS_REMOTE'; playerId: string; name?: string; score: number; correct: number; done: boolean; roundId?: string }
  | { type: 'VERSUS_LEFT'; playerId: string }
  | { type: 'VERSUS_CONTINUE' }
  | { type: 'VERSUS_REMATCH' }
  | { type: 'VERSUS_NEXT_LEVEL' }
  | { type: 'VERSUS_EXIT' }
  | { type: 'ROCKET_START'; missionId: string }
  | { type: 'ROCKET_MOVE'; dir: -1 | 1 }
  | { type: 'ROCKET_LANE'; lane: 0 | 1 | 2 }
  | { type: 'ROCKET_BOOST' }
  | { type: 'ROCKET_TIMEOUT' }
  | { type: 'ROCKET_NEXT' }
  | { type: 'ROCKET_EXIT' }
  | { type: 'MILL_START'; kind: import('../questions/wordproblems').WordKind }
  | { type: 'MILL_PICK'; index: number }
  | { type: 'MILL_NEXT' }
  | { type: 'MILL_LIFELINE'; kind: import('./millionaire').Lifeline }
  | { type: 'MILL_WALK' }
  | { type: 'MILL_EXIT' }
  | { type: 'STUD_START'; selection: import('./stud').StudState['selection'] }
  | { type: 'STUD_CHOOSE'; choice: 1 | 2 | 3 | 'fold' }
  | { type: 'STUD_ANSWER'; given: string }
  | { type: 'STUD_REVEAL' }
  | { type: 'STUD_COLLECT'; given: string }
  | { type: 'STUD_EXIT' }
  | { type: 'PLAZA_START'; setup: import('./plaza').PlazaSetup }
  | { type: 'TYCOON_START'; setup: import('../tycoon/game').TycoonSetup }
  | { type: 'TYCOON_ROLL' }
  | { type: 'TYCOON_ANSWER'; given: string }
  | { type: 'TYCOON_PASS' }
  | { type: 'TYCOON_ACK' }
  | { type: 'TYCOON_JAIL'; choice: 'fix' | 'pay' | 'roll' }
  | { type: 'TYCOON_BUILD'; space: number }
  | { type: 'TYCOON_BUILD_CANCEL' }
  | { type: 'TYCOON_MORTGAGE'; space: number }
  | { type: 'TYCOON_END_TURN' }
  | { type: 'TYCOON_BOT' }
  | { type: 'TYCOON_FINISH' }
  | { type: 'TYCOON_EXIT' }
  | { type: 'TYCOON_HOST'; level: import('../tycoon/board').Level; mode: 'quick' | 'classic'; code: string; myId: string }
  | { type: 'TYCOON_JOIN'; code: string; myId: string }
  | { type: 'TYCOON_ROSTER'; players: { id: string; name: string }[] }
  | { type: 'TYCOON_LAUNCH'; bots: import('../tycoon/game').BotLevel[] }
  | { type: 'TYCOON_REMOTE'; state: import('../tycoon/game').TycoonGame }
  | { type: 'TYCOON_LEFT'; id: string }
  | { type: 'TYCOON_GUEST'; id: string; action: import('../tycoon/online').TycoonGuestAction }
  | { type: 'PLAZA_PLAY'; move: import('./plaza').PlazaMove }
  | { type: 'PLAZA_SWAP' }
  | { type: 'PLAZA_BOT' }
  | { type: 'PLAZA_END' }
  | { type: 'PLAZA_UNDO' }
  | { type: 'PLAZA_COACH_DONE' }
  | { type: 'REALITY_RESULT'; result: import('../reality/progress').StageResult }
  | { type: 'REALITY_STAGE'; mission: string; stage: number }
  | { type: 'REALITY_DONE'; mission: string }
  | { type: 'REALITY_NOTE'; key: string; text: string }
  | { type: 'REALITY_KIT'; component: string; status: import('../reality/progress').KitMark | null; note?: string }
  | { type: 'REALITY_INVENTION'; invention: import('../reality/progress').Invention }
  | { type: 'REALITY_SEEN'; key: string }
  | { type: 'CONTEST_SET_GRADE'; grade: import('../contest/common').GradeId | null }
  | { type: 'CONTEST_SET_CAPS'; on: boolean }
  /** Contest Path track: start today's session (Calm), a 3-item preview of the next grade, or the Grade 5 mini-mock. `day` = 0 (Sun) … 6; default today. An unfinished run is kept unless `replace`. */
  | { type: 'CONTEST_START'; mode: import('../contest/state').RunMode; day?: number; seed?: number; replace?: boolean }
  | { type: 'CONTEST_ANSWER'; given: string }
  | { type: 'CONTEST_NEXT' }
  | { type: 'CONTEST_HINT' }
  | { type: 'CONTEST_EXPLAIN' }
  /** Grade 5: Skip & come back (the item returns at the end). */
  | { type: 'CONTEST_SKIP' }
  /** The answer to "this round has a clock. Want to try it?" */
  | { type: 'CONTEST_CLOCK'; accept: boolean }
  | { type: 'CONTEST_TEACH_NEXT' }
  /** Back to the hub with the run kept (Resume), or the run dropped (Quit), or the victory card closed. */
  | { type: 'CONTEST_PAUSE' }
  | { type: 'CONTEST_RESUME' }
  | { type: 'CONTEST_QUIT' }
  | { type: 'CONTEST_CLOSE' }
  | { type: 'PLAZA_EXIT' }
  | { type: 'PLAZA_LAUNCH' }
  | { type: 'PLAZA_SEATS'; here: string[] }
  | { type: 'PLAZA_SIT_OUT'; id: string }
  | { type: 'PLAZA_END_EARLY' }
  | { type: 'PLAZA_RESUME' }
  | { type: 'PLAZA_FORGET' }
  | { type: 'PLAZA_ROSTER'; players: { id: string; name: string }[] }
  /** `resync`: the first state after (re)connecting is taken as it is, even if older than this device's copy. */
  | { type: 'PLAZA_REMOTE'; state: import('./plaza').PlazaState; resync?: boolean }
  | { type: 'GEAR_START'; setup: import('./gear').GearSetup }
  | { type: 'GEAR_BANK' }
  | { type: 'GEAR_ANSWER'; given: string }
  | { type: 'GEAR_BOT' }
  | { type: 'GEAR_NEXT' }
  | { type: 'GEAR_TIMEOUT' }
  | { type: 'GEAR_VOTE'; voterId: string; targetId: string }
  | { type: 'GEAR_TIEBREAK'; targetId: string }
  | { type: 'GEAR_CONTINUE' }
  | { type: 'GEAR_EXIT' }
  | { type: 'GEAR_LAUNCH' }
  | { type: 'GEAR_LOBBY_ROSTER'; players: { id: string; name: string; avatarId?: GearAvatarId }[] }
  | { type: 'GEAR_REMOTE_STATE'; state: import('./gear').GearState }
  | { type: 'GEAR_LOCAL_ANSWER'; given: string }
  | { type: 'GEAR_LEFT'; id: string }
  | { type: 'NOTEBOOK_START'; entryId: string }
  | { type: 'NOTEBOOK_ANSWER'; given: string }
  | { type: 'NOTEBOOK_NEXT' }
  | { type: 'NOTEBOOK_EXIT' }
  | { type: 'NOTEBOOK_DROP'; entryId: string }
  | { type: 'DUNGEON_EXIT' }
  | { type: 'USE_ITEM'; itemId: string }
  | { type: 'EQUIP'; itemId: string }
  | { type: 'UNEQUIP'; slot: EquipSlot }
  | { type: 'REST' }
  | { type: 'TICK'; now: number }
  | { type: 'SET_SETTINGS'; settings: Partial<import('./types').Settings> }
  | { type: 'DISMISS_TOAST'; id: number }
  | { type: 'NOTICE'; text: string; icon?: string }
  // Arithmetic Academy
  | { type: 'ACADEMY_OPEN'; view?: 'campus' | 'hub' | 'chapter' | 'dashboard'; academy?: string; chapter?: string }
  | { type: 'ACADEMY_START'; kind: 'quest' | 'concept' | 'transfer' | 'trial'; academy?: string; chapter?: string; questId?: string }
  | { type: 'ACADEMY_ANSWER'; given: string }
  | { type: 'ACADEMY_NEXT' }
  | { type: 'ACADEMY_HELP' }
  | { type: 'ACADEMY_TOGGLE_EXPLAIN' }
  | { type: 'ACADEMY_EXIT' }
  | { type: 'ACADEMY_GRADUATE'; academy?: string }
  | { type: 'RESET_PROGRESS' };


