import type { Player, RoomSettings, PlayerMessage, HostMessage, ClientGameState } from '../types';
import { AVATAR_COLORS } from '../utils/constants';
import { GameEngine } from '../engine/gameEngine';
import { acceptOffer } from './lanSignaling';

interface PeerSlot {
  playerId: string;
  pc: RTCPeerConnection;
  channel: RTCDataChannel | null;
}

export class HostManager {
  engine: GameEngine;
  private peers = new Map<string, PeerSlot>(); // by playerId
  private hostPlayer: Player;
  private playerIdCounter = 0;
  private onPlayersChange: (players: Player[]) => void;
  private onStateChange: (state: ClientGameState, playerId: string) => void;
  private onError: (msg: string) => void;

  constructor(
    hostName: string,
    settings: RoomSettings,
    callbacks: {
      onPlayersChange: (players: Player[]) => void;
      onStateChange: (state: ClientGameState, playerId: string) => void;
      onError: (msg: string) => void;
    }
  ) {
    this.onPlayersChange = callbacks.onPlayersChange;
    this.onStateChange = callbacks.onStateChange;
    this.onError = callbacks.onError;

    this.hostPlayer = {
      id: 'host',
      name: hostName,
      isHost: true,
      isAlive: true,
      isConnected: true,
      role: null,
      avatarColor: AVATAR_COLORS[0],
    };

    this.engine = new GameEngine(settings, () => this.broadcastState());
    this.engine.players = [this.hostPlayer];
  }

  start() {
    this.onPlayersChange([...this.engine.players]);
  }

  private nextPlayerId(): string {
    return `p${++this.playerIdCounter}`;
  }

  /**
   * Process a player's offer (decoded from QR), produce an answer (to be shown as QR),
   * and resolve the join in the engine once the data channel actually opens.
   *
   * Returns the encoded answer immediately so the UI can render it as a QR for the
   * player to scan back. The `connected` promise resolves when the player is fully
   * joined to the lobby.
   */
  async acceptPlayerOffer(encodedOffer: string): Promise<{
    answer: string;
    playerName: string;
    connected: Promise<void>;
  }> {
    const { pc, channel, answer, playerName } = await acceptOffer(encodedOffer);

    // Validate name against current roster (and pending peers).
    if (this.engine.players.some(p => p.name === playerName && p.isConnected)) {
      pc.close();
      throw new Error('Имя уже занято');
    }

    let resumingPlayerId: string | null = null;
    if (this.engine.state.phase !== 'lobby') {
      const existing = this.engine.players.find(p => p.name === playerName && !p.isConnected);
      if (!existing) {
        pc.close();
        throw new Error('Игра уже началась');
      }
      resumingPlayerId = existing.id;
    }

    const playerId = resumingPlayerId ?? this.nextPlayerId();
    const slot: PeerSlot = { playerId, pc, channel: null };
    this.peers.set(playerId, slot);

    const connected = channel.then((ch) => {
      slot.channel = ch;

      if (resumingPlayerId) {
        const p = this.engine.players.find(pl => pl.id === resumingPlayerId);
        if (p) { p.isConnected = true; }
      } else {
        const player: Player = {
          id: playerId,
          name: playerName,
          isHost: false,
          isAlive: true,
          isConnected: true,
          role: null,
          avatarColor: AVATAR_COLORS[this.engine.players.length % AVATAR_COLORS.length],
        };
        this.engine.players.push(player);
      }

      ch.addEventListener('message', (ev) => {
        try {
          const msg = JSON.parse((ev as MessageEvent).data as string) as PlayerMessage;
          this.handleMessage(playerId, msg);
        } catch {
          // ignore malformed messages
        }
      });
      ch.addEventListener('close', () => this.handleDisconnect(playerId));

      this.sendTo(playerId, { type: 'WELCOME', payload: { playerId } });
      this.onPlayersChange([...this.engine.players]);
      this.broadcastState();
    }).catch((err) => {
      // Connection never opened — clean up.
      this.peers.delete(playerId);
      try { pc.close(); } catch { /* noop */ }
      throw err;
    });

    return { answer, playerName, connected };
  }

  private handleMessage(playerId: string, msg: PlayerMessage) {
    switch (msg.type) {
      case 'ACTION':
        this.engine.submitNightAction(playerId, msg.payload.targetId);
        break;
      case 'ACK':
        this.engine.acknowledgeNightPhase(playerId);
        break;
      case 'VOTE':
        this.engine.submitVote(playerId, msg.payload.targetId);
        break;
      case 'READY':
        this.engine.playerReady(playerId);
        break;
      case 'PING':
        this.sendTo(playerId, { type: 'PONG', payload: {} });
        break;
    }
  }

  private handleDisconnect(playerId: string) {
    const player = this.engine.players.find(p => p.id === playerId);
    if (!player) return;
    player.isConnected = false;
    this.peers.delete(playerId);
    this.onPlayersChange([...this.engine.players]);
    this.broadcastState();
  }

  // ─── Host actions (called from UI) ───

  hostAction(action: string, payload?: any) {
    switch (action) {
      case 'START_GAME':       this.engine.startGame(); break;
      case 'READY':            this.engine.playerReady('host'); break;
      case 'NIGHT_ACTION':     this.engine.submitNightAction('host', payload?.targetId); break;
      case 'NIGHT_ACK':        this.engine.acknowledgeNightPhase(payload?.playerId || 'host'); break;
      case 'VOTE':             this.engine.submitVote('host', payload?.targetId); break;
      case 'CLOSE_VOTING':     this.engine.closeVoting(); break;
      case 'START_DISCUSSION': this.engine.startDiscussion(); break;
      case 'START_VOTING':     this.engine.startVoting(); break;
      case 'PROCEED_VOTE':     this.engine.proceedAfterVoteResult(); break;
      case 'PROCEED_LAST':     this.engine.proceedAfterLastWord(); break;
      case 'NEW_GAME':         this.engine.resetForNewGame(); break;
    }
  }

  kickPlayer(playerId: string) {
    const slot = this.peers.get(playerId);
    if (slot) {
      if (slot.channel) this.sendTo(playerId, { type: 'KICKED', payload: {} });
      try { slot.channel?.close(); } catch { /* noop */ }
      try { slot.pc.close(); } catch { /* noop */ }
      this.peers.delete(playerId);
    }
    this.engine.players = this.engine.players.filter(p => p.id !== playerId);
    this.onPlayersChange([...this.engine.players]);
    this.broadcastState();
  }

  updateSettings(settings: RoomSettings) {
    this.engine.updateSettings(settings);
    for (const playerId of this.peers.keys()) {
      this.sendTo(playerId, { type: 'SETTINGS_UPDATE', payload: settings });
    }
  }

  // ─── Broadcast ───

  private broadcastState() {
    for (const [playerId] of this.peers) {
      const clientState = this.engine.buildClientState(playerId);
      this.sendTo(playerId, { type: 'STATE_UPDATE', payload: clientState });
      this.onStateChange(clientState, playerId);
    }
    const hostState = this.engine.buildClientState('host');
    this.onStateChange(hostState, 'host');
  }

  private sendTo(playerId: string, msg: HostMessage) {
    const slot = this.peers.get(playerId);
    if (!slot?.channel) return;
    if (slot.channel.readyState !== 'open') return;
    try {
      slot.channel.send(JSON.stringify(msg));
    } catch {
      // ignore send errors
    }
  }

  destroy() {
    for (const [, slot] of this.peers) {
      try { slot.channel?.close(); } catch { /* noop */ }
      try { slot.pc.close(); } catch { /* noop */ }
    }
    this.peers.clear();
  }
}
