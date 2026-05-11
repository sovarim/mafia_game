import type { Role } from '../../types';
import { ROLE_META } from '../../types';

interface RoleIconProps {
  role: Role;
  size?: number;
  className?: string;
}

export function RoleIcon({ role, size = 40, className = '' }: RoleIconProps) {
  const meta = ROLE_META[role];
  const c = meta.color;
  const s = size * 0.5;

  const icons: Record<Role, React.ReactNode> = {
    mafia: (
      <svg width={s} height={s} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="7" stroke={c} strokeWidth="2" fill="none" />
        <circle cx="12" cy="12" r="2.5" fill={c} />
        <line x1="12" y1="1" x2="12" y2="6" stroke={c} strokeWidth="2" />
        <line x1="12" y1="18" x2="12" y2="23" stroke={c} strokeWidth="2" />
        <line x1="1" y1="12" x2="6" y2="12" stroke={c} strokeWidth="2" />
        <line x1="18" y1="12" x2="23" y2="12" stroke={c} strokeWidth="2" />
      </svg>
    ),
    don: (
      <svg width={s} height={s} viewBox="0 0 24 24">
        <path d="M4 17h16l-2-9-3 4-3-6-3 6-3-4z" fill={c} />
        <rect x="4" y="17" width="16" height="2.5" rx="1" fill={c} />
      </svg>
    ),
    advocate: (
      <svg width={s} height={s} viewBox="0 0 24 24">
        <path d="M12 3L4 7v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V7l-8-4z" stroke={c} strokeWidth="2" fill="none" />
        <path d="M9 12l2 2 4-4" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    commissioner: (
      <svg width={s} height={s} viewBox="0 0 24 24">
        <path d="M12 2l2.4 5 5.6.8-4 3.9 1 5.5L12 14.7 6.8 17.2l1-5.5-4-3.9 5.6-.8z" fill={c} />
      </svg>
    ),
    doctor: (
      <svg width={s} height={s} viewBox="0 0 24 24">
        <rect x="8.5" y="3" width="7" height="18" rx="1.5" fill={c} />
        <rect x="3" y="8.5" width="18" height="7" rx="1.5" fill={c} />
      </svg>
    ),
    maniac: (
      <svg width={s} height={s} viewBox="0 0 24 24">
        <path d="M10 4c0 0 1 2 1 6s-1 5-1 7c0 1.5.5 3 .5 3h3s.5-1.5.5-3c0-2-1-3-1-7s1-6 1-6h-4z" fill={c} />
        <rect x="10" y="19" width="4" height="3" rx="1.5" fill={c} />
      </svg>
    ),
    civilian: (
      <svg width={s} height={s} viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" fill={c} />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" fill={c} />
      </svg>
    ),
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size, height: size,
        background: `${c}15`,
        border: `2px solid ${c}35`,
      }}
    >
      {icons[role]}
    </div>
  );
}
