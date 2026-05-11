# Архитектура — Мафия Онлайн

## Обзор

Полностью клиентское SPA-приложение для игры в Мафию по сети. Серверная часть отсутствует — браузер хоста (создателя комнаты) выступает в роли игрового сервера. Связь между игроками через WebRTC (peer-to-peer).

---

## Технологический стек

| Слой | Технология |
|------|-----------|
| UI-фреймворк | React 18 + TypeScript |
| Сборка | Vite |
| Стилизация | TailwindCSS |
| P2P-соединение | PeerJS (обёртка над WebRTC DataChannel) |
| QR-коды | qrcode.react |
| Озвучка | Web Speech API (SpeechSynthesis) |
| Деплой | GitHub Pages |

---

## Сетевая архитектура

### Топология: Звезда (Host-as-Server)

```
           ┌──────────┐
           │   HOST   │
           │ (сервер) │
           └────┬─────┘
          ┌─────┼─────┐
          │     │     │
     ┌────▼─┐ ┌▼────┐ ┌▼────┐
     │Player│ │Player│ │Player│
     │  A   │ │  B   │ │  C  │
     └──────┘ └─────┘ └──────┘
```

- **Хост** создаёт PeerJS Peer и получает уникальный ID
- **Игроки** подключаются к хосту по этому ID через WebRTC DataChannel
- Вся игровая логика выполняется на хосте
- Хост хранит авторитетное состояние игры и рассылает обновления
- Игроки отправляют только свои действия (голос, выбор жертвы и т.д.)

### Формат сообщений

```typescript
// Игрок → Хост
interface PlayerMessage {
  type: 'JOIN' | 'ACTION' | 'VOTE' | 'READY' | 'PING';
  payload: any;
}

// Хост → Игрок (персональное состояние)
interface HostMessage {
  type: 'STATE_UPDATE' | 'ROLE_ASSIGN' | 'NIGHT_RESULT'
      | 'VOTE_RESULT' | 'GAME_OVER' | 'ERROR' | 'PONG'
      | 'KICKED' | 'SETTINGS_UPDATE';
  payload: any;
}
```

### Сигнализация (Signaling)

PeerJS предоставляет бесплатный облачный сигнальный сервер для обмена SDP-офферами. После установки WebRTC-соединения сигнальный сервер больше не нужен — данные идут напрямую между браузерами.

Для NAT Traversal используются публичные STUN-серверы (Google, Twilio). TURN не требуется — игроки обычно в одной сети или с обычным домашним NAT.

### Код комнаты

- Хост генерирует 6-символьный буквенно-цифровой код (например, `A7KX3M`)
- Этот код используется как PeerJS Peer ID (с префиксом `mafia-`)
- Игрок вводит код → приложение подключается к `mafia-A7KX3M`
- QR-код кодирует URL: `https://<user>.github.io/mafia/?room=A7KX3M`

---

## Управление состоянием

### Состояние на хосте (Host State)

```typescript
interface Room {
  id: string;                   // код комнаты
  hostId: string;               // PeerJS ID хоста
  settings: RoomSettings;
  players: Player[];
  gameState: GameState | null;  // null = в лобби
}

interface RoomSettings {
  roles: RoleConfig;
  timers: TimerConfig;
  votingType: 'open' | 'closed';
  revealRoleOnDeath: boolean;   // показывать роль убитого
}

interface RoleConfig {
  mafiaCount: number;           // количество обычных мафиози
  don: boolean;
  commissioner: boolean;
  doctor: boolean;
  maniac: boolean;
  advocate: boolean;
}

interface TimerConfig {
  enabled: boolean;
  nightActionSeconds: number;   // таймер ночного действия (по умолчанию 30)
  discussionSeconds: number;    // время обсуждения (по умолчанию 120)
  votingSeconds: number;        // время голосования (по умолчанию 60)
  lastWordSeconds: number;      // прощальное слово (по умолчанию 30)
}

interface Player {
  id: string;                   // PeerJS connection ID
  name: string;
  isHost: boolean;
  isAlive: boolean;
  isConnected: boolean;
  role: Role | null;            // null до начала игры
}

type Role = 'mafia' | 'don' | 'commissioner'
          | 'doctor' | 'maniac' | 'advocate' | 'civilian';

interface GameState {
  phase: GamePhase;
  round: number;                // номер дня (1, 2, 3...)
  nightActions: NightActions;
  votes: Record<string, string>; // voterId → targetId
  lastEliminatedId: string | null;
  deadPlayers: string[];
  history: RoundHistory[];
}

type GamePhase =
  | 'role_reveal'        // раздача ролей
  | 'night_start'        // "город засыпает"
  | 'night_mafia'        // мафия выбирает жертву
  | 'night_don'          // дон проверяет игрока
  | 'night_advocate'     // адвокат защищает мафиози
  | 'night_maniac'       // маньяк выбирает жертву
  | 'night_commissioner' // комиссар проверяет игрока
  | 'night_doctor'       // врач лечит игрока
  | 'day_results'        // объявление результатов ночи
  | 'day_discussion'     // обсуждение
  | 'day_voting'         // голосование
  | 'day_last_word'      // прощальное слово изгнанного
  | 'game_over';         // конец игры

interface NightActions {
  mafiaTarget: string | null;       // кого мафия решила убить
  mafiaVotes: Record<string, string>; // голоса мафии
  donCheck: string | null;          // кого проверяет дон
  donResult: boolean | null;        // true = комиссар
  advocateTarget: string | null;    // кого защищает адвокат
  maniacTarget: string | null;      // кого убивает маньяк
  commissionerCheck: string | null; // кого проверяет комиссар
  commissionerResult: boolean | null; // true = мафия
  doctorTarget: string | null;      // кого лечит врач
  doctorLastTarget: string | null;  // кого лечил прошлой ночью (нельзя повторять)
}
```

