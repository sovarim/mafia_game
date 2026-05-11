import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Timer, TimerDisplay } from '../common/Timer';

export function VotingScreen() {
  const { gameState, sendVote, hostAction, mode } = useGameStore();
  const [myVote, setMyVote] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    // Reset on phase change
    setMyVote(null);
    setConfirmed(false);
  }, [gameState?.phase]);

  if (!gameState || !gameState.voteState) return null;

  const isHost = mode === 'host';
  const myId = gameState.myPlayerId;
  const alive = gameState.players.filter(p => p.isAlive);
  const aliveExceptMe = alive.filter(p => p.id !== myId);
  const isOpen = gameState.voteState.votingType === 'open';
  const votes = gameState.voteState.votes;
  const confirmedMap = gameState.voteState.confirmed || {};
  const totalConfirmed = Object.keys(confirmedMap).filter(id => alive.some(p => p.id === id)).length;
  const allVoted = totalConfirmed >= alive.length;

  const handleVote = (targetId: string | null) => {
    setMyVote(targetId);
  };

  const handleConfirm = () => {
    sendVote(myVote);
    setConfirmed(true);
  };

  const handleSkip = () => {
    sendVote(null);
    setConfirmed(true);
  };

  // Count votes per candidate (open voting)
  const voteCounts: Record<string, string[]> = {};
  if (isOpen) {
    for (const [voterId, targetId] of Object.entries(votes)) {
      if (!targetId) continue;
      if (!voteCounts[targetId]) voteCounts[targetId] = [];
      const voter = gameState.players.find(p => p.id === voterId);
      if (voter) voteCounts[targetId].push(voter.name);
    }
  }

  return (
    <div className="min-h-full flex flex-col px-5 py-6 safe-top safe-bottom">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-2xl font-bold">Голосование</h1>
          <p className="text-sm text-gray-400">
            День {gameState.round} · {isOpen ? 'Открытое' : 'Закрытое'}
          </p>
        </div>
        <TimerDisplay endTime={gameState.timerEnd} />
      </div>

      {gameState.timerEnd && (
        <div className="mb-3">
          <Timer endTime={gameState.timerEnd} color="#3b82f6" />
        </div>
      )}

      <p className="text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">Кандидаты</p>

      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
        {aliveExceptMe.map(p => {
          const isSel = myVote === p.id;
          const vCount = isOpen ? (voteCounts[p.id]?.length || 0) : 0;
          const voterNames = isOpen ? voteCounts[p.id] || [] : [];

          return (
            <div key={p.id}>
              <button
                onClick={() => !confirmed && handleVote(p.id)}
                disabled={confirmed}
                className={`w-full p-3 rounded-xl border transition-all ${
                  isSel ? 'border-civilian/40' : 'border-white/8 hover:border-white/15'
                }`}
                style={{ background: isSel ? 'rgba(59,130,246,0.08)' : '#111827' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar name={p.name} color={p.avatarColor} size={32} />
                    <span className="text-sm font-semibold">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {vCount > 0 && (
                      <span className="font-mono text-sm font-bold text-civilian">{vCount}</span>
                    )}
                    {!isOpen && !confirmed && (
                      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                        <span className="text-xs text-gray-500">?</span>
                      </div>
                    )}
                    {isSel ? (
                      <div className="w-7 h-7 rounded-lg bg-civilian flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-gray-600" />
                      </div>
                    )}
                  </div>
                </div>
                {voterNames.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2 ml-11">
                    {voterNames.map(n => (
                      <span key={n} className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-white/5 vote-fly">{n}</span>
                    ))}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
        <span>Проголосовали: {totalConfirmed} / {alive.length}</span>
        {confirmed && (
          <span className="text-civilian">
            {myVote
              ? `Вы: ${gameState.players.find(p => p.id === myVote)?.name}`
              : 'Вы воздержались'}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-3 shrink-0">
        {!confirmed ? (
          <>
            <button
              onClick={handleConfirm}
              disabled={!myVote}
              className="h-[52px] rounded-[14px] bg-civilian text-white font-semibold text-base disabled:opacity-30 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Подтвердить голос
            </button>
            <button onClick={handleSkip} className="h-10 rounded-[14px] border border-white/10 text-gray-500 font-medium text-sm hover:bg-white/5 transition-colors">
              Воздержаться
            </button>
          </>
        ) : (
          <div className="p-3 rounded-xl bg-civilian/10 border border-civilian/20 text-sm text-civilian text-center">
            {myVote
              ? `Вы проголосовали за ${gameState.players.find(p => p.id === myVote)?.name}`
              : 'Вы воздержались'}
            {!isOpen && '. Результат после завершения.'}
          </div>
        )}

        {/* Host can close voting once everyone (or enough) has voted */}
        {isHost && (
          <button
            onClick={() => hostAction('CLOSE_VOTING')}
            className={`h-11 rounded-[14px] font-semibold text-sm transition-all ${
              allVoted
                ? 'bg-mafia text-white hover:brightness-110'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            {allVoted ? 'Завершить голосование' : `Завершить досрочно (${totalConfirmed}/${alive.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
