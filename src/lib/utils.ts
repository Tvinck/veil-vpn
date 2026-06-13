import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Вспомогательная утилита для слияния CSS классов Tailwind (cn).
 * Позволяет комбинировать динамические классы с помощью clsx и корректно
 * разрешать пересекающиеся/конфликтующие правила с помощью twMerge.
 * 
 * @param {ClassValue[]} inputs - Массив имен классов или условных выражений
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
