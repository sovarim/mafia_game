import { useGameStore } from './store/gameStore';
import { HomeScreen } from './components/screens/HomeScreen';
import { CreateRoomScreen } from './components/screens/CreateRoomScreen';
import { JoinFlowScreen } from './components/screens/JoinFlowScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { RoleRevealScreen } from './components/screens/RoleRevealScreen';
import { NightWaitScreen } from './components/screens/NightWaitScreen';
import { NightActionScreen } from './components/screens/NightActionScreen';
import { DayResultsScreen } from './components/screens/DayResultsScreen';
import { DiscussionScreen } from './components/screens/DiscussionScreen';
import { VotingScreen } from './components/screens/VotingScreen';
import { VoteResultScreen } from './components/screens/VoteResultScreen';
import { LastWordScreen } from './components/screens/LastWordScreen';
import { DeadScreen } from './components/screens/DeadScreen';
import { GameOverScreen } from './components/screens/GameOverScreen';
import { useEffect, useRef, useState } from 'react';

type HomeStage = 'home' | 'create' | 'join';

export default function App() {
  const { mode, gameState } = useGameStore();
  const [stage, setStage] = useState<HomeStage>('home');
  const prevMode = useRef(mode);

  // Reset to the home picker only when transitioning back from a room.
  useEffect(() => {
    if (prevMode.current !== 'home' && mode === 'home') setStage('home');
    prevMode.current = mode;
  }, [mode]);

  // Home (not yet connected)
  if (mode === 'home') {
    if (stage === 'create') return <ScreenWrap><CreateRoomScreen onBack={() => setStage('home')} /></ScreenWrap>;
    if (stage === 'join') return <ScreenWrap><JoinFlowScreen onBack={() => setStage('home')} /></ScreenWrap>;
    return <ScreenWrap><HomeScreen onCreateClick={() => setStage('create')} onJoinClick={() => setStage('join')} /></ScreenWrap>;
  }

  // Connected but no game state yet → Lobby
  if (!gameState || gameState.phase === 'lobby') {
    return <ScreenWrap><LobbyScreen /></ScreenWrap>;
  }

  // Dead player sees DeadScreen (except game_over)
  const myId = gameState.myPlayerId;
  const myPlayer = gameState.players.find(p => p.id === myId);
  const amDead = myPlayer && !myPlayer.isAlive && gameState.phase !== 'game_over';

  if (amDead) {
    return <ScreenWrap><DeadScreen /></ScreenWrap>;
  }

  const screen = getScreen(gameState.phase, gameState.canAct);
  return <ScreenWrap>{screen}</ScreenWrap>;
}

function getScreen(phase: string, canAct: boolean): React.ReactNode {
  switch (phase) {
    case 'role_reveal':
      return <RoleRevealScreen />;

    case 'night_start':
      return <NightWaitScreen />;

    case 'night_mafia':
    case 'night_don':
    case 'night_advocate':
    case 'night_maniac':
    case 'night_commissioner':
    case 'night_doctor':
      return canAct ? <NightActionScreen /> : <NightWaitScreen />;

    case 'day_results':
      return <DayResultsScreen />;

    case 'day_discussion':
      return <DiscussionScreen />;

    case 'day_voting':
      return <VotingScreen />;

    case 'day_vote_result':
      return <VoteResultScreen />;

    case 'day_last_word':
      return <LastWordScreen />;

    case 'game_over':
      return <GameOverScreen />;

    default:
      return <NightWaitScreen />;
  }
}

function ScreenWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-bg">
      <div className="w-full h-full max-w-md mx-auto bg-bg relative overflow-hidden screen-enter">
        {children}
      </div>
    </div>
  );
}
