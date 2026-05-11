import { PlayerAvatar } from './PlayerAvatar';

interface PlayerInfo {
  id: string;
  name: string;
  isAlive: boolean;
  isHost: boolean;
  avatarColor: string;
  isConnected: boolean;
}

interface PlayerListProps {
  players: PlayerInfo[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  selectionColor?: string;
  showHostBadge?: boolean;
  trailing?: (player: PlayerInfo) => React.ReactNode;
  disabledIds?: string[] | Set<string>;
  myId?: string;
}

export function PlayerList({
  players, selectedId, onSelect, selectionColor = '#dc2626',
  showHostBadge = false, trailing, disabledIds, myId,
}: PlayerListProps) {
  const disabledSet = disabledIds instanceof Set
    ? disabledIds
    : new Set(disabledIds || []);
  return (
    <div className="flex flex-col gap-1.5">
      {players.map((p) => {
        const isSel = selectedId === p.id;
        const isDisabled = disabledSet.has(p.id) || !p.isAlive;
        const isMe = myId === p.id;

        return (
          <button
            key={p.id}
            onClick={() => !isDisabled && onSelect?.(p.id)}
            disabled={isDisabled || !onSelect}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all ${
              isSel
                ? 'border-opacity-40'
                : isDisabled
                  ? 'border-white/5 opacity-50'
                  : 'border-white/8 hover:border-white/15 active:scale-[0.98]'
            }`}
            style={{
              background: isSel ? `${selectionColor}12` : '#111827',
              borderColor: isSel ? `${selectionColor}60` : undefined,
            }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <PlayerAvatar name={p.name} color={p.avatarColor} size={34} dead={!p.isAlive} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold truncate ${p.isAlive ? 'text-white' : 'text-gray-500'}`}>
                    {p.name}
                    {isMe && <span className="text-gray-500 font-normal"> (вы)</span>}
                  </span>
                  {showHostBadge && p.isHost && (
                    <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/15 px-1.5 py-0.5 rounded">
                      ХОСТ
                    </span>
                  )}
                  {!p.isConnected && (
                    <span className="text-[9px] font-bold text-red-400 bg-red-400/15 px-1.5 py-0.5 rounded">
                      ОФЛАЙН
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {trailing?.(p)}
              {isSel && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: selectionColor }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