### Состояние на клиенте (Player State)

Каждый игрок получает от хоста только ту информацию, которую ему положено видеть:

```typescript
interface ClientGameState {
  phase: GamePhase;
  round: number;
  myRole: Role | null;
  alivePlayers: PlayerInfo[];    // id, name, isAlive
  deadPlayers: PlayerInfo[];
  myTeam?: PlayerInfo[];         // для мафии — список команды
  timerEndAt: number | null;     // unix timestamp окончания таймера
  nightResult?: NightResultInfo; // результат ночи (для дневной фазы)
  voteState?: VoteState;         // состояние голосования
  checkResult?: string;          // результат проверки (для дона/комиссара)
  canAct: boolean;               // может ли игрок действовать в текущей фазе
  waitingFor?: string;           // "Мафия делает выбор..." и т.п.
}
```

---

## Озвучка (Text-to-Speech)

- Используется `window.speechSynthesis` (Web Speech API)
- Воспроизводится **только на устройстве хоста**
- Язык: `ru-RU`
- Хост может отключить озвучку в настройках

### Список фраз

| Событие | Фраза |
|---------|-------|
| Начало ночи | "Город засыпает. Наступает ночь." |
| Мафия | "Мафия просыпается." / "Мафия засыпает." |
| Дон | "Дон просыпается." / "Дон засыпает." |
| Адвокат | "Адвокат просыпается." / "Адвокат засыпает." |
| Маньяк | "Маньяк просыпается." / "Маньяк засыпает." |
| Комиссар | "Комиссар просыпается." / "Комиссар засыпает." |
| Врач | "Врач просыпается." / "Врач засыпает." |
| Начало дня | "Город просыпается. Наступает день." |
| Убийство | "Этой ночью был убит {имя}." |
| Никто не погиб | "Этой ночью никто не погиб." |
| Двойное убийство | "Этой ночью были убиты {имя1} и {имя2}." |
| Голосование | "Город голосует." |
| Изгнание | "{имя} покидает город." |
| Победа мафии | "Мафия победила!" |
| Победа мирных | "Мирные жители победили!" |
| Победа маньяка | "Маньяк победил!" |

---

## QR-код

- Генерируется библиотекой `qrcode.react`
- Содержит URL: `https://<user>.github.io/mafia/?room={КОД_КОМНАТЫ}`
- При открытии URL код комнаты автоматически подставляется в поле ввода

---

## Структура проекта

```
mafia/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                     # точка входа
│   ├── App.tsx                      # роутинг по состоянию
│   ├── types/
│   │   ├── game.ts                  # все типы и интерфейсы
│   │   └── messages.ts              # типы сообщений P2P
│   ├── store/
│   │   ├── gameStore.ts             # основной стор (zustand)
│   │   └── connectionStore.ts       # состояние соединения
│   ├── engine/
│   │   ├── gameEngine.ts            # игровая логика (только хост)
│   │   ├── roleDistributor.ts       # распределение ролей
│   │   ├── nightResolver.ts         # разрешение ночных действий
│   │   ├── voteResolver.ts          # подсчёт голосов
│   │   └── winChecker.ts            # проверка условий победы
│   ├── network/
│   │   ├── hostManager.ts           # управление P2P (хост)
│   │   ├── clientManager.ts         # подключение к хосту (игрок)
│   │   └── messageHandler.ts        # обработка сообщений
│   ├── audio/
│   │   └── narrator.ts              # TTS озвучка
│   ├── components/
│   │   ├── common/
│   │   │   ├── Timer.tsx
│   │   │   ├── PlayerAvatar.tsx
│   │   │   ├── PlayerList.tsx
│   │   │   ├── RoleCard.tsx
│   │   │   └── Modal.tsx
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx        # главная
│   │   │   ├── CreateRoomScreen.tsx  # создание комнаты
│   │   │   ├── LobbyScreen.tsx       # лобби
│   │   │   ├── RoleRevealScreen.tsx  # раздача ролей
│   │   │   ├── NightScreen.tsx       # ночная фаза
│   │   │   ├── NightActionScreen.tsx # экран выбора (убить/лечить/проверить)
│   │   │   ├── DayResultsScreen.tsx  # результаты ночи
│   │   │   ├── DiscussionScreen.tsx  # обсуждение
│   │   │   ├── VotingScreen.tsx      # голосование
│   │   │   ├── LastWordScreen.tsx    # прощальное слово
│   │   │   ├── DeadScreen.tsx        # экран мёртвого игрока
│   │   │   └── GameOverScreen.tsx    # конец игры
│   │   └── host/
│   │       └── HostControls.tsx      # кнопки управления хоста
│   └── utils/
│       ├── roomCode.ts              # генерация кода комнаты
│       └── constants.ts             # константы
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Деплой на GitHub Pages

1. Сборка: `npm run build` → статика в `dist/`
2. Деплой через `gh-pages` пакет или GitHub Actions
3. Базовый URL настраивается в `vite.config.ts`:
   ```ts
   export default defineConfig({
     base: '/mafia/',
   })
   ```
4. SPA-роутинг: `404.html` копируется из `index.html` (GitHub Pages SPA hack)

---

## Ограничения и допущения

- **Отключение хоста** = конец игры для всех (нет миграции хоста)
- **Нет персистентности** — при перезагрузке страницы хоста игра теряется
- **STUN only** — может не работать за жёстким корпоративным NAT (но для домашних сетей и мобильного интернета работает)
- **Масштаб** — до ~15 игроков (ограничение WebRTC data channels на одном peer)
- **Браузеры** — Chrome, Safari, Firefox, Edge (все поддерживают WebRTC и Speech API)
