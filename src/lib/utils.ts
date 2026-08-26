import { PEOPLE } from './vibely-data';
import type { Person } from './types';

export const person = (id: string): Person | undefined =>
  (PEOPLE as readonly Person[]).find((p) => p.id === id);

export const initial = (name: string) => (name || '?').trim().charAt(0).toLocaleUpperCase('tr-TR');

export const pad = (n: number) => String(n).padStart(2, '0');

export const clockNow = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fmtDuration = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export const callDurationLabel = (seconds: number) =>
  seconds < 60 ? `${seconds} sn` : `${Math.floor(seconds / 60)} dk ${seconds % 60} sn`;

export const isMail = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());

export function shuffledIds<T extends { id: string }>(pool: readonly T[]): string[] {
  const ids = pool.map((f) => f.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}
