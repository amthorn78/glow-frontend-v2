import React from 'react';

interface ProfileDetailModalProps {
  data?: any;
  onClose: () => void;
}

const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({ data, onClose }) => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 id="modal-title" className="text-xl font-bold">
          Profile Details
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl"
          aria-label="Close modal"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300">
          Profile detail modal content will be implemented in future sprints.
        </p>
        
        {data && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 mt-6">
        <button onClick={onClose} className="btn-secondary">
          Close
        </button>
      </div>
    </div>
  );
};

export default ProfileDetailModal;

