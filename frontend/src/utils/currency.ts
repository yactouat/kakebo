/**
 * Formats a currency amount for display.
 * @param amount - The amount to format
 * @param currency - The currency code (defaults to 'EUR')
 * @returns Formatted currency string (e.g., "€100.00" or "100.00 USD")
 */
export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  if (currency === 'EUR') {
    return `€${amount.toFixed(2)}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
};

