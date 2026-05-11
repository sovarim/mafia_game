import type {
  GameState, GamePhase, Player, RoomSettings,
  ClientGameState, Role, Winner,
} from '../types';
import { ROLE_META } from '../types';
import { distributeRoles } from './roleDistributor';
import { resolveNight, resolveCommissionerCheck, resolveDonCheck } from './nightResolver';
import { resolveVotes } from './voteResolver';
import { checkWin } from './winChecker';
import { NIGHT_PHASE_ORDER, NIGHT_PHASE_LABELS, NARRATION_PHRASES, DEAD_ROLE_PAUSE } from '../utils/constants';
import { narrator } from '../audio/narrator';

export class GameEngine {
  players: Player[] = [];
  settings: RoomSettings;
  state: GameState;
  /** Per-player set of action submissions (for the current night phase). */
  private acted: Set<string> = new Set();
  private onStateChange: (state: GameState) => void;

  constructor(settings: RoomSettings, onStateChange: (s: GameState) => void) {
    this.settings = settings;
    this.onStateChange = onStateChange;
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'lobby',
      round: 0,
      nightActions: {
        mafiaTarget: null, mafiaVotes: {},
        donCheck: null, donResult: null,
        advocateTarget: null,
        maniacTarget: null,
        commissionerCheck: null, commissionerResult: null,
        doctorTarget: null, doctorLastTarget: null,
      },
      voteState: { votes: {}, confirmed: {} },
      nightResult: null,
      lastVotedOutId: null,
      history: [],
      winner: null,
      readyPlayers: new Set(),
      phaseTimerEnd: null,
    };
  }

  private emit() { this.onStateChange(this.state); }

  private speak(text: string) {
    if (this.settings.narration) narrator.speak(text).catch(() => {});
  }

  // ─── Game Start ───

  startGame() {
    const roles = distributeRoles(this.players.length, this.settings.roles);
    this.players.forEach((p, i) => { p.role = roles[i]; p.isAlive = true; });
    this.state.phase = 'role_reveal';
    this.state.readyPlayers = new Set();
    this.emit();
  }

  playerReady(playerId: string) {
    this.state.readyPlayers.add(playerId);
    const aliveCount = this.players.filter(p => p.isAlive).length;
    if (this.state.readyPlayers.size >= aliveCount) {
      if (this.state.phase === 'role_reveal') this.startNight();
    }
    this.emit();
  }

  // ─── Night ───

  startNight() {
    this.state.round++;
    const prevDoctor = this.state.nightActions.doctorTarget;
    this.state.nightActions = {
      mafiaTarget: null, mafiaVotes: {},
      donCheck: null, donResult: null,
      advocateTarget: null,
      maniacTarget: null,
      commissionerCheck: null, commissionerResult: null,
      doctorTarget: null,
      doctorLastTarget: prevDoctor,
    };
    this.state.phase = 'night_start';
    this.state.nightResult = null;
    this.state.readyPlayers = new Set();
    this.state.phaseTimerEnd = null;
    this.acted = new Set();
    this.emit();
    this.speak(NARRATION_PHRASES.night_start[0]);

    setTimeout(() => this.advanceNightPhase(), 2200);
  }

  /** Host (or active player) acknowledges they've seen the current night phase result and wants to move on. */
  acknowledgeNightPhase(playerId: string) {
    const phase = this.state.phase;
    if (!phase.startsWith('night_')) return;

    // Only the role's player (or all mafia for mafia phase) can advance.
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) return;

    const isAuthorized = this.isPlayerActiveInPhase(player, phase);
    if (!isAuthorized) return;

    this.advanceNightPhase();
  }

  private isPlayerActiveInPhase(player: Player, phase: GamePhase): boolean {
    if (!player.role) return false;
    switch (phase) {
      case 'night_mafia':        return ['mafia', 'don'].includes(player.role);
      case 'night_don':          return player.role === 'don';
      case 'night_advocate':     return player.role === 'advocate';
      case 'night_maniac':       return player.role === 'maniac';
      case 'night_commissioner': return player.role === 'commissioner';
      case 'night_doctor':       return player.role === 'doctor';
      default: return false;
    }
  }

  advanceNightPhase() {
    // Speak "fall asleep" for outgoing phase if it was active
    const prev = this.state.phase;
    if (prev !== 'night_start' && NIGHT_PHASE_ORDER.includes(prev as any)) {
      const lines = NARRATION_PHRASES[prev];
      if (lines?.[1]) this.speak(lines[1]);
    }

    const currentIdx = NIGHT_PHASE_ORDER.indexOf(prev as any);
    const startIdx = currentIdx < 0 ? 0 : currentIdx + 1;

    for (let i = startIdx; i < NIGHT_PHASE_ORDER.length; i++) {
      const phase = NIGHT_PHASE_ORDER[i];
      const active = this.isNightPhaseActive(phase);

      if (active) {
        this.state.phase = phase;
        this.state.phaseTimerEnd = this.settings.timers.enabled
          ? Date.now() + this.settings.timers.nightActionSeconds * 1000
          : null;
        this.acted = new Set();
        this.emit();
        const lines = NARRATION_PHRASES[phase];
        if (lines?.[0]) this.speak(lines[0]);
        return;
      } else {
        // Dead role — still pause to hide which roles are alive.
        this.state.phase = phase;
        this.state.phaseTimerEnd = null;
        this.emit();
        const lines = NARRATION_PHRASES[phase];
        if (lines?.[0]) this.speak(lines[0]);
        // Schedule continuation
        setTimeout(() => {
          if (this.state.phase === phase) {
            if (lines?.[1]) this.speak(lines[1]);
            // Continue advancing (use synchronous loop)
            this.continueFromInactivePhase(phase);
          }
        }, DEAD_ROLE_PAUSE);
        return;
      }
    }

    // All night phases done — resolve
    this.resolveNightActions();
  }

  private continueFromInactivePhase(prev: GamePhase) {
    const currentIdx = NIGHT_PHASE_ORDER.indexOf(prev as any);
    for (let i = currentIdx + 1; i < NIGHT_PHASE_ORDER.length; i++) {
      const phase = NIGHT_PHASE_ORDER[i];
      const active = this.isNightPhaseActive(phase);
      if (active) {
        this.state.phase = phase;
        this.state.phaseTimerEnd = this.settings.timers.enabled
          ? Date.now() + this.settings.timers.nightActionSeconds * 1000
          : null;
        this.acted = new Set();
        this.emit();
        const lines = NARRATION_PHRASES[phase];
        if (lines?.[0]) this.speak(lines[0]);
        return;
      } else {
        this.state.phase = phase;
        this.state.phaseTimerEnd = null;
        this.emit();
        const lines = NARRATION_PHRASES[phase];
        if (lines?.[0]) this.speak(lines[0]);
        setTimeout(() => {
          if (this.state.phase === phase) {
            if (lines?.[1]) this.speak(lines[1]);
            this.continueFromInactivePhase(phase);
          }
        }, DEAD_ROLE_PAUSE);
        return;
      }
    }
    this.resolveNightActions();
  }

  private isNightPhaseActive(phase: string): boolean {
    const alive = this.players.filter(p => p.isAlive);
    switch (phase) {
      case 'night_mafia':        return alive.some(p => ['mafia', 'don'].includes(p.role!));
      case 'night_don':          return alive.some(p => p.role === 'don');
      case 'night_advocate':     return alive.some(p => p.role === 'advocate');
      case 'night_maniac':       return alive.some(p => p.role === 'maniac');
      case 'night_commissioner': return alive.some(p => p.role === 'commissioner');
      case 'night_doctor':       return alive.some(p => p.role === 'doctor');
      default: return false;
    }
  }

  submitNightAction(playerId: string, targetId: string | null) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) return;
    if (!this.isPlayerActiveInPhase(player, this.state.phase)) return;

    switch (this.state.phase) {
      case 'night_mafia':
        if (targetId) this.state.nightActions.mafiaVotes[playerId] = targetId;
        this.acted.add(playerId);
        this.emit();
        // Advance only when every alive mafia member has voted
        if (this.isPhaseActionSubmitted()) {
          this.advanceNightPhase();
        }
        return;

      case 'night_don':
        // Result reveal — wait for player to ACK before advancing.
        this.state.nightActions.donCheck = targetId;
        if (targetId) {
          this.state.nightActions.donResult = resolveDonCheck(targetId, this.players);
        }
        this.acted.add(playerId);
        this.emit();
        return;

      case 'night_advocate':
        this.state.nightActions.advocateTarget = targetId;
        this.acted.add(playerId);
        this.emit();
        this.advanceNightPhase();
        return;

      case 'night_maniac':
        this.state.nightActions.maniacTarget = targetId;
        this.acted.add(playerId);
        this.emit();
        this.advanceNightPhase();
        return;

      case 'night_commissioner':
        // Result reveal — wait for player to ACK before advancing.
        this.state.nightActions.commissionerCheck = targetId;
        if (targetId) {
          this.state.nightActions.commissionerResult = resolveCommissionerCheck(
            targetId, this.players, this.state.nightActions.advocateTarget
          );
        }
        this.acted.add(playerId);
        this.emit();
        return;

      case 'night_doctor':
        if (targetId && targetId === this.state.nightActions.doctorLastTarget) {
          return;
        }
        this.state.nightActions.doctorTarget = targetId;
        this.acted.add(playerId);
        this.emit();
        this.advanceNightPhase();
        return;
    }
  }

  /** Has the active player(s) for this phase submitted? Used to enable the "Confirm" UI on host. */
  isPhaseActionSubmitted(): boolean {
    const phase = this.state.phase;
    const aliveActors = this.players.filter(p => p.isAlive && this.isPlayerActiveInPhase(p, phase));
    if (aliveActors.length === 0) return false;
    return aliveActors.every(p => this.acted.has(p.id));
  }

  private resolveNightActions() {
    const result = resolveNight(this.state.nightActions, this.players);
    this.state.nightResult = result;

    for (const deadId of result.actuallyDied) {
      const p = this.players.find(pp => pp.id === deadId);
      if (p) p.isAlive = false;
    }

    this.recordRoundHistoryNightOnly();

    const winner = checkWin(this.players);
    if (winner) {
      this.state.winner = winner;
      this.state.phase = 'game_over';
      this.state.phaseTimerEnd = null;
      this.emit();
      this.speak(this.winnerLine(winner));
      return;
    }

    this.state.phase = 'day_results';
    this.state.phaseTimerEnd = null;
    this.emit();
    this.speak(NARRATION_PHRASES.day_start[0]);
    if (result.actuallyDied.length > 0) {
      const names = result.actuallyDied
        .map(id => this.players.find(p => p.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      setTimeout(() => this.speak(`Этой ночью погиб: ${names}`), 1500);
    } else {
      setTimeout(() => this.speak('Этой ночью никто не погиб'), 1500);
    }
  }

  private recordRoundHistoryNightOnly() {
    // Pre-record so DeadScreen can show "Убит ночью N" before game ends.
    this.state.history.push({
      round: this.state.round,
      nightResult: this.state.nightResult!,
      votedOut: null,
      votedOutRole: null,
    });
  }

  private winnerLine(w: Winner): string {
    if (w === 'mafia') return 'Мафия победила. Город пал.';
    if (w === 'civilian') return 'Мирные жители победили. Город спасён.';
    if (w === 'maniac') return 'Маньяк победил. Город опустел.';
    return '';
  }

  // ─── Day ───

  startDiscussion() {
    this.state.phase = 'day_discussion';
    this.state.phaseTimerEnd = this.settings.timers.enabled
      ? Date.now() + this.settings.timers.discussionSeconds * 1000
      : null;
    this.emit();
    this.speak('Начинается обсуждение');
  }

  startVoting() {
    this.state.phase = 'day_voting';
    this.state.voteState = { votes: {}, confirmed: {} };
    this.state.phaseTimerEnd = this.settings.timers.enabled
      ? Date.now() + this.settings.timers.votingSeconds * 1000
      : null;
    this.emit();
    this.speak('Прошу голосовать');
  }

  submitVote(playerId: string, targetId: string | null) {
    if (this.state.phase !== 'day_voting') return;
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) return;

    this.state.voteState.votes[playerId] = targetId;
    this.state.voteState.confirmed[playerId] = true;
    this.emit();
  }

  /** Host explicitly closes voting (or all players have voted). */
  closeVoting() {
    if (this.state.phase !== 'day_voting') return;
    this.finalizeVoting();
  }

  private finalizeVoting() {
    const result = resolveVotes(this.state.voteState, this.players);
    this.state.lastVotedOutId = result.votedOutId;
    this.state.phase = 'day_vote_result';
    this.state.phaseTimerEnd = null;
    this.emit();
    if (result.votedOutId) {
      const name = this.players.find(p => p.id === result.votedOutId)?.name;
      this.speak(`Город изгоняет: ${name}`);
    } else {
      this.speak('Голосование завершилось без изгнания');
    }
  }

  proceedAfterVoteResult() {
    if (this.state.lastVotedOutId) {
      const p = this.players.find(pp => pp.id === this.state.lastVotedOutId);
      if (p) {
        this.state.phase = 'day_last_word';
        this.state.phaseTimerEnd = this.settings.timers.enabled
          ? Date.now() + this.settings.timers.lastWordSeconds * 1000
          : null;
        this.emit();
        this.speak(`${p.name}, прощальное слово`);
        return;
      }
    }
    this.startNight();
  }

  proceedAfterLastWord() {
    if (this.state.lastVotedOutId) {
      const p = this.players.find(pp => pp.id === this.state.lastVotedOutId);
      if (p) p.isAlive = false;

      // Update the last history entry with vote result
      const lastHist = this.state.history[this.state.history.length - 1];
      if (lastHist && lastHist.round === this.state.round) {
        lastHist.votedOut = this.state.lastVotedOutId;
        lastHist.votedOutRole = p?.role || null;
      }
    }

    const winner = checkWin(this.players);
    if (winner) {
      this.state.winner = winner;
      this.state.phase = 'game_over';
      this.state.phaseTimerEnd = null;
      this.emit();
      this.speak(this.winnerLine(winner));
      return;
    }

    this.startNight();
  }

  // ─── Client State Builder ───

  buildClientState(playerId: string): ClientGameState {
    const player = this.players.find(p => p.id === playerId);
    const myRole = player?.role || null;
    const isMafia = myRole && ROLE_META[myRole].team === 'mafia';

    const cs: ClientGameState = {
      phase: this.state.phase,
      round: this.state.round,
      myPlayerId: playerId,
      myRole,
      players: this.players.map(p => ({
        id: p.id, name: p.name, isAlive: p.isAlive,
        isHost: p.isHost, avatarColor: p.avatarColor, isConnected: p.isConnected,
      })),
      timerEnd: this.state.phaseTimerEnd,
      canAct: this.canPlayerAct(playerId),
      winner: this.state.winner,
      settings: this.settings,
      readyCount: this.state.readyPlayers.size,
      totalCount: this.players.length,
      lastVotedOutId: this.state.lastVotedOutId,
      actionSubmitted: this.acted.has(playerId),
    };

    if (isMafia) {
      cs.myTeam = this.players
        .filter(p => ROLE_META[p.role!]?.team === 'mafia')
        .map(p => ({ id: p.id, name: p.name, role: p.role! }));
    }

    if (this.state.phase.startsWith('night_') && !this.canPlayerAct(playerId)) {
      cs.waitingFor = NIGHT_PHASE_LABELS[this.state.phase] || 'Город спит...';
    }

    if (this.state.phase === 'night_mafia' && isMafia) {
      cs.voteState = {
        votes: this.state.nightActions.mafiaVotes,
        confirmed: {},
        votingType: 'open',
      };
    }

    if (this.state.phase === 'night_doctor' && myRole === 'doctor') {
      cs.doctorLastTarget = this.state.nightActions.doctorLastTarget;
    }

    if (this.state.phase === 'night_don' && myRole === 'don' && this.state.nightActions.donResult !== null) {
      const target = this.players.find(p => p.id === this.state.nightActions.donCheck);
      cs.checkResult = {
        targetId: this.state.nightActions.donCheck!,
        targetName: target?.name || '',
        result: this.state.nightActions.donResult ? 'Это Комиссар' : 'Не Комиссар',
        positive: this.state.nightActions.donResult,
      };
    }
    if (this.state.phase === 'night_commissioner' && myRole === 'commissioner' && this.state.nightActions.commissionerResult !== null) {
      const target = this.players.find(p => p.id === this.state.nightActions.commissionerCheck);
      cs.checkResult = {
        targetId: this.state.nightActions.commissionerCheck!,
        targetName: target?.name || '',
        result: this.state.nightActions.commissionerResult ? 'Это Мафия' : 'Мирный житель',
        positive: this.state.nightActions.commissionerResult,
      };
    }

    if (this.state.nightResult && ['day_results', 'day_discussion', 'day_voting', 'day_vote_result', 'day_last_word'].includes(this.state.phase)) {
      cs.nightResult = this.state.nightResult;
      if (this.settings.revealRoleOnDeath) {
        const roles: Record<string, Role> = {};
        for (const id of this.state.nightResult.actuallyDied) {
          const p = this.players.find(pp => pp.id === id);
          if (p?.role) roles[id] = p.role;
        }
        cs.nightDeathRoles = roles;
      }
    }

    if (this.state.phase === 'day_last_word' && this.state.lastVotedOutId && this.settings.revealRoleOnDeath) {
      const lv = this.players.find(p => p.id === this.state.lastVotedOutId);
      if (lv?.role) cs.lastVotedOutRole = lv.role;
    }
    if (this.state.phase === 'day_vote_result' && this.state.lastVotedOutId && this.settings.revealRoleOnDeath) {
      const lv = this.players.find(p => p.id === this.state.lastVotedOutId);
      if (lv?.role) cs.lastVotedOutRole = lv.role;
    }

    if (['day_voting', 'day_vote_result'].includes(this.state.phase)) {
      cs.voteState = {
        votes: this.settings.votingType === 'open' || this.state.phase === 'day_vote_result'
          ? this.state.voteState.votes
          : {},
        confirmed: this.state.voteState.confirmed,
        votingType: this.settings.votingType,
      };
    }

    if (this.state.phase === 'game_over') {
      cs.allRoles = {};
      cs.playerDeaths = {};
      for (const p of this.players) {
        if (p.role) cs.allRoles[p.id] = p.role;
        if (!p.isAlive) {
          const hist = this.state.history.find(h =>
            h.nightResult.actuallyDied.includes(p.id) || h.votedOut === p.id
          );
          if (hist) {
            cs.playerDeaths[p.id] = hist.nightResult.actuallyDied.includes(p.id)
              ? `Убит ночью ${hist.round}`
              : `Изгнан днём ${hist.round}`;
          }
        }
      }
    }

    return cs;
  }

  private canPlayerAct(playerId: string): boolean {
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.isAlive || !player.role) return false;

    switch (this.state.phase) {
      case 'night_mafia':        return ['mafia', 'don'].includes(player.role);
      case 'night_don':          return player.role === 'don';
      case 'night_advocate':     return player.role === 'advocate';
      case 'night_maniac':       return player.role === 'maniac';
      case 'night_commissioner': return player.role === 'commissioner';
      case 'night_doctor':       return player.role === 'doctor';
      case 'day_voting':         return true;
      case 'role_reveal':        return !this.state.readyPlayers.has(playerId);
      default: return false;
    }
  }

  // ─── Utility ───

  updateSettings(settings: RoomSettings) {
    this.settings = settings;
    narrator.setEnabled(settings.narration);
  }

  resetForNewGame() {
    this.state = this.createInitialState();
    this.acted = new Set();
    this.players.forEach(p => { p.role = null; p.isAlive = true; });
    this.emit();
  }
}
