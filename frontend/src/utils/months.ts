/**
 * Month names array for display purposes.
 * Index corresponds to month number (1-12).
 */
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Month options array for Select components.
 * Maps month names to { value, label } format where value is the month number (1-12) as a string.
 */
export const MONTHS = MONTH_NAMES.map((name, index) => ({
  value: String(index + 1),
  label: name,
}));

/**
 * Get month name by month number (1-12).
 * @param monthNumber - Month number (1-12)
 * @returns Month name string
 */
export const getMonthName = (monthNumber: number): string => {
  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error(`Invalid month number: ${monthNumber}. Must be between 1 and 12.`);
  }
  return MONTH_NAMES[monthNumber - 1];
};

/**
 * Convert month number (1-12) to YYYY-MM format using current year.
 * @param monthNumber - Month number (1-12)
 * @param year - Optional year (defaults to current year)
 * @returns Month string in YYYY-MM format (e.g., "2025-12")
 */
export const monthToYYYYMM = (monthNumber: number, year?: number): string => {
  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error(`Invalid month number: ${monthNumber}. Must be between 1 and 12.`);
  }
  const currentYear = year ?? new Date().getFullYear();
  return `${currentYear}-${String(monthNumber).padStart(2, '0')}`;
};

