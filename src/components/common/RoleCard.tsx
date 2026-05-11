import { useState } from 'react';
import { ROLE_META, type Role } from '../../types';
import { RoleIcon } from './RoleIcon';

interface RoleCardProps {
  role: Role;
  flipped?: boolean;
  onFlip?: () => void;
  teamMembers?: { name: string; role: Role }[];
}

export function RoleCard({ role, flipped = false, onFlip, teamMembers }: RoleCardProps) {
  const [isFlipped, setIsFlipped] = useState(flipped);
  const meta = ROLE_META[role];

  const handleClick = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      onFlip?.();
    }
  };

  return (
    <div className="perspective w-[260px] h-[380px] cursor-pointer" onClick={handleClick}>
      <div className={`relative w-full h-full preserve-3d card-flip ${isFlipped ? 'flipped' : ''}`}>
        {/* Back */}
        <div className="absolute inset-0 backface-hidden rounded-3xl bg-gradient-to-br from-[#1a1f3a] to-[#111827] border-2 border-white/10 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-4 rounded-2xl border border-white/5" />
          <div className="absolute inset-7 rounded-xl border border-white/[0.03]" />
          <div className="flex flex-col items-center gap-2">
            <span className="font-display text-4xl font-bold text-white/10 tracking-[4px]">МАФИЯ</span>
            <span className="text-[11px] text-white/[0.06] tracking-[3px] uppercase">Онлайн</span>
          </div>
        </div>

        {/* Front */}
        <div
          className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl border-2 flex flex-col items-center justify-center gap-4 overflow-hidden"
          style={{
            background: `linear-gradient(165deg, ${meta.color}18 0%, #111827 40%, #0a0a0f 100%)`,
            borderColor: `${meta.color}40`,
            boxShadow: `0 0 60px ${meta.color}25`,
          }}
        >
          {/* Glow */}
          <div
            className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full"
            style={{ background: `radial-gradient(circle, ${meta.color}20, transparent 70%)` }}
          />

          <div className="relative z-10 flex flex-col items-center gap-3">
            <RoleIcon role={role} size={72} />
            <h3 className="font-display text-[28px] font-bold text-white">{meta.name}</h3>
            <p className="text-sm text-gray-400 text-center max-w-[200px] leading-relaxed">{meta.desc}</p>
          </div>

          {/* Team members (mafia only) */}
          {teamMembers && teamMembers.length > 0 && (
            <div
              className="absolute bottom-5 left-5 right-5 p-3 rounded-xl"
              style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}20` }}
            >
              <div className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: meta.color }}>
                Ваша команда
              </div>
              <div className="flex flex-col gap-1">
                {teamMembers.map(m => (
                  <div key={m.name} className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{m.name}</span>
                    <span style={{ color: `${meta.color}80` }}>{ROLE_META[m.role].short}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
