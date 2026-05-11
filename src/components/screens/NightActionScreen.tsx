import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ROLE_META, type Role } from '../../types';
import { RoleIcon } from '../common/RoleIcon';
import { PlayerList } from '../common/PlayerList';
import { Timer } from '../common/Timer';
import { ConfirmModal } from '../common/Modal';

interface NightConfig {
  role: Role;
  title: string;
  subtitle: string;
  skipBtn?: string;
}

const NIGHT_CONFIGS: Record<string, NightConfig> = {
  night_mafia:        { role: 'mafia',         title: 'Мафия просыпается',           subtitle: 'Выберите жертву' },
  night_don:          { role: 'don',           title: 'Дон проводит расследование',  subtitle: 'Кто из них Комиссар?' },
  night_advocate:     { role: 'advocate',      title: 'Адвокат готовит защиту',      subtitle: 'Кого защитить от проверки?', skipBtn: 'Не защищать никого' },
  night_maniac:       { role: 'maniac',        title: 'Маньяк выходит на охоту',     subtitle: 'Выберите жертву' },
  night_commissioner: { role: 'commissioner', title: 'Комиссар ведёт расследование', subtitle: 'Кого проверить?' },
  night_doctor:       { role: 'doctor',        title: 'Врач спасает жизни',          subtitle: 'Кого вылечить этой ночью?', skipBtn: 'Не лечить никого' },
};

