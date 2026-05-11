import { useState, useEffect, useRef } from 'react';

interface TimerProps {
  endTime: number | null;
  color?: string;
  onExpire?: () => void;
}

export function Timer({ endTime, color = '#3b82f6', onExpire }: TimerProps) {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const expired = useRef(false);

  useEffect(() => {
    if (!endTime) return;
    expired.current = false;
    const totalMs = endTime - Date.now();
    setTotal(Math.max(0, Math.ceil(totalMs / 1000)));

    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0 && !expired.current) {
        expired.current = true;
        onExpire?.();
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [endTime]);

  if (!endTime) return null;
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const urgent = remaining <= 5;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: urgent ? '#ef4444' : color }}
        />
      </div>
      <span
        className={`font-mono text-sm font-bold min-w-[2rem] ${urgent ? 'text-red-500 timer-urgent' : 'text-gray-400'}`}
      >
        {remaining}с
      </span>
    </div>
  );
}

export function TimerDisplay({ endTime, color }: { endTime: number | null; color?: string }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
    }, 200);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!endTime) return null;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const urgent = remaining <= 5;

  return (
    <div
      className={`px-3 py-1.5 rounded-lg border font-mono text-base font-bold ${
        urgent ? 'bg-red-500/10 border-red-500/25 text-red-500 timer-urgent' : 'bg-white/5 border-white/10'
      }`}
      style={!urgent ? { color: color || '#eab308' } : undefined}
    >
      {min}:{sec.toString().padStart(2, '0')}
    </div>
  );
}
