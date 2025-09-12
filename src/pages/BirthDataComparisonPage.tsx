import React, { useState } from 'react';
import BirthDataForm from '../components/BirthDataForm';
import EnhancedBirthDataForm from '../components/EnhancedBirthDataForm';
import EnhancedDropdownBirthDataForm from '../components/EnhancedDropdownBirthDataForm';

const BirthDataComparisonPage: React.FC = () => {
  const [activeForm, setActiveForm] = useState<'original' | 'enhanced' | 'dropdown'>('dropdown');
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const handleOriginalSubmit = async (formData: any) => {
    console.log('Original form data:', formData);
    setSubmissionResult({
      type: 'original',
      data: formData,
      timestamp: new Date().toISOString()
    });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleEnhancedSubmit = async (formData: any) => {
    console.log('Enhanced form data:', formData);
    setSubmissionResult({
      type: 'enhanced',
      data: formData,
      timestamp: new Date().toISOString()
    });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleDropdownSubmit = async (formData: any) => {
    console.log('Enhanced dropdown form data:', formData);
    setSubmissionResult({
      type: 'dropdown',
      data: formData,
      timestamp: new Date().toISOString()
    });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-600 mb-2">🔬 Birth Data Form Comparison</h1>
          <p className="text-gray-600">Phase 2 (DISSOLUTION) - Mobile-First Enhancement Testing</p>
        </div>

        {/* Form Selector */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2 flex-wrap gap-2">
            <button
              onClick={() => setActiveForm('original')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeForm === 'original'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Original (5 Dropdowns)
            </button>
            <button
              onClick={() => setActiveForm('enhanced')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeForm === 'enhanced'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              HTML5 Native Inputs
            </button>
            <button
              onClick={() => setActiveForm('dropdown')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeForm === 'dropdown'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Enhanced Dropdowns
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Display */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {activeForm === 'original' && '❌ Original Form'}
                {activeForm === 'enhanced' && '🔧 HTML5 Native Form'}
                {activeForm === 'dropdown' && '✅ Enhanced Dropdown Form'}
              </h2>
              <div className="text-sm text-gray-600">
                {activeForm === 'original' && (
                  <div className="space-y-1">
                    <p>• 5 separate dropdown selectors</p>
                    <p>• Complex mobile interaction</p>
                    <p>• Multiple validation points</p>
                    <p>• Poor accessibility</p>
                  </div>
                )}
                {activeForm === 'enhanced' && (
                  <div className="space-y-1">
                    <p>• 2 native HTML5 inputs</p>
                    <p>• Mobile-optimized experience</p>
                    <p>• Simplified validation</p>
                    <p>• Format confusion issues</p>
                  </div>
                )}
                {activeForm === 'dropdown' && (
                  <div className="space-y-1">
                    <p>• 6 mobile-optimized dropdowns</p>
                    <p>• Large touch targets (56px)</p>
                    <p>• Impossible to enter invalid dates</p>
                    <p>• Familiar UX with 12-hour time</p>
                  </div>
                )}
              </div>
            </div>

            {activeForm === 'original' && (
              <BirthDataForm
                onSubmit={handleOriginalSubmit}
                submitButtonText="Test Original Form"
                isRequired={false}
              />
            )}
            {activeForm === 'enhanced' && (
              <EnhancedBirthDataForm
                onSubmit={handleEnhancedSubmit}
                submitButtonText="Test HTML5 Form"
                isRequired={false}
              />
            )}
            {activeForm === 'dropdown' && (
              <EnhancedDropdownBirthDataForm
                onSubmit={handleDropdownSubmit}
                submitButtonText="Test Enhanced Dropdowns"
                isRequired={false}
              />
            )}
          </div>

          {/* Results Display */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Submission Results</h2>
            
            {submissionResult ? (
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    submissionResult.type === 'original' 
                      ? 'bg-red-100 text-red-800' 
                      : submissionResult.type === 'enhanced'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {submissionResult.type === 'original' && 'Original Form'}
                    {submissionResult.type === 'enhanced' && 'HTML5 Native Form'}
                    {submissionResult.type === 'dropdown' && 'Enhanced Dropdown Form'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted at: {new Date(submissionResult.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-700">Data Structure:</h3>
                    <pre className="mt-1 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(submissionResult.data, null, 2)}
                    </pre>
                  </div>

                  {submissionResult.type === 'enhanced' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <h4 className="font-medium text-blue-800 mb-2">🔧 HTML5 Native Benefits:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Native date format (YYYY-MM-DD) - perfect for backend</li>
                        <li>• Native time format (HH:MM) - ready for HD API</li>
                        <li>• Simplified data structure</li>
                        <li>• Mobile-optimized user experience</li>
                      </ul>
                    </div>
                  )}

                  {submissionResult.type === 'dropdown' && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <h4 className="font-medium text-green-800 mb-2">✅ Enhanced Dropdown Benefits:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Impossible to enter invalid dates - zero validation errors</li>
                        <li>• Familiar 12-hour time format with AM/PM</li>
                        <li>• Large 56px touch targets for mobile</li>
                        <li>• Smart defaults and intuitive UX</li>
                        <li>• Perfect data conversion to backend format</li>
                      </ul>
                    </div>
                  )}

                  {submissionResult.type === 'original' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <h4 className="font-medium text-red-800 mb-2">❌ Original Limitations:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Complex data structure with separate fields</li>
                        <li>• Requires frontend data conversion</li>
                        <li>• Poor mobile user experience</li>
                        <li>• Multiple validation points</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 shadow-lg text-center text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>Submit a form to see the data structure comparison</p>
              </div>
            )}

            {/* Technical Comparison */}
            <div className="mt-6 bg-white rounded-lg p-6 shadow-lg">
              <h3 className="font-medium text-gray-800 mb-3">🔧 Technical Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Original Form</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• 5 dropdown components</li>
                    <li>• Complex state management</li>
                    <li>• Manual date validation</li>
                    <li>• Poor mobile UX</li>
                    <li>• Accessibility issues</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">HTML5 Native Form</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• 2 native HTML5 inputs</li>
                    <li>• Simplified state</li>
                    <li>• Browser-native validation</li>
                    <li>• Mobile-optimized</li>
                    <li>• Format confusion</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-green-600 mb-2">Enhanced Dropdowns</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• 6 optimized dropdowns</li>
                    <li>• Smart state management</li>
                    <li>• Zero validation errors</li>
                    <li>• Mobile-first design</li>
                    <li>• Accessibility-first</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Phase 2 (DISSOLUTION): "Dissolve rigid structures to create fluid, adaptive systems"
          </p>
        </div>
      </div>
    </div>
  );
};

export default BirthDataComparisonPage;

