import { format, startOfDay, differenceInCalendarDays, subDays, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export const ymd = (d: Date | string) => {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "yyyy-MM-dd");
};

export const today = () => ymd(new Date());

export const prettyDate = (d: Date = new Date()) => format(d, "EEEE, MMM d, yyyy");
export const prettyTime = (d: Date = new Date()) => format(d, "HH:mm:ss");
export const monthLabel = (d: Date = new Date()) => format(d, "MMMM yyyy");

export {
  startOfDay,
  differenceInCalendarDays,
  subDays,
  parseISO,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
};
