import React from 'react';
import BirthDataFormCanonical from '../components/BirthDataFormCanonical';

const BirthDataPage: React.FC = () => {
  const handleSuccess = () => {
    // P0-FREEZE: No router navigation - use hard navigation if needed
    // For now, just show success feedback (handled by form component)
    console.log('Birth data saved successfully');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Birth Information</h1>
        <p className="text-gray-600">
          Update your birth details for accurate compatibility calculations.
        </p>
      </div>

      <BirthDataFormCanonical
        onSuccess={handleSuccess}
        submitButtonText="Save Birth Data"
      />
    </div>
  );
};

export default BirthDataPage;

