import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: string | number, currency: string = "USD"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;
  const hours = parseInt(match[1] || "0");
  const mins = parseInt(match[2] || "0");
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatDate(dateStr: string, fmt: string = "d MMM yyyy"): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "HH:mm");
  } catch {
    return dateStr;
  }
}

export function getStopsLabel(stops: number): string {
  if (stops === 0) return "Nonstop";
  if (stops === 1) return "1 stop";
  return `${stops} stops`;
}

export function getTotalStops(slices: { segments: { stops: number }[] }[]): number {
  return slices.reduce((total, slice) => {
    return total + slice.segments.reduce((s, seg) => s + seg.stops, 0) + Math.max(0, slice.segments.length - 1);
  }, 0);
}

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function addDays(dateStr: string, days: number): string {
  const d = parseISO(dateStr);
  d.setDate(d.getDate() + days);
  return format(d, "yyyy-MM-dd");
}

export function parseDurationMinutes(isoDuration: string): number {
  const dayMatch = isoDuration.match(/P(\d+)D/);
  const timeMatch = isoDuration.match(/T(?:(\d+)H)?(?:(\d+)M)?/);
  const days = dayMatch ? parseInt(dayMatch[1]) : 0;
  const hours = timeMatch?.[1] ? parseInt(timeMatch[1]) : 0;
  const mins = timeMatch?.[2] ? parseInt(timeMatch[2]) : 0;
  return days * 24 * 60 + hours * 60 + mins;
}

export function totalTravelMinutes(slices: { duration: string }[]): number {
  return slices.reduce((sum, s) => sum + parseDurationMinutes(s.duration), 0);
}
