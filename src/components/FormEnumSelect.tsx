import React from 'react';

interface FormEnumSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  helpText?: string;
  name?: string;
}

export const FormEnumSelect: React.FC<FormEnumSelectProps> = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
  helpText,
  name
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  const selectId = name || `enum-select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const helpId = helpText ? `${selectId}-help` : undefined;

  return (
    <div className="space-y-2">
      <label 
        htmlFor={selectId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      
      {helpText && (
        <p 
          id={helpId}
          className="text-sm text-gray-500"
        >
          {helpText}
        </p>
      )}
      
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={helpId}
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          text-sm
        `.trim()}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
};
