interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  dead?: boolean;
  className?: string;
}

export function PlayerAvatar({ name, color, size = 36, dead = false, className = '' }: AvatarProps) {
  const initial = name ? name[0].toUpperCase() : '?';
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
        dead ? 'opacity-40 grayscale' : ''
      } ${className}`}
      style={{
        width: size, height: size,
        background: dead ? '#6b7280' : color,
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
}
