import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../core/api';
import { 
  ResonanceConfig, 
  ResonanceDimension, 
  ResonancePrefs,
  configToDimensions,
  createDefaultWeights,
  validateWeights
} from '../config/resonance';

type SetupPhase = 'loading' | 'welcome' | 'setup' | 'completion';

const ResonanceTenSetupPage: React.FC = () => {
  if (typeof window !== "undefined") {
    // 🔎 runtime fingerprint
    (window as any).__R10_PAGE__ = "ResonanceTenSetupPage@v1";
    console.log("[R10] Page:", (window as any).__R10_PAGE__);
  }

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [phase, setPhase] = useState<SetupPhase>('loading');
  const [currentStep, setCurrentStep] = useState(0);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [dimensions, setDimensions] = useState<ResonanceDimension[]>([]);

  // Load Resonance Ten configuration from backend
  const { 
    data: configData, 
    isLoading: configLoading, 
    error: configError,
    refetch: refetchConfig 
  } = useQuery({
    queryKey: ['r10-config'],
    queryFn: async () => {
      const r = await fetch('/api/config/resonance', { credentials: 'include' });
      const text = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}\n${text.slice(0,300)}`);
      try { return JSON.parse(text); } catch { throw new Error(`Bad JSON\n${text.slice(0,300)}`); }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000,
  });

  // Load existing user preferences
  const { 
    data: prefsData, 
    isLoading: prefsLoading,
    error: prefsError,
    refetch: refetchPrefs
  } = useQuery({
    queryKey: ['resonance-prefs'],
    queryFn: () => apiClient.getResonancePrefs(),
    enabled: !!user && !!configData?.data,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Save preferences mutation
  const savePrefsMutation = useMutation({
    mutationFn: (prefs: ResonancePrefs) => apiClient.updateResonancePrefs(prefs),
    onSuccess: () => {
      setPhase('completion');
    },
    onError: (error) => {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    }
  });

  // Initialize when config loads
  useEffect(() => {
    if (configData?.data) {
      const config: ResonanceConfig = configData.data;
      const dims = configToDimensions(config);
      setDimensions(dims);
      
      // Initialize weights
      if (prefsData?.data?.weights) {
        setWeights(prefsData.data.weights);
      } else {
        setWeights(createDefaultWeights(config.keys));
      }
      
      setPhase('welcome');
    }
  }, [configData, prefsData]);

  const handleWeightChange = (key: string, value: number) => {
    setWeights(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < dimensions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSave();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    if (!configData?.data) return;
    
    const config: ResonanceConfig = configData.data;
    
    // Validate weights
    if (!validateWeights(weights, config.keys)) {
      alert('Invalid weight values. Please check your selections.');
      return;
    }

    const prefs: ResonancePrefs = {
      version: config.version,
      weights,
      facets: {} // Sub-facets can be added later
    };

    savePrefsMutation.mutate(prefs);
  };

  const handleSkipToEnd = () => {
    setCurrentStep(dimensions.length - 1);
  };

  const handleStartOver = () => {
    setCurrentStep(0);
    setPhase('welcome');
  };

  const handleContinueToApp = () => {
    navigate('/discovery');
  };

  if (phase === 'loading' || configLoading || prefsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center" data-page="ResonanceTenSetupPage@v1">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Resonance Ten...</p>
        </div>
      </div>
    );
  }

  // Handle configuration error
  if (configError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-semibold text-white mb-4">Failed to Load Resonance Ten</h2>
            <p className="text-rose-600 font-medium mb-4">Failed to load Resonance Ten.</p>
            <pre className="text-xs mt-2 whitespace-pre-wrap text-left bg-black/20 p-3 rounded text-purple-200 mb-6">{String(configError)}</pre>
            <div className="space-y-3">
              <button 
                onClick={() => refetchConfig()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate('/discovery')}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Skip for Now
              </button>
            </div>
            <p className="mt-4 text-sm text-purple-300">
              If this continues, please contact support or check your internet connection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle preferences error (less critical)
  if (prefsError) {
    console.warn('Failed to load existing preferences:', prefsError);
    // Continue with default preferences
  }

  if (phase === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Welcome to Resonance Ten
            </h1>
            <p className="text-xl text-purple-200 mb-8">
              Discover what matters most in your relationships through ten key dimensions of compatibility.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">How it works</h2>
            <p className="text-purple-200 mb-6">
              You'll set your priorities for {dimensions.length} relationship dimensions. 
              Our system uses these preferences to find compatible matches and provide 
              personalized relationship insights.
            </p>
            <div className="text-sm text-purple-300">
              Takes about 3-5 minutes • Your preferences can be updated anytime
            </div>
          </div>

          <button
            onClick={() => setPhase('setup')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-full text-lg transition-all duration-200 transform hover:scale-105"
          >
            Let's Begin
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    const currentDimension = dimensions[currentStep];
    const progress = ((currentStep + 1) / dimensions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Resonance Ten Setup</h1>
            <p className="text-purple-200">Step {currentStep + 1} of {dimensions.length}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 mb-8">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Current Dimension */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{currentDimension.icon}</div>
              <h2 className="text-3xl font-bold text-white mb-4">{currentDimension.label}</h2>
              <p className="text-xl text-purple-200 mb-6">{currentDimension.description}</p>
            </div>

            {/* Slider */}
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <label className="block text-white text-lg font-medium mb-4">
                  How important is this to you? ({weights[currentDimension.key] || 50}/100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights[currentDimension.key] || 50}
                  onChange={(e) => handleWeightChange(currentDimension.key, parseInt(e.target.value))}
                  className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-purple-300 mt-2">
                  <span>Not Important</span>
                  <span>Very Important</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-full transition-all duration-200"
            >
              Previous
            </button>

            <div className="flex space-x-4">
              <button
                onClick={handleSkipToEnd}
                className="text-purple-300 hover:text-white font-medium py-3 px-6 rounded-full transition-all duration-200"
              >
                Skip to End
              </button>
              
              <button
                onClick={handleNext}
                disabled={savePrefsMutation.isPending}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-full transition-all duration-200"
              >
                {currentStep === dimensions.length - 1 ? 
                  (savePrefsMutation.isPending ? 'Saving...' : 'Complete Setup') : 
                  'Next'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'completion') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Setup Complete!
            </h1>
            <p className="text-xl text-purple-200 mb-8">
              Your Resonance Ten preferences have been saved. We'll use these to find your most compatible matches.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">What's Next?</h3>
            <p className="text-purple-200 mb-4">
              Start discovering profiles that resonate with your preferences. 
              You can update your settings anytime from your profile.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartOver}
              className="bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-full transition-all duration-200"
            >
              Review Settings
            </button>
            
            <button
              onClick={handleContinueToApp}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-200"
            >
              Start Discovering
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ResonanceTenSetupPage;

