import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

interface HomeScreenProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export function HomeScreen({ onCreateClick, onJoinClick }: HomeScreenProps) {
  const { error, clearError, setName: persistName, myName } = useGameStore();
  const [name, setName] = useState(myName || '');

  const handleCreate = () => {
    if (name.length < 2) return;
    persistName(name);
    onCreateClick();
  };

  const handleJoin = () => {
    if (name.length < 2) return;
    persistName(name);
    onJoinClick();
  };

  return (
    <div className="min-h-full flex flex-col px-5 py-6 safe-top safe-bottom relative overflow-hidden">
      {/* Atmospheric glow */}
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(220,38,38,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* City silhouette */}
      <svg className="absolute bottom-0 left-0 right-0 opacity-[0.06]" viewBox="0 0 393 140" fill="#fff">
        <rect x="5" y="50" width="22" height="90" /><rect x="30" y="70" width="15" height="70" />
        <rect x="50" y="35" width="20" height="105" /><rect x="75" y="55" width="28" height="85" />
        <rect x="108" y="25" width="18" height="115" /><rect x="130" y="60" width="24" height="80" />
        <rect x="158" y="40" width="14" height="100" /><rect x="176" y="20" width="30" height="120" />
        <rect x="210" y="50" width="20" height="90" /><rect x="235" y="30" width="25" height="110" />
        <rect x="265" y="55" width="18" height="85" /><rect x="288" y="15" width="22" height="125" />
        <rect x="335" y="35" width="28" height="105" /><rect x="368" y="60" width="25" height="80" />
      </svg>

      <div className="flex-1 flex flex-col justify-center gap-0 relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-6xl font-bold text-white tracking-[8px] leading-none">МАФИЯ</h1>
          <p className="text-gray-500 text-xs mt-2 tracking-[3px]">ЛОКАЛЬНАЯ СЕТЬ</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm text-center" onClick={clearError}>
            {error}
          </div>
        )}

        {/* Name input */}
        <input
          type="text"
          placeholder="Ваше имя"
          value={name}
          onChange={e => setName(e.target.value.slice(0, 20))}
          className="h-[52px] rounded-[14px] bg-bg-input border border-white/8 px-4 text-white font-body text-base focus:outline-none focus:border-white/25 transition-colors mb-3"
          autoFocus
        />

        <button
          onClick={handleCreate}
          disabled={name.length < 2}
          className="h-[52px] rounded-[14px] bg-mafia text-white font-semibold text-base disabled:opacity-40 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Создать комнату
        </button>
        <button
          onClick={handleJoin}
          disabled={name.length < 2}
          className="mt-3 h-[48px] rounded-[14px] bg-bg-card border border-white/10 text-white font-medium text-sm hover:bg-white/5 disabled:opacity-30 transition-all"
        >
          Присоединиться по QR
        </button>
      </div>
    </div>
  );
}
