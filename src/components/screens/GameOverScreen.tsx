import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { RoleIcon } from '../common/RoleIcon';
import { ROLE_META, type Winner, type Role } from '../../types';

const WINNER_CONFIG: Record<string, { title: string; desc: string; color: string; role: Role }> = {
  mafia:    { title: 'Мафия победила!',          desc: 'Город пал. Мафия контролирует всё.', color: '#dc2626', role: 'mafia' },
  civilian: { title: 'Мирные победили!',          desc: 'Все угрозы устранены. Город в безопасности.', color: '#3b82f6', role: 'commissioner' },
  maniac:   { title: 'Маньяк победил!',           desc: 'Город пуст. Маньяк остался один.', color: '#9333ea', role: 'maniac' },
};

export function GameOverScreen() {
  const { gameState, hostAction, leaveRoom, mode } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!gameState) return null;
  const isHost = mode === 'host';
  const winner = gameState.winner || 'civilian';
  const cfg = WINNER_CONFIG[winner];
  const allRoles = gameState.allRoles || {};
  const deaths = gameState.playerDeaths || {};

  return (
    <div className="min-h-full flex flex-col px-5 py-6 safe-top safe-bottom relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.color}12, transparent 60%)` }} />

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="confetti-piece rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                background: ['#dc2626', '#3b82f6', '#22c55e', '#eab308', '#9333ea', '#ec4899'][i % 6],
                '--fall-duration': `${1.5 + Math.random() * 2}s`,
                '--fall-delay': `${Math.random() * 0.8}s`,
                '--spin': `${360 + Math.random() * 720}deg`,
                width: `${6 + Math.random() * 6}px`,
                height: `${6 + Math.random() * 6}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-1">
        {/* Winner banner */}
        <div className="flex flex-col items-center gap-2 mb-5 animate-slide-up">
          <RoleIcon role={cfg.role} size={56} />
          <h1
            className="font-display text-3xl font-bold winner-glow"
            style={{ color: cfg.color, '--glow-color': cfg.color } as React.CSSProperties}
          >
            {cfg.title}
          </h1>
          <p className="text-sm text-gray-400">{cfg.desc}</p>
        </div>

        {/* All players revealed */}
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {gameState.players.map(p => {
            const role = allRoles[p.id] as Role | undefined;
            const meta = role ? ROLE_META[role] : null;
            const isMafiaTeam = meta?.team === 'mafia';
            const death = deaths[p.id];

            return (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl border"
                style={{
                  background: isMafiaTeam ? `${cfg.color === '#dc2626' ? '#dc2626' : '#dc2626'}08` : '#111827',
                  borderColor: isMafiaTeam ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <PlayerAvatar name={p.name} color={p.avatarColor} size={30} dead={!p.isAlive} />
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-sm font-semibold ${p.isAlive ? 'text-white' : 'text-gray-400'}`}>
                      {p.name}
                    </span>
                    {meta && (
                      <span className="text-[11px] font-medium" style={{ color: meta.color }}>
                        {meta.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {p.isAlive ? (
                    <span className="text-[11px] text-green-500 font-semibold">Жив</span>
                  ) : (
                    <span className="text-[10px] text-gray-500">{death || 'Выбыл'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 mt-4 shrink-0">
          {isHost && (
            <button
              onClick={() => hostAction('NEW_GAME')}
              className="h-[52px] rounded-[14px] text-white font-semibold text-base hover:brightness-110 active:scale-[0.98] transition-all"
              style={{ background: cfg.color }}
            >
              Новая игра
            </button>
          )}
          <button
            onClick={leaveRoom}
            className="h-10 rounded-[14px] border border-white/10 text-gray-500 font-medium text-sm hover:bg-white/5 transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
