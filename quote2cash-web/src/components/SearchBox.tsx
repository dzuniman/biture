import React, { useState, useEffect } from 'react';

interface SearchBoxProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

const SearchBox: React.FC<SearchBoxProps> = ({ placeholder = 'Search...', value, onChange, debounceMs = 300 }) => {
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(internal);
    }, debounceMs);
    return () => {
      clearTimeout(handler);
    };
  }, [internal, onChange, debounceMs]);

  // Keep internal state in sync when external value changes (e.g., reset)
  useEffect(() => {
    setInternal(value);
  }, [value]);

  return (
    <input
      type="text"
      className="search-box"
      placeholder={placeholder}
      value={internal}
      onChange={(e) => setInternal(e.target.value)}
    />
  );
};

export default SearchBox;