export function NightActionScreen() {
  const { gameState, sendAction, sendAck } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  // Reset local state on phase change
  useEffect(() => {
    setSelectedId(null);
    setConfirmTarget(null);
  }, [gameState?.phase]);

  if (!gameState) return null;

  const config = NIGHT_CONFIGS[gameState.phase];
  if (!config) return null;

  const meta = ROLE_META[config.role];
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const myId = gameState.myPlayerId;

  let targets = alivePlayers;
  const myTeamIds = gameState.myTeam?.map(m => m.id) || [];

  switch (gameState.phase) {
    case 'night_mafia':
      targets = alivePlayers.filter(p => !myTeamIds.includes(p.id));
      break;
    case 'night_don':
      targets = alivePlayers.filter(p => !myTeamIds.includes(p.id));
      break;
    case 'night_advocate':
      targets = alivePlayers.filter(p => myTeamIds.includes(p.id) && p.id !== myId);
      break;
    case 'night_commissioner':
      targets = alivePlayers.filter(p => p.id !== myId);
      break;
    case 'night_maniac':
      targets = alivePlayers.filter(p => p.id !== myId);
      break;
    case 'night_doctor':
      targets = alivePlayers;
      break;
  }

  const disabledIds = new Set<string>();
  if (gameState.phase === 'night_doctor' && gameState.doctorLastTarget) {
    disabledIds.add(gameState.doctorLastTarget);
  }

  const handleSelect = (id: string) => {
    if (disabledIds.has(id)) return;
    if (gameState.actionSubmitted) return;
    setSelectedId(id);
  };

  const handleConfirmClick = () => {
    if (selectedId !== null) setConfirmTarget(selectedId);
  };

  const handleConfirm = () => {
    if (confirmTarget !== null) {
      sendAction(confirmTarget);
      setConfirmTarget(null);
    }
  };

  const handleSkip = () => {
    sendAction(null);
  };

  const checkResult = gameState.checkResult;
  const submitted = !!gameState.actionSubmitted;

  return (
    <div className="min-h-full flex flex-col px-5 py-6 safe-top safe-bottom stars-bg relative"
      style={{ background: `radial-gradient(ellipse at 50% -5%, ${meta.color}15, #0a0a0f 65%)` }}>

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ left: `${(i*37+13)%100}%`, top: `${(i*29+7)%75+12}%`, width: i%3===0?2:1, height: i%3===0?2:1, opacity: 0.06+(i%5)*0.05 }} />
        ))}
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-3 shrink-0">
          <RoleIcon role={config.role} size={52} />
          <h1 className="font-display text-2xl font-bold text-white text-center">{config.title}</h1>
          <p className="text-sm text-gray-400 text-center">{config.subtitle}</p>
        </div>

        {/* Timer (informational only) */}
        {gameState.timerEnd && (
          <div className="mb-3 shrink-0">
            <Timer endTime={gameState.timerEnd} color={meta.color} />
          </div>
        )}

        {/* Check result — sticky banner */}
        {checkResult && (
          <div
            className="flex items-center gap-3 p-4 rounded-2xl mb-3 animate-slide-up shrink-0"
            style={{
              background: `${checkResult.positive ? '#dc2626' : '#22c55e'}15`,
              border: `2px solid ${checkResult.positive ? '#dc2626' : '#22c55e'}40`,
            }}
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${checkResult.positive ? '#dc2626' : '#22c55e'}25` }}>
              {checkResult.positive ? (
                <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2.5" fill="none" /><line x1="12" y1="8" x2="12" y2="13" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" /><circle cx="12" cy="16" r="1.2" fill="#dc2626" /></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-base font-bold" style={{ color: checkResult.positive ? '#dc2626' : '#22c55e' }}>
                {checkResult.result}
              </span>
              <span className="text-xs text-gray-400">Игрок: {checkResult.targetName}</span>
            </div>
          </div>
        )}

        {/* Player list (hidden when displaying check result for don/commissioner) */}
        {!checkResult && (
          <div className="flex-1 overflow-y-auto">
            <PlayerList
              players={targets}
              selectedId={selectedId}
              onSelect={handleSelect}
              selectionColor={meta.color}
              disabledIds={disabledIds}
            />
            {disabledIds.size > 0 && (
              <p className="mt-2 text-[11px] text-gray-500 text-center italic">
                Нельзя лечить одного и того же игрока две ночи подряд
              </p>
            )}
          </div>
        )}

        {/* Mafia team panel */}
        {gameState.phase === 'night_mafia' && gameState.myTeam && (
          <div className="mt-2 p-3 rounded-xl shrink-0" style={{ background: `${meta.color}08`, border: `1px solid ${meta.color}15` }}>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: meta.color }}>Ваша команда</p>
            <div className="flex flex-col gap-1">
              {gameState.myTeam.map(m => {
                const vote = gameState.voteState?.votes[m.id];
                const voteName = vote ? gameState.players.find(p => p.id === vote)?.name : null;
                return (
                  <div key={m.id} className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">
                      {m.name} {m.id === myId && <span className="text-gray-500">(вы)</span>}
                    </span>
                    {voteName
                      ? <span className="text-[11px]" style={{ color: meta.color }}>→ {voteName}</span>
                      : <span className="text-[10px] text-gray-600">ждём…</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-3 shrink-0">
          {checkResult ? (
            <button
              onClick={sendAck}
              className="h-[52px] rounded-[14px] text-white font-semibold text-base hover:brightness-110 active:scale-[0.98] transition-all"
              style={{ background: meta.color }}
            >
              Понятно, продолжить
            </button>
          ) : submitted ? (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-sm text-gray-300 font-medium">Выбор отправлен</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {gameState.phase === 'night_mafia'
                  ? 'Ждём остальных членов мафии…'
                  : 'Ждём, пока остальные роли сделают свои ходы…'}
              </p>
            </div>
          ) : (
            <button
              onClick={handleConfirmClick}
              disabled={!selectedId}
              className="h-[52px] rounded-[14px] text-white font-semibold text-base disabled:opacity-30 hover:brightness-110 active:scale-[0.98] transition-all"
              style={{ background: meta.color }}
            >
              Подтвердить
            </button>
          )}
          {!submitted && !checkResult && config.skipBtn && (
            <button onClick={handleSkip} className="h-10 rounded-[14px] border border-white/10 text-gray-500 font-medium text-sm hover:bg-white/5 transition-colors">
              {config.skipBtn}
            </button>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        open={!!confirmTarget && !checkResult}
        title="Подтвердите выбор"
        message={`Игрок: ${targets.find(t => t.id === confirmTarget)?.name || ''}`}
        confirmColor={meta.color}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
