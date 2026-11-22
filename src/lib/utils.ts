import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * Normalizes a track title by removing parentheses, bracketed tags (Remix, Lofi, Slowed, etc.),
 * subtitles, punctuation, and converting to lowercase alphanumeric string.
 * Used for instant duplicate detection in autoplay.
 */
export function normalizeTrackTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, '') // Remove (Lofi Mix), [Official Audio], etc.
    .replace(/[-–—].*$/, '') // Remove "- From Movie", "- Lofi Version"
    .replace(/[^a-z0-9]/g, '') // Keep alphanumeric only
    .trim();
}

/**
 * Extracts the primary singer from an artist string.
 * e.g. "Pritam, Arijit Singh - Agent Vinod" -> "Arijit Singh"
 * e.g. "Adil, Arpit Bala - Keychain Laalu" -> "Adil"
 */
export function extractPrimarySinger(rawArtist: string): string {
  if (!rawArtist) return '';
  const beforeDash = rawArtist.split(' - ')[0] || rawArtist;
  const parts = beforeDash
    .split(/[,&/]| ft\.? | feat\.? | with /i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  // Filter out composer / generic tags if possible
  const preferred = parts.filter(
    (name) =>
      !/^(various artists|solo artist|official|original|soundtrack|unknown|composer)$/i.test(
        name
      )
  );

  return preferred[0] || parts[0] || beforeDash.trim();
}
