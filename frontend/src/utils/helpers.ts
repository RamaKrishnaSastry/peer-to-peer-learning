import { AxiosError } from "axios";

export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (date: Date | string): string => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

export const getTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(date);
};

export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const capitalizeFirstLetter = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.error || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

export const extractYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? match[1] : null;
};

export const getYouTubeThumbnail = (url: string): string | null => {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
};

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp)(\?.*)?$/i;

export const isImageUrl = (url: string): boolean => IMAGE_EXTENSIONS.test(url);

// Returns a thumbnail for content: YouTube thumb for videos, the file itself
// for images, otherwise null (caller falls back to the generic icon).
export const getContentThumbnail = (
  url: string,
  type: string,
): string | null => {
  if (type === 'image') return isImageUrl(url) ? url : null;
  if (type === 'video') return getYouTubeThumbnail(url);
  return null;
};

export interface LevelInfo {
  level: number;
  title: string;
  currentRep: number;
  base: number;
  next: number;
  progressPct: number;
}

const LEVEL_TITLES = [
  'Beginner',
  'Learner',
  'Scholar',
  'Mentor',
  'Expert',
  'Master',
  'Champion',
  'Grandmaster',
];

// Level grows with reputation (each level requires +100 more than the last),
// giving learners a visible sense of progress tied to their score.
export const getLevelInfo = (reputation: number): LevelInfo => {
  let level = 1;
  let base = 0;
  let next = 100;
  while (reputation >= next && level < LEVEL_TITLES.length) {
    base = next;
    level += 1;
    next = base + 100 * level;
  }
  const span = next - base;
  const progressPct =
    span > 0 ? Math.min(100, ((reputation - base) / span) * 100) : 100;
  return {
    level,
    title: LEVEL_TITLES[level - 1],
    currentRep: reputation,
    base,
    next,
    progressPct,
  };
};
