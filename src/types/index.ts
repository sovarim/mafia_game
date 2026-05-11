// ─── Types & Interfaces ─── Мафия Онлайн ───

export type Role = 'mafia' | 'don' | 'commissioner' | 'doctor' | 'maniac' | 'advocate' | 'civilian';

export type Team = 'mafia' | 'civilian' | 'maniac';

export type GamePhase =
  | 'lobby'
  | 'role_reveal'
  | 'night_start'
  | 'night_mafia'
  | 'night_don'
  | 'night_advocate'
  | 'night_maniac'
  | 'night_commissioner'
  | 'night_doctor'
  | 'day_results'
  | 'day_discussion'
  | 'day_voting'
  | 'day_vote_result'
  | 'day_last_word'
  | 'game_over';

export type VotingType = 'open' | 'closed';
export type Winner = 'mafia' | 'civilian' | 'maniac' | null;

// ─── Role metadata ───

export interface RoleMeta {
  name: string;
  short: string;
  team: Team;
  color: string;
  desc: string;
}

export const ROLE_META: Record<Role, RoleMeta> = {
  mafia:        { name: 'Мафия',         short: 'Мафия',    team: 'mafia',    color: '#dc2626', desc: 'Выбирает жертву вместе с командой' },
  don:          { name: 'Дон мафии',     short: 'Дон',      team: 'mafia',    color: '#dc2626', desc: 'Лидер мафии. Проверяет Комиссара' },
  advocate:     { name: 'Адвокат',       short: 'Адвокат',  team: 'mafia',    color: '#dc2626', desc: 'Защищает мафиози от проверки' },
  commissioner: { name: 'Комиссар',      short: 'Комиссар', team: 'civilian', color: '#3b82f6', desc: 'Проверяет игроков на мафию' },
  doctor:       { name: 'Врач',          short: 'Врач',     team: 'civilian', color: '#22c55e', desc: 'Лечит игрока от убийства' },
  maniac:       { name: 'Маньяк',        short: 'Маньяк',   team: 'maniac',   color: '#9333ea', desc: 'Одиночка. Убивает любого' },
  civilian:     { name: 'Мирный житель', short: 'Мирный',   team: 'civilian', color: '#6b7280', desc: 'Обычный житель города' },
};

// ─── Settings ───

export interface RoleConfig {
  mafiaCount: number;
  don: boolean;
  commissioner: boolean;
  doctor: boolean;
  maniac: boolean;
  advocate: boolean;
}

export interface TimerConfig {
  enabled: boolean;
  nightActionSeconds: number;
  discussionSeconds: number;
  votingSeconds: number;
  lastWordSeconds: number;
}

export interface RoomSettings {
  roles: RoleConfig;
  timers: TimerConfig;
  votingType: VotingType;
  revealRoleOnDeath: boolean;
  narration: boolean;
}

export const DEFAULT_SETTINGS: RoomSettings = {
  roles: { mafiaCount: 2, don: true, commissioner: true, doctor: true, maniac: false, advocate: false },
  timers: { enabled: true, nightActionSeconds: 30, discussionSeconds: 120, votingSeconds: 60, lastWordSeconds: 30 },
  votingType: 'open',
  revealRoleOnDeath: true,
  narration: true,
};

// ─── Player ───

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isAlive: boolean;
  isConnected: boolean;
  role: Role | null;
  avatarColor: string;
}

// ─── Night Actions ───

export interface NightActions {
  mafiaTarget: string | null;
  mafiaVotes: Record<string, string>;  // mafiaPlayerId → targetId
  donCheck: string | null;
  donResult: boolean | null;           // true = target is commissioner
  advocateTarget: string | null;
  maniacTarget: string | null;
  commissionerCheck: string | null;
  commissionerResult: boolean | null;  // true = target is mafia
  doctorTarget: string | null;
  doctorLastTarget: string | null;     // can't heal same person twice
}

export const EMPTY_NIGHT_ACTIONS: NightActions = {
  mafiaTarget: null, mafiaVotes: {},
  donCheck: null, donResult: null,
  advocateTarget: null,
  maniacTarget: null,
  commissionerCheck: null, commissionerResult: null,
  doctorTarget: null, doctorLastTarget: null,
};

// ─── Night Result (shown on day) ───

export interface NightResult {
  killedByMafia: string | null;
  killedByManiac: string | null;
  savedByDoctor: string[];
  actuallyDied: string[];
}

// ─── Vote State ───

export interface VoteState {
  votes: Record<string, string | null>;   // voterId → targetId (null = skip)
  confirmed: Record<string, boolean>;
}

// ─── Round History ───

export interface RoundHistory {
  round: number;
  nightResult: NightResult;
  votedOut: string | null;
  votedOutRole: Role | null;
}

// ─── Full Game State (host-side) ───

export interface GameState {
  phase: GamePhase;
  round: number;
  nightActions: NightActions;
  voteState: VoteState;
  nightResult: NightResult | null;
  lastVotedOutId: string | null;
  history: RoundHistory[];
  winner: Winner;
  readyPlayers: Set<string>;
  phaseTimerEnd: number | null;   // unix ms
}

// ─── Client Game State (what player sees) ───

export interface ClientGameState {
  phase: GamePhase;
  round: number;
  myPlayerId: string;
  myRole: Role | null;
  players: Pick<Player, 'id' | 'name' | 'isAlive' | 'isHost' | 'avatarColor' | 'isConnected'>[];
  myTeam?: { id: string; name: string; role: Role }[];
  timerEnd: number | null;
  nightResult?: NightResult;
  voteState?: {
    votes: Record<string, string | null>;
    confirmed: Record<string, boolean>;
    votingType: VotingType;
  };
  /** Check result for don/commissioner. Stays visible until the player explicitly acknowledges. */
  checkResult?: { targetId: string; targetName: string; result: string; positive: boolean };
  /** True when current player has submitted a night action and is waiting for confirmation/advance */
  actionSubmitted?: boolean;
  /** Doctor's previous target — UI disables this option (can't heal same person twice) */
  doctorLastTarget?: string | null;
  lastVotedOutId?: string | null;
  /** Role of the just-voted-out player (only set after vote_result if revealRoleOnDeath is on) */
  lastVotedOutRole?: Role | null;
  /** Role of just-killed players during night (set for day_results if revealRoleOnDeath is on) */
  nightDeathRoles?: Record<string, Role>;
  canAct: boolean;
  waitingFor?: string;
  winner: Winner;
  allRoles?: Record<string, Role>;
  playerDeaths?: Record<string, string>;
  readyCount?: number;
  totalCount?: number;
  settings: RoomSettings;
}

// ─── P2P Messages ───

export type PlayerMessageType = 'JOIN' | 'ACTION' | 'ACK' | 'VOTE' | 'READY' | 'PING';
export type HostMessageType = 'STATE_UPDATE' | 'ROLE_ASSIGN' | 'ERROR' | 'PONG' | 'KICKED' | 'SETTINGS_UPDATE' | 'WELCOME';

export interface PlayerMessage {
  type: PlayerMessageType;
  payload: any;
}

export interface HostMessage {
  type: HostMessageType;
  payload: any;
}

// ─── Action payloads ───

export interface NightActionPayload {
  phase: GamePhase;
  targetId: string | null;
}

export interface VotePayload {
  targetId: string | null;  // null = skip
}
