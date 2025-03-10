import { format } from "date-fns";

const createSafeDateFormatter = (formatString: string) => (date: string) => {
  try {
    return format(new Date(date), formatString);
  } catch {
    return date;
  }
};

const createSafeMillisecondDateFormatter =
  (formatString: string) => (milliseconds: number) => {
    try {
      return format(new Date(milliseconds * 1000), formatString);
    } catch {
      return milliseconds.toString();
    }
  };

export const formatYearFromTimestamp =
  createSafeMillisecondDateFormatter("yyyy");
export const formatFullDateFromTimestamp =
  createSafeMillisecondDateFormatter("yyyy-MM-dd");
export const formatMonthYear = createSafeDateFormatter("MMM yyyy");
export const formatMonthDayYear = createSafeDateFormatter("MMM d, yyyy");
export const formatMonthDay = createSafeDateFormatter("MMM d");

type Formatter = "MMM yyyy" | "MMM d, yyyy" | "MMM d";
type MsFormatter = "ms:yyyy" | "ms:yyyy-MM-dd";

export const formatters: Record<
  Formatter,
  ReturnType<typeof createSafeDateFormatter>
> = {
  "MMM yyyy": createSafeDateFormatter("MMM yyyy"),
  "MMM d, yyyy": createSafeDateFormatter("MMM d, yyyy"),
  "MMM d": createSafeDateFormatter("MMM d"),
};

export const msFormatters: Record<
  MsFormatter,
  ReturnType<typeof createSafeMillisecondDateFormatter>
> = {
  "ms:yyyy": createSafeMillisecondDateFormatter("yyyy"),
  "ms:yyyy-MM-dd": createSafeMillisecondDateFormatter("yyyy-MM-dd"),
};

export type AnyFormatter = Formatter | MsFormatter;

export function getFormatter(formatter: AnyFormatter) {
  if (formatter.startsWith("ms:")) {
    return msFormatters[formatter as MsFormatter];
  }
  return formatters[formatter as Formatter];
}
