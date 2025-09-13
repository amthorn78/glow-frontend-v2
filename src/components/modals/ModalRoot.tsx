import React from 'react';
import { useUIStore, type ModalType } from '../../stores/uiStore';
import MatchCelebrationModal from './MatchCelebrationModal';
import ProfileDetailModal from './ProfileDetailModal';
import SettingsModal from './SettingsModal';
import BirthDataModal from './BirthDataModal';
import CompatibilityModal from './CompatibilityModal';

// ============================================================================
// MODAL REGISTRY
// ============================================================================

const MODAL_COMPONENTS: Record<
  NonNullable<ModalType>,
  React.ComponentType<{ data?: any; onClose: () => void }>
> = {
  'match': MatchCelebrationModal,
  'profile': ProfileDetailModal,
  'settings': SettingsModal,
  'birth-data': BirthDataModal,
  'compatibility': CompatibilityModal,
};

// ============================================================================
// MODAL ROOT COMPONENT
// ============================================================================

export const ModalRoot: React.FC = () => {
  const { activeModal, modalData, closeModal } = useUIStore();

  // Don't render anything if no modal is active
  if (!activeModal) return null;

  const ModalComponent = MODAL_COMPONENTS[activeModal];
  
  // Safety check - if modal type is not registered, don't render
  if (!ModalComponent) {
    console.warn(`Modal component not found for type: ${activeModal}`);
    return null;
  }

  return (
    <div className="modal-root">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 modal-backdrop animate-fade-in"
        onClick={closeModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Container */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className="modal-container animate-slide-up max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <ModalComponent data={modalData} onClose={closeModal} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalRoot;

