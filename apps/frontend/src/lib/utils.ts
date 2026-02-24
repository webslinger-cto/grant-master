import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistance, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, formatStr: string = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

export function calculateForecastValue(amountRequested: number, probability: number): number {
  return amountRequested * (probability / 100);
}

export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    qualification: 'bg-gray-100 text-gray-800',
    planning: 'bg-gm-cyan-soft text-gm-navy',
    drafting: 'bg-yellow-100 text-yellow-800',
    review: 'bg-purple-100 text-purple-800',
    submitted: 'bg-gm-cyan-soft text-gm-navy',
    awarded: 'bg-green-100 text-green-800',
    not_funded: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-800',
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    not_started: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-gm-cyan-soft text-gm-navy',
    blocked: 'bg-orange-100 text-orange-800',
    in_review: 'bg-purple-100 text-purple-800',
    complete: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
