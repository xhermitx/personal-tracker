'use client';

import { useRef } from 'react';
import { FiCalendar } from 'react-icons/fi';

interface Props {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

export default function DatePicker({ value, onChange, required }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="custom-datepicker-container" onClick={() => inputRef.current?.showPicker?.()}>
      <input
        ref={inputRef}
        type="date"
        className="custom-datepicker-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
      <div className="custom-datepicker-display">
        <FiCalendar className="custom-datepicker-icon" />
        <span className={`custom-datepicker-text ${!value ? 'placeholder' : ''}`}>
          {value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date...'}
        </span>
      </div>
    </div>
  );
}
