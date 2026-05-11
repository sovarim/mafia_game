import { useState, useEffect, useRef } from 'react';
import { QrScanner } from '../common/QrScanner';
import { QrFrame } from '../common/QrFrame';
import { useGameStore } from '../../store/gameStore';

interface HostInviteModalProps {
  open: boolean;
  onClose: () => void;
}

type Stage = 'scan-offer' | 'show-answer' | 'connecting' | 'connected';

export function HostInviteModal({ open, onClose }: HostInviteModalProps) {
  const { hostManager } = useGameStore();
  const [stage, setStage] = useState<Stage>('scan-offer');
  const [answer, setAnswer] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setStage('scan-offer');
      setAnswer(null);
      setPlayerName('');
      setError(null);
      processingRef.current = false;
    }
  }, [open]);

  const handleScan = async (text: string) => {
    if (processingRef.current || !hostManager) return;
    processingRef.current = true;
    setError(null);

    try {
      const { answer, playerName, connected } = await hostManager.acceptPlayerOffer(text);
      setAnswer(answer);
      setPlayerName(playerName);
      setStage('show-answer');

      connected
        .then(() => setStage('connected'))
        .catch((e) => {
          setError(e?.message || 'Соединение не установилось');
          processingRef.current = false;
          setStage('scan-offer');
        });
    } catch (e: any) {
      setError(e?.message || 'Не удалось обработать QR');
      processingRef.current = false;
      setStage('scan-offer');
    }
  };

  // Auto-close shortly after connection so host sees a confirmation
  useEffect(() => {
    if (stage === 'connected') {
      const t = setTimeout(() => onClose(), 1200);
      return () => clearTimeout(t);
    }
  }, [stage, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-md bg-[#1a1f35] rounded-2xl border border-white/10 p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Подключение игрока</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg width="22" height="22" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" /><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" /></svg>
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {stage === 'scan-offer' && (
          <>
            <p className="text-sm text-gray-400 text-center">
              Шаг 1 из 2 — отсканируйте QR с экрана игрока
            </p>
            <QrScanner onScan={handleScan} hint="Поднесите QR-код игрока к камере" />
          </>
        )}

        {stage === 'show-answer' && answer && (
          <>
            <p className="text-sm text-gray-400 text-center">
              Шаг 2 из 2 — пусть <span className="text-white font-semibold">{playerName}</span> отсканирует этот QR
            </p>
            <div className="flex justify-center py-2">
              <QrFrame value={answer} size={260} />
            </div>
            <p className="text-xs text-gray-500 text-center">Ждём подключения...</p>
          </>
        )}

        {stage === 'connected' && (
          <div className="py-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-base text-white font-semibold">
              {playerName} подключён
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
