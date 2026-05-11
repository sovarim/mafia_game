import { useGameStore } from '../../store/gameStore';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { ROLE_META } from '../../types';

export function VoteResultScreen() {
  const { gameState, hostAction, mode } = useGameStore();
  if (!gameState || !gameState.voteState) return null;

  const isHost = mode === 'host';
  const votes = gameState.voteState.votes;
  const alive = gameState.players.filter(p => p.isAlive);

  // Build tally
  const counts: Record<string, string[]> = {};
  for (const [voterId, targetId] of Object.entries(votes)) {
    if (!targetId) continue;
    if (!counts[targetId]) counts[targetId] = [];
    const voter = gameState.players.find(p => p.id === voterId);
    if (voter) counts[targetId].push(voter.name);
  }

  const tally = alive
    .map(p => ({ player: p, votes: counts[p.id]?.length || 0, voters: counts[p.id] || [] }))
    .sort((a, b) => b.votes - a.votes);

  const maxVotes = tally[0]?.votes || 0;
  const votedOutId = gameState.lastVotedOutId;
  const votedOutPlayer = votedOutId ? gameState.players.find(p => p.id === votedOutId) : null;
  const role = gameState.lastVotedOutRole ? ROLE_META[gameState.lastVotedOutRole] : null;

  return (
    <div className="min-h-full flex flex-col px-5 py-6 safe-top safe-bottom">
      <div className="flex flex-col items-center gap-1 mb-5">
        <h1 className="font-display text-2xl font-bold">Результат голосования</h1>
        <p className="text-sm text-gray-400">День {gameState.round}</p>
      </div>

      {/* Result card */}
      {votedOutPlayer ? (
        <div className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4 animate-slide-up">
          <PlayerAvatar name={votedOutPlayer.name} color={votedOutPlayer.avatarColor} size={56} />
          <span className="text-lg font-bold text-white">Город изгоняет {votedOutPlayer.name}</span>
          {role && (
            <span className="text-sm font-semibold" style={{ color: role.color }}>{role.name}</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 mb-4 animate-slide-up">
          <span className="text-lg font-bold text-yellow-500">
            Никто не изгнан
          </span>
          <span className="text-xs text-gray-400">Ничья или все воздержались</span>
        </div>
      )}

      {/* Tally */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {tally.map(({ player: p, votes: v, voters }) => (
          <div key={p.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${v === maxVotes && v > 0 ? 'text-white' : 'text-gray-400'}`}>
                {p.name}
              </span>
              <span className={`font-mono text-sm font-bold ${v === maxVotes && v > 0 ? 'text-civilian' : 'text-gray-600'}`}>
                {v} гол.
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${maxVotes > 0 ? (v / maxVotes) * 100 : 0}%`,
                  background: v === maxVotes && v > 0 ? '#3b82f6' : 'rgba(59,130,246,0.3)',
                }}
              />
            </div>
            {voters.length > 0 && (
              <div className="flex gap-1 flex-wrap ml-1">
                {voters.map(n => (
                  <span key={n} className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded bg-white/[0.03]">{n}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {isHost ? (
        <button
          onClick={() => hostAction('PROCEED_VOTE')}
          className="w-full h-[52px] rounded-[14px] bg-civilian text-white font-semibold text-base hover:brightness-110 active:scale-[0.98] transition-all mt-4 shrink-0"
        >
          Продолжить
        </button>
      ) : (
        <p className="text-xs text-gray-600 text-center mt-4 shrink-0">Ожидание хоста…</p>
      )}
    </div>
  );
}
