import React from 'react';
import { useUIStore } from '../../stores/uiStore';

interface SettingsModalProps {
  data?: any;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { 
    theme, 
    setTheme, 
    reducedMotion, 
    setReducedMotion,
    lowDataMode,
    setLowDataMode 
  } = useUIStore();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 id="modal-title" className="text-xl font-bold">
          Settings
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl"
          aria-label="Close modal"
        >
          ×
        </button>
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Appearance</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
                className="text-glow-purple focus:ring-glow-purple"
              />
              <span>Light</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
                className="text-glow-purple focus:ring-glow-purple"
              />
              <span>Dark</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="theme"
                value="auto"
                checked={theme === 'auto'}
                onChange={() => setTheme('auto')}
                className="text-glow-purple focus:ring-glow-purple"
              />
              <span>System</span>
            </label>
          </div>
        </div>

        {/* Accessibility Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Accessibility</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Reduced Motion</span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="text-glow-purple focus:ring-glow-purple"
              />
            </label>
          </div>
        </div>

        {/* Performance Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Performance</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Low Data Mode</span>
              <input
                type="checkbox"
                checked={lowDataMode}
                onChange={(e) => setLowDataMode(e.target.checked)}
                className="text-glow-purple focus:ring-glow-purple"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 mt-6">
        <button onClick={onClose} className="btn-primary">
          Done
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;

