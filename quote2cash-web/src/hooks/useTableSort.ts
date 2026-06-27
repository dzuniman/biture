import { useState, useMemo } from 'react';

/**
 * Hook to manage sorting for a table.
 * @param data Array of items to be sorted.
 * @param defaultKey Optional default sort column.
 */
export default function useTableSort<T extends Record<string, any>>(data: T[], defaultKey: string | null = null) {
  const [sortKey, setSortKey] = useState<string | null>(defaultKey);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const setSort = (column: string) => {
    if (sortKey === column) {
      // Toggle direction
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const sorted = [...data];
    sorted.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return -1;
      if (bVal == null) return 1;
      // Numeric comparison if both are numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }
      // Date comparison if both are dates or parseable strings
      const aDate = new Date(aVal);
      const bDate = new Date(bVal);
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        return aDate.getTime() - bDate.getTime();
      }
      // Fallback to string comparison
      return String(aVal).localeCompare(String(bVal));
    });
    if (sortDirection === 'desc') sorted.reverse();
    return sorted;
  }, [data, sortKey, sortDirection]);

  return { sortedData, sortKey, sortDirection, setSort };
}
