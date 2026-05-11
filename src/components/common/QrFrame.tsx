import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QrFrameProps {
  value: string;
  size?: number;
  label?: string;
}

export function QrFrame({ value, size = 240, label }: QrFrameProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers / HTTP context
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-white rounded-2xl p-3">
        <QRCodeSVG
          value={value}
          size={size}
          level="L"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      {label && <p className="text-xs text-gray-400 text-center">{label}</p>}
      <button
        onClick={copy}
        className="text-[11px] text-gray-500 hover:text-white underline-offset-2 hover:underline"
      >
        {copied ? 'Скопировано' : 'Скопировать код (если QR не сканируется)'}
      </button>
    </div>
  );
}
