import { useState, useEffect, useRef } from 'react';
import { QrScanner } from '../common/QrScanner';
import { QrFrame } from '../common/QrFrame';
import { useGameStore } from '../../store/gameStore';

interface JoinFlowScreenProps {
  onBack: () => void;
}

type Stage = 'name' | 'preparing' | 'show-offer' | 'scan-answer' | 'connecting';

export function JoinFlowScreen({ onBack }: JoinFlowScreenProps) {
  const { joinRoom, acceptAnswer, whenOpen, setName: persistName, myName, error, clearError } = useGameStore();
  const [stage, setStage] = useState<Stage>('name');
  const [name, setName] = useState(myName || '');
  const [offer, setOffer] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const processingRef = useRef(false);

  const startJoin = async () => {
    if (name.length < 2) return;
    setLocalError(null);
    clearError();
    persistName(name);
    setStage('preparing');

    try {
      const generatedOffer = await joinRoom(name);
      setOffer(generatedOffer);
      setStage('show-offer');
    } catch (e: any) {
      setLocalError(e?.message || 'Не удалось создать оффер');
      setStage('name');
    }
  };

  // Move from "show-offer" to "scan-answer" after a short delay so the user
  // can position their phone for the host to scan their QR first.
  // The user can also tap "Я готов сканировать" to advance manually.
  const goToScanAnswer = () => setStage('scan-answer');

  const handleScanAnswer = async (text: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setStage('connecting');
    setLocalError(null);

    try {
      await acceptAnswer(text);
      // whenOpen resolves once the data channel actually opens — store flips mode to 'client'.
      await whenOpen();
    } catch (e: any) {
      setLocalError(e?.message || 'Не удалось установить соединение');
      processingRef.current = false;
      setStage('scan-answer');
    }
  };

  // Reset processing flag when navigating back to scan stage
  useEffect(() => {
    if (stage === 'scan-answer') processingRef.current = false;
  }, [stage]);

  const errMsg = localError || error;

  return (
    <div className="min-h-full flex flex-col px-5 py-6 safe-top safe-bottom">
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <h1 className="font-display text-xl font-bold">Присоединиться</h1>
      </div>

      {errMsg && (
        <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm text-center" onClick={() => { setLocalError(null); clearError(); }}>
          {errMsg}
        </div>
      )}

      {stage === 'name' && (
        <div className="flex-1 flex flex-col justify-center gap-3">
          <p className="text-sm text-gray-400 text-center mb-2">Введите имя — затем покажете QR-код хосту</p>
          <input
            type="text"
            placeholder="Ваше имя"
            value={name}
            onChange={e => setName(e.target.value.slice(0, 20))}
            className="h-[52px] rounded-[14px] bg-bg-input border border-white/8 px-4 text-white font-body text-base focus:outline-none focus:border-white/25 transition-colors"
            autoFocus
          />
          <button
            onClick={startJoin}
            disabled={name.length < 2}
            className="h-[52px] rounded-[14px] bg-mafia text-white font-semibold text-base disabled:opacity-40 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Создать QR-код
          </button>
        </div>
      )}

      {stage === 'preparing' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-sm">Готовим соединение...</p>
        </div>
      )}

      {stage === 'show-offer' && offer && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-sm text-gray-400 text-center px-4">
            Шаг 1 из 2 — пусть хост отсканирует этот QR-код
          </p>
          <QrFrame value={offer} size={260} />
          <button
            onClick={goToScanAnswer}
            className="h-[52px] w-full max-w-xs rounded-[14px] bg-civilian text-white font-semibold text-base hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Готово, сканировать ответ
          </button>
        </div>
      )}

      {stage === 'scan-answer' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-gray-400 text-center px-4">
            Шаг 2 из 2 — теперь отсканируйте QR-код с экрана хоста
          </p>
          <div className="w-full max-w-xs">
            <QrScanner onScan={handleScanAnswer} hint="Поднесите QR хоста к камере" />
          </div>
          <button
            onClick={() => setStage('show-offer')}
            className="text-sm text-gray-500 hover:text-white"
          >
            ← Показать мой QR ещё раз
          </button>
        </div>
      )}

      {stage === 'connecting' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-sm">Подключение...</p>
        </div>
      )}
    </div>
  );
}
