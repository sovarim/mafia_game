import { useEffect, useState } from 'react';
import { ROLE_META, type RoomSettings, type Role } from '../../types';
import { RoleIcon } from '../common/RoleIcon';
import { getMinPlayers } from '../../engine/roleDistributor';

const ROLE_ROWS: { role: Role; type: 'toggle' | 'counter' }[] = [
  { role: 'mafia', type: 'counter' },
  { role: 'don', type: 'toggle' },
  { role: 'advocate', type: 'toggle' },
  { role: 'commissioner', type: 'toggle' },
  { role: 'doctor', type: 'toggle' },
  { role: 'maniac', type: 'toggle' },
];

interface SettingsModalProps {
  open: boolean;
  settings: RoomSettings;
  onSave: (settings: RoomSettings) => void;
  onClose: () => void;
}

export function SettingsModal({ open, settings: initial, onSave, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<RoomSettings>(initial);

  useEffect(() => { if (open) setSettings(initial); }, [open, initial]);

  if (!open) return null;

  const update = (patch: Partial<RoomSettings>) => setSettings(s => ({ ...s, ...patch }));
  const updateRoles = (patch: Partial<RoomSettings['roles']>) =>
    setSettings(s => ({ ...s, roles: { ...s.roles, ...patch } }));
  const updateTimers = (patch: Partial<RoomSettings['timers']>) =>
    setSettings(s => ({ ...s, timers: { ...s.timers, ...patch } }));

  const minPlayers = getMinPlayers(settings.roles);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="bg-[#0a0a0f] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h2 className="font-display text-xl font-bold">Настройки комнаты</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Roles */}
          <h3 className="text-xs font-bold tracking-wider uppercase text-gray-500">Роли</h3>
          <div className="flex flex-col gap-1.5">
            {ROLE_ROWS.map(({ role, type }) => {
              const meta = ROLE_META[role];
              const isOn = type === 'toggle'
                ? settings.roles[role as keyof typeof settings.roles] as boolean
                : true;
              const count = role === 'mafia' ? settings.roles.mafiaCount : undefined;

              return (
                <div key={role} className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-bg-card border border-white/8">
                  <div className="flex items-center gap-2.5">
                    <RoleIcon role={role} size={32} />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{meta.name}</span>
                      <span className="text-[11px] text-gray-500">{meta.desc}</span>
                    </div>
                  </div>
                  {type === 'toggle' ? (
                    <button
                      onClick={() => updateRoles({ [role]: !isOn } as any)}
                      className={`w-11 h-7 rounded-full relative transition-colors ${isOn ? '' : 'bg-white/15'}`}
                      style={isOn ? { background: meta.color } : undefined}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${isOn ? 'left-5' : 'left-1'}`} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => updateRoles({ mafiaCount: Math.max(1, settings.roles.mafiaCount - 1) })}
                        className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-gray-400"
                      >−</button>
                      <span className="font-mono text-base font-bold w-4 text-center">{count}</span>
                      <button
                        onClick={() => updateRoles({ mafiaCount: Math.min(8, settings.roles.mafiaCount + 1) })}
                        className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-gray-400"
                      >+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-2.5 rounded-xl bg-civilian/10 border border-civilian/20 text-sm text-civilian text-center">
            Минимум {minPlayers} игроков
          </div>

          {/* Voting */}
          <h3 className="text-xs font-bold tracking-wider uppercase text-gray-500">Голосование</h3>
          <div className="flex items-center justify-between p-3 rounded-xl bg-bg-card border border-white/8">
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {settings.votingType === 'open' ? 'Открытое' : 'Закрытое'}
              </span>
              <span className="text-[11px] text-gray-500">
                {settings.votingType === 'open' ? 'Видны голоса в реальном времени' : 'Результат в конце'}
              </span>
            </div>
            <button
              onClick={() => update({ votingType: settings.votingType === 'open' ? 'closed' : 'open' })}
              className={`w-11 h-7 rounded-full relative transition-colors ${settings.votingType === 'open' ? 'bg-civilian' : 'bg-white/15'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${settings.votingType === 'open' ? 'left-5' : 'left-1'}`} />
            </button>
          </div>

          {/* Timers */}
          <h3 className="text-xs font-bold tracking-wider uppercase text-gray-500">Таймеры</h3>
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-bg-card border border-white/8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Показывать таймеры</span>
                <span className="text-[11px] text-gray-500">Информационные, фазу закрывают игроки</span>
              </div>
              <button
                onClick={() => updateTimers({ enabled: !settings.timers.enabled })}
                className={`w-11 h-7 rounded-full relative transition-colors ${settings.timers.enabled ? 'bg-civilian' : 'bg-white/15'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${settings.timers.enabled ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
            {settings.timers.enabled && (
              <>
                <TimerSlider label="Ночное действие" value={settings.timers.nightActionSeconds} min={15} max={120}
                  onChange={v => updateTimers({ nightActionSeconds: v })} />
                <TimerSlider label="Обсуждение" value={settings.timers.discussionSeconds} min={30} max={600}
                  onChange={v => updateTimers({ discussionSeconds: v })} />
                <TimerSlider label="Голосование" value={settings.timers.votingSeconds} min={15} max={120}
                  onChange={v => updateTimers({ votingSeconds: v })} />
                <TimerSlider label="Прощальное слово" value={settings.timers.lastWordSeconds} min={10} max={120}
                  onChange={v => updateTimers({ lastWordSeconds: v })} />
              </>
            )}
          </div>

          {/* Additional */}
          <h3 className="text-xs font-bold tracking-wider uppercase text-gray-500">Дополнительно</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-card border border-white/8">
              <span className="text-sm font-semibold">Раскрывать роль убитого</span>
              <button
                onClick={() => update({ revealRoleOnDeath: !settings.revealRoleOnDeath })}
                className={`w-11 h-7 rounded-full relative transition-colors ${settings.revealRoleOnDeath ? 'bg-green-500' : 'bg-white/15'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${settings.revealRoleOnDeath ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-card border border-white/8">
              <span className="text-sm font-semibold">Озвучка ведущего</span>
              <button
                onClick={() => update({ narration: !settings.narration })}
                className={`w-11 h-7 rounded-full relative transition-colors ${settings.narration ? 'bg-yellow-500' : 'bg-white/15'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${settings.narration ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/8 shrink-0 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 h-11 rounded-xl bg-mafia text-white font-semibold text-sm hover:brightness-110 transition-all"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

function TimerSlider({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-20 accent-blue-500" />
        <span className="font-mono text-xs text-white min-w-[40px] text-right">{value}с</span>
      </div>
    </div>
  );
}
