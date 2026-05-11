import type { VoteState, Player } from '../types';

export interface VoteResult {
  votedOutId: string | null;
  tally: { playerId: string; playerName: string; votes: number; voters: string[] }[];
  isTie: boolean;
}

/** Count votes and determine who is voted out */
export function resolveVotes(voteState: VoteState, players: Player[]): VoteResult {
  const alivePlayers = players.filter(p => p.isAlive);
  const allVotes = Object.entries(voteState.votes);

  // Build tally
  const counts: Record<string, string[]> = {}; // targetId → voterIds
  for (const [voterId, targetId] of allVotes) {
    if (!targetId) continue; // skipped
    if (!counts[targetId]) counts[targetId] = [];
    counts[targetId].push(voterId);
  }

  const tally = alivePlayers.map(p => ({
    playerId: p.id,
    playerName: p.name,
    votes: counts[p.id]?.length || 0,
    voters: (counts[p.id] || []).map(vid => players.find(pp => pp.id === vid)?.name || vid),
  })).sort((a, b) => b.votes - a.votes);

  if (tally.length === 0 || tally[0].votes === 0) {
    return { votedOutId: null, tally, isTie: false };
  }

  // Check for tie
  const maxVotes = tally[0].votes;
  const leaders = tally.filter(t => t.votes === maxVotes);

  if (leaders.length > 1) {
    return { votedOutId: null, tally, isTie: true };
  }

  return { votedOutId: leaders[0].playerId, tally, isTie: false };
}
