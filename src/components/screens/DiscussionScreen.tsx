import { useGameStore } from '../../store/gameStore';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Timer, TimerDisplay } from '../common/Timer';

export function DiscussionScreen() {
  const { gameState, hostAction, mode } = useGameStore();
  if (!gameState) return null;

  const isHost = mode === 'host';
  const alive = gameState.players.filter(p => p.isAlive);
  const dead = gameState.players.filter(p => !p.isAlive);

  return (
    <div className="min-h-full flex flex-col px-5 py-6 safe-top safe-bottom"
      style={{ background: 'linear-gradient(180deg, #12101a 0%, #0a0a0f 30%)' }}>

      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-2xl font-bold">Обсуждение</h1>
          <p className="text-sm text-gray-400">День {gameState.round}</p>
        </div>
        <TimerDisplay endTime={gameState.timerEnd} color="#eab308" />
      </div>

      {/* Timer bar */}
      {gameState.timerEnd && (
        <div className="mb-4">
          <Timer endTime={gameState.timerEnd} color="#eab308" />
        </div>
      )}

      {/* Alive players grid */}
      <p className="text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">Живые игроки</p>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {alive.map(p => (
          <div key={p.id} className="flex flex-col items-center gap-1.5">
            <PlayerAvatar name={p.name} color={p.avatarColor} size={48} />
            <span className="text-[11px] text-white text-center font-medium truncate w-full">{p.name}</span>
          </div>
        ))}
      </div>

      {/* Dead */}
      {dead.length > 0 && (
        <div>
          <p className="text-xs font-bold tracking-wider uppercase text-gray-600 mb-1.5">Выбыли</p>
          <div className="flex gap-2 flex-wrap">
            {dead.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03]">
                <PlayerAvatar name={p.name} color={p.avatarColor} size={22} dead />
                <span className="text-xs text-gray-500">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1" />

      <p className="text-sm text-gray-500 text-center mb-3 italic">Обсуждайте, кто может быть мафией</p>

      {isHost && (
        <button
          onClick={() => hostAction('START_VOTING')}
          className="w-full h-[52px] rounded-[14px] bg-civilian text-white font-semibold text-base hover:brightness-110 active:scale-[0.98] transition-all shrink-0"
        >
          Начать голосование
        </button>
      )}
    </div>
  );
}
