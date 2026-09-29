'use client';

import React, { useState, useRef, useEffect } from 'react';
import { searchPeople } from '@/store';
import { UserPlus } from 'lucide-react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
  onAddNew?: () => void;
}

export default function AutocompleteInput({
  value,
  onChange,
  placeholder,
  className = 'form-input',
  id,
  required,
  onAddNew,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    const results = searchPeople(val);
    setSuggestions(results);
    setShowDropdown(results.length > 0 || (onAddNew !== undefined));
    setActiveIndex(-1);
  };

  const handleSelect = (name: string) => {
    onChange(name);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const max = onAddNew ? suggestions.length : suggestions.length - 1;
      setActiveIndex((prev) => Math.min(prev + 1, max));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      if (activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else if (onAddNew) {
        onAddNew();
        setShowDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => handleChange(value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="off"
      />
      {showDropdown && (suggestions.length > 0 || onAddNew) && (
        <div className="autocomplete-dropdown">
          {suggestions.map((name, index) => (
            <div
              key={name}
              className={`autocomplete-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => handleSelect(name)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {name}
            </div>
          ))}
          {onAddNew && (
            <div
              className={`autocomplete-item ${activeIndex === suggestions.length ? 'active' : ''}`}
              onClick={() => {
                onAddNew();
                setShowDropdown(false);
              }}
              onMouseEnter={() => setActiveIndex(suggestions.length)}
              style={{
                borderTop: suggestions.length > 0 ? '1px solid var(--border-color)' : undefined,
                color: 'var(--brand-primary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <UserPlus size={14} />
              + नया व्यक्ति जोड़ें / Add New Person
            </div>
          )}
        </div>
      )}
    </div>
  );
}
