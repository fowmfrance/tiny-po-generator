
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function highlight(text: string, type: 'yellow' | 'green' | 'pink' = 'yellow') {
  return <span className={`highlight-${type}`}>{text}</span>;
}
