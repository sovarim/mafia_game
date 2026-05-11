import { useGameStore } from '../../store/gameStore';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { ROLE_META } from '../../types';

export function DayResultsScreen() {
  const { gameState, hostAction, mode } = useGameStore();
  if (!gameState || !gameState.nightResult) return null;

  const isHost = mode === 'host';
  const result = gameState.nightResult;
  const died = result.actuallyDied;
  const saved = result.savedByDoctor;
  const deathRoles = gameState.nightDeathRoles || {};

  return (
    <div className="min-h-full flex flex-col px-5 py-6 safe-top safe-bottom relative"
      style={{ background: 'linear-gradient(180deg, #1a1025 0%, #0a0a0f 40%)' }}>
      {/* Sunrise glow */}
      <div className="absolute top-0 left-0 right-0 h-[200px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.08), transparent 70%)' }} />

      <div className="flex flex-col items-center gap-2 mb-6 relative z-10">
        <span className="text-sm text-yellow-500 font-semibold tracking-wider">ДЕНЬ {gameState.round}</span>
        <h1 className="font-display text-3xl font-bold text-white">Город просыпается</h1>
      </div>

      <div className="flex-1 flex flex-col gap-4 relative z-10 overflow-y-auto">
        {died.length > 0 ? (
          <>
            <p className="text-sm text-gray-400 text-center">
              Этой ночью {died.length === 1 ? 'погиб' : 'погибли'}:
            </p>
            {died.map(id => {
              const player = gameState.players.find(p => p.id === id);
              if (!player) return null;
              const roleKey = deathRoles[id];
              const role = roleKey ? ROLE_META[roleKey] : null;
              return (
                <div key={id} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-red-500/8 border border-red-500/15 animate-slide-up">
                  <div className="relative">
                    <PlayerAvatar name={player.name} color={player.avatarColor} size={64} dead />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-lg font-bold text-white">{player.name}</span>
                    {role && <span className="text-sm font-semibold" style={{ color: role.color }}>{role.name}</span>}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-green-500/8 border border-green-500/15 animate-slide-up">
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24"><path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z" stroke="#22c55e" strokeWidth="2" fill="none" /><path d="M8 12l3 3 5-5" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <p className="text-base text-green-500 font-semibold">Этой ночью никто не погиб</p>
            {saved.length > 0 && (
              <p className="text-sm text-gray-400">Врач спас жизнь</p>
            )}
          </div>
        )}
      </div>

      {isHost ? (
        <div className="mt-4 shrink-0">
          <button
            onClick={() => hostAction('START_DISCUSSION')}
            className="w-full h-[52px] rounded-[14px] bg-yellow-500 text-white font-semibold text-base hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Начать обсуждение
          </button>
          <p className="text-xs text-gray-500 text-center mt-1.5">Только хост может продолжить</p>
        </div>
      ) : (
        <p className="text-xs text-gray-600 text-center mt-4 shrink-0">Ожидание хоста…</p>
      )}
    </div>
  );
}
