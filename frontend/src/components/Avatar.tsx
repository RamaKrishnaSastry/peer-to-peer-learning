const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-rose-500",
];

export const avatarColorFor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}

export const Avatar = ({ name, avatarUrl, className = "w-10 h-10 text-sm" }: AvatarProps) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      className={`rounded-full text-white font-bold flex items-center justify-center shrink-0 ${avatarColorFor(name)} ${className}`}
      aria-label={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
};
