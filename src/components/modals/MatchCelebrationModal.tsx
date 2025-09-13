import React from 'react';
import { type Match } from '../../stores/uiStore';

interface MatchCelebrationModalProps {
  data?: Match;
  onClose: () => void;
}

const MatchCelebrationModal: React.FC<MatchCelebrationModalProps> = ({ data, onClose }) => {
  const match = data as Match;

  if (!match) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No match data available</p>
        <button
          onClick={onClose}
          className="mt-4 btn-secondary"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      {/* Celebration Animation */}
      <div className="mb-6">
        <div className="text-6xl animate-match-celebration mb-4">🎉</div>
        <h2 id="modal-title" className="text-2xl font-bold text-gradient mb-2">
          It's a Match!
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          You and {match.userName} liked each other
        </p>
      </div>

      {/* Match Profile */}
      <div className="mb-6">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
          <img
            src={match.userPhoto}
            alt={match.userName}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-xl font-semibold mb-2">{match.userName}</h3>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-500">Compatibility:</span>
          <span className="text-lg font-bold text-gradient">
            {match.compatibilityScore}%
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onClose}
          className="flex-1 btn-secondary"
        >
          Keep Swiping
        </button>
        <button
          onClick={() => {
            // TODO: Navigate to chat with this match
            console.log('Start chat with:', match.userId);
            onClose();
          }}
          className="flex-1 btn-primary"
        >
          Send Message
        </button>
      </div>
    </div>
  );
};

export default MatchCelebrationModal;

