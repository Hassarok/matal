import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names, resolving Tailwind conflicts intelligently
 * (later utilities win). The foundation for every component's `className` API.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
