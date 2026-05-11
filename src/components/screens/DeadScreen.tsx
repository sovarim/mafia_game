import { useGameStore } from '../../store/gameStore';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { RoleIcon } from '../common/RoleIcon';
import type { Role } from '../../types';
import { ROLE_META } from '../../types';

const PHASE_LABELS: Record<string, string> = {
  night_start: 'Ночь начинается',
  night_mafia: 'Ночь · Мафия делает выбор',
  night_don: 'Ночь · Дон проверяет',
  night_advocate: 'Ночь · Адвокат защищает',
  night_maniac: 'Ночь · Маньяк охотится',
  night_commissioner: 'Ночь · Комиссар проверяет',
  night_doctor: 'Ночь · Врач лечит',
  day_results: 'День · Объявление результатов',
  day_discussion: 'День · Обсуждение',
  day_voting: 'День · Голосование',
  day_vote_result: 'День · Результат голосования',
  day_last_word: 'День · Прощальное слово',
};

export function DeadScreen() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const myRole = gameState.myRole as Role;
  const meta = myRole ? ROLE_META[myRole] : null;
  const phaseLabel = PHASE_LABELS[gameState.phase] || gameState.phase;
  const nightResult = gameState.nightResult;
  const deathRoles = gameState.nightDeathRoles || {};

  return (
    <div className="min-h-full flex flex-col px-5 py-6 safe-top safe-bottom relative">
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      <div className="flex flex-col items-center gap-3 mb-5 relative z-10 shrink-0">
        <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
            <path d="M12 2C7 2 3 6 3 11v9c0 1 .8 1.6 1.5 1 .7-.5 1.5-.5 2 0s1.5.5 2 0 1.5-.5 2 0 1.5.5 2 0 1.5-.5 2 0c.7.6 1.5 0 1.5-1v-9c0-5-4-9-9-9z"
              fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            <circle cx="9" cy="11" r="1.5" fill="rgba(255,255,255,0.3)" />
            <circle cx="15" cy="11" r="1.5" fill="rgba(255,255,255,0.3)" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white/60">Вы выбыли</h1>
        <p className="text-sm text-gray-500 text-center -mt-1">Наблюдайте за игрой со стороны</p>
      </div>

      {meta && (
        <div className="flex items-center gap-3 p-3 rounded-xl border relative z-10 mb-3 shrink-0"
          style={{ background: `${meta.color}08`, borderColor: `${meta.color}15` }}>
          <RoleIcon role={myRole} size={36} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Ваша роль</span>
            <span className="text-sm font-semibold text-white/80">{meta.name}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white/[0.03] mb-3 relative z-10 shrink-0">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        <span className="text-sm text-gray-300">{phaseLabel}</span>
      </div>

      {/* Latest night result */}
      {nightResult && nightResult.actuallyDied.length > 0 && (
        <div className="mb-3 relative z-10 shrink-0">
          <p className="text-[10px] font-bold tracking-wider text-gray-600 uppercase mb-1.5">Прошлой ночью</p>
          <div className="flex flex-col gap-1">
            {nightResult.actuallyDied.map(id => {
              const p = gameState.players.find(pp => pp.id === id);
              if (!p) return null;
              const roleKey = deathRoles[id];
              const role = roleKey ? ROLE_META[roleKey] : null;
              return (
                <div key={id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/15">
                  <PlayerAvatar name={p.name} color={p.avatarColor} size={22} dead />
                  <span className="text-xs text-gray-300">{p.name}</span>
                  {role && <span className="text-[11px]" style={{ color: role.color }}>· {role.name}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative z-10 flex-1 overflow-y-auto">
        <p className="text-[10px] font-bold tracking-wider uppercase text-gray-600 mb-2">Игроки</p>
        <div className="flex flex-col gap-1">
          {gameState.players.map(p => (
            <div key={p.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03]">
              <PlayerAvatar name={p.name} color={p.avatarColor} size={22} dead={!p.isAlive} />
              <span className={`text-xs ${p.isAlive ? 'text-white/80' : 'text-gray-600'}`}>{p.name}</span>
              {!p.isAlive && (
                <span className="text-[10px] text-gray-600 ml-auto">выбыл</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
