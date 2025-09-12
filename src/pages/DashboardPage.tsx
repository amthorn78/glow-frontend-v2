import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useMagic10Store } from '../stores/magic10Store';
import Magic10SimpleDisplay from '../components/Magic10SimpleDisplay';

// Dashboard Components
const UserWelcome: React.FC<{ user: any }> = ({ user }) => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-xl mb-6">
      <h1 className="text-2xl font-bold mb-2">
        {greeting}, {user?.firstName || 'there'}! ✨
      </h1>
      <p className="text-pink-100">
        Welcome back to your connection journey
      </p>
    </div>
  );
};

const ProfileProgress: React.FC<{ completionPercentage: number }> = ({ completionPercentage }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Completion</h2>
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-pink-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">
          {completionPercentage}% complete
        </p>
      </div>

      {completionPercentage < 100 && (
        <p className="text-sm text-pink-600 mt-2">
          Complete your profile to get better matches!
        </p>
      )}
    </div>
  );
};

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Discover',
      description: 'Find your perfect match',
      icon: '💕',
      action: () => navigate('/discovery'),
      color: 'from-pink-500 to-rose-500'
    },
    {
      title: 'Magic 10',
      description: 'Set your priorities',
      icon: '⚡',
      action: () => navigate('/magic10-setup'),
      color: 'from-purple-500 to-indigo-500'
    },
    {
      title: 'Profile',
      description: 'Manage your profile',
      icon: '👤',
      action: () => navigate('/profile'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Messages',
      description: 'Chat with matches',
      icon: '💬',
      action: () => navigate('/conversations'),
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className={`bg-gradient-to-r ${action.color} text-white p-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
        >
          <div className="text-2xl mb-2">{action.icon}</div>
          <h3 className="font-semibold text-sm">{action.title}</h3>
          <p className="text-xs opacity-90">{action.description}</p>
        </button>
      ))}
    </div>
  );
};

const OnboardingPrompts: React.FC<{ missingSteps: string[] }> = ({ missingSteps }) => {
  const navigate = useNavigate();

  if (missingSteps.length === 0) return null;

  const stepActions = {
    'magic10': () => navigate('/magic10-setup'),
    'birthData': () => navigate('/birth-data'),
    'photos': () => navigate('/profile/edit'),
    'bio': () => navigate('/profile/edit')
  };

  const stepLabels = {
    'magic10': 'Set your Magic 10 priorities',
    'birthData': 'Add your birth information',
    'photos': 'Upload profile photos',
    'bio': 'Write your bio'
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">
        Complete Your Profile
      </h3>
      <div className="space-y-3">
        {missingSteps.map((step, index) => (
          <button
            key={index}
            onClick={stepActions[step as keyof typeof stepActions]}
            className="w-full text-left p-3 bg-white rounded-lg border border-yellow-200 hover:border-yellow-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-800">{stepLabels[step as keyof typeof stepLabels]}</span>
              <span className="text-yellow-600">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const RecentMatches: React.FC = () => {
  // Placeholder for recent matches - will be implemented in Sprint 3
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">💫</div>
        <p>Start discovering to see your matches here!</p>
        <button 
          onClick={() => window.location.href = '/discovery'}
          className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
        >
          Start Discovering
        </button>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { priorities } = useMagic10Store();
  const navigate = useNavigate();

  // Calculate profile completion
  const calculateCompletion = () => {
    let completion = 0;
    
    // Basic profile (25%)
    if (user?.firstName && user?.lastName) completion += 25;
    
    // Magic 10 priorities (35%)
    const hasPriorities = Object.values(priorities).some(value => value > 0);
    if (hasPriorities) completion += 35;
    
    // Birth data (25%) - placeholder for now
    // TODO: Check if user has birth data when birth data store is implemented
    
    // Photos and bio (15%) - placeholder for now
    // TODO: Check if user has photos and bio when profile store is implemented
    
    return completion;
  };

  const completionPercentage = calculateCompletion();

  // Determine missing onboarding steps
  const getMissingSteps = () => {
    const missing: string[] = [];
    
    const hasPriorities = Object.values(priorities).some(value => value > 0);
    if (!hasPriorities) missing.push('magic10');
    
    // TODO: Add birth data check when birth data store is implemented
    // if (!hasBirthData) missing.push('birthData');
    
    // TODO: Add photos and bio checks when profile store is implemented
    // if (!hasPhotos) missing.push('photos');
    // if (!hasBio) missing.push('bio');
    
    return missing;
  };

  const missingSteps = getMissingSteps();

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Welcome Section */}
        <UserWelcome user={user} />

        {/* Profile Progress */}
        <ProfileProgress completionPercentage={completionPercentage} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Magic 10 Priorities Display */}
        <Magic10SimpleDisplay />

        {/* Onboarding Prompts */}
        {missingSteps.length > 0 && (
          <OnboardingPrompts missingSteps={missingSteps} />
        )}

        {/* Recent Matches */}
        <RecentMatches />

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            ✨ GLOW - Where compatibility meets chemistry ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

