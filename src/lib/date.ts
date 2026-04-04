import { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { zhTW } from "date-fns/locale";

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy/MM/dd", { locale: zhTW });
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy/MM/dd HH:mm", { locale: zhTW });
}

export function formatDateShort(date: Date | string) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MM/dd (E)", { locale: zhTW });
}

export function toDateOnly(date: Date): Date {
  return startOfDay(date);
}

export { startOfDay, endOfDay, startOfMonth, endOfMonth, parseISO };
