import type { HostMessage, PlayerMessage, ClientGameState, RoomSettings } from '../types';
import { createOffer, type OffererHandle } from './lanSignaling';

export class ClientManager {
  private handle: OffererHandle | null = null;
  playerName: string;
  playerId: string = '';
  private onStateUpdate: (state: ClientGameState) => void;
  private onSettingsUpdate: (settings: RoomSettings) => void;
  private onError: (msg: string) => void;
  private onKicked: () => void;
  private onDisconnect: () => void;
  private onConnect: () => void;
  private onWelcome: (playerId: string) => void;

  constructor(
    playerName: string,
    callbacks: {
      onStateUpdate: (state: ClientGameState) => void;
      onSettingsUpdate: (settings: RoomSettings) => void;
      onError: (msg: string) => void;
      onKicked: () => void;
      onDisconnect: () => void;
      onConnect: () => void;
      onWelcome?: (playerId: string) => void;
    }
  ) {
    this.playerName = playerName;
    this.onStateUpdate = callbacks.onStateUpdate;
    this.onSettingsUpdate = callbacks.onSettingsUpdate;
    this.onError = callbacks.onError;
    this.onKicked = callbacks.onKicked;
    this.onDisconnect = callbacks.onDisconnect;
    this.onConnect = callbacks.onConnect;
    this.onWelcome = callbacks.onWelcome || (() => {});
  }

  /**
   * Generate an encoded offer for the host to scan. The data channel doesn't open
   * until the host returns an answer (via {@link acceptHostAnswer}) and ICE completes.
   */
  async generateOffer(): Promise<string> {
    if (this.handle) {
      // Reset any prior attempt cleanly.
      try { this.handle.channel.close(); } catch { /* noop */ }
      try { this.handle.pc.close(); } catch { /* noop */ }
    }

    this.handle = await createOffer(this.playerName);
    const ch = this.handle.channel;

    ch.addEventListener('open', () => this.onConnect());
    ch.addEventListener('close', () => this.onDisconnect());
    ch.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse((ev as MessageEvent).data as string) as HostMessage;
        this.handleMessage(msg);
      } catch {
        // ignore malformed messages
      }
    });

    return this.handle.offer;
  }

  async acceptHostAnswer(encodedAnswer: string): Promise<void> {
    if (!this.handle) throw new Error('Сначала сгенерируйте оффер');
    await this.handle.acceptAnswer(encodedAnswer);
  }

  whenOpen(): Promise<void> {
    if (!this.handle) return Promise.reject(new Error('Нет активного соединения'));
    return this.handle.whenOpen;
  }

  private handleMessage(msg: HostMessage) {
    switch (msg.type) {
      case 'STATE_UPDATE':
        this.onStateUpdate(msg.payload as ClientGameState);
        break;
      case 'WELCOME':
        this.playerId = msg.payload.playerId;
        this.onWelcome(this.playerId);
        break;
      case 'SETTINGS_UPDATE':
        this.onSettingsUpdate(msg.payload as RoomSettings);
        break;
      case 'KICKED':
        this.onKicked();
        break;
      case 'ERROR':
        this.onError(msg.payload.message);
        break;
      case 'PONG':
        break;
    }
  }

  // ─── Send actions to host ───

  sendAction(targetId: string | null) {
    this.send({ type: 'ACTION', payload: { targetId } });
  }

  sendAck() {
    this.send({ type: 'ACK', payload: {} });
  }

  sendVote(targetId: string | null) {
    this.send({ type: 'VOTE', payload: { targetId } });
  }

  sendReady() {
    this.send({ type: 'READY', payload: {} });
  }

  private send(msg: PlayerMessage) {
    const ch = this.handle?.channel;
    if (!ch || ch.readyState !== 'open') return;
    try {
      ch.send(JSON.stringify(msg));
    } catch {
      // ignore
    }
  }

  destroy() {
    if (!this.handle) return;
    try { this.handle.channel.close(); } catch { /* noop */ }
    try { this.handle.pc.close(); } catch { /* noop */ }
    this.handle = null;
  }
}
