import React from 'react';
import { useUIStore } from '../stores/uiStore';

const ThemeTestComponent: React.FC = () => {
  const { 
    theme, 
    setTheme, 
    toggleTheme, 
    openModal, 
    addNotification 
  } = useUIStore();

  const testMatch = {
    id: 'test-match-1',
    userId: 'user-123',
    userName: 'Sarah Johnson',
    userPhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=150&h=150&fit=crop&crop=face',
    compatibilityScore: 87,
    matchedAt: new Date().toISOString(),
    isNew: true,
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gradient mb-2">
          🎨 Theme & Modal Test
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Test the Sprint 1 foundation: theme switching, modals, and design system
        </p>
      </div>

      {/* Theme Controls */}
      <div className="card-glow p-6">
        <h2 className="text-xl font-semibold mb-4">Theme System</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Current theme: <span className="font-semibold">{theme}</span>
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setTheme('light')}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'light' 
                    ? 'bg-glow-pink text-white border-glow-pink' 
                    : 'btn-secondary'
                }`}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-glow-purple text-white border-glow-purple' 
                    : 'btn-secondary'
                }`}
              >
                🌙 Dark
              </button>
              <button
                onClick={() => setTheme('auto')}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'auto' 
                    ? 'bg-glow-orange text-white border-glow-orange' 
                    : 'btn-secondary'
                }`}
              >
                🔄 Auto
              </button>
            </div>
            <button
              onClick={toggleTheme}
              className="mt-2 btn-primary"
            >
              Toggle Theme
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tests */}
      <div className="card-glow p-6">
        <h2 className="text-xl font-semibold mb-4">Modal System</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => openModal('match', testMatch)}
            className="btn-primary"
          >
            🎉 Match Modal
          </button>
          <button
            onClick={() => openModal('settings')}
            className="btn-secondary"
          >
            ⚙️ Settings Modal
          </button>
          <button
            onClick={() => openModal('profile', { userId: 'test-123' })}
            className="btn-secondary"
          >
            👤 Profile Modal
          </button>
          <button
            onClick={() => openModal('birth-data')}
            className="btn-secondary"
          >
            🌟 Birth Data Modal
          </button>
        </div>
      </div>

      {/* Notification Tests */}
      <div className="card-glow p-6">
        <h2 className="text-xl font-semibold mb-4">Notification System</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => addNotification({
              type: 'success',
              title: 'Success!',
              message: 'Theme switching is working perfectly!'
            })}
            className="btn-primary"
          >
            ✅ Success
          </button>
          <button
            onClick={() => addNotification({
              type: 'error',
              title: 'Error',
              message: 'This is a test error notification'
            })}
            className="btn-secondary"
          >
            ❌ Error
          </button>
          <button
            onClick={() => addNotification({
              type: 'info',
              title: 'Info',
              message: 'Modal system is ready for testing!'
            })}
            className="btn-secondary"
          >
            ℹ️ Info
          </button>
          <button
            onClick={() => addNotification({
              type: 'warning',
              title: 'Warning',
              message: 'This is a warning notification'
            })}
            className="btn-secondary"
          >
            ⚠️ Warning
          </button>
        </div>
      </div>

      {/* Design System Showcase */}
      <div className="card-glow p-6">
        <h2 className="text-xl font-semibold mb-4">Design System</h2>
        <div className="space-y-4">
          {/* Gradients */}
          <div className="space-y-2">
            <div className="h-12 gradient-glow rounded-lg flex items-center justify-center text-white font-semibold">
              Primary Gradient
            </div>
            <div className="h-12 gradient-glow-orange rounded-lg flex items-center justify-center text-white font-semibold">
              Secondary Gradient
            </div>
          </div>
          
          {/* Swipe Buttons */}
          <div className="flex justify-center space-x-4">
            <div className="swipe-button pass">✕</div>
            <div className="swipe-button super-like">⭐</div>
            <div className="swipe-button like">♥</div>
          </div>
          
          {/* Profile Card Example */}
          <div className="profile-card max-w-sm mx-auto">
            <div className="h-48 bg-gradient-to-br from-glow-pink to-glow-purple"></div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">Design System</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Mobile-first, accessible, beautiful
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeTestComponent;

