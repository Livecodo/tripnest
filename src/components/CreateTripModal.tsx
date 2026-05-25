import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../store/useStore';

interface CreateTripModalProps {
  onClose: () => void;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60', // Beach
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=60', // Mountains
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop&q=60', // Lake/Boat
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=60', // Paris
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=60', // Passport/Map
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({ onClose }) => {
  const createTrip = useStore((state) => state.createTrip);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [coverUrl, setCoverUrl] = useState(PRESET_COVERS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;

    setIsLoading(true);
    try {
      const result = await createTrip({
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate,
        end_date: endDate,
        cover_url: coverUrl,
      });
      if (result) {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg rounded-2xl glass-panel overflow-hidden flex flex-col items-stretch"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-200">Start New Trip Folder</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Trip Name</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer in Santorini, EuroTrip 2026"
                className="w-full glass-input pl-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are the vibes of this trip?"
              rows={2}
              className="w-full glass-input text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full glass-input pl-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full glass-input pl-10 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Preset cover image selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Choose Cover Image
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COVERS.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCoverUrl(url)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    coverUrl === url ? 'border-cyan-500 scale-95 shadow-lg shadow-cyan-500/10' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="preset cover" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="glass-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="glass-btn-primary"
            >
              {isLoading ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
