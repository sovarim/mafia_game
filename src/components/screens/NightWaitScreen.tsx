import { useGameStore } from '../../store/gameStore';
import { NIGHT_PHASE_LABELS } from '../../utils/constants';

export function NightWaitScreen() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const label = gameState.waitingFor || NIGHT_PHASE_LABELS[gameState.phase] || 'Город спит...';

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-5 py-6 safe-top safe-bottom stars-bg relative"
      style={{ background: 'radial-gradient(ellipse at 50% -5%, rgba(255,255,255,0.04), #0a0a0f 65%)' }}>
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ left: `${(i*37+13)%100}%`, top: `${(i*29+7)%75+12}%`, width: i%3===0?2:1, height: i%3===0?2:1, opacity: 0.06+(i%5)*0.05 }} />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* Moon */}
        <div className="w-20 h-20 rounded-full mb-2"
          style={{ background: 'radial-gradient(circle at 35% 35%, #e8e8f0, #b0b0c0)', boxShadow: '0 0 40px rgba(200,200,220,0.2)' }} />

        <h1 className="font-display text-4xl font-bold text-white text-center">Город спит...</h1>
        <p className="text-base text-gray-400">Ночь {gameState.round}</p>

        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-gray-500 dot-float" />
            ))}
          </div>
          <p className="text-sm text-gray-400 italic">{label}</p>
        </div>
      </div>
    </div>
  );
}
