import React from 'react';

interface TableHeaderProps {
  columnKey: string;
  label: string;
  sortKey: string | null;
  sortDirection: 'asc' | 'desc' | null;
  onSort: (column: string) => void;
  className?: string;
}

const TableHeader: React.FC<TableHeaderProps> = ({ columnKey, label, sortKey, sortDirection, onSort, className }) => {
  const isActive = sortKey === columnKey;
  const arrow = isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '';

  const handleClick = () => {
    onSort(columnKey);
  };

  return (
    <th
      className={className}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={handleClick}
    >
      {label} {arrow && <span className="sort-arrow" style={{ marginLeft: '4px' }}>{arrow}</span>}
    </th>
  );
};

export default TableHeader;
