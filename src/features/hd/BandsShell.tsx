import React from 'react';
import bandsData from '../../fixtures/hd_bands_example.json';

// Type definitions for the bands data structure
interface Category {
  id: string;
  band: 'Cool' | 'Open' | 'Warm' | 'Glow';
}

interface BandsData {
  engine_tag?: string;
  eligible: boolean;
  uncertainty: 'none' | 'low' | 'high';
  categories: Category[];
  top3_shared: string[];
  prompt: string;
  flags?: {
    out_of_preset?: boolean;
    relaxed_pool?: boolean;
  };
}

// Band color mapping for visual styling
const getBandColor = (band: Category['band']): string => {
  switch (band) {
    case 'Cool':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Open':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Warm':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Glow':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Uncertainty indicator styling
const getUncertaintyColor = (uncertainty: BandsData['uncertainty']): string => {
  switch (uncertainty) {
    case 'none':
      return 'text-green-600';
    case 'low':
      return 'text-yellow-600';
    case 'high':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const BandsShell: React.FC = () => {
  const data = bandsData as BandsData;

  return (
    <div 
      className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border"
      role="region"
      aria-labelledby="bands-shell-title"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 
          id="bands-shell-title"
          className="text-2xl font-semibold text-gray-900 mb-2"
        >
          HD Bands Analysis
        </h2>
        
        {data.engine_tag && (
          <p className="text-sm text-gray-500 font-mono">
            Engine: {data.engine_tag}
          </p>
        )}
      </div>

      {/* Eligibility and Uncertainty Status */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Eligible:</span>
          <span 
            className={`px-2 py-1 rounded text-sm font-medium ${
              data.eligible 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
            aria-label={`Eligibility status: ${data.eligible ? 'eligible' : 'not eligible'}`}
          >
            {data.eligible ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Uncertainty:</span>
          <span 
            className={`px-2 py-1 rounded text-sm font-medium ${getUncertaintyColor(data.uncertainty)}`}
            aria-label={`Uncertainty level: ${data.uncertainty}`}
          >
            {data.uncertainty.charAt(0).toUpperCase() + data.uncertainty.slice(1)}
          </span>
        </div>
      </div>

      {/* Prompt */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Guidance Prompt
        </h3>
        <blockquote 
          className="bg-gray-50 border-l-4 border-gray-300 pl-4 py-3 italic text-gray-700"
          role="note"
          aria-label="Guidance prompt"
        >
          "{data.prompt}"
        </blockquote>
      </div>

      {/* Top 3 Shared */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Top 3 Shared Categories
        </h3>
        <div 
          className="flex flex-wrap gap-2"
          role="list"
          aria-label="Top 3 shared categories"
        >
          {data.top3_shared.map((category, index) => (
            <span
              key={category}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
              role="listitem"
              aria-label={`Rank ${index + 1}: ${category}`}
            >
              {index + 1}. {category}
            </span>
          ))}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Category Bands ({data.categories.length} total)
        </h3>
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          role="grid"
          aria-label="Category bands grid"
        >
          {data.categories.map((category) => (
            <div
              key={category.id}
              className={`p-3 rounded-lg border ${getBandColor(category.band)}`}
              role="gridcell"
              tabIndex={0}
              aria-label={`Category: ${category.id}, Band: ${category.band}`}
            >
              <div className="font-medium capitalize">
                {category.id}
              </div>
              <div className="text-sm font-semibold">
                {category.band}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flags (if present) */}
      {data.flags && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Engine Flags
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(data.flags).map(([key, value]) => (
              <span
                key={key}
                className={`px-2 py-1 rounded ${
                  value 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}
                aria-label={`Flag ${key}: ${value ? 'enabled' : 'disabled'}`}
              >
                {key}: {value ? 'true' : 'false'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BandsShell;
