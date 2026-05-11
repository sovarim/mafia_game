import type { Player, Winner } from '../types';
import { ROLE_META } from '../types';

/**
 * Check win conditions after any death. Returns null if game continues.
 *
 * Rules:
 *  - Civilians win when mafia AND maniac are all dead.
 *  - Maniac wins when only the maniac is left, OR maniac + 1 civilian remain (no mafia).
 *  - Mafia wins when mafia >= rest of alive players AND maniac is dead.
 *    (While the maniac is alive, mafia cannot fully control the city — they could be killed by the maniac too.)
 */
export function checkWin(players: Player[]): Winner {
  const alive = players.filter(p => p.isAlive && p.role);

  const mafiaAlive = alive.filter(p => ROLE_META[p.role!].team === 'mafia').length;
  const maniacAlive = alive.filter(p => p.role === 'maniac').length;
  const civAlive = alive.length - mafiaAlive - maniacAlive;

  if (alive.length === 0) return 'civilian';

  // Civilian total victory
  if (mafiaAlive === 0 && maniacAlive === 0) return 'civilian';

  // Maniac is the very last player
  if (alive.length === 1 && maniacAlive === 1) return 'maniac';

  // Maniac + 1 civilian, no mafia → maniac wins (cannot be voted out reliably)
  if (mafiaAlive === 0 && maniacAlive === 1 && civAlive === 1) return 'maniac';

  // Mafia wins only when maniac is dead and mafia >= rest
  if (maniacAlive === 0 && mafiaAlive > 0 && mafiaAlive >= civAlive) return 'mafia';

  return null;
}
