export const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f43f5e', '#a855f7', '#84cc16',
  '#0ea5e9', '#e11d48', '#7c3aed', '#10b981',
];

export const MIN_PLAYERS = 3;

export const NIGHT_PHASE_ORDER = [
  'night_mafia',
  'night_don',
  'night_advocate',
  'night_maniac',
  'night_commissioner',
  'night_doctor',
] as const;

export const NIGHT_PHASE_LABELS: Record<string, string> = {
  night_mafia:        'Мафия делает выбор...',
  night_don:          'Дон проводит расследование...',
  night_advocate:     'Адвокат готовит защиту...',
  night_maniac:       'Маньяк выходит на охоту...',
  night_commissioner: 'Комиссар ведёт расследование...',
  night_doctor:       'Врач спасает жизни...',
};

export const NARRATION_PHRASES: Record<string, string[]> = {
  night_start:        ['Город засыпает. Наступает ночь.'],
  night_mafia:        ['Мафия просыпается.', 'Мафия засыпает.'],
  night_don:          ['Дон просыпается.', 'Дон засыпает.'],
  night_advocate:     ['Адвокат просыпается.', 'Адвокат засыпает.'],
  night_maniac:       ['Маньяк просыпается.', 'Маньяк засыпает.'],
  night_commissioner: ['Комиссар просыпается.', 'Комиссар засыпает.'],
  night_doctor:       ['Врач просыпается.', 'Врач засыпает.'],
  day_start:          ['Город просыпается. Наступает день.'],
};

export const RECONNECT_TIMEOUT = 30_000;
export const DEAD_ROLE_PAUSE = 2_500; // pause for dead roles to hide who is still alive
