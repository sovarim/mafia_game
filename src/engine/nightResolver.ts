import type { NightActions, Player, Role, NightResult } from '../types';

/** Resolve all night actions after every role has acted */
export function resolveNight(actions: NightActions, players: Player[]): NightResult {
  const alive = players.filter(p => p.isAlive);
  const result: NightResult = {
    killedByMafia: null,
    killedByManiac: null,
    savedByDoctor: [],
    actuallyDied: [],
  };

  // 1. Determine mafia target (majority of votes)
  const mafiaTarget = resolveMafiaVotes(actions.mafiaVotes, players);
  result.killedByMafia = mafiaTarget;

  // 2. Maniac target
  result.killedByManiac = actions.maniacTarget;

  // 3. Doctor saves
  const doctorTarget = actions.doctorTarget;

  // 4. Check if doctor saved mafia's target
  if (mafiaTarget && doctorTarget === mafiaTarget) {
    result.savedByDoctor.push(mafiaTarget);
    result.killedByMafia = null;
  }

  // 5. Check if doctor saved maniac's target
  if (actions.maniacTarget && doctorTarget === actions.maniacTarget) {
    result.savedByDoctor.push(actions.maniacTarget);
    result.killedByManiac = null;
  }

  // 6. Compile actual deaths
  if (result.killedByMafia) result.actuallyDied.push(result.killedByMafia);
  if (result.killedByManiac && result.killedByManiac !== result.killedByMafia) {
    result.actuallyDied.push(result.killedByManiac);
  }

  return result;
}

/** Resolve mafia votes — majority wins, Don breaks ties */
function resolveMafiaVotes(votes: Record<string, string>, players: Player[]): string | null {
  const entries = Object.entries(votes);
  if (entries.length === 0) return null;

  // Count votes per target
  const counts: Record<string, number> = {};
  for (const [, targetId] of entries) {
    counts[targetId] = (counts[targetId] || 0) + 1;
  }

  const maxVotes = Math.max(...Object.values(counts));
  const leaders = Object.keys(counts).filter(id => counts[id] === maxVotes);

  if (leaders.length === 1) return leaders[0];

  // Tie — Don's vote breaks it
  const don = players.find(p => p.role === 'don' && p.isAlive);
  if (don && votes[don.id] && leaders.includes(votes[don.id])) {
    return votes[don.id];
  }

  // Random if no don or don didn't vote for a leader
  return leaders[Math.floor(Math.random() * leaders.length)];
}

/** Check commissioner result */
export function resolveCommissionerCheck(
  targetId: string, players: Player[], advocateTarget: string | null
): boolean {
  const target = players.find(p => p.id === targetId);
  if (!target || !target.role) return false;

  const mafiaRoles: Role[] = ['mafia', 'advocate'];

  // Advocate protection — if target is protected, show as civilian
  if (advocateTarget === targetId) return false;

  // Don always shows as civilian
  if (target.role === 'don') return false;

  // Maniac shows as civilian
  if (target.role === 'maniac') return false;

  return mafiaRoles.includes(target.role);
}

/** Check Don result — is target the commissioner? */
export function resolveDonCheck(targetId: string, players: Player[]): boolean {
  const target = players.find(p => p.id === targetId);
  return target?.role === 'commissioner';
}
