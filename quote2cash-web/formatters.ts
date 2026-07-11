/**
 * Formats a number or string into a currency format consistent with the Quotes page.
 * Defaults to South African Rand (ZAR).
 */
export const formatAmount = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return 'R 0,00';

  const amount = typeof value === 'string' ? parseFloat(value) : value;

  // Format absolute value only
  const formattedAbs = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));

  // Add minus sign manually if negative
  return amount < 0 ? `-${formattedAbs}` : formattedAbs;
};
