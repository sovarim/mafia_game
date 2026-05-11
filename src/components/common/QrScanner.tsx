import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface QrScannerProps {
  onScan: (text: string) => void;
  /** Hide the scanner (e.g. after a successful scan) without unmounting. */
  paused?: boolean;
  /** Hint text under viewport. */
  hint?: string;
}

export function QrScanner({ onScan, paused = false, hint }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanRef = useRef<string>('');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [showPaste, setShowPaste] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      // Secure context check — navigator.mediaDevices is undefined on HTTP non-localhost origins.
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          window.isSecureContext === false
            ? 'Камера доступна только по HTTPS или localhost. Откройте сайт по защищённому адресу или вставьте код вручную.'
            : 'Этот браузер не поддерживает камеру. Вставьте код вручную.'
        );
        setShowPaste(true);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => { /* iOS sometimes throws once */ });
          setReady(true);
          tick();
        }
      } catch (e: any) {
        setError(e?.message || 'Не удалось открыть камеру');
        setShowPaste(true);
      }
    };

    const tick = () => {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const code = jsQR(imageData.data, w, h, { inversionAttempts: 'dontInvert' });
      if (code && code.data && code.data !== lastScanRef.current) {
        lastScanRef.current = code.data;
        onScan(code.data);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [paused, onScan]);

  const submitPaste = () => {
    const v = pasteValue.trim();
    if (!v) return;
    onScan(v);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {!showPaste && (
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black border border-white/10">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-[12%] border-2 border-white/40 rounded-lg" />
            <div className="absolute inset-[12%] border-2 border-mafia rounded-lg animate-pulse" />
          </div>

          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-gray-400 text-sm">
              Открываем камеру...
            </div>
          )}

          {paused && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-green-400 text-sm font-semibold">
              QR распознан
            </div>
          )}

          {hint && !error && (
            <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur rounded-lg px-3 py-1.5 text-center text-xs text-white">
              {hint}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-xs text-center">
          {error}
        </div>
      )}

      {showPaste ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={pasteValue}
            onChange={e => setPasteValue(e.target.value)}
            placeholder="Вставьте код из QR сюда"
            rows={4}
            className="w-full rounded-xl bg-bg-input border border-white/10 px-3 py-2 text-white text-xs font-mono break-all focus:outline-none focus:border-white/25"
          />
          <button
            onClick={submitPaste}
            disabled={!pasteValue.trim()}
            className="h-11 rounded-xl bg-civilian text-white text-sm font-semibold disabled:opacity-40 hover:brightness-110 transition-all"
          >
            Использовать код
          </button>
          <button
            onClick={() => { setShowPaste(false); setError(null); }}
            className="text-xs text-gray-500 hover:text-white"
          >
            ← Попробовать камеру снова
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowPaste(true)}
          className="text-xs text-gray-500 hover:text-white"
        >
          Камера не работает? Вставить код вручную
        </button>
      )}
    </div>
  );
}
