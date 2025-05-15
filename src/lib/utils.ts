
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fadeInUp = (visible: boolean, delay?: number) => {
  return cn(
    "transition-all duration-700 ease-out",
    delay ? `delay-${delay}` : "",
    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
  )
}

export const staggeredDelay = (index: number, baseDelay = 200) => {
  return baseDelay + (index * 100)
}
