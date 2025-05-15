
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function highlight(text: string, type: 'yellow' | 'green' | 'pink' = 'yellow'): React.ReactNode {
  return <span className={`highlight-${type}`}>{text}</span>;
}
