// GLOW Landing Page - Magic 10 + HD Dating Platform - Build fixes applied
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentRoute } = useUIStore();

  React.useEffect(() => {
    setCurrentRoute('/');
  }, [setCurrentRoute]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="text-center max-w-md">
        {/* GLOW Branding */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-pink-600 mb-2">✨ GLOW ✨</h1>
          <p className="text-xl text-gray-700 mb-4">
            Find your perfect match through Magic 10 compatibility
          </p>
          <p className="text-sm text-gray-600">
            Revolutionary connection intelligence powered by Human Design
          </p>
        </div>

        {/* Magic 10 Preview */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🎯 Magic 10 Connection Priorities
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>💕 Love</div>
            <div>🤗 Intimacy</div>
            <div>💬 Communication</div>
            <div>👫 Friendship</div>
            <div>🤝 Collaboration</div>
            <div>🏠 Lifestyle</div>
            <div>⚖️ Decisions</div>
            <div>🛡️ Support</div>
            <div>🌱 Growth</div>
            <div>🌌 Space</div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Set your priorities, get enhanced compatibility scores
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/register')}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Start Your GLOW Journey
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full border-2 border-pink-300 text-pink-600 font-semibold py-4 px-6 rounded-xl hover:bg-pink-50 transition-all duration-200"
          >
            Sign In
          </button>
        </div>

        {/* Features Preview */}
        <div className="mt-8 text-xs text-gray-500">
          <p>🧠 Enhanced by Human Design Intelligence</p>
          <p>📱 Mobile-First Dating Experience</p>
          <p>✨ Revolutionary Compatibility Matching</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

// Force redeploy Fri Sep 12 16:14:54 EDT 2025
