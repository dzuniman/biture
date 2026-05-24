/**
 * Formats a number or string into a currency format consistent with the Quotes page.
 * Defaults to South African Rand (ZAR).
 */
export const formatAmount = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return 'R 0.00';
  
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
};