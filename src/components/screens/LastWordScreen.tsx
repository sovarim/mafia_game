import { useGameStore } from '../../store/gameStore';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Timer } from '../common/Timer';
import { ROLE_META } from '../../types';

export function LastWordScreen() {
  const { gameState, hostAction, mode } = useGameStore();
  if (!gameState) return null;

  const isHost = mode === 'host';
  const myId = gameState.myPlayerId;

  const votedOutId = gameState.lastVotedOutId;
  if (!votedOutId) return null;
  const player = gameState.players.find(p => p.id === votedOutId);
  if (!player) return null;

  const isMe = player.id === myId;
  const role = gameState.lastVotedOutRole ? ROLE_META[gameState.lastVotedOutRole] : null;

  return (
    <div className="min-h-full flex flex-col px-5 py-6 safe-top safe-bottom">
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <PlayerAvatar name={player.name} color={player.avatarColor} size={80} />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></svg>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xl font-bold text-white">{player.name}</span>
          {role && (
            <span className="text-sm font-semibold" style={{ color: role.color }}>{role.name}</span>
          )}
          <span className="text-xs text-gray-500 mt-1">Изгнан днём {gameState.round}</span>
        </div>

        <h2 className="font-display text-2xl font-semibold text-gray-300 italic text-center mt-2">
          {isMe ? 'Ваше прощальное слово' : 'Прощальное слово'}
        </h2>

        {gameState.timerEnd && (
          <div className="w-4/5 mt-2">
            <Timer endTime={gameState.timerEnd} color="#eab308" />
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 text-center mb-3">
        {isMe ? 'У вас есть время сказать последнее слово' : 'Все ожидают завершения прощального слова'}
      </p>

      {isHost ? (
        <div className="shrink-0">
          <button
            onClick={() => hostAction('PROCEED_LAST')}
            className="w-full h-[52px] rounded-[14px] bg-yellow-500 text-white font-semibold text-base hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Продолжить
          </button>
          <p className="text-xs text-gray-500 text-center mt-1">Только хост может продолжить</p>
        </div>
      ) : (
        <p className="text-xs text-gray-600 text-center shrink-0">Ожидание хоста…</p>
      )}
    </div>
  );
}
