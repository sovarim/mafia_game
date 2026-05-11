import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { RoleCard } from '../common/RoleCard';
import type { Role } from '../../types';
import { ROLE_META } from '../../types';

export function RoleRevealScreen() {
  const { gameState, sendReady } = useGameStore();
  const [readyLocal, setReadyLocal] = useState(false);

  useEffect(() => {
    setReadyLocal(false);
  }, [gameState?.round]);

  if (!gameState) return null;

  const myRole = gameState.myRole as Role;
  const meta = myRole ? ROLE_META[myRole] : null;
  const teamMembers = gameState.myTeam?.map(m => ({ name: m.name, role: m.role }));

  const handleReady = () => {
    if (readyLocal) return;
    setReadyLocal(true);
    sendReady();
  };

  return (
    <div
      className="min-h-full flex flex-col items-center justify-center px-5 py-6 safe-top safe-bottom stars-bg relative"
      style={{ background: `radial-gradient(ellipse at 50% -5%, ${meta?.color || '#6b7280'}15, #0a0a0f 65%)` }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 29 + 7) % 75 + 12}%`,
              width: i % 3 === 0 ? 2 : 1,
              height: i % 3 === 0 ? 2 : 1,
              opacity: 0.08 + (i % 5) * 0.06,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        {myRole ? (
          <>
            <RoleCard role={myRole} teamMembers={teamMembers} />
            <button
              onClick={handleReady}
              disabled={readyLocal}
              className="w-full max-w-[260px] h-[52px] rounded-[14px] text-white font-semibold text-base hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ background: meta?.color || '#6b7280' }}
            >
              {readyLocal ? 'Готово' : 'Готов'}
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-400">Загрузка роли...</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-400">
            {gameState.readyCount} / {gameState.totalCount} готовы
          </span>
        </div>
      </div>
    </div>
  );
}
