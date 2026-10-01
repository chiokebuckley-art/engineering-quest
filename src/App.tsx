import { VisualLibraryScreen } from './game/screens/VisualLibraryScreen';
import { DiceWorkshopScreen } from './game/screens/DiceWorkshopScreen';
import { CountLabScreen } from './game/screens/CountLabScreen';
import { useEffect } from 'react';
import { GameProvider, useGame } from './game/store';
import { Hud, Nav } from './game/components/Hud';
import { Toasts } from './game/components/Toasts';
import { DialogueOverlay } from './game/components/Dialogue';
import { MainMenu, IntroScreen, CharacterCreation } from './game/screens/MenuScreens';
import { RegionScreen } from './game/screens/RegionScreen';
import { BattleScreen } from './game/screens/BattleScreen';
import { LessonScreen, LessonsScreen } from './game/screens/LessonScreens';
import { DrillScreen, MissionScreen } from './game/screens/SessionScreens';
import { DungeonScreen } from './game/screens/DungeonScreen';
import { WorldMapScreen } from './game/screens/WorldMapScreen';
import { SkillTreeScreen } from './game/screens/SkillTreeScreen';
import { DashboardScreen } from './game/screens/DashboardScreen';
import { InventoryScreen } from './game/screens/InventoryScreen';
import { LabScreen } from './game/screens/LabScreen';
import { QuestScreen, AchievementsScreen } from './game/screens/QuestScreen';
import { SettingsScreen } from './game/screens/SettingsScreen';
import { ArcadeScreen } from './game/screens/ArcadeScreen';
import { VersusScreen } from './game/screens/VersusScreen';
import { RocketScreen } from './game/screens/RocketScreen';
import { MillionaireScreen } from './game/screens/MillionaireScreen';
import { StudScreen } from './game/screens/StudScreen';
import { GearRoomProvider } from './game/hooks/useGearRoom';
import { PlazaScreen } from './game/screens/PlazaScreen';
import { PlazaRoomProvider } from './game/hooks/usePlazaRoom';
import { TycoonRoomProvider } from './game/hooks/useTycoonRoom';
import { DiceRoomProvider } from './game/hooks/useDiceRoom';
import { WeakestGearScreen } from './game/screens/WeakestGearScreen';
import { NotebookScreen } from './game/screens/NotebookScreen';
import { WorkshopScreen } from './game/screens/WorkshopScreen';
import { MentalAcademyScreen } from './game/screens/MentalAcademyScreen';
import { AcademyScreen } from './game/screens/AcademyScreen';
import { RealityScreen } from './game/reality/RealityScreen';
import { TycoonScreen } from './game/tycoon/TycoonScreen';
import { VersusRoomProvider } from './game/hooks/useVersusRoom';
import { GalleryScreen } from './game/screens/GalleryScreen';
import { ContestTrackScreen } from './game/screens/ContestTrackScreen';

function Screen() {
  const { state } = useGame();
  if (!state.character) {
    if (state.screen === 'intro') return <IntroScreen />;
    if (state.screen === 'create') return <CharacterCreation />;
    return <MainMenu />;
  }
  switch (state.screen) {
    case 'menu': return <MainMenu />;
    case 'intro': return <IntroScreen />;
    case 'create': return <CharacterCreation />;
    case 'battle': return state.battle ? <BattleScreen /> : <RegionScreen />;
    case 'lesson': return state.lesson ? <LessonScreen /> : <LessonsScreen />;
    case 'lessons': return <LessonsScreen />;
    case 'drill': return <DrillScreen />;
    case 'mission': return state.session ? <MissionScreen /> : <RegionScreen />;
    case 'dungeon': return <DungeonScreen />;
    case 'map': return <WorldMapScreen />;
    case 'skilltree': return <SkillTreeScreen />;
    case 'dashboard': return <DashboardScreen />;
    case 'inventory': return <InventoryScreen />;
    case 'lab': return <LabScreen />;
    case 'quests': return <QuestScreen />;
    case 'achievements': return <AchievementsScreen />;
    case 'settings': return <SettingsScreen />;
    case 'arcade': return <ArcadeScreen />;
    case 'versus': return state.versus ? <VersusScreen /> : <ArcadeScreen />;
    case 'rocket': return <RocketScreen />;
    case 'millionaire': return <MillionaireScreen />;
    case 'stud': return <StudScreen />;
    case 'dice': return <DiceWorkshopScreen />;
    case 'gear': return <WeakestGearScreen />;
    case 'plaza': return <PlazaScreen />;
    case 'countlab': return <CountLabScreen key={state.character.name} />;
    case 'notebook': return <NotebookScreen />;
    case 'workshop': return <WorkshopScreen />;
    case 'mental': return <MentalAcademyScreen />;
    case 'academy': return <AcademyScreen />;
    case 'visual-library': return <VisualLibraryScreen />;
    case 'reality': return <RealityScreen />;
    case 'tycoon': return <TycoonScreen />;
    case 'contest': return <ContestTrackScreen />;
    default: return <RegionScreen />;
  }
}

