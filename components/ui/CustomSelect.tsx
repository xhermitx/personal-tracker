'use client';

import { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string; // Hex color for a custom background/avatar
  avatarText?: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function CustomSelect({ value, onChange, options, placeholder = 'Select...', disabled, required }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`custom-select-container ${disabled ? 'disabled' : ''}`} ref={containerRef}>
      {/* Hidden input for form validation if required */}
      {required && (
        <input 
          type="text" 
          required 
          value={value} 
          onChange={() => {}} 
          style={{ opacity: 0, position: 'absolute', height: 0, width: 0, zIndex: -1 }} 
        />
      )}

      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${!value ? 'placeholder' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="custom-select-value">
          {selectedOption ? (
            <div className="custom-select-item-content">
              {selectedOption.color && selectedOption.avatarText && (
                <div 
                  className="custom-select-avatar" 
                  style={{ background: `${selectedOption.color}33`, color: selectedOption.color, border: `1px solid ${selectedOption.color}55` }}
                >
                  {selectedOption.avatarText}
                </div>
              )}
              {selectedOption.icon && <span className="custom-select-icon">{selectedOption.icon}</span>}
              <span className="custom-select-label">{selectedOption.label}</span>
            </div>
          ) : (
            placeholder
          )}
        </div>
        <FiChevronDown className={`custom-select-arrow ${isOpen ? 'open' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="custom-select-dropdown">
          {options.length === 0 ? (
            <div className="custom-select-empty">No options available</div>
          ) : (
            options.map(option => (
              <div
                key={option.value}
                className={`custom-select-option ${value === option.value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <div className="custom-select-item-content">
                  {option.color && option.avatarText && (
                    <div 
                      className="custom-select-avatar" 
                      style={{ background: `${option.color}33`, color: option.color, border: `1px solid ${option.color}55` }}
                    >
                      {option.avatarText}
                    </div>
                  )}
                  {option.icon && <span className="custom-select-icon">{option.icon}</span>}
                  <span className="custom-select-label">{option.label}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
