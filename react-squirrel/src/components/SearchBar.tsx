import React from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...'
}) => {
  return (
    <div className="search-bar-container">
      <FaSearch className="search-icon" />
      <input
        type="text"
        className="search-bar"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          className="clear-button"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
};