let pendingGame = '';
let pendingRoom = (() => {
  try {
    const p = new URLSearchParams(window.location.search); const code = p.get('room') ?? ''; pendingGame = p.get('game') ?? '';
    if (code) { p.delete('room'); p.delete('game'); const q = p.toString(); window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + window.location.hash); }
    return code;
  } catch { return ''; }
})();

function Shell() {
  const { state } = useGame();
  const inGame = !!state.character && state.screen !== 'menu' && state.screen !== 'intro' && state.screen !== 'create';
  const immersive = state.screen === 'dice' || state.screen === 'battle' || state.screen === 'lesson' || state.screen === 'mission' || (state.screen === 'drill' && !!state.session) || (state.screen === 'arcade' && !!state.arcade) || state.screen === 'versus' || (state.screen === 'rocket' && !!state.rocket) || (state.screen === 'millionaire' && !!state.millionaire) || (state.screen === 'stud' && !!state.stud) || state.screen === 'plaza' || state.screen === 'countlab' || (state.screen === 'tycoon' && !!state.tycoon) || (state.screen === 'gear' && !!state.gear) || (state.screen === 'notebook' && !!state.notebookRun) || (state.screen === 'academy' && !!state.academy.run) || (state.screen === 'contest' && !!state.contest.run && !state.contest.run.paused);
  useEffect(() => { document.body.classList.toggle('reduced-motion', state.settings.reducedMotion); }, [state.settings.reducedMotion]);
  // Invite links (?room=CODE) open the Arcade with the join box filled in, once a character exists.
  const { dispatch } = useGame();
  useEffect(() => {
    if (!inGame || !pendingRoom) return;
    const code = pendingRoom; pendingRoom = '';
    dispatch({ type: 'NAVIGATE', screen: pendingGame === 'plaza' ? 'plaza' : pendingGame === 'gear' ? 'gear' : pendingGame === 'tycoon' ? 'tycoon' : pendingGame === 'dice' ? 'dice' : 'arcade', params: { room: code } });
  }, [inGame, dispatch]);
  const body = (
    <div className={`app ${immersive ? 'immersive' : ''} ${state.screen === 'plaza' && state.plaza?.phase === 'playing' ? 'plaza-play' : ''}`}>
      {inGame && <Hud />}
      <main className="app-main">
        <Screen />
        {inGame && <Toasts />}
        {inGame && <DialogueOverlay />}
      </main>
      {inGame && !immersive && <Nav />}
    </div>
  );
  // The online room must outlive screen changes (lobby → blitz → results).
  if (state.versus?.kind === 'online') return <VersusRoomProvider key={state.versus.roomCode}>{body}</VersusRoomProvider>;
  if (state.plaza?.online) return <PlazaRoomProvider key={state.plaza.online.code}>{body}</PlazaRoomProvider>;
  if (state.tycoon?.online) return <TycoonRoomProvider key={state.tycoon.online.code}>{body}</TycoonRoomProvider>;
  if (state.diceTable?.online) return <DiceRoomProvider key={state.diceTable.online.code}>{body}</DiceRoomProvider>;
  if (state.gear?.online) return <GearRoomProvider key={state.gear.online.roomCode}>{body}</GearRoomProvider>;
  return body;
}

/** ?gallery=<game> opens the question gallery (for checking pictures), outside the game itself. */
const galleryParams = (() => { try { const p = new URLSearchParams(window.location.search); return p.get('gallery') ? p : null; } catch { return null; } })();

export default function App() {
  if (galleryParams) return <GameProvider><div className="app"><main className="app-main"><GalleryScreen params={galleryParams} /></main></div></GameProvider>;
  return <GameProvider><Shell /></GameProvider>;
}


