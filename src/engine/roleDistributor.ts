import type { Role, RoleConfig } from '../types';

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build role pool from config and total player count */
export function distributeRoles(playerCount: number, config: RoleConfig): Role[] {
  const pool: Role[] = [];

  // Mafia team
  for (let i = 0; i < config.mafiaCount; i++) pool.push('mafia');
  if (config.don) pool.push('don');
  if (config.advocate) pool.push('advocate');

  // Town
  if (config.commissioner) pool.push('commissioner');
  if (config.doctor) pool.push('doctor');

  // Independent
  if (config.maniac) pool.push('maniac');

  // Fill rest with civilians
  const civCount = playerCount - pool.length;
  for (let i = 0; i < civCount; i++) pool.push('civilian');

  return shuffle(pool);
}

/** Validate role config against player count */
export function validateRoles(playerCount: number, config: RoleConfig): { valid: boolean; message: string } {
  const totalSpecial = config.mafiaCount
    + (config.don ? 1 : 0)
    + (config.advocate ? 1 : 0)
    + (config.commissioner ? 1 : 0)
    + (config.doctor ? 1 : 0)
    + (config.maniac ? 1 : 0);

  if (playerCount < 3) return { valid: false, message: 'Нужно минимум 3 игрока' };
  if (config.mafiaCount < 1 && !config.don) return { valid: false, message: 'Нужен хотя бы 1 мафиози или Дон' };
  if (totalSpecial >= playerCount) return { valid: false, message: 'Нужен хотя бы 1 мирный житель' };

  const mafiaTeam = config.mafiaCount + (config.don ? 1 : 0) + (config.advocate ? 1 : 0);
  const warn = mafiaTeam > Math.floor(playerCount / 3);

  return {
    valid: true,
    message: warn
      ? `Мафия (${mafiaTeam}) больше 1/3 от игроков — возможен дисбаланс`
      : `Для ${totalSpecial} ролей нужно минимум ${totalSpecial + 1} игроков`,
  };
}

export function getMinPlayers(config: RoleConfig): number {
  const totalSpecial = config.mafiaCount
    + (config.don ? 1 : 0)
    + (config.advocate ? 1 : 0)
    + (config.commissioner ? 1 : 0)
    + (config.doctor ? 1 : 0)
    + (config.maniac ? 1 : 0);
  return Math.max(3, totalSpecial + 1);
}
