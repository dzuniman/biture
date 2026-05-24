interface Props {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ placeholder, value, onChange }: Props) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-input"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="search-clear"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
