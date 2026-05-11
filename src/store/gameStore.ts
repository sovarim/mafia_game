import { create } from 'zustand';
import type { ClientGameState, RoomSettings, Player } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { HostManager } from '../network/hostManager';
import { ClientManager } from '../network/clientManager';
import { narrator } from '../audio/narrator';

type AppMode = 'home' | 'host' | 'client';

interface GameStore {
  mode: AppMode;
  myName: string;
  myPlayerId: string;
  isConnected: boolean;
  error: string | null;

  gameState: ClientGameState | null;
  settings: RoomSettings;
  players: Player[];

  hostManager: HostManager | null;
  clientManager: ClientManager | null;

  setName: (name: string) => void;
  createRoom: (name: string, settings: RoomSettings) => Promise<void>;
  /** Generates an offer (encoded). UI shows it as a QR for the host to scan. */
  joinRoom: (name: string) => Promise<string>;
  /** After host returns an answer (also encoded), feed it back here. */
  acceptAnswer: (encodedAnswer: string) => Promise<void>;
  /** Resolves once the data channel actually opens. */
  whenOpen: () => Promise<void>;
  leaveRoom: () => void;

  hostAction: (action: string, payload?: any) => void;
  kickPlayer: (playerId: string) => void;
  updateSettings: (settings: RoomSettings) => void;

  sendAction: (targetId: string | null) => void;
  sendAck: () => void;
  sendVote: (targetId: string | null) => void;
  sendReady: () => void;

  clearError: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  mode: 'home',
  myName: '',
  myPlayerId: '',
  isConnected: false,
  error: null,
  gameState: null,
  settings: DEFAULT_SETTINGS,
  players: [],
  hostManager: null,
  clientManager: null,

  setName: (name) => set({ myName: name }),
  clearError: () => set({ error: null }),

  createRoom: async (name, settings) => {
    const host = new HostManager(name, settings, {
      onPlayersChange: (players) => set({ players: [...players] }),
      onStateChange: (state, playerId) => {
        if (playerId === 'host') set({ gameState: state });
      },
      onError: (msg) => set({ error: msg }),
    });
    host.start();
    narrator.setEnabled(settings.narration);
    set({
      mode: 'host',
      myName: name,
      myPlayerId: 'host',
      isConnected: true,
      hostManager: host,
      settings,
      error: null,
    });
  },

  joinRoom: async (name) => {
    const prev = get().clientManager;
    if (prev) prev.destroy();

    const client = new ClientManager(name, {
      onStateUpdate: (state) => set({
        gameState: state,
        players: state.players as Player[],
        settings: state.settings,
      }),
      onSettingsUpdate: (settings) => set({ settings }),
      onError: (msg) => set({ error: msg }),
      onKicked: () => {
        get().leaveRoom();
        set({ error: 'Вы были исключены из комнаты' });
      },
      onDisconnect: () => set({ isConnected: false, error: 'Соединение потеряно' }),
      onConnect: () => set({ mode: 'client', isConnected: true }),
      onWelcome: (playerId) => set({ myPlayerId: playerId }),
    });

    const offer = await client.generateOffer();
    set({ clientManager: client, myName: name, error: null });
    return offer;
  },

  acceptAnswer: async (encodedAnswer) => {
    const client = get().clientManager;
    if (!client) throw new Error('Соединение не инициализировано');
    await client.acceptHostAnswer(encodedAnswer);
  },

  whenOpen: () => {
    const client = get().clientManager;
    if (!client) return Promise.reject(new Error('Нет соединения'));
    return client.whenOpen();
  },

  leaveRoom: () => {
    const { hostManager, clientManager } = get();
    hostManager?.destroy();
    clientManager?.destroy();
    set({
      mode: 'home',
      isConnected: false,
      gameState: null,
      players: [],
      hostManager: null,
      clientManager: null,
    });
  },

  hostAction: (action, payload) => {
    get().hostManager?.hostAction(action, payload);
  },

  kickPlayer: (playerId) => {
    get().hostManager?.kickPlayer(playerId);
  },

  updateSettings: (settings) => {
    get().hostManager?.updateSettings(settings);
    narrator.setEnabled(settings.narration);
    set({ settings });
  },

  sendAction: (targetId) => {
    const { mode, hostManager, clientManager } = get();
    if (mode === 'host') hostManager?.hostAction('NIGHT_ACTION', { targetId });
    else clientManager?.sendAction(targetId);
  },

  sendAck: () => {
    const { mode, hostManager, clientManager } = get();
    if (mode === 'host') hostManager?.hostAction('NIGHT_ACK');
    else clientManager?.sendAck();
  },

  sendVote: (targetId) => {
    const { mode, hostManager, clientManager } = get();
    if (mode === 'host') hostManager?.hostAction('VOTE', { targetId });
    else clientManager?.sendVote(targetId);
  },

  sendReady: () => {
    const { mode, hostManager, clientManager } = get();
    if (mode === 'host') hostManager?.hostAction('READY');
    else clientManager?.sendReady();
  },
}));
