import React, { useState, useEffect, useRef } from 'react';
import { useMagic10Store } from '../stores/magic10Store';

interface DragItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  rank: number;
}

const Magic10DragRanking: React.FC = () => {
  const { priorities, updatePriorities, isLoading } = useMagic10Store();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [items, setItems] = useState<DragItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  // Magic 10 dimensions with enhanced styling
  const dimensionConfig: { [key: string]: { label: string; icon: string; color: string } } = {
    physicalAttraction: { label: 'Physical Attraction', icon: '💕', color: '#ec4899' },
    emotionalConnection: { label: 'Emotional Connection', icon: '💖', color: '#f59e0b' },
    intellectualCompatibility: { label: 'Intellectual Compatibility', icon: '🧠', color: '#3b82f6' },
    spiritualAlignment: { label: 'Spiritual Alignment', icon: '✨', color: '#8b5cf6' },
    communicationStyle: { label: 'Communication Style', icon: '💬', color: '#10b981' },
    lifestyleCompatibility: { label: 'Lifestyle Compatibility', icon: '🏠', color: '#f97316' },
    valuesAlignment: { label: 'Values Alignment', icon: '⚖️', color: '#6366f1' },
    humorCompatibility: { label: 'Humor Compatibility', icon: '😄', color: '#84cc16' },
    ambitionAlignment: { label: 'Ambition Alignment', icon: '🎯', color: '#ef4444' },
    familyOrientation: { label: 'Family Orientation', icon: '👨‍👩‍👧‍👦', color: '#06b6d4' }
  };

  // Convert priorities to ranked items
  useEffect(() => {
    const priorityEntries = Object.entries(priorities);
    const rankedItems = priorityEntries
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .map(([key, value], index) => ({
        id: key,
        label: dimensionConfig[key]?.label || key,
        icon: dimensionConfig[key]?.icon || '💫',
        color: dimensionConfig[key]?.color || '#6b7280',
        rank: index + 1
      }));
    setItems(rankedItems);
  }, [priorities]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', itemId);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null);
    setDragOverItem(null);
    
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(itemId);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, dropItemId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === dropItemId) return;

    const newItems = [...items];
    const draggedIndex = newItems.findIndex(item => item.id === draggedItem);
    const dropIndex = newItems.findIndex(item => item.id === dropItemId);

    // Reorder items
    const [draggedItemData] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItemData);

    // Update ranks
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    setItems(updatedItems);
    setHasChanges(true);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Touch handling for mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchItem, setTouchItem] = useState<string | null>(null);

  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchItem(itemId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !touchItem) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropTarget = element?.closest('[data-item-id]');
    
    if (dropTarget) {
      const dropItemId = dropTarget.getAttribute('data-item-id');
      if (dropItemId && dropItemId !== touchItem) {
        setDragOverItem(dropItemId);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchItem || !dragOverItem) {
      setTouchStart(null);
      setTouchItem(null);
      setDragOverItem(null);
      return;
    }

    // Perform the drop
    handleDrop(e as any, dragOverItem);
    setTouchStart(null);
    setTouchItem(null);
  };

  // Save changes
  const handleSave = async () => {
    try {
      // Convert ranked items back to priorities (10 for rank 1, 9 for rank 2, etc.)
      const newPriorities: { [key: string]: number } = {};
      items.forEach(item => {
        newPriorities[item.id] = Math.max(1, 11 - item.rank);
      });

      await updatePriorities(newPriorities);
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save priorities:', error);
    }
  };

  const handleCancel = () => {
    // Reset to original order
    const priorityEntries = Object.entries(priorities);
    const rankedItems = priorityEntries
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .map(([key, value], index) => ({
        id: key,
        label: dimensionConfig[key]?.label || key,
        icon: dimensionConfig[key]?.icon || '💫',
        color: dimensionConfig[key]?.color || '#6b7280',
        rank: index + 1
      }));
    setItems(rankedItems);
    setIsEditing(false);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasPriorities = Object.values(priorities).some(value => value > 0);

  if (!hasPriorities) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Magic 10 Priorities</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⚡</div>
          <p className="text-gray-600 mb-4">Set your Magic 10 priorities to find better matches!</p>
          <button 
            onClick={() => window.location.href = '/magic10-setup'}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Set Your Priorities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Magic 10 Priorities</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            Reorder
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-700 text-sm font-medium px-3 py-1 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`text-sm font-medium px-3 py-1 rounded ${
                hasChanges 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Save
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <p className="text-sm text-purple-700">
            🎯 <strong>Drag to reorder:</strong> Your top priorities will get higher scores for better matching.
          </p>
        </div>
      )}

      <div 
        ref={dragRef}
        className="space-y-2"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            data-item-id={item.id}
            draggable={isEditing}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDrop={(e) => handleDrop(e, item.id)}
            onTouchStart={(e) => isEditing && handleTouchStart(e, item.id)}
            className={`
              flex items-center p-3 sm:p-4 rounded-lg border-2 transition-all duration-200
              ${isEditing ? 'cursor-move hover:shadow-md' : 'cursor-default'}
              ${draggedItem === item.id ? 'opacity-50 scale-95' : ''}
              ${dragOverItem === item.id ? 'border-purple-400 bg-purple-50 scale-105' : 'border-gray-200 bg-gray-50'}
              ${!isEditing ? 'hover:bg-gray-100' : ''}
            `}
            style={{
              background: !isEditing ? `linear-gradient(135deg, ${item.color}15, ${item.color}05)` : undefined
            }}
          >
            {/* Rank Badge */}
            <div 
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3"
              style={{ backgroundColor: item.color }}
            >
              {item.rank}
            </div>

            {/* Icon */}
            <div className="text-2xl mr-3 flex-shrink-0">
              {item.icon}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                {item.label}
              </p>
            </div>

            {/* Priority Score */}
            <div className="flex-shrink-0 ml-3">
              <span 
                className="text-sm font-bold px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: item.color }}
              >
                {Math.max(1, 11 - item.rank)}
              </span>
            </div>

            {/* Drag Handle */}
            {isEditing && (
              <div className="flex-shrink-0 ml-2 text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {!isEditing && (
        <div className="mt-4 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            ✨ Your top 3 priorities get the highest compatibility scores
          </p>
        </div>
      )}
    </div>
  );
};

export default Magic10DragRanking;

