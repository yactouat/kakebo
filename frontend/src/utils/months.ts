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
 * Calculate the number of days remaining in the current month (including the last day).
 * @param monthNumber - Month number (1-12)
 * @param year - Year (required)
 * @returns Number of days remaining in the month (including today and the last day), or 0 if not the current month
 */
export const getDaysRemainingInMonth = (monthNumber: number, year: number): number => {
  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error(`Invalid month number: ${monthNumber}. Must be between 1 and 12.`);
  }
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const currentDay = currentDate.getDate();

  // If not the current month, return 0
  if (monthNumber !== currentMonth || year !== currentYear) {
    return 0;
  }

  // Get the last day of the current month
  const lastDayOfMonth = new Date(year, monthNumber, 0).getDate();
  
  // Calculate days remaining (including today and the last day)
  return lastDayOfMonth - currentDay + 1;
};

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
 * Generate year options for Select components.
 * @param startYear - Starting year (defaults to current year - 5)
 * @param endYear - Ending year (defaults to current year + 5)
 * @returns Array of year options in { value, label } format
 */
export const getYearOptions = (startYear?: number, endYear?: number): Array<{ value: string; label: string }> => {
  const currentYear = new Date().getFullYear();
  const start = startYear ?? currentYear - 5;
  const end = endYear ?? currentYear + 5;
  const years: Array<{ value: string; label: string }> = [];
  for (let year = start; year <= end; year++) {
    years.push({ value: String(year), label: String(year) });
  }
  return years;
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

