import React from 'react';

interface ReadOnlyFieldProps {
  label: string;
  value?: string | null;
  showChip?: boolean;
}

const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ label, value, showChip }) => {
  // Handle falsy values robustly (null, undefined, empty string)
  const displayValue = value && value.trim() ? value : 'Not set';
  const isNotSet = !value || !value.trim();

  return (
    <div 
      className="flex justify-between items-center py-4 border-b border-gray-200 last:border-b-0"
      role="group"
      aria-labelledby={`label-${label.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <label 
        id={`label-${label.replace(/\s+/g, '-').toLowerCase()}`}
        className="text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      
      <div className="min-w-[120px] text-right">
        {showChip ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Read only
          </span>
        ) : (
          <span 
            className={`text-sm ${isNotSet ? 'text-gray-400 italic' : 'text-gray-900'}`}
          >
            {displayValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default ReadOnlyField;
