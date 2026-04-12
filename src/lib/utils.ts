import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu);
  if (!matches) return [];
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
}
