import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { ConfirmModal } from '../common/Modal';
import { SettingsModal } from './SettingsModal';
import { HostInviteModal } from './HostInviteModal';
import { getMinPlayers } from '../../engine/roleDistributor';
import { ROLE_META } from '../../types';

export function LobbyScreen() {
  const { mode, players, settings, hostAction, kickPlayer, leaveRoom, updateSettings } = useGameStore();
  const isHost = mode === 'host';
  const [showSettings, setShowSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [kickTarget, setKickTarget] = useState<string | null>(null);

  const minPlayers = getMinPlayers(settings.roles);
  const canStart = players.length >= minPlayers;

  const handleStart = () => {
    if (canStart) hostAction('START_GAME');
  };

  // Build role summary
  const roleSummary: string[] = [];
  roleSummary.push(`${settings.roles.mafiaCount}× ${ROLE_META.mafia.short}`);
  if (settings.roles.don) roleSummary.push(ROLE_META.don.short);
  if (settings.roles.advocate) roleSummary.push(ROLE_META.advocate.short);
  if (settings.roles.commissioner) roleSummary.push(ROLE_META.commissioner.short);
  if (settings.roles.doctor) roleSummary.push(ROLE_META.doctor.short);
  if (settings.roles.maniac) roleSummary.push(ROLE_META.maniac.short);

  return (
    <div className="min-h-full flex flex-col px-5 py-5 safe-top safe-bottom">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="font-display text-xl font-bold text-white">Комната</h1>
        {isHost && (
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-lg bg-bg-card border border-white/10 hover:border-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            aria-label="Настройки"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        )}
      </div>

      {/* Invite section (host only) */}
      {isHost && (
        <button
          onClick={() => setShowInvite(true)}
          className="mb-3 p-3 rounded-xl bg-mafia/15 border border-mafia/30 text-white text-sm font-semibold hover:bg-mafia/20 transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3h-3zM18 18h3v3h-3z" />
          </svg>
          Подключить игрока через QR
        </button>
      )}

      {/* Roles summary */}
      <div className="mb-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/8 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Состав ролей</span>
          <span className="text-[10px] text-gray-500">{minPlayers}+ игроков</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {roleSummary.map(r => (
            <span key={r} className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-gray-300">{r}</span>
          ))}
        </div>
      </div>

      {/* Player list */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h2 className="text-xs font-bold tracking-wider uppercase text-gray-500">Игроки</h2>
        <span className={`text-sm font-semibold ${canStart ? 'text-green-500' : 'text-yellow-500'}`}>
          {players.length} / {minPlayers}+
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
        {players.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-bg-card border border-white/8 player-enter" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center gap-3">
              <PlayerAvatar name={p.name} color={p.avatarColor} size={34} />
              <span className="text-sm font-semibold text-white">{p.name}</span>
              {p.isHost && (
                <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/15 px-1.5 py-0.5 rounded">ХОСТ</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${p.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isHost && !p.isHost && (
                <button onClick={() => setKickTarget(p.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" /><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" /></svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className={`mt-3 p-2.5 rounded-xl border text-sm text-center shrink-0 ${
        canStart ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
      }`}>
        {canStart ? 'Можно начинать!' : `Нужно минимум ${minPlayers} игроков`}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2 mt-3 shrink-0">
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="h-[52px] rounded-[14px] bg-green-500 text-white font-semibold text-base disabled:opacity-30 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Начать игру
          </button>
        ) : null}
        <button
          onClick={leaveRoom}
          className="h-10 rounded-[14px] border border-white/10 text-gray-500 font-medium text-sm hover:bg-white/5 transition-colors"
        >
          {isHost ? 'Закрыть комнату' : 'Выйти из комнаты'}
        </button>
      </div>

      {/* Settings modal */}
      <SettingsModal
        open={showSettings}
        settings={settings}
        onSave={updateSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Invite modal */}
      <HostInviteModal open={showInvite} onClose={() => setShowInvite(false)} />

      {/* Kick confirm */}
      <ConfirmModal
        open={!!kickTarget}
        title="Исключить игрока?"
        message={`${players.find(p => p.id === kickTarget)?.name || ''} будет удалён из комнаты.`}
        confirmText="Исключить"
        confirmColor="#ef4444"
        onConfirm={() => { if (kickTarget) kickPlayer(kickTarget); setKickTarget(null); }}
        onCancel={() => setKickTarget(null)}
      />
    </div>
  );
}
